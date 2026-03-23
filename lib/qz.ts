import qz from 'qz-tray'

// Nombres posibles para la impresora (separados por coma).
// Soporte documentado para Windows 11 que suele crear "Brother QL-800 (Copia 1)" al reconectar el USB.
// Configurable vía variable de entorno NEXT_PUBLIC_PRINTER_NAME.
const BROTHER_PRINTER_NAMES = (
    process.env.NEXT_PUBLIC_PRINTER_NAME || 'Brother QL-800,Brother QL-800 (Copia 1)'
).split(',').map(n => n.trim().toLowerCase())

// La QL-800 usa etiquetas DK de 62mm de ancho.
const QL800_LABEL_WIDTH_MM = 62
const QL800_LABEL_HEIGHT_MM = 62

type PrintResult =
    | { success: true; printerUsed: string }
    | { success: false; reason: string }

/**
 * Configura QZ Tray para:
 * 1. Leer el certificado público desde /public/digital-certificate.txt (accesible via URL)
 * 2. Firmar los challenges llamando a /api/qz-sign (server-side, nunca expone la private key)
 *
 * Esto funciona tanto en local como desde la URL de Vercel.
 */
function setupQZSecurity() {
    // El certificado vive en /public y es accesible como asset estático
    qz.security.setCertificatePromise((resolve, reject) => {
        fetch('/digital-certificate.txt')
            .then(res => {
                if (!res.ok) throw new Error(`No se pudo cargar el certificado: ${res.status}`)
                return res.text()
            })
            .then(resolve)
            .catch((e: any) => reject(e))
    })

    // La firma se delega a la API Route server-side que tiene acceso a la private key
    qz.security.setSignatureAlgorithm('SHA512')
    qz.security.setSignaturePromise((toSign: string) => {
        return (resolve, reject) => {
            fetch('/api/qz-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toSign }),
            })
                .then(res => {
                    if (!res.ok) throw new Error(`Error al firmar challenge: ${res.status}`)
                    return res.json()
                })
                .then(data => resolve(data.signature))
                .catch((e: any) => reject(e))
        }
    })
}

/**
 * Conecta con QZ Tray y envía un trabajo de impresión a la impresora Brother QL-800.
 * La imagen debe ser un Data URL base64 (ej: "data:image/png;base64,...").
 */
export async function printToQZ(qrBase64: string): Promise<PrintResult> {
    try {
        // Configurar seguridad ANTES de conectar
        setupQZSecurity()

        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({
                host: 'localhost',
                usingSecure: false,
                port: {
                    insecure: [8182]
                }
            })
        }

        const rawPrinters = await qz.printers.find()
        const availablePrinters: string[] = [rawPrinters].flat()
        const matchedPrinter = availablePrinters.find(
            (p) => {
                const lowerName = p.toLowerCase()
                return BROTHER_PRINTER_NAMES.some(validName => lowerName.includes(validName)) || lowerName.includes('ql-800')
            }
        )

        if (!matchedPrinter) {
            const printerList = availablePrinters.join(', ') || 'ninguna'
            throw new Error(
                `Impresora Brother no encontrada. Impresoras disponibles: [${printerList}]. ` +
                `Verifica que la QL-800 esté conectada y añadida en System Settings → Printers & Scanners.`
            )
        }

        const config = qz.configs.create(matchedPrinter, {
            size: {
                width: QL800_LABEL_WIDTH_MM,
                height: QL800_LABEL_HEIGHT_MM
            },
            units: 'mm',
            colorType: 'blackwhite',
            copies: 1
        })

        const data = [
            {
                type: 'pixel',
                format: 'image',
                flavor: 'base64',
                data: qrBase64.split(',')[1],
                options: {
                    language: 'ESCPOS',
                    dotDensity: 'double',
                }
            }
        ]

        // @ts-expect-error — los tipos de qz-tray no cubren todas las overloads de print()
        await qz.print(config, data)

        return { success: true, printerUsed: matchedPrinter }
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Error desconocido en QZ Tray'
        console.error('[QZ Tray] Error al imprimir:', reason)
        return { success: false, reason }
    }
}
