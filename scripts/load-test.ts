/**
 * Load test: simula N escaneos concurrentes contra el webhook de WhatsApp.
 * Mide latencia, tasa de éxito y comportamiento de la DB bajo carga.
 *
 * Uso:
 *   npx tsx scripts/load-test.ts                        # 50 requests contra producción
 *   npx tsx scripts/load-test.ts --n=100                # 100 requests
 *   npx tsx scripts/load-test.ts --url=http://localhost:3000  # contra local
 *   npx tsx scripts/load-test.ts --dry                  # muestra payloads sin enviar
 */

import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { createClient } from '@supabase/supabase-js'

// ── Config desde args ──────────────────────────────────────────────────────
const args = process.argv.slice(2)
const N = parseInt(args.find(a => a.startsWith('--n='))?.split('=')[1] ?? '50')
const BASE_URL = args.find(a => a.startsWith('--url='))?.split('=')[1]
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? 'http://localhost:3000'
const DRY_RUN = args.includes('--dry')
const CONCURRENCY = 10  // máx requests en paralelo a la vez
const WEBHOOK_PATH = '/api/whatsapp/webhook'

// ── Supabase ───────────────────────────────────────────────────────────────
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

// ── Helpers ────────────────────────────────────────────────────────────────
function randomChileanPhone(): string {
    const prefix = ['9', '8', '7'][Math.floor(Math.random() * 3)]
    const suffix = Math.floor(Math.random() * 90000000 + 10000000)
    return `56${prefix}${suffix}`
}

function buildPayload(scannerPhone: string, qrToken: string) {
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
                        id: `wamid.test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

async function sendRequest(payload: object, index: number): Promise<{ ok: boolean; ms: number; status: number }> {
    const start = Date.now()
    try {
        const res = await fetch(`${BASE_URL}${WEBHOOK_PATH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        return { ok: res.status === 200, ms: Date.now() - start, status: res.status }
    } catch (e: any) {
        return { ok: false, ms: Date.now() - start, status: 0 }
    }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n🚀 Load test Joblify Webhook`)
    console.log(`   URL:         ${BASE_URL}${WEBHOOK_PATH}`)
    console.log(`   Requests:    ${N}`)
    console.log(`   Concurrency: ${CONCURRENCY}`)
    console.log(`   Modo:        ${DRY_RUN ? 'DRY RUN (sin enviar)' : 'REAL'}\n`)

    // 1. Obtener qr_tokens reales de la DB
    console.log('📦 Obteniendo qr_tokens de la DB...')
    const { data: contacts, error } = await supabase
        .from('contacts')
        .select('qr_token, name')
        .not('qr_token', 'is', null)
        .limit(100)

    if (error || !contacts?.length) {
        console.error('❌ No se pudieron obtener contactos de la DB:', error?.message)
        process.exit(1)
    }

    const tokens = contacts.map(c => c.qr_token as string)
    console.log(`   ✓ ${tokens.length} tokens disponibles (usando ${Math.min(N, tokens.length)} únicos)\n`)

    // 2. Construir N payloads
    const jobs = Array.from({ length: N }, (_, i) => ({
        phone: randomChileanPhone(),
        token: tokens[i % tokens.length],
        index: i + 1,
    }))

    if (DRY_RUN) {
        console.log('📋 Primeros 3 payloads de ejemplo:')
        jobs.slice(0, 3).forEach(j => {
            console.log(JSON.stringify(buildPayload(j.phone, j.token), null, 2))
        })
        return
    }

    // 3. Ejecutar con concurrencia controlada
    const results: { ok: boolean; ms: number; status: number }[] = []
    const startTotal = Date.now()
    let done = 0

    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
        const batch = jobs.slice(i, i + CONCURRENCY)
        const batchResults = await Promise.all(
            batch.map(j => sendRequest(buildPayload(j.phone, j.token), j.index))
        )
        results.push(...batchResults)
        done += batch.length

        const ok = results.filter(r => r.ok).length
        const avgMs = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length)
        process.stdout.write(`\r   Progreso: ${done}/${N} | OK: ${ok} | Avg: ${avgMs}ms`)
    }

    const totalMs = Date.now() - startTotal

    // 4. Reporte final
    const ok = results.filter(r => r.ok).length
    const failed = results.filter(r => !r.ok)
    const latencies = results.map(r => r.ms).sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)]
    const p95 = latencies[Math.floor(latencies.length * 0.95)]
    const p99 = latencies[Math.floor(latencies.length * 0.99)]
    const avg = Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)

    console.log(`\n\n${'─'.repeat(50)}`)
    console.log(`📊 RESULTADOS`)
    console.log(`${'─'.repeat(50)}`)
    console.log(`  Total requests:  ${N}`)
    console.log(`  Exitosos (200):  ${ok} (${Math.round(ok / N * 100)}%)`)
    console.log(`  Fallidos:        ${failed.length}`)
    console.log(`  Tiempo total:    ${(totalMs / 1000).toFixed(1)}s`)
    console.log(`  Throughput:      ${Math.round(N / (totalMs / 1000))} req/s`)
    console.log(``)
    console.log(`  Latencia (tiempo hasta 200 OK):`)
    console.log(`    Promedio:  ${avg}ms`)
    console.log(`    P50:       ${p50}ms`)
    console.log(`    P95:       ${p95}ms`)
    console.log(`    P99:       ${p99}ms`)
    console.log(`    Máximo:    ${latencies[latencies.length - 1]}ms`)

    if (failed.length > 0) {
        const statusCounts: Record<number, number> = {}
        failed.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1 })
        console.log(`\n  ⚠️  Errores por código HTTP:`)
        Object.entries(statusCounts).forEach(([code, count]) => {
            console.log(`    HTTP ${code}: ${count} requests`)
        })
    }

    console.log(`${'─'.repeat(50)}`)

    // Evaluación
    const verdict = ok === N && p95 < 3000
        ? '✅ PASA — sistema listo para el evento'
        : ok / N >= 0.95 && p95 < 5000
        ? '⚠️  MARGINAL — revisa los errores antes del evento'
        : '❌ FALLA — hay problemas que resolver'

    console.log(`\n  ${verdict}\n`)
}

main().catch(e => {
    console.error('Error fatal:', e)
    process.exit(1)
})
