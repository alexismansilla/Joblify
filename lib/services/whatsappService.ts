/**
 * Normaliza un teléfono chileno al formato internacional E.164: +569XXXXXXXX
 * Acepta: "56938997919", "938997919", "+56938997919", "9 3899 7919", etc.
 */
function normalizeChileanPhone(rawPhone: string): string {
    const digitsOnly = rawPhone.replace(/\D/g, '')
    if (digitsOnly.startsWith('56')) return `+${digitsOnly}`
    if (digitsOnly.startsWith('9') && digitsOnly.length === 9) return `+56${digitsOnly}`
    return `+${digitsOnly}`
}

export const whatsappService = {
    async sendInteractiveProfileMessage(toPhone: string, contact: any, matchId: string) {
        const token = process.env.WHATSAPP_ACCESS_TOKEN
        const phoneId = process.env.WHATSAPP_PHONE_ID

        if (!token || !phoneId) {
            console.error('WhatsApp App credentials not configured.')
            return
        }

        const endpoint = `https://graph.facebook.com/v18.0/${phoneId}/messages`

        // Format the profile message text
        const messageText = `👤 *Nombre:* ${contact.name}\n📱 *Teléfono:* ${contact.phone || 'N/A'}\n💼 *Empresa:* ${contact.company || 'N/A'}\n\n¿Cómo clasificarías esta conexión?`

        const payload = {
            messaging_product: "whatsapp",
            to: toPhone,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: messageText
                },
                action: {
                    buttons: [
                        {
                            type: "reply",
                            reply: {
                                id: `negocio_${matchId}`,
                                title: "💼 Negocio"
                            }
                        },
                        {
                            type: "reply",
                            reply: {
                                id: `mentoria_${matchId}`,
                                title: "🤝 Mentoría"
                            }
                        },
                        {
                            type: "reply",
                            reply: {
                                id: `casual_${matchId}`,
                                title: "💬 Casual"
                            }
                        }
                    ]
                }
            }
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json()
            if (!response.ok) {
                console.error('Error sending WhatsApp message:', data)
            }
        } catch (error) {
            console.error('Failed to send WhatsApp message', error)
        }
    },

    async sendTextMessage(toPhone: string, text: string) {
        const token = process.env.WHATSAPP_ACCESS_TOKEN
        const phoneId = process.env.WHATSAPP_PHONE_ID

        if (!token || !phoneId) {
            return
        }

        const endpoint = `https://graph.facebook.com/v18.0/${phoneId}/messages`

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: toPhone,
            type: "text",
            text: {
                preview_url: false,
                body: text
            }
        }

        try {
            await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
        } catch (error) {
            console.error('Failed to send WhatsApp message', error)
        }
    },

    /**
     * Envía una Contact Card nativa de WhatsApp.
     * Renderiza la foto de perfil del contacto, su nombre y los botones
     * "Mensaje" y "Añadir a un grupo" — igual al screenshot.
     */
    async sendContactCard(toPhone: string, contactName: string, contactPhone: string) {
        const token = process.env.WHATSAPP_ACCESS_TOKEN
        const phoneId = process.env.WHATSAPP_PHONE_ID

        if (!token || !phoneId) return

        const endpoint = `https://graph.facebook.com/v18.0/${phoneId}/messages`

        // Normalizamos el teléfono del contacto al formato E.164 (+569XXXXXXXX)
        const formattedPhone = normalizeChileanPhone(contactPhone)
        // wa_id no lleva el + (solo dígitos)
        const waId = formattedPhone.replace('+', '')

        // Separamos nombre en first/last para el vCard
        const nameParts = contactName.trim().split(' ')
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ')

        const payload = {
            messaging_product: "whatsapp",
            to: toPhone,
            type: "contacts",
            contacts: [
                {
                    name: {
                        formatted_name: contactName,
                        first_name: firstName,
                        last_name: lastName
                    },
                    phones: [
                        {
                            phone: formattedPhone,
                            type: "CELL",
                            wa_id: waId
                        }
                    ]
                }
            ]
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })
            const data = await response.json()
            if (!response.ok) {
                console.error('Error sending contact card:', data)
            }
        } catch (error) {
            console.error('Failed to send contact card', error)
        }
    }
}

