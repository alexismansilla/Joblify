import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())

import { whatsappService } from "../lib/services/whatsappService"

const telefonoPrueba = process.env.WHATSAPP_TEST_NUMBER

async function testConnection() {
    if (!telefonoPrueba) {
        console.error("❌ ERROR: Para probar, necesito que agregues WHATSAPP_TEST_NUMBER en tu .env.local")
        console.error("Ejemplo: WHATSAPP_TEST_NUMBER=\"569XXXXXXX\" (sin el + y con código de país)")
        return
    }

    console.log(`📡 Conectando a Meta Graph API...\nDestino: ${telefonoPrueba}`)
    
    try {
        console.log("enviando mensaje de perfil...")
        const mockContact = { name: "Alexis (Prueba)", company: "Connectify" }
        await whatsappService.sendInteractiveProfileMessage(telefonoPrueba, mockContact, "match_ab12c")
        
        await new Promise(r => setTimeout(r, 2000))

        console.log("enviando mensaje de texto confirmación...")
        await whatsappService.sendTextMessage(telefonoPrueba, "✅ Integración Meta completada.")
        
        console.log("✔️ Peticiones enviadas exitosamente al sandbox. Revisa tu celular.")
    } catch(e) {
        console.error("Error en el script de prueba:", e)
    }
}

testConnection()
