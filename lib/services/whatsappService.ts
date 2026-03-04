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
    }
}
