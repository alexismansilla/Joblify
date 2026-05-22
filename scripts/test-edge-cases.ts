/**
 * Test de casos borde: simula escaneos de contactos con datos incompletos.
 * Verifica que el webhook responde 200 y que el mensaje se construye correctamente.
 *
 * Uso:
 *   ./node_modules/.bin/tsx scripts/test-edge-cases.ts
 *   ./node_modules/.bin/tsx scripts/test-edge-cases.ts --url=http://localhost:3000
 */

import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'
import { buildProfileMessageText } from '../lib/templates/whatsappTemplates'

const BASE_URL = process.argv.find(a => a.startsWith('--url='))?.split('=')[1]
    ?? 'http://localhost:3000'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

// ── Casos borde a probar ───────────────────────────────────────────────────
const EDGE_CASES = [
    { label: 'Sin teléfono, sin empresa, sin cargo',  filter: { phone: null } },
    { label: 'Sin empresa',                            filter: { company: null } },
    { label: 'Sin email',                              filter: { email: null } },
    { label: 'Perfil completo (control)',              filter: 'complete' },
]

function buildWebhookPayload(scannerPhone: string, qrToken: string) {
    return {
        object: 'whatsapp_business_account',
        entry: [{
            id: '123456789',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { display_phone_number: '56900000000', phone_number_id: 'test' },
                    messages: [{
                        from: scannerPhone,
                        id: `wamid.edge_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                        timestamp: String(Math.floor(Date.now() / 1000)),
                        type: 'text',
                        text: { body: `Hola! Escaneé tu QR @${qrToken}` },
                    }],
                },
                field: 'messages',
            }],
        }],
    }
}

async function findContact(filter: Record<string, any> | 'complete') {
    let query = supabase
        .from('contacts')
        .select('id, name, email, phone, company, position, profile, industry, qr_token')
        .not('qr_token', 'is', null)

    if (filter === 'complete') {
        query = query
            .not('phone', 'is', null)
            .not('company', 'is', null)
            .not('email', 'is', null)
    } else {
        for (const [col, val] of Object.entries(filter)) {
            if (val === null) query = query.is(col, null)
        }
    }

    const { data } = await query.limit(1).maybeSingle()
    return data
}

async function hitWebhook(qrToken: string): Promise<{ status: number; ms: number }> {
    const fakePhone = `569${Math.floor(Math.random() * 90000000 + 10000000)}`
    const start = Date.now()
    const res = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildWebhookPayload(fakePhone, qrToken)),
    })
    return { status: res.status, ms: Date.now() - start }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n🧪 Test de casos borde — Joblify Webhook`)
    console.log(`   URL: ${BASE_URL}\n`)

    // 1. Validar template con datos incompletos (sin red)
    console.log('── 1. Validación de mensajes con campos nulos ──────────────')

    const cases = [
        { label: 'Completo',                  contact: { name: 'Ana Torres', phone: '+56912345678', email: 'ana@empresa.cl', company: 'Acme', position: 'CTO', profile: 'Tecnología', industry: 'Software' } },
        { label: 'Sin teléfono',              contact: { name: 'Francisca Paris', phone: null, email: 'franciscaparis@gmail.com', company: null, position: null, profile: 'Ecosistema', industry: null } },
        { label: 'Sin empresa ni cargo',      contact: { name: 'Juan Pérez', phone: '+56987654321', email: 'juan@gmail.com', company: null, position: null, profile: null, industry: null } },
        { label: 'Solo nombre',               contact: { name: 'María González', phone: null, email: null, company: null, position: null, profile: null, industry: null } },
    ]

    cases.forEach(({ label, contact }) => {
        const msg = buildProfileMessageText(contact)
        const hasNA = msg.includes('N/A')
        const icon = hasNA ? '❌' : '✅'
        console.log(`\n  ${icon} ${label}:`)
        console.log(msg.split('\n').map(l => `     ${l}`).join('\n'))
    })

    // 2. Webhook real contra contactos de la DB con datos incompletos
    console.log('\n── 2. Requests reales al webhook ───────────────────────────')

    const results: { label: string; found: boolean; status?: number; ms?: number }[] = []

    for (const { label, filter } of EDGE_CASES) {
        const contact = await findContact(filter as any)

        if (!contact) {
            console.log(`  ⚪ ${label}: no hay contactos con este patrón en la DB`)
            results.push({ label, found: false })
            continue
        }

        const { status, ms } = await hitWebhook(contact.qr_token!)
        const icon = status === 200 ? '✅' : '❌'
        console.log(`  ${icon} ${label}: ${contact.name} → HTTP ${status} en ${ms}ms`)
        results.push({ label, found: true, status, ms })
    }

    // 3. Resumen
    const allOk = results.every(r => !r.found || r.status === 200)
    console.log(`\n── 3. Resumen ──────────────────────────────────────────────`)
    console.log(allOk
        ? '  ✅ Todos los casos borde responden 200 — listo para el evento'
        : '  ❌ Hay casos que fallan — revisar antes del evento'
    )
    console.log()
}

main().catch(e => {
    console.error('Error fatal:', e)
    process.exit(1)
})
