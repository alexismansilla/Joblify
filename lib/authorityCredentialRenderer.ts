// Dimensiones en píxeles a 300 DPI para etiquetas DK de la Brother QL-800.
// 62mm × 62mm a 300 DPI ≈ 732 × 732 px.
const LABEL_WIDTH_PX = 732  // 62mm a 300 DPI
const LABEL_HEIGHT_PX = 732  // Volviendo a formato cuadrado 62x62
const PADDING_X = 40   // margen horizontal izquierdo/derecho

interface AuthorityCredentialData {
    name: string
    position: string
    organization: string | null
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
 * Renderiza la credencial de autoridad en un canvas y devuelve el Data URL base64.
 *
 * Layout (mismo que credentialRenderer pero sin QR):
 *   Nombre        (izquierda, bold, wraps si es largo)
 *   Organización  (izquierda, gris oscuro, equivalente a company)
 *   ─────────────────────────────── (línea separadora)
 *   CARGO         (en grande, ocupando el lugar del QR)
 */
export function generateAuthorityCredentialImage(data: AuthorityCredentialData): Promise<string> {
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

        // Separación perfecta
        cursorY += 25

        // --- Organización (Equivalente a empresa): gris oscuro (#555555) ideal para dithering ---
        const orgText = data.organization || 'AUTORIDAD ACREDITADA'
        ctx.font = 'bold 24px Arial, sans-serif'
        ctx.fillStyle = '#555555'
        const orgLines = wrapText(ctx, orgText.toUpperCase(), availableWidth)
        orgLines.forEach(line => {
            ctx.fillText(line, PADDING_X, cursorY)
            cursorY += 30
        })

        cursorY += 6

        // --- Línea separadora full-width ---
        cursorY += 14
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(PADDING_X, cursorY)
        ctx.lineTo(LABEL_WIDTH_PX - PADDING_X, cursorY)
        ctx.stroke()
        cursorY += 30

        // --- Cargo (Position): Grande, ocupa el lugar del QR ---
        // Le damos un aspecto importante ya que es la característica clave de la autoridad
        ctx.fillStyle = '#000000'

        let positionFontSize = 60
        ctx.font = `900 ${positionFontSize}px Arial, sans-serif`

        // Ajustamos dinámicamente el tamaño de fuente si el cargo es muy largo
        // Asegurando que se aproveche el espacio sobrante
        let positionLines = wrapText(ctx, data.position.toUpperCase(), availableWidth)

        // Si hay muchas líneas, bajamos un poco la fuente
        if (positionLines.length > 3) {
            positionFontSize = 45
            ctx.font = `900 ${positionFontSize}px Arial, sans-serif`
            positionLines = wrapText(ctx, data.position.toUpperCase(), availableWidth)
        } else if (positionLines.length > 2) {
            positionFontSize = 50
            ctx.font = `900 ${positionFontSize}px Arial, sans-serif`
            positionLines = wrapText(ctx, data.position.toUpperCase(), availableWidth)
        }

        const positionLineHeight = positionFontSize * 1.1

        positionLines.forEach((line) => {
            ctx.fillText(line, PADDING_X, cursorY)
            cursorY += positionLineHeight
        })
        resolve(canvas.toDataURL('image/png'))
    })
}
