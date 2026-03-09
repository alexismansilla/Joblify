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
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.worksheets[0]
        const authorities: { name: string; position: string; organization: string | null }[] = []

        const headerRow = worksheet.getRow(1)
        const headers: { [col: number]: string } = {}
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').toLowerCase().trim()
        })

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return

            const entry: any = {}
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber]
                const value = String(cell.value || '').trim()

                if (header === 'name' || header === 'nombre') entry.name = value
                if (header === 'position' || header === 'cargo') entry.position = value
                if (header === 'organization' || header === 'organización' || header === 'organizacion' || header === 'empresa') {
                    entry.organization = value
                }
            })

            if (entry.name && entry.position) {
                authorities.push({
                    name: entry.name,
                    position: entry.position,
                    organization: entry.organization || null,
                })
            }
        })

        if (authorities.length === 0) {
            throw new Error('No se encontraron autoridades válidas. Verifica que el archivo tenga columnas: nombre, cargo, organización')
        }

        await authorityService.insertMany(authorities)
        revalidatePath('/admin/autoridades')

        return { success: true, count: authorities.length }
    } catch (error: any) {
        console.error('Error al procesar archivo de autoridades:', error)
        throw new Error(error.message || 'Error al procesar el archivo')
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
