import { describe, it, expect } from 'vitest'
import { normalizeChileanPhone } from '@/lib/services/whatsappService'

describe('normalizeChileanPhone', () => {
    it('prepends + to number starting with 56', () => {
        expect(normalizeChileanPhone('56938997919')).toBe('+56938997919')
    })

    it('prepends +56 to 9-digit number starting with 9', () => {
        expect(normalizeChileanPhone('938997919')).toBe('+56938997919')
    })

    it('does not duplicate prefix when already has +56', () => {
        expect(normalizeChileanPhone('+56938997919')).toBe('+56938997919')
    })

    it('strips spaces and dashes before normalizing', () => {
        expect(normalizeChileanPhone('9 3899 7919')).toBe('+56938997919')
        expect(normalizeChileanPhone('56-9-3899-7919')).toBe('+56938997919')
    })

    it('handles non-Chilean numbers by prepending +', () => {
        expect(normalizeChileanPhone('5491155551234')).toBe('+5491155551234')
    })

    it('9-digit number NOT starting with 9 gets fallback +', () => {
        expect(normalizeChileanPhone('212345678')).toBe('+212345678')
    })

    it('handles short numbers with fallback +', () => {
        expect(normalizeChileanPhone('12345')).toBe('+12345')
    })

    it('handles number with only non-digit characters cleaned', () => {
        expect(normalizeChileanPhone('+1 (234) 567-8900')).toBe('+12345678900')
    })
})
