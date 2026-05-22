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
    it('con solo nombre usa el nombre como empresa y representante', () => {
        const msg = buildProfileMessageText({ name: 'Francisca Paris' })
        expect(msg).toContain('🏢 *Empresa:* Francisca Paris')
        expect(msg).toContain('👤 *Representante:* Francisca Paris')
        expect(msg).not.toContain('N/A')
    })

    it('con company null usa el nombre como fallback de empresa', () => {
        const msg = buildProfileMessageText({
            name: 'Francisca Paris',
            company: null,
            position: null,
        })
        expect(msg).toContain('🏢 *Empresa:* Francisca Paris')
        expect(msg).toContain('👤 *Representante:* Francisca Paris')
        expect(msg).not.toContain('👔 *Cargo:*')
    })

    it('no contiene N/A cuando todos los campos están completos', () => {
        const msg = buildProfileMessageText({
            name: 'Ana Torres',
            company: 'Acme',
            position: 'CTO',
            industry: 'Software',
        })
        expect(msg).not.toContain('N/A')
        expect(msg).toContain('🏢 *Empresa:* Acme')
        expect(msg).toContain('👤 *Representante:* Ana Torres')
        expect(msg).toContain('👔 *Cargo:* CTO')
    })

    it('siempre incluye el texto de interés al final', () => {
        const msg = buildProfileMessageText({ name: 'Solo Nombre' })
        expect(msg).toContain('¿Cuál es tu nivel de interés en esta empresa?')
    })

    it('con company y position nulos usa el nombre como empresa sin mostrar cargo', () => {
        const msg = buildProfileMessageText({ name: 'Juan Pérez', company: null, position: null })
        expect(msg).toContain('🏢 *Empresa:* Juan Pérez')
        expect(msg).not.toContain('👔 *Cargo:*')
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
