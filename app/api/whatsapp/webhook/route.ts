import { NextResponse } from 'next/server'
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
            }

            // Siempre retornar 200 OK para que Meta no reintente
            return new NextResponse('OK', { status: 200 })
        }

        return new NextResponse('Not Found', { status: 404 })
    } catch (error) {
        console.error('Error processing webhook:', error)
        // Aún así respondemos 200 para que meta no bloquee el webhook
        return new NextResponse('Error', { status: 200 })
    }
}

async function processConnection(scannerPhone: string, text: string) {
    // Regex para extraer el qr_token y el contact_id (@TOKEN:ID)
    const match = text.match(/@([\w-]+):([a-zA-Z0-9-]+)/)

    if (!match) return

    const qrToken = match[1]
    const contactId = match[2]

    console.log(`Buscando contacto con ID: ${contactId}`)

    // 1. Buscamos al asistente destino en la DB
    const targetContact = await contactService.getById(contactId)

    if (!targetContact) {
        console.error('Contacto destino no encontrado')
        return
    }

    // 2. Registramos el match temporal con el teléfono del escáner
    let scannerContact = await contactService.getByIdentifier(scannerPhone)

    // Lo guardamos en matches. 
    // Como hemos modificado la tabla para soportar scanner_phone, lo pasaremos si no hay match claro.
    // Usaremos un método específico para el tracking completo de esta conexión.
    const matchRecord = await contactService.registerWhatsappMatch(contactId, scannerContact?.id || null, scannerPhone)

    if (!matchRecord) {
        console.error('No se pudo crear el registro del match')
        return;
    }

    // 3. Enviamos los mensajes de vuelta (Botones interactivos y perfil)
    await whatsappService.sendInteractiveProfileMessage(scannerPhone, targetContact, matchRecord[0].id)
}

async function processButtonReply(scannerPhone: string, buttonId: string) {
    console.log(`[DEBUG] Recibido click en botón. Button ID: ${buttonId}`)

    // Format de buttonId expected: type_matchId (e.g., negocio_1234-5678)
    const [action, matchId] = buttonId.split('_')

    console.log(`[DEBUG] Intentando calificar Match DB ID: ${matchId} como: ${action}`)

    if (matchId) {
        const result = await contactService.updateMatchConnectionType(matchId, action)
        console.log(`[DEBUG] Resultado de Supabase update:`, result)
        await whatsappService.sendTextMessage(scannerPhone, "¡Gracias! Tu conexión ha sido clasificada exitosamente. ✅")
    } else {
        console.error(`[DEBUG] No se pudo extraer el matchId del buttonId: ${buttonId}`)
    }
}
