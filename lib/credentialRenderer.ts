// Dimensiones en píxeles a 300 DPI para etiquetas DK de la Brother QL-800.
// 62mm × 62mm a 300 DPI ≈ 732 × 732 px.
const LABEL_WIDTH_PX = 732  // 62mm a 300 DPI
const LABEL_HEIGHT_PX = 732  // 62mm a 300 DPI
const PADDING_X = 40   // margen horizontal izquierdo/derecho

interface CredentialData {
    name: string
    company: string
    qrBase64: string // Data URL del QR (data:image/png;base64,...)
}

/**
 * Divide un texto en líneas que no excedan el ancho máximo disponible en el canvas.
 * Necesario para hacer text-wrap manual en canvas 2D.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
        const canvas = document.createElement('canvas')
        canvas.width = LABEL_WIDTH_PX
        canvas.height = LABEL_HEIGHT_PX

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            reject(new Error('No se pudo crear el contexto 2D del canvas'))
            return
        }

        // --- Fondo blanco limpio ---
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX)

        const availableWidth = LABEL_WIDTH_PX - PADDING_X * 2
        let cursorY = 50

        // --- Nombre: izquierda, bold, con wrap automático ---
        const nameFontSize = 58
        ctx.font = `900 ${nameFontSize}px Arial, sans-serif`
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        const nameLines = wrapText(ctx, data.name.toUpperCase(), availableWidth)
        const nameLineHeight = nameFontSize * 1.1

        nameLines.forEach(line => {
            ctx.fillText(line, PADDING_X, cursorY)
            cursorY += nameLineHeight
        })

        cursorY += 10

        // --- Empresa: izquierda, gris, más pequeño ---
        ctx.font = 'bold 30px Arial, sans-serif'
        ctx.fillStyle = '#666666'
        ctx.fillText(data.company.toUpperCase(), PADDING_X, cursorY, availableWidth)
        cursorY += 38

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
        const qrImage = new Image()
        qrImage.onload = () => {
            // El QR ocupa el espacio vertical restante con un margen inferior
            const remainingHeight = LABEL_HEIGHT_PX - cursorY - 20
            const qrSize = Math.min(remainingHeight, availableWidth) * 0.75 // 75% del espacio disponible
            const qrX = (LABEL_WIDTH_PX - qrSize) / 2

            ctx.drawImage(qrImage, qrX, cursorY, qrSize, qrSize)

            resolve(canvas.toDataURL('image/png'))
        }

        qrImage.onerror = () => reject(new Error('Error al cargar la imagen del QR en el canvas'))
        qrImage.src = data.qrBase64
    })
}
