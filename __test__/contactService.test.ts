import { describe, it, expect, vi, beforeEach } from 'vitest'

// Chainable mock builder for Supabase
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
    const chain: any = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    }
    return chain
}

let mockSupabase: ReturnType<typeof createChainMock>

vi.mock('@/lib/supabase', () => ({
    get supabase() {
        return mockSupabase
    },
}))

// Import after mocking
import { contactService } from '@/lib/services/contactService'

describe('contactService.getByIdentifier', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('builds OR query with RUT variants for formatted RUT', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        await contactService.getByIdentifier('12.345.678-9')

        expect(mockSupabase.or).toHaveBeenCalledOnce()
        const orQuery: string = mockSupabase.or.mock.calls[0][0]

        // Clean RUT (digits + K only)
        expect(orQuery).toContain('rut.eq.123456789')
        // Formatted RUT (with dash before check digit)
        expect(orQuery).toContain('rut.eq.12345678-9')
        // Original
        expect(orQuery).toContain('rut.eq.12.345.678-9')
    })

    it('generates phone variants for 9-digit local number', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        await contactService.getByIdentifier('912345678')

        const orQuery: string = mockSupabase.or.mock.calls[0][0]

        expect(orQuery).toContain('phone.eq.912345678')
        expect(orQuery).toContain('phone.eq.56912345678')
        expect(orQuery).toContain('phone.eq.+56912345678')
    })

    it('generates phone variants for 11-digit Chilean number', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        await contactService.getByIdentifier('56912345678')

        const orQuery: string = mockSupabase.or.mock.calls[0][0]

        // Extracts local phone 912345678
        expect(orQuery).toContain('phone.eq.912345678')
        expect(orQuery).toContain('phone.eq.+56912345678')
        // Also includes the digits-only and +digits
        expect(orQuery).toContain('phone.eq.56912345678')
        expect(orQuery).toContain('phone.eq.+56912345678')
    })

    it('does not enter Chilean branch for non-Chilean international number', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        await contactService.getByIdentifier('5491155551234')

        const orQuery: string = mockSupabase.or.mock.calls[0][0]

        // Should NOT extract a "local" phone as Chilean
        expect(orQuery).not.toContain('phone.eq.91155551234')
        // Should have fallback variants
        expect(orQuery).toContain('phone.eq.5491155551234')
        expect(orQuery).toContain('phone.eq.+5491155551234')
    })

    it('includes email in OR query', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        await contactService.getByIdentifier('test@example.com')

        const orQuery: string = mockSupabase.or.mock.calls[0][0]
        expect(orQuery).toContain('email.eq.test@example.com')
    })

    it('throws on Supabase error', async () => {
        mockSupabase = createChainMock({ data: null, error: new Error('DB error') })

        await expect(contactService.getByIdentifier('test')).rejects.toThrow('DB error')
    })

    it('returns null when no contact found', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        const result = await contactService.getByIdentifier('ghost@nobody.com')
        expect(result).toBeNull()
    })

    it('returns the contact when found', async () => {
        const fakeContact = { id: '1', name: 'Test', email: 'test@test.com' }
        mockSupabase = createChainMock({ data: fakeContact, error: null })

        const result = await contactService.getByIdentifier('test@test.com')
        expect(result).toEqual(fakeContact)
    })

    it('queries the contacts table', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        await contactService.getByIdentifier('anything')

        expect(mockSupabase.from).toHaveBeenCalledWith('contacts')
    })

    it('limits results to 1', async () => {
        mockSupabase = createChainMock({ data: null, error: null })

        await contactService.getByIdentifier('anything')

        expect(mockSupabase.limit).toHaveBeenCalledWith(1)
    })
})
