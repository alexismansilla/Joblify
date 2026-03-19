import { describe, it, expect, vi } from 'vitest'

// Mock 'use server' dependencies before importing
vi.mock('@/lib/services/authorityService', () => ({
    authorityService: {},
}))
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

import { parseCsvToAuthorities, mapRowToAuthority } from '@/app/actions/authorities'

// ─── mapRowToAuthority ─────────────────────────────────────────────

describe('mapRowToAuthority', () => {
    it('maps "nombre" header to firstName', () => {
        const result = mapRowToAuthority({ nombre: 'Juan', apellido: 'Perez' })
        expect(result).not.toBeNull()
        expect(result!.name).toBe('Juan Perez')
    })
    
    it('composes name properly with multiple variants', () => {
        expect(mapRowToAuthority({ nombres: 'Maria', apellidos: 'Gomez' })!.name).toBe('Maria Gomez')
        expect(mapRowToAuthority({ name: 'Charlie', 'last name': 'Brown' })!.name).toBe('Charlie Brown')
    })

    it('returns null when no firstName and no lastName is found', () => {
        expect(mapRowToAuthority({ cargo: 'CEO' })).toBeNull()
    })

    it('maps position variants', () => {
        expect(mapRowToAuthority({ nombre: 'Juan', cargo: 'CEO' })!.position).toBe('CEO')
        expect(mapRowToAuthority({ nombre: 'Juan', position: 'CTO' })!.position).toBe('CTO')
    })
    
    it('maps organization variants', () => {
        expect(mapRowToAuthority({ nombre: 'Juan', organización: 'Corp1' })!.organization).toBe('Corp1')
        expect(mapRowToAuthority({ nombre: 'Juan', organizacion: 'Corp2' })!.organization).toBe('Corp2')
        expect(mapRowToAuthority({ nombre: 'Juan', organization: 'Corp3' })!.organization).toBe('Corp3')
        expect(mapRowToAuthority({ nombre: 'Juan', empresa: 'Corp4' })!.organization).toBe('Corp4')
    })

    it('sets optional fields to empty or null when missing', () => {
        const result = mapRowToAuthority({ nombre: 'Solo' })!
        expect(result.position).toBe('')
        expect(result.organization).toBeNull()
    })
})

// ─── parseCsvToAuthorities ──────────────────────────────────────────

describe('parseCsvToAuthorities', () => {
    it('parses comma-delimited CSV', () => {
        const csv = 'nombres,apellidos,cargo,empresa\nJuan,Pérez,Gerente,TestCorp'
        const result = parseCsvToAuthorities(csv)
        expect(result).toHaveLength(1)
        expect(result[0]!.name).toBe('Juan Pérez')
        expect(result[0]!.position).toBe('Gerente')
        expect(result[0]!.organization).toBe('TestCorp')
    })

    it('skips rows without any names', () => {
        const csv = 'nombres,cargo\nJuan,CEO\n,skipMe\nAna,CTO'
        const result = parseCsvToAuthorities(csv)
        expect(result).toHaveLength(2)
        expect(result[0]!.name).toBe('Juan')
        expect(result[1]!.name).toBe('Ana')
    })

    it('returns empty array for only headers (no data rows)', () => {
        const csv = 'nombres,cargo'
        expect(parseCsvToAuthorities(csv)).toEqual([])
    })

    it('handles headers case insensitively', () => {
        const csv = 'Nombres,Apellidos,Cargo\nJuan,Pérez,Director'
        const result = parseCsvToAuthorities(csv)
        expect(result).toHaveLength(1)
        expect(result[0]!.name).toBe('Juan Pérez')
        expect(result[0]!.position).toBe('Director')
    })
})
