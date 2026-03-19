'use server'

import { authorityService } from '@/lib/services/authorityService'
import ExcelJS from 'exceljs'
import { revalidatePath } from 'next/cache'
import { parseCsvToAuthorities, cellToText, mapRowToAuthority } from './authoritiesParser'

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
