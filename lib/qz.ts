import qz from 'qz-tray'

export async function printToQZ(qrBase64: string, printerName: string = 'QZ Tray') {
    try {
        if (!qz.websocket.isActive()) {
            // Forzamos la conexión al puerto que le funcionó al usuario
            await qz.websocket.connect({
                host: 'localhost',
                usingSecure: false,
                port: {
                    insecure: [8182]
                }
            })
        }

        // Listar impresoras para verificar si existe o usar la por defecto
        const printers = await qz.printers.find()
        const selectedPrinter = printers.includes(printerName) ? printerName : printers[0]

        if (!selectedPrinter) {
            throw new Error('No se encontraron impresoras instaladas en el sistema.')
        }

        const config = qz.configs.create(selectedPrinter)

        // El formato depende de la impresora térmica (ESC/POS, ZPL, etc.)
        // Pero QZ Tray puede procesar imágenes directamente
        const data = [
            {
                type: 'pixel',
                format: 'image',
                flavor: 'base64',
                data: qrBase64.split(',')[1], // Quitar el prefijo data:image/png;base64,
                options: { language: 'ESCPOS', dotDensity: 'double' }
            }
        ]

        await qz.print(config, data)
        console.log('QZ Tray: Print command sent successfully')
        alert('Comando de impresión enviado con éxito a: ' + selectedPrinter)
        return true
    } catch (error) {
        console.error('Error printing with QZ Tray:', error)
        // Podrías mostrar el error específico al usuario para debugear
        // alert('Error de QZ Tray: ' + (error as Error).message)
        return false
    }
}
