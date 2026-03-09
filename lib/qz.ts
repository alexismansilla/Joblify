import qz from 'qz-tray'

// Nombre de la impresora Brother QL-800 tal como aparece en macOS.
// Configurable vía variable de entorno para evitar hardcodear el nombre del sistema.
const BROTHER_PRINTER_NAME =
    process.env.NEXT_PUBLIC_PRINTER_NAME || 'Brother QL-800'

// La QL-800 usa etiquetas DK de 62mm de ancho.
// Tamaño en puntos a 300 DPI: 62mm ≈ 732px. La altura se ajusta automáticamente.
const QL800_LABEL_WIDTH_MM = 62
const QL800_LABEL_HEIGHT_MM = 62 // 62mm — etiqueta cuadrada DK 62mm × 62mm

type PrintResult =
    | { success: true; printerUsed: string }
    | { success: false; reason: string }

/**
 * Conecta con QZ Tray y envía un trabajo de impresión a la impresora Brother QL-800.
 * La imagen debe ser un Data URL base64 (ej: "data:image/png;base64,...").
 *
 * Retorna un objeto descriptivo en lugar de un booleano para que el llamador
 * pueda informar al usuario con precisión.
 */
export async function printToQZ(qrBase64: string): Promise<PrintResult> {
    try {
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({
                host: 'localhost',
                usingSecure: false,
                port: {
                    insecure: [8182]
                }
            })
        }

        // Buscar la impresora configurada; si no existe, lanzar error claro.
        // qz.printers.find() puede retornar string | string[], normalizamos a array siempre.
        const rawPrinters = await qz.printers.find()
        const availablePrinters: string[] = [rawPrinters].flat()
        const matchedPrinter = availablePrinters.find(
            (p) => p.toLowerCase().includes('brother') || p.includes(BROTHER_PRINTER_NAME)
        )

        if (!matchedPrinter) {
            const printerList = availablePrinters.join(', ') || 'ninguna'
            throw new Error(
                `Impresora Brother no encontrada. Impresoras disponibles: [${printerList}]. ` +
                `Verifica que la QL-800 esté conectada y añadida en System Settings → Printers & Scanners.`
            )
        }

        // Configuración optimizada para etiquetas DK de la QL-800
        const config = qz.configs.create(matchedPrinter, {
            size: { width: QL800_LABEL_WIDTH_MM, height: QL800_LABEL_HEIGHT_MM },
            units: 'mm',
            colorType: 'blackwhite', // La QL-800 solo imprime en blanco y negro
            copies: 1,
        })

        // Enviamos la imagen en pixel format — QZ Tray la adapta al tamaño de etiqueta.
        const data = [
            {
                type: 'pixel',
                format: 'image',
                flavor: 'base64',
                // Extraemos solo la parte base64, sin el prefijo "data:image/png;base64,"
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
