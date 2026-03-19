'use server'

import { authorityService } from '@/lib/services/authorityService'
import ExcelJS from 'exceljs'
import { revalidatePath } from 'next/cache'

/**
 * Carga masiva de autoridades desde un archivo Excel o CSV.
 * Columnas esperadas: nombre/name, cargo/position, organización/organization
 */
export async function uploadAuthorities(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) throw new Error('No se ha subido ningún archivo')

    try {
        const buffer = await file.arrayBuffer()

        // Motor dual: primero XLSX, fallback nativo a CSV si ExcelJS falla o es falso XLSX
        const parsed = await parseAuthoritiesSpreadsheet(buffer)
        const rows = parsed.filter((r): r is NonNullable<typeof r> => r !== null)

        if (rows.length === 0) {
            throw new Error('No se encontraron autoridades válidas en el archivo')
        }

        await authorityService.insertMany(rows)
        revalidatePath('/admin/autoridades')

        return { success: true, count: rows.length }
    } catch (error: any) {
        console.error('Error al procesar archivo de autoridades:', error)
        throw new Error(error.message || 'Error al procesar el archivo')
    }
}

async function parseAuthoritiesSpreadsheet(buffer: ArrayBuffer) {
    try {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        const worksheet = workbook.worksheets[0]

        const headerValues = worksheet.getRow(1).values as unknown[]
        const headers: string[] = []

        headerValues.forEach((val, idx) => {
            if (idx === 0) return
            headers[idx] = cellToText(val).toLowerCase().trim()
        })

        const validHeaders = headers.filter(Boolean)
        if (validHeaders.length > 0) {
            const authorities: ReturnType<typeof mapRowToAuthority>[] = []

            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return
                const rowValues = row.values as unknown[]
                const raw: Record<string, string> = {}

                rowValues.forEach((val, idx) => {
                    if (idx === 0) return
                    const header = headers[idx]
                    if (header) raw[header] = cellToText(val)
                })

                const authority = mapRowToAuthority(raw)
                if (authority) authorities.push(authority)
            })

            return authorities
        }
    } catch (xlsxError) {
        console.warn('[parseAuthoritiesSpreadsheet] Fallo XLSX:', xlsxError)
    }

    // Fallback a parseo CSV manual
    const text = new TextDecoder('utf-8').decode(buffer)
    return parseCsvToAuthorities(text)
}

export function parseCsvToAuthorities(text: string) {
    const firstLine = text.split(/\r?\n/)[0] ?? ''
    const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ','

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return []

    const headers = splitCsvLine(lines[0], delimiter).map(h => h.toLowerCase().trim())
    const authorities: ReturnType<typeof mapRowToAuthority>[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i], delimiter)
        const raw: Record<string, string> = {}
        headers.forEach((header, idx) => {
            if (header) raw[header] = (values[idx] ?? '').trim().replace(/^"|"$/g, '')
        })

        const auth = mapRowToAuthority(raw)
        if (auth) authorities.push(auth)
    }

    return authorities
}

function splitCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
            result.push(current)
            current = ''
        } else {
            current += char
        }
    }
    result.push(current)
    return result
}

function cellToText(value: any): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
        if (value.richText) return value.richText.map((t: any) => t.text).join('')
        if (value.text) return String(value.text)
        if (value.result !== undefined) return String(value.result) // Para fórmulas
        if (value instanceof Date) return value.toISOString()
    }
    return String(value)
}

export function mapRowToAuthority(raw: Record<string, string>) {
    const firstName = raw['nombre'] || raw['nombres'] || raw['name'] || ''
    const lastName = raw['apellido'] || raw['apellidos'] || raw['last name'] || ''

    // Necesitamos al menos un nombre o apellido
    if (!firstName && !lastName) return null

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

    const position = raw['cargo'] || raw['position'] || ''
    const organization = raw['organización'] || raw['organizacion'] || raw['organization'] || raw['empresa'] || ''

    return {
        name: fullName,
        position: position,
        organization: organization || null
    }
}

/**
 * Retorna todas las autoridades registradas.
 */
export async function getAuthorities() {
    try {
        return await authorityService.getAll()
    } catch (error) {
        console.error('Error al obtener autoridades:', error)
        return []
    }
}
