import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to import the whole module to test sendContactCard
import { whatsappService } from '@/lib/services/whatsappService'

describe('whatsappService.sendContactCard', () => {
    let fetchSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ messages: [{ id: 'wamid.123' }] }),
        })
        vi.stubGlobal('fetch', fetchSpy)
        vi.stubEnv('WHATSAPP_ACCESS_TOKEN', 'test-token')
        vi.stubEnv('WHATSAPP_PHONE_ID', 'phone-123')
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    it('normalizes phone and builds correct payload', async () => {
        await whatsappService.sendContactCard('56900000000', 'Juan Pérez', '938997919')

        expect(fetchSpy).toHaveBeenCalledOnce()
        const [url, options] = fetchSpy.mock.calls[0]
        expect(url).toContain('phone-123/messages')

        const payload = JSON.parse(options.body)
        expect(payload.type).toBe('contacts')
        expect(payload.contacts[0].name.formatted_name).toBe('Juan Pérez')
        expect(payload.contacts[0].name.first_name).toBe('Juan')
        expect(payload.contacts[0].name.last_name).toBe('Pérez')
        // 938997919 → +56938997919 → wa_id 56938997919
        expect(payload.contacts[0].phones[0].wa_id).toBe('56938997919')
        expect(payload.contacts[0].phones[0].phone).toBe('+56938997919')
    })

    it('does not call fetch without WHATSAPP_ACCESS_TOKEN', async () => {
        vi.stubEnv('WHATSAPP_ACCESS_TOKEN', '')

        await whatsappService.sendContactCard('56900000000', 'Juan', '938997919')

        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('does not call fetch without WHATSAPP_PHONE_ID', async () => {
        vi.stubEnv('WHATSAPP_PHONE_ID', '')

        await whatsappService.sendContactCard('56900000000', 'Juan', '938997919')

        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('splits single-word name with empty last_name', async () => {
        await whatsappService.sendContactCard('56900000000', 'Madonna', '938997919')

        const payload = JSON.parse(fetchSpy.mock.calls[0][1].body)
        expect(payload.contacts[0].name.first_name).toBe('Madonna')
        expect(payload.contacts[0].name.last_name).toBe('')
    })

    it('splits multi-part name into first and rest', async () => {
        await whatsappService.sendContactCard('56900000000', 'María José García', '938997919')

        const payload = JSON.parse(fetchSpy.mock.calls[0][1].body)
        expect(payload.contacts[0].name.first_name).toBe('María')
        expect(payload.contacts[0].name.last_name).toBe('José García')
    })

    it('does not throw when fetch rejects', async () => {
        fetchSpy.mockRejectedValue(new Error('Network error'))

        // Should not throw
        await expect(
            whatsappService.sendContactCard('56900000000', 'Juan', '938997919')
        ).resolves.toBeUndefined()
    })
})
