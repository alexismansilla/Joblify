import { NextResponse, after } from 'next/server'
import { contactService } from '@/lib/services/contactService'
import { whatsappService } from '@/lib/services/whatsappService'

// GET handler for Webhook verification (Required by Meta)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

    console.log("== WEBHOOK VALIDATION ATTEMPT ==")
    console.log("Mode:", mode)
    console.log("Received Token:", token)
    console.log("Expected Token:", verifyToken)
    console.log("Challenge:", challenge)

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK_VERIFIED')
        return new NextResponse(challenge, { status: 200 })
    } else {
        return new NextResponse('Error de validación', { status: 403 })
    }
}

// POST handler to receive incoming messages from WhatsApp
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validamos que sea un evento de mensaje de una cuenta de WhatsApp Business
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0]
            const change = entry?.changes?.[0]
            const value = change?.value

            // Si hay un mensaje entrante
            if (value?.messages && value.messages.length > 0) {
                const message = value.messages[0]
                const scannerPhone = message.from // Número que escaneó el QR

                // Usamos 'after' para responder 200 OK inmediatamente a Meta 
                // y procesar la lógica pesada en background. Esto evita Timeouts en Vercel.
                after(async () => {
                    try {
                        // Si el mensaje es interactivo (respuesta a un botón)
                        if (message.type === 'interactive') {
                            const buttonReply = message.interactive?.button_reply
                            if (buttonReply) {
                                await processButtonReply(scannerPhone, buttonReply.id)
                            }
                        }
                        // Si es un mensaje de texto normal (el mensaje que genera el QR)
                        else if (message.type === 'text') {
                            const messageText = message.text?.body
                            console.log('Mensaje recibido:', messageText)
                            await processConnection(scannerPhone, messageText)
                        }
                    } catch (bgError) {
                        console.error('Error in background processing:', bgError)
                    }
                })
            }

            // Respuesta inmediata: Meta deja de esperar y no reintenta el webhook
            return new NextResponse('OK', { status: 200 })
        }

        return new NextResponse('Not Found', { status: 404 })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return new NextResponse('Error', { status: 200 })
    }
}

async function processConnection(scannerPhone: string, text: string) {
    // Regex para extraer solo el qr_token del mensaje: @XXXXXXXXXX
    const match = text.match(/@([A-Z0-9]{8,10})/)

    if (!match) return

    const qrToken = match[1]

    console.log(`Buscando contacto con qr_token: ${qrToken}`)

    // 1. Buscamos al asistente destino por su qr_token
    const targetContact = await contactService.getByQrToken(qrToken)

    if (!targetContact) {
        console.error('Contacto destino no encontrado para qr_token:', qrToken)
        return
    }

    // 2. Buscamos si el escáner ya está registrado en la DB
    const scannerContact = await contactService.getByIdentifier(scannerPhone)

    // MODO PRUEBA / AUTO-ESCANEO: Permite al usuario jugar con el bot sin ensuciar métricas
    if (scannerContact && scannerContact.id === targetContact.id) {
        console.log(`[Webhook] MODO DE PRUEBA: Auto-escaneo activado para ${scannerContact.name}`)
        
        // Enviamos la interfaz interactiva con un ID estático inofensivo
        await whatsappService.sendInteractiveProfileMessage(scannerPhone, targetContact, 'self-test')
        await whatsappService.sendContactCard(scannerPhone, targetContact.name, targetContact.phone || '')
        return
    }

    // 3. Registramos el match con el teléfono del escáner
    const matchRecord = await contactService.registerWhatsappMatch(targetContact.id, scannerContact?.id || null, scannerPhone)

    if (!matchRecord) {
        console.error('No se pudo crear el registro del match')
        return;
    }

    // 4. Enviamos el mensaje interactivo con los botones de clasificación
    await whatsappService.sendInteractiveProfileMessage(scannerPhone, targetContact, matchRecord[0].id)

    // 5. Enviamos la tarjeta de contacto nativa asegurándonos de que ya se despachó el anterior
    await whatsappService.sendContactCard(scannerPhone, targetContact.name, targetContact.phone)
}


async function processButtonReply(scannerPhone: string, buttonId: string) {
    console.log(`[DEBUG] Recibido click en botón. Button ID: ${buttonId}`)

    // Format de buttonId: type_matchId (e.g., negocio_1234-5678)
    const [action, matchId] = buttonId.split('_')

    if (!matchId) {
        console.error(`[DEBUG] No se pudo extraer el matchId del buttonId: ${buttonId}`)
        return
    }

    // Respuesta interceptada y simulada para cuando jugaron con su propia credencial
    if (matchId === 'self-test') {
        console.log(`[DEBUG] Click de prueba detectado (${action})`)
        await whatsappService.sendTextMessage(scannerPhone, '😁 Efectivamente, interactuaste con tu propio perfil en modo de prueba.\n\nTe invito a escanear los códigos QR de otras personas y hacer conexiones reales. ¡Éxito!')
        return
    }

    console.log(`[DEBUG] Clasificando Match ID: ${matchId} como: ${action}`)

    // 1. Guardamos el tipo de conexión y obtenemos el match actualizado
    const matchResult = await contactService.updateMatchConnectionType(matchId, action)
    console.log(`[DEBUG] Match actualizado:`, matchResult)

    if (!matchResult?.[0]) {
        console.error(`[DEBUG] No se pudo actualizar el match: ${matchId}`)
        return
    }

    // Confirmación final
    await whatsappService.sendTextMessage(scannerPhone, '¡Gracias! Tu conexión ha sido clasificada exitosamente. ✅')
}

