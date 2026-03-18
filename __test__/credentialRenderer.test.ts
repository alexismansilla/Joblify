import { describe, it, expect } from 'vitest'
import { wrapText } from '@/lib/credentialRenderer'

// Mock CanvasRenderingContext2D: 10px per character
function mockCtx(): CanvasRenderingContext2D {
    return {
        measureText: (text: string) => ({ width: text.length * 10 }),
    } as unknown as CanvasRenderingContext2D
}

describe('wrapText', () => {
    it('returns single line when text fits', () => {
        const ctx = mockCtx()
        expect(wrapText(ctx, 'Hello', 100)).toEqual(['Hello'])
    })

    it('wraps text into multiple lines when exceeding maxWidth', () => {
        const ctx = mockCtx()
        // "Hello World" = 11 chars = 110px, maxWidth 80px
        const lines = wrapText(ctx, 'Hello World', 80)
        expect(lines).toEqual(['Hello', 'World'])
    })

    it('single word exceeding maxWidth stays on its own line', () => {
        const ctx = mockCtx()
        // "Superlongword" = 13 chars = 130px, maxWidth 50
        const lines = wrapText(ctx, 'Superlongword', 50)
        expect(lines).toEqual(['Superlongword'])
    })

    it('returns single element for a single word', () => {
        const ctx = mockCtx()
        expect(wrapText(ctx, 'Word', 200)).toEqual(['Word'])
    })

    it('handles empty string', () => {
        const ctx = mockCtx()
        expect(wrapText(ctx, '', 200)).toEqual([''])
    })

    it('splits 3 words each near maxWidth into 3 lines', () => {
        const ctx = mockCtx()
        // Each word 8 chars = 80px, maxWidth = 90
        // "ABCDEFGH" (80px) fits, "ABCDEFGH ABCDEFGH" (170px) doesn't
        const lines = wrapText(ctx, 'ABCDEFGH ABCDEFGH ABCDEFGH', 90)
        expect(lines).toEqual(['ABCDEFGH', 'ABCDEFGH', 'ABCDEFGH'])
    })

    it('keeps words on same line when they fit together', () => {
        const ctx = mockCtx()
        // "Hi There Friend" -> "Hi There" = 8 chars = 80px fits in 100, "Hi There Friend" = 15*10 = 150 > 100
        const lines = wrapText(ctx, 'Hi There Friend', 100)
        expect(lines).toEqual(['Hi There', 'Friend'])
    })
})
