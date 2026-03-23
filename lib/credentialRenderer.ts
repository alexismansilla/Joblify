// Dimensiones en píxeles a 300 DPI para etiquetas DK de la Brother QL-800.
// 62mm × 62mm a 300 DPI ≈ 732 × 732 px.
const LABEL_WIDTH_PX = 732  // 62mm a 300 DPI
const LABEL_HEIGHT_PX = 732  // 62mm a 300 DPI
const PADDING_X = 40   // margen horizontal izquierdo/derecho

interface CredentialData {
    name: string
    company: string
    qrBase64: string // Data URL del QR (data:image/png;base64,...)
    includeQR?: boolean // Determina si se imprime o no el código QR (default: true)
}

/**
 * Divide un texto en líneas que no excedan el ancho máximo disponible en el canvas.
 * Necesario para hacer text-wrap manual en canvas 2D.
 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const testLine = `${currentLine} ${words[i]}`
        if (ctx.measureText(testLine).width <= maxWidth) {
            currentLine = testLine
        } else {
            lines.push(currentLine)
            currentLine = words[i]
        }
    }
    lines.push(currentLine)
    return lines
}

/**
 * Renderiza la credencial completa en un canvas y devuelve el Data URL base64.
 *
 * Layout:
 *   Nombre  (izquierda, bold, wraps si es largo)
 *   Empresa (izquierda, gris)
 *   ─────────────────────────────── (línea separadora)
 *
 *            [QR CODE]              (centrado)
 */
export function generateCredentialImage(data: CredentialData): Promise<string> {
    return new Promise((resolve, reject) => {
        const withQR = data.includeQR !== false
        // Volviendo a forzar tamaño 732x732 cuadrado para todo para no arruinar la impresión
        const currentHeight = 732

        const canvas = document.createElement('canvas')
        canvas.width = LABEL_WIDTH_PX
        canvas.height = currentHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            reject(new Error('No se pudo crear el contexto 2D del canvas'))
            return
        }

        // --- Fondo blanco limpio ---
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, LABEL_WIDTH_PX, currentHeight)

        const availableWidth = LABEL_WIDTH_PX - PADDING_X * 2
        let cursorY = 50

        // --- Nombre: izquierda, bold, con wrap automático ---
        const nameFontSize = 58
        ctx.font = `900 ${nameFontSize}px "Segoe UI", Arial, sans-serif`
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        const nameLines = wrapText(ctx, data.name.toUpperCase(), availableWidth)
        const nameLineHeight = nameFontSize * 1.1

        nameLines.forEach(line => {
            ctx.fillText(line, PADDING_X, cursorY)
            cursorY += nameLineHeight
        })

        // Separación perfecta
        cursorY += 25

        // --- Empresa: gris oscuro (#555555) ideal para crear un patrón de 'dithering' en la impresora Brother
        ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif'
        ctx.fillStyle = '#555555'
        ctx.fillText(data.company.toUpperCase(), PADDING_X, cursorY, availableWidth)
        cursorY += 36

        // --- Línea separadora full-width ---
        cursorY += 14
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(PADDING_X, cursorY)
        ctx.lineTo(LABEL_WIDTH_PX - PADDING_X, cursorY)
        ctx.stroke()
        cursorY += 24

        // --- QR Code: centrado, ocupa el espacio restante ---
        if (withQR) {
            const qrImage = new Image()
            qrImage.onload = () => {
                // QR izquierda (PADDING_X), 5% más grande (factor 0.80 del espacio disponible)
                const remainingHeight = currentHeight - cursorY - 20
                const qrSize = Math.min(remainingHeight, availableWidth) * 0.80
                const qrX = PADDING_X

                ctx.drawImage(qrImage, qrX, cursorY, qrSize, qrSize)

                resolve(canvas.toDataURL('image/png'))
            }

            qrImage.onerror = () => reject(new Error('Error al cargar la imagen del QR en el canvas'))
            qrImage.src = data.qrBase64
        } else {
            // Sin QR, terminamos aquí
            resolve(canvas.toDataURL('image/png'))
        }
    })
}
