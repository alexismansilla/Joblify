import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildProfileMessageText } from '@/lib/templates/whatsappTemplates'

// ─── Mock de next/server: hace que after() sea awaitable en tests ─────────────
let pendingAfter: Promise<void>[] = []

vi.mock('next/server', async () => {
    const mod = await vi.importActual<typeof import('next/server')>('next/server')
    return {
        ...mod,
        after: (fn: () => Promise<void>) => { pendingAfter.push(fn()) },
    }
})

// ─── Mocks de servicios ───────────────────────────────────────────────────────
const { mockContactService, mockWhatsappService } = vi.hoisted(() => ({
    mockContactService: {
        getByQrToken: vi.fn(),
        getByIdentifier: vi.fn(),
        registerWhatsappMatch: vi.fn(),
        updateMatchConnectionType: vi.fn(),
    },
    mockWhatsappService: {
        sendInteractiveProfileMessage: vi.fn(),
        sendContactCard: vi.fn(),
        sendTextMessage: vi.fn(),
    },
}))

vi.mock('@/lib/services/contactService', () => ({ contactService: mockContactService }))
vi.mock('@/lib/services/whatsappService', () => ({ whatsappService: mockWhatsappService }))

import { POST } from '@/app/api/whatsapp/webhook/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function postAndFlush(body: unknown): Promise<Response> {
    pendingAfter = []
    const req = new Request('http://localhost/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    await Promise.all(pendingAfter)
    return res
}

function makeWhatsappTextBody(from: string, text: string) {
    return {
        object: 'whatsapp_business_account',
        entry: [{ changes: [{ value: { messages: [{ from, type: 'text', text: { body: text } }] } }] }],
    }
}

// ─── 1. buildProfileMessageText — campos nulos muestran N/A ──────────────────

describe('buildProfileMessageText — campos nulos', () => {
    it('muestra N/A en todos los campos cuando el contacto solo tiene nombre', () => {
        const msg = buildProfileMessageText({ name: 'Francisca Paris' })
        expect(msg).toContain('👤 *Nombre:* Francisca Paris')
        expect(msg).toContain('📱 *Teléfono:* N/A')
        expect(msg).toContain('📧 *Email:* N/A')
        expect(msg).toContain('🧑‍💻 *Perfil:* N/A')
        expect(msg).toContain('💼 *Empresa:* N/A')
        expect(msg).toContain('👔 *Cargo:* N/A')
        expect(msg).toContain('🏭 *Industria:* N/A')
    })

    it('muestra N/A solo en campos faltantes, respeta los que sí existen', () => {
        const msg = buildProfileMessageText({
            name: 'Francisca Paris',
            phone: null,
            email: 'franciscaparis@gmail.com',
            company: null,
            position: null,
            profile: 'Ecosistema',
            industry: null,
        })
        expect(msg).toContain('📱 *Teléfono:* N/A')
        expect(msg).toContain('📧 *Email:* franciscaparis@gmail.com')
        expect(msg).toContain('🧑‍💻 *Perfil:* Ecosistema')
        expect(msg).toContain('💼 *Empresa:* N/A')
        expect(msg).toContain('👔 *Cargo:* N/A')
        expect(msg).toContain('🏭 *Industria:* N/A')
    })

    it('no contiene N/A cuando todos los campos están completos', () => {
        const msg = buildProfileMessageText({
            name: 'Ana Torres',
            phone: '+56912345678',
            email: 'ana@empresa.cl',
            profile: 'Tecnología',
            company: 'Acme',
            position: 'CTO',
            industry: 'Software',
        })
        expect(msg).not.toContain('N/A')
        expect(msg).toContain('💼 *Empresa:* Acme')
        expect(msg).toContain('👔 *Cargo:* CTO')
    })

    it('siempre incluye el texto de clasificación al final', () => {
        const msg = buildProfileMessageText({ name: 'Solo Nombre' })
        expect(msg).toContain('¿Cómo clasificarías esta conexión?')
    })

    it('maneja company y position nulos con N/A', () => {
        const msg = buildProfileMessageText({ name: 'Juan Pérez', company: null, position: null })
        expect(msg).toContain('💼 *Empresa:* N/A')
        expect(msg).toContain('👔 *Cargo:* N/A')
    })
})

// ─── 2. Webhook — target sin teléfono no rompe el flujo ──────────────────────

describe('Webhook POST — target sin teléfono (caso Francisca Paris)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        pendingAfter = []
    })

    it('responde 200 aunque el target no tenga teléfono', async () => {
        mockContactService.getByQrToken.mockResolvedValue({ id: 'c1', name: 'Francisca Paris', phone: null })
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm1' }])

        const res = await postAndFlush(makeWhatsappTextBody('56987654321', '@I1KOSGDNF8'))
        expect(res.status).toBe(200)
    })

    it('envía el mensaje de perfil aunque el target no tenga teléfono', async () => {
        const target = { id: 'c1', name: 'Francisca Paris', phone: null, email: 'fp@gmail.com' }
        mockContactService.getByQrToken.mockResolvedValue(target)
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm1' }])

        await postAndFlush(makeWhatsappTextBody('56987654321', '@I1KOSGDNF8'))
        expect(mockWhatsappService.sendInteractiveProfileMessage).toHaveBeenCalledWith('56987654321', target, 'm1')
    })

    it('llama a sendContactCard con phone null (la guarda está en el servicio)', async () => {
        const target = { id: 'c1', name: 'Francisca Paris', phone: null }
        mockContactService.getByQrToken.mockResolvedValue(target)
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm1' }])

        await postAndFlush(makeWhatsappTextBody('56987654321', '@I1KOSGDNF8'))
        expect(mockWhatsappService.sendContactCard).toHaveBeenCalledWith('56987654321', 'Francisca Paris', null)
    })

    it('registra el match con scanner_id null cuando el escáner no está en la DB', async () => {
        mockContactService.getByQrToken.mockResolvedValue({ id: 'c1', name: 'Francisca Paris', phone: null })
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm1' }])

        await postAndFlush(makeWhatsappTextBody('56987654321', '@I1KOSGDNF8'))
        expect(mockContactService.registerWhatsappMatch).toHaveBeenCalledWith('c1', null, '56987654321')
    })
})

// ─── 3. Webhook — target con campos incompletos ───────────────────────────────

describe('Webhook POST — target con campos incompletos', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        pendingAfter = []
    })

    it('responde 200 y envía mensajes cuando el target no tiene empresa ni cargo', async () => {
        mockContactService.getByQrToken.mockResolvedValue({ id: 'c2', name: 'Juan Pérez', phone: '56911111111', company: null, position: null })
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm2' }])

        const res = await postAndFlush(makeWhatsappTextBody('56987654321', '@ABCD1234EF'))
        expect(res.status).toBe(200)
        expect(mockWhatsappService.sendInteractiveProfileMessage).toHaveBeenCalled()
        expect(mockWhatsappService.sendContactCard).toHaveBeenCalled()
    })

    it('responde 200 y envía mensajes cuando el target no tiene email', async () => {
        mockContactService.getByQrToken.mockResolvedValue({ id: 'c3', name: 'María González', phone: '56922222222', email: null, company: 'Acme' })
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm3' }])

        const res = await postAndFlush(makeWhatsappTextBody('56987654321', '@EFGH5678IJ'))
        expect(res.status).toBe(200)
        expect(mockWhatsappService.sendInteractiveProfileMessage).toHaveBeenCalled()
    })

    it('responde 200 cuando el scanner no está en la DB y registra con scanner_id null', async () => {
        mockContactService.getByQrToken.mockResolvedValue({ id: 'c4', name: 'Carlos López', phone: '56933333333' })
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm4' }])

        const res = await postAndFlush(makeWhatsappTextBody('56999999999', '@KLMN9012OP'))
        expect(res.status).toBe(200)
        expect(mockContactService.registerWhatsappMatch).toHaveBeenCalledWith('c4', null, '56999999999')
    })

    it('responde 200 cuando el target solo tiene nombre y nada más', async () => {
        mockContactService.getByQrToken.mockResolvedValue({ id: 'c5', name: 'Solo Nombre', phone: null, email: null, company: null, position: null, profile: null, industry: null })
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm5' }])

        const res = await postAndFlush(makeWhatsappTextBody('56987654321', '@QRST3456UV'))
        expect(res.status).toBe(200)
        expect(mockWhatsappService.sendInteractiveProfileMessage).toHaveBeenCalled()
    })
})
