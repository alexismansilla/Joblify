import { describe, it, expect, vi } from 'vitest'

// Mock 'use server' dependencies before importing
vi.mock('@/lib/services/contactService', () => ({
    contactService: {},
}))
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

import { splitCsvLine, mapRowToContact, cellToText, parseCsvToContacts } from '@/app/actions/contactsParser'

// ─── splitCsvLine ────────────────────────────────────────────────

describe('splitCsvLine', () => {
    it('splits by comma delimiter', () => {
        expect(splitCsvLine('a,b,c', ',')).toEqual(['a', 'b', 'c'])
    })

    it('splits by semicolon delimiter', () => {
        expect(splitCsvLine('a;b;c', ';')).toEqual(['a', 'b', 'c'])
    })

    it('handles quoted fields with internal delimiter', () => {
        expect(splitCsvLine('"hello, world",b,c', ',')).toEqual(['hello, world', 'b', 'c'])
    })

    it('handles empty fields', () => {
        expect(splitCsvLine('a,,c', ',')).toEqual(['a', '', 'c'])
    })

    it('handles trailing delimiter', () => {
        expect(splitCsvLine('a,b,', ',')).toEqual(['a', 'b', ''])
    })

    it('handles single field', () => {
        expect(splitCsvLine('hello', ',')).toEqual(['hello'])
    })
})

// ─── mapRowToContact ─────────────────────────────────────────────

describe('mapRowToContact', () => {
    it('maps "nombres" header to firstName', () => {
        const result = mapRowToContact({ nombres: 'Juan' })
        expect(result).not.toBeNull()
        expect(result!.first_name).toBe('Juan')
        expect(result!.name).toBe('Juan')
    })

    it('maps "nombre" header', () => {
        const result = mapRowToContact({ nombre: 'María' })
        expect(result!.first_name).toBe('María')
    })

    it('maps "first name" header', () => {
        const result = mapRowToContact({ 'first name': 'John' })
        expect(result!.first_name).toBe('John')
    })

    it('maps "first_name" header', () => {
        const result = mapRowToContact({ first_name: 'Jane' })
        expect(result!.first_name).toBe('Jane')
    })

    it('maps "name" header', () => {
        const result = mapRowToContact({ name: 'Carlos' })
        expect(result!.first_name).toBe('Carlos')
    })

    it('returns null when no firstName is found', () => {
        expect(mapRowToContact({ email: 'test@test.com' })).toBeNull()
    })

    it('returns null for empty object', () => {
        expect(mapRowToContact({})).toBeNull()
    })

    it('composes name from firstName + lastName', () => {
        const result = mapRowToContact({ nombres: 'Juan', apellidos: 'Pérez' })
        expect(result!.name).toBe('Juan Pérez')
        expect(result!.first_name).toBe('Juan')
        expect(result!.last_name).toBe('Pérez')
    })

    it('maps lastName variants: apellido, last name, last_name', () => {
        expect(mapRowToContact({ nombres: 'A', apellido: 'B' })!.last_name).toBe('B')
        expect(mapRowToContact({ nombres: 'A', 'last name': 'C' })!.last_name).toBe('C')
        expect(mapRowToContact({ nombres: 'A', last_name: 'D' })!.last_name).toBe('D')
    })

    it('maps email variants', () => {
        expect(mapRowToContact({ nombres: 'A', email: 'a@b.com' })!.email).toBe('a@b.com')
        expect(mapRowToContact({ nombres: 'A', 'e-mail': 'x@y.com' })!.email).toBe('x@y.com')
        expect(mapRowToContact({ nombres: 'A', correo: 'z@w.com' })!.email).toBe('z@w.com')
    })

    it('maps phone variants', () => {
        expect(mapRowToContact({ nombres: 'A', 'teléfono móvil': '123' })!.phone).toBe('123')
        expect(mapRowToContact({ nombres: 'A', 'telefono movil': '456' })!.phone).toBe('456')
        expect(mapRowToContact({ nombres: 'A', 'teléfono': '789' })!.phone).toBe('789')
        expect(mapRowToContact({ nombres: 'A', telefono: '012' })!.phone).toBe('012')
        expect(mapRowToContact({ nombres: 'A', phone: '345' })!.phone).toBe('345')
    })

    it('maps rut/identification variants', () => {
        expect(mapRowToContact({ nombres: 'A', 'rut/dni/pasaporte': '12345' })!.rut).toBe('12345')
        expect(mapRowToContact({ nombres: 'A', rut: '67890' })!.rut).toBe('67890')
        expect(mapRowToContact({ nombres: 'A', dni: 'ABC' })!.rut).toBe('ABC')
        expect(mapRowToContact({ nombres: 'A', pasaporte: 'PP' })!.rut).toBe('PP')
        expect(mapRowToContact({ nombres: 'A', identification_number: 'ID' })!.rut).toBe('ID')
    })

    it('maps company variants', () => {
        expect(mapRowToContact({ nombres: 'A', 'empresa u organización': 'Corp' })!.company).toBe('Corp')
        expect(mapRowToContact({ nombres: 'A', 'empresa u organizacion': 'LLC' })!.company).toBe('LLC')
        expect(mapRowToContact({ nombres: 'A', empresa: 'Inc' })!.company).toBe('Inc')
        expect(mapRowToContact({ nombres: 'A', 'organización': 'Org' })!.company).toBe('Org')
        expect(mapRowToContact({ nombres: 'A', organizacion: 'Fund' })!.company).toBe('Fund')
        expect(mapRowToContact({ nombres: 'A', company: 'Co' })!.company).toBe('Co')
    })

    it('maps position variants', () => {
        expect(mapRowToContact({ nombres: 'A', cargo: 'CEO' })!.position).toBe('CEO')
        expect(mapRowToContact({ nombres: 'A', position: 'CTO' })!.position).toBe('CTO')
        expect(mapRowToContact({ nombres: 'A', puesto: 'Dev' })!.position).toBe('Dev')
    })

    it('sets missing optional fields to null', () => {
        const result = mapRowToContact({ nombres: 'Solo' })!
        expect(result.last_name).toBeNull()
        expect(result.email).toBeNull()
        expect(result.phone).toBeNull()
        expect(result.rut).toBeNull()
        expect(result.company).toBeNull()
        expect(result.position).toBeNull()
    })
})

// ─── cellToText ──────────────────────────────────────────────────

describe('cellToText', () => {
    it('returns empty string for null', () => {
        expect(cellToText(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
        expect(cellToText(undefined)).toBe('')
    })

    it('trims string values', () => {
        expect(cellToText('  hello  ')).toBe('hello')
    })

    it('converts number to string', () => {
        expect(cellToText(42)).toBe('42')
    })

    it('converts boolean to string', () => {
        expect(cellToText(true)).toBe('true')
        expect(cellToText(false)).toBe('false')
    })

    it('converts Date to ISO string', () => {
        const date = new Date('2024-01-15T00:00:00.000Z')
        expect(cellToText(date)).toBe('2024-01-15T00:00:00.000Z')
    })

    it('extracts text from RichText object', () => {
        const richText = { richText: [{ text: 'Hello ' }, { text: 'World' }] }
        expect(cellToText(richText)).toBe('Hello World')
    })

    it('handles formula result recursively', () => {
        expect(cellToText({ result: 42 })).toBe('42')
        expect(cellToText({ result: 'hello' })).toBe('hello')
    })

    it('falls back to String() for unknown objects', () => {
        expect(cellToText({ toString: () => 'custom' })).toBe('custom')
    })
})

// ─── parseCsvToContacts ──────────────────────────────────────────

describe('parseCsvToContacts', () => {
    it('parses comma-delimited CSV', () => {
        const csv = 'nombres,apellidos,email\nJuan,Pérez,juan@test.com'
        const result = parseCsvToContacts(csv)
        expect(result).toHaveLength(1)
        expect(result[0]!.name).toBe('Juan Pérez')
        expect(result[0]!.email).toBe('juan@test.com')
    })

    it('parses semicolon-delimited CSV', () => {
        const csv = 'nombres;apellidos;email\nMaría;López;maria@test.com'
        const result = parseCsvToContacts(csv)
        expect(result).toHaveLength(1)
        expect(result[0]!.name).toBe('María López')
    })

    it('auto-detects comma when both present', () => {
        // When both , and ; exist in first line, defaults to comma
        const csv = 'nombres,apellidos\nJuan,Pérez'
        const result = parseCsvToContacts(csv)
        expect(result).toHaveLength(1)
    })

    it('skips rows without firstName', () => {
        const csv = 'nombres,email\nJuan,a@b.com\n,skip@me.com\nAna,c@d.com'
        const result = parseCsvToContacts(csv)
        expect(result).toHaveLength(2)
        expect(result[0]!.first_name).toBe('Juan')
        expect(result[1]!.first_name).toBe('Ana')
    })

    it('handles CRLF line endings', () => {
        const csv = 'nombres,email\r\nJuan,a@b.com\r\nAna,c@d.com'
        const result = parseCsvToContacts(csv)
        expect(result).toHaveLength(2)
    })

    it('returns empty array for only headers (no data rows)', () => {
        const csv = 'nombres,email'
        expect(parseCsvToContacts(csv)).toEqual([])
    })

    it('returns empty array for empty string', () => {
        expect(parseCsvToContacts('')).toEqual([])
    })

    it('handles headers case insensitively', () => {
        const csv = 'Nombres,Apellidos,Email\nJuan,Pérez,j@t.com'
        const result = parseCsvToContacts(csv)
        expect(result).toHaveLength(1)
        expect(result[0]!.name).toBe('Juan Pérez')
    })

    it('parses multiple rows correctly', () => {
        const csv = 'nombres,apellidos,phone\nA,B,111\nC,D,222\nE,F,333'
        const result = parseCsvToContacts(csv)
        expect(result).toHaveLength(3)
    })
})
