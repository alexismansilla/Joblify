import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())
import { whatsappService } from "../lib/services/whatsappService"

async function run() {
    const dest = process.env.WHATSAPP_TEST_NUMBER
    if (!dest) { console.error("Debes poner un WHATSAPP_TEST_NUMBER en el .env con formato: 56912345678"); return }
    console.log(`Enviando a: ${dest}`)
    await whatsappService.sendTextMessage(dest, "¡Conexión Connectify exitosa! 🚀")
    console.log("Revisa tu WhatsApp ✓")
}
run()
