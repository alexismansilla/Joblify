import { NextResponse, after } from 'next/server'
import { empresaService } from '@/lib/services/empresaService'
import { candidatoService } from '@/lib/services/candidatoService'
import { whatsappService } from '@/lib/services/whatsappService'
import type { Empresa } from '@/lib/services/empresaService'

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

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0]
            const change = entry?.changes?.[0]
            const value = change?.value

            if (value?.messages && value.messages.length > 0) {
                const message = value.messages[0]
                const candidatoPhone = message.from

                after(async () => {
                    try {
                        // Only process text messages with @TOKEN
                        if (message.type === 'text') {
                            const messageText = message.text?.body
                            console.log('Mensaje recibido:', messageText)
                            await processConnection(candidatoPhone, messageText)
                        }
                        // Button replies from old messages still work
                        else if (message.type === 'interactive') {
                            const buttonReply = message.interactive?.button_reply
                            if (buttonReply) {
                                await processButtonReply(candidatoPhone, buttonReply.id)
                            }
                        }
                    } catch (bgError) {
                        console.error('Error in background processing:', bgError)
                    }
                })
            }

            return new NextResponse('OK', { status: 200 })
        }

        return new NextResponse('Not Found', { status: 404 })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return new NextResponse('Error', { status: 200 })
    }
}

/**
 * Process a @TOKEN text message from WhatsApp.
 *
 * Flow:
 * 1. Extract @TOKEN from message text
 * 2. Find Empresa by qr_token
 * 3. Find existing match from scan form (connect page), or create one
 * 4. Update match with confirmed phone number
 * 5. Send confirmation + empresa contact card
 */
async function processConnection(candidatoPhone: string, text: string) {
    const match = text.match(/@([A-Z0-9]{8,10})/)
    if (!match) return

    const qrToken = match[1]
    console.log(`Buscando empresa con qr_token: ${qrToken}`)

    const [empresa, candidato] = await Promise.all([
        empresaService.getByQrToken(qrToken),
        candidatoService.getByIdentifier(candidatoPhone),
    ])

    if (!empresa) {
        console.error('Empresa no encontrada para qr_token:', qrToken)
        return
    }

    // Try to find existing match from the scan form (connect page)
    // The connect page creates a match with empty/null candidato_phone
    const existingMatch = await empresaService.findUnmatchedByEmpresa(empresa.id)

    let matchId: string

    if (existingMatch) {
        // Update the existing match with the confirmed phone
        const updated = await empresaService.updateMatchPhone(existingMatch.id, candidatoPhone)
        matchId = existingMatch.id
        console.log(`Match existente actualizado con teléfono: ${matchId}`)
    } else {
        // No existing match — create one (direct WhatsApp flow without connect page)
        const matchRecord = await empresaService.registerMatch(
            empresa.id,
            candidatoPhone,
            candidato?.id || undefined,
        )
        if (!matchRecord || matchRecord.length === 0) {
            console.error('No se pudo crear el registro del match')
            return
        }
        matchId = matchRecord[0].id
        console.log(`Nuevo match creado desde WhatsApp: ${matchId}`)
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://joblify.vercel.app'
    const profileUrl = `${baseUrl}/completar-perfil/${matchId}`

    // Send confirmation + empresa contact card + profile completion link
    const tasks: Promise<void>[] = [
        whatsappService.sendTextMessage(
            candidatoPhone,
            `✅ ¡Conexión confirmada con ${empresa.company || empresa.name}! Te hemos enviado sus datos de contacto.\n\n📝 Completa tu perfil aquí para que te conozcan mejor:\n${profileUrl}`
        ),
    ]
    if (empresa.phone) {
        tasks.push(whatsappService.sendContactCard(candidatoPhone, empresa.name, empresa.phone))
    }
    await Promise.all(tasks)
}

/**
 * Process a button reply (interest classification).
 * Kept for backward compatibility with older messages.
 */
async function processButtonReply(candidatoPhone: string, buttonId: string) {
    console.log(`[DEBUG] Recibido click en botón. Button ID: ${buttonId}`)

    const [action, matchId] = buttonId.split('_')

    if (!matchId) {
        console.error(`[DEBUG] No se pudo extraer el matchId del buttonId: ${buttonId}`)
        return
    }

    const matchResult = await empresaService.updateMatchConnectionType(matchId, action)
    console.log(`[DEBUG] Match actualizado:`, matchResult)

    if (!matchResult?.[0]) {
        console.error(`[DEBUG] No se pudo actualizar el match: ${matchId}`)
        return
    }

    await whatsappService.sendTextMessage(
        candidatoPhone,
        '¡Gracias! Tu conexión ha sido clasificada exitosamente. ✅'
    )
}
