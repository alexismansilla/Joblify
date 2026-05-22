'use server'

import { contactService } from '@/lib/services/contactService'
import { revalidatePath } from 'next/cache'
import { parseCsvToContacts, splitCsvLine, mapRowToContact, cellToText } from './contactsParser'

/**
 * Handles bulk upload of contacts from an Excel file.
 * Following Server Action pattern for secure processing.
 */
export async function uploadContacts(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) {
        throw new Error('No se ha subido ningún archivo')
    }

    try {
        const buffer = await file.arrayBuffer()

        // Intentamos parsear como XLSX primero, luego como CSV si los headers quedan vacíos
        const parsed = await parseSpreadsheet(buffer)
        const rows = parsed.filter((r): r is NonNullable<typeof r> => r !== null)

        if (rows.length === 0) {
            throw new Error('No se encontraron contactos válidos en el archivo')
        }

        await contactService.insertMany(rows)
        revalidatePath('/')
        return { success: true, count: rows.length }
    } catch (error: any) {
        console.error('Upload error:', error)
        throw new Error(error.message || 'Error al procesar el archivo')
    }
}

/**
 * Borra todos los contactos de la base de datos.
 * Botón de emergencia para limpiar la lista.
 */
export async function deleteAllContacts() {
    try {
        await contactService.deleteAll()
        revalidatePath('/')
        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        console.error('Delete error:', error)
        throw new Error(error.message || 'Error al borrar la base de datos')
    }
}

/**
 * Parsea un archivo xlsx o csv y devuelve los contactos mapeados.
 * Estrategia dual: ExcelJS para xlsx, fallback a CSV nativo si no se leen celdas.
 */
async function parseSpreadsheet(buffer: ArrayBuffer) {
    // --- Intento 1: XLSX con ExcelJS ---
    try {
        const ExcelJS = (await import('exceljs')).default
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        const worksheet = workbook.worksheets[0]

        const headerValues = worksheet.getRow(1).values as unknown[]
        const headers: string[] = []

        // ExcelJS usa arrays base-1; índice 0 siempre es undefined
        headerValues.forEach((val, idx) => {
            if (idx === 0) return
            headers[idx] = cellToText(val).toLowerCase().trim()
        })

        // Si encontramos al menos un header, el formato XLSX es válido
        const validHeaders = headers.filter(Boolean)
        if (validHeaders.length > 0) {
            const contacts: ReturnType<typeof mapRowToContact>[] = []

            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                if (rowNumber === 1) return
                const rowValues = row.values as unknown[]
                const raw: Record<string, string> = {}

                rowValues.forEach((val, idx) => {
                    if (idx === 0) return
                    const header = headers[idx]
                    if (header) raw[header] = cellToText(val)
                })

                const contact = mapRowToContact(raw)
                if (contact) contacts.push(contact)
            })

            return contacts
        }
    } catch (xlsxError) {
        console.warn('[parseSpreadsheet] Fallo XLSX:', xlsxError)
    }

    // --- Intento 2: CSV (fallback cuando ExcelJS no lee celdas) ---
    const text = new TextDecoder('utf-8').decode(buffer)
    return parseCsvToContacts(text)
}


/**
 * Retrieves all contacts.
 */
export async function getContacts() {
    try {
        return await contactService.getAll()
    } catch (error) {
        console.error('Error fetching contacts:', error)
        return []
    }
}

/**
 * Returns only the total count of contacts (used in admin header).
 */
export async function getContactsCount(): Promise<number> {
    try {
        return await contactService.getCount()
    } catch (error) {
        console.error('Error counting contacts:', error)
        return 0
    }
}

/**
 * Retrieves a contact by its ID.
 * This is used to replace direct client-side calls.
 */
export async function getContactById(id: string) {
    try {
        return await contactService.getById(id)
    } catch (error) {
        console.error(`Error fetching contact ${id}:`, error)
        return null
    }
}

/**
 * Registers a match between two contacts.
 */
export async function registerMatch(contactId: string, scannerId?: string) {
    try {
        await contactService.registerMatch(contactId, scannerId)
        return { success: true }
    } catch (error) {
        console.error('Error registering match:', error)
        return { success: false }
    }
}

/**
 * Finds a contact by email or phone.
 */
export async function findContactByIdentifier(identifier: string) {
    try {
        return await contactService.getByIdentifier(identifier)
    } catch (error) {
        console.error('Error finding contact:', error)
        return null
    }
}

/**
 * Returns pre-aggregated stats + top 20 for the matches dashboard.
 * Single DB call via RPC — no full table load.
 */
export async function getMatchesDashboard() {
    try {
        return await contactService.getMatchesDashboard()
    } catch (error) {
        console.error('Error getting matches dashboard:', error)
        return null
    }
}

/**
 * Returns a company contact by its access_token (for empresa portal).
 */
export async function getCompanyByToken(token: string) {
    try {
        return await contactService.getByAccessToken(token)
    } catch (error) {
        console.error('Error fetching company by token:', error)
        return null
    }
}

/**
 * Returns all leads (candidates who scanned the company QR).
 */
export async function getLeadsForCompany(companyId: string) {
    try {
        return await contactService.getLeadsForCompany(companyId)
    } catch (error) {
        console.error('Error fetching leads:', error)
        return []
    }
}

/**
 * Generates (or reuses) an access_token for the empresa portal link.
 */
export async function generateCompanyToken(contactId: string): Promise<string> {
    return contactService.generateAccessToken(contactId)
}

/**
 * Updates the plan of a company contact.
 */
export async function updateContactPlan(contactId: string, plan: string): Promise<void> {
    return contactService.updatePlan(contactId, plan)
}

/**
 * Creates a single contact manually (registro manual desde UI).
 * Reutiliza insertMany para aprovechar el manejo de colisiones de qr_token.
 */
export async function createContact(formData: FormData) {
    const firstName = (formData.get('first_name') as string)?.trim() || ''
    const lastName = (formData.get('last_name') as string)?.trim() || ''
    // Mantenemos name como campo derivado para compatibilidad con QR, matches y WhatsApp
    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    const rut = (formData.get('rut') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const company = (formData.get('company') as string)?.trim() || null
    const position = (formData.get('position') as string)?.trim() || null
    const profile = (formData.get('profile') as string)?.trim() || null
    const industry = (formData.get('industry') as string)?.trim() || null
    const experience_level = (formData.get('experience_level') as string)?.trim() || null
    const job_search_type = (formData.get('job_search_type') as string)?.trim() || null
    const opportunity_description = (formData.get('opportunity_description') as string)?.trim() || null

    if (!firstName) throw new Error('El nombre es obligatorio')

    try {
        const inserted = await contactService.insertMany([{
            name: fullName,
            first_name: firstName,
            last_name: lastName || null,
            rut,
            email,
            phone,
            company,
            position,
            profile,
            industry,
            experience_level,
            job_search_type,
            opportunity_description,
        }])
        revalidatePath('/admin')
        // Retornamos el id para que el cliente pueda navegar directo a la credencial
        const contactId = inserted?.[0]?.id ?? null
        return { success: true, contactId }
    } catch (error: any) {
        console.error('Error al crear contacto manual:', error)
        throw new Error(error.message || 'Error al guardar el contacto en la base de datos')
    }
}
