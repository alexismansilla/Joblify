import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock de next/server: hace que after() sea awaitable en tests ─────
let pendingAfter: Promise<void>[] = []

vi.mock('next/server', async () => {
    const mod = await vi.importActual<typeof import('next/server')>('next/server')
    return {
        ...mod,
        after: (fn: () => Promise<void>) => { pendingAfter.push(fn()) },
    }
})

// ─── Mocks (hoisted so vi.mock factories can reference them) ─────

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

vi.mock('@/lib/services/contactService', () => ({
    contactService: mockContactService,
}))

vi.mock('@/lib/services/whatsappService', () => ({
    whatsappService: mockWhatsappService,
}))

import { GET, POST } from '@/app/api/whatsapp/webhook/route'

// ─── Helpers ─────────────────────────────────────────────────────

function makeGetRequest(params: Record<string, string>): Request {
    const url = new URL('http://localhost/api/whatsapp/webhook')
    for (const [key, val] of Object.entries(params)) {
        url.searchParams.set(key, val)
    }
    return new Request(url.toString())
}

function makePostRequest(body: unknown): Request {
    return new Request('http://localhost/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}

async function postAndFlush(body: unknown): Promise<Response> {
    pendingAfter = []
    const res = await POST(makePostRequest(body))
    await Promise.all(pendingAfter)
    return res
}

function makeWhatsappBody(message: Record<string, unknown>) {
    return {
        object: 'whatsapp_business_account',
        entry: [{
            changes: [{
                value: {
                    messages: [{ from: '56912345678', ...message }],
                },
            }],
        }],
    }
}

// ─── Tests ───────────────────────────────────────────────────────

describe('GET - webhook verification', () => {
    beforeEach(() => {
        vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'my-secret-token')
    })

    it('returns 200 + challenge when token is correct and mode is subscribe', async () => {
        const req = makeGetRequest({
            'hub.mode': 'subscribe',
            'hub.verify_token': 'my-secret-token',
            'hub.challenge': 'challenge123',
        })
        const res = await GET(req)
        expect(res.status).toBe(200)
        expect(await res.text()).toBe('challenge123')
    })

    it('returns 403 when token is incorrect', async () => {
        const req = makeGetRequest({
            'hub.mode': 'subscribe',
            'hub.verify_token': 'wrong-token',
            'hub.challenge': 'challenge123',
        })
        const res = await GET(req)
        expect(res.status).toBe(403)
    })

    it('returns 403 when mode is incorrect', async () => {
        const req = makeGetRequest({
            'hub.mode': 'unsubscribe',
            'hub.verify_token': 'my-secret-token',
            'hub.challenge': 'challenge123',
        })
        const res = await GET(req)
        expect(res.status).toBe(403)
    })
})

describe('POST - text message with QR token', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        pendingAfter = []
    })

    it('creates match when valid token and known scanner', async () => {
        const targetContact = { id: 'c1', name: 'Target', phone: '912345678' }
        const scannerContact = { id: 's1', name: 'Scanner' }
        mockContactService.getByQrToken.mockResolvedValue(targetContact)
        mockContactService.getByIdentifier.mockResolvedValue(scannerContact)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm1' }])

        const res = await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: 'Hello @ABCD1234EF from my QR' } }))
        expect(res.status).toBe(200)
        expect(mockContactService.registerWhatsappMatch).toHaveBeenCalledWith('c1', 's1', '56912345678')
        expect(mockWhatsappService.sendInteractiveProfileMessage).toHaveBeenCalled()
        expect(mockWhatsappService.sendContactCard).toHaveBeenCalled()
    })

    it('creates match with scanner_id null when scanner unknown', async () => {
        const targetContact = { id: 'c1', name: 'Target', phone: '912345678' }
        mockContactService.getByQrToken.mockResolvedValue(targetContact)
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue([{ id: 'm1' }])

        const res = await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: 'Scan @ABCDEF12' } }))
        expect(res.status).toBe(200)
        expect(mockContactService.registerWhatsappMatch).toHaveBeenCalledWith('c1', null, '56912345678')
    })

    it('does not search contact when no @ token in message', async () => {
        const res = await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: 'Just a normal message' } }))
        expect(res.status).toBe(200)
        expect(mockContactService.getByQrToken).not.toHaveBeenCalled()
    })

    it('does not create match when token not found in DB', async () => {
        mockContactService.getByQrToken.mockResolvedValue(null)
        const res = await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: 'Scan @NOTEXIST' } }))
        expect(res.status).toBe(200)
        expect(mockContactService.registerWhatsappMatch).not.toHaveBeenCalled()
    })

    it('does not send messages when match registration fails', async () => {
        mockContactService.getByQrToken.mockResolvedValue({ id: 'c1', name: 'T', phone: '9' })
        mockContactService.getByIdentifier.mockResolvedValue(null)
        mockContactService.registerWhatsappMatch.mockResolvedValue(null)

        const res = await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: '@ABCDEFGH' } }))
        expect(res.status).toBe(200)
        expect(mockWhatsappService.sendInteractiveProfileMessage).not.toHaveBeenCalled()
        expect(mockWhatsappService.sendContactCard).not.toHaveBeenCalled()
    })

    it('accepts 8-character token', async () => {
        mockContactService.getByQrToken.mockResolvedValue(null)
        await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: '@ABCDEFGH' } }))
        expect(mockContactService.getByQrToken).toHaveBeenCalledWith('ABCDEFGH')
    })

    it('accepts 10-character token', async () => {
        mockContactService.getByQrToken.mockResolvedValue(null)
        await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: '@ABCDEFGHIJ' } }))
        expect(mockContactService.getByQrToken).toHaveBeenCalledWith('ABCDEFGHIJ')
    })

    it('ignores token shorter than 8 characters', async () => {
        await postAndFlush(makeWhatsappBody({ type: 'text', text: { body: '@SHORT' } }))
        expect(mockContactService.getByQrToken).not.toHaveBeenCalled()
    })
})

describe('POST - button reply', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        pendingAfter = []
    })

    it('updates connection_type to negocio and sends confirmation', async () => {
        mockContactService.updateMatchConnectionType.mockResolvedValue([{ id: 'm1' }])
        const res = await postAndFlush(makeWhatsappBody({ type: 'interactive', interactive: { button_reply: { id: 'negocio_uuid-123' } } }))
        expect(res.status).toBe(200)
        expect(mockContactService.updateMatchConnectionType).toHaveBeenCalledWith('uuid-123', 'negocio')
        expect(mockWhatsappService.sendTextMessage).toHaveBeenCalled()
    })

    it('updates connection_type to mentoria', async () => {
        mockContactService.updateMatchConnectionType.mockResolvedValue([{ id: 'm1' }])
        await postAndFlush(makeWhatsappBody({ type: 'interactive', interactive: { button_reply: { id: 'mentoria_match-456' } } }))
        expect(mockContactService.updateMatchConnectionType).toHaveBeenCalledWith('match-456', 'mentoria')
    })

    it('updates connection_type to casual', async () => {
        mockContactService.updateMatchConnectionType.mockResolvedValue([{ id: 'm1' }])
        await postAndFlush(makeWhatsappBody({ type: 'interactive', interactive: { button_reply: { id: 'casual_match-789' } } }))
        expect(mockContactService.updateMatchConnectionType).toHaveBeenCalledWith('match-789', 'casual')
    })

    it('does not send confirmation when update fails', async () => {
        mockContactService.updateMatchConnectionType.mockResolvedValue(null)
        await postAndFlush(makeWhatsappBody({ type: 'interactive', interactive: { button_reply: { id: 'negocio_uuid-fail' } } }))
        expect(mockWhatsappService.sendTextMessage).not.toHaveBeenCalled()
    })

    it('does not call update when button ID has no underscore', async () => {
        await postAndFlush(makeWhatsappBody({ type: 'interactive', interactive: { button_reply: { id: 'nounderscore' } } }))
        expect(mockContactService.updateMatchConnectionType).not.toHaveBeenCalled()
    })
})

describe('POST - edge cases', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        pendingAfter = []
    })

    it('returns 404 when body.object is not whatsapp_business_account', async () => {
        const res = await postAndFlush({ object: 'something_else' })
        expect(res.status).toBe(404)
    })

    it('returns 200 when no messages in entry', async () => {
        const res = await postAndFlush({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: { messages: [] } }] }] })
        expect(res.status).toBe(200)
    })

    it('returns 200 when messages array is missing', async () => {
        const res = await postAndFlush({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: {} }] }] })
        expect(res.status).toBe(200)
    })
})
