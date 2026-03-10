'use server'

import { contactService } from '@/lib/services/contactService'
import ExcelJS from 'exceljs'
import { revalidatePath } from 'next/cache'

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
 * Parsea un archivo xlsx o csv y devuelve los contactos mapeados.
 * Estrategia dual: ExcelJS para xlsx, fallback a CSV nativo si no se leen celdas.
 */
async function parseSpreadsheet(buffer: ArrayBuffer) {
    // --- Intento 1: XLSX con ExcelJS ---
    try {
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
 * Parsea texto CSV (separado por coma o punto y coma) y devuelve contactos mapeados.
 * Maneja campos entre comillas con comas internas.
 */
function parseCsvToContacts(text: string) {
    // Detectar delimitador (coma o punto y coma) según la primera línea
    const firstLine = text.split(/\r?\n/)[0] ?? ''
    const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ','

    const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)

    if (lines.length < 2) return []

    const headers = splitCsvLine(lines[0], delimiter).map(h => h.toLowerCase().trim())
    const contacts: ReturnType<typeof mapRowToContact>[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i], delimiter)
        const raw: Record<string, string> = {}
        headers.forEach((header, idx) => {
            if (header) raw[header] = (values[idx] ?? '').trim()
        })

        const contact = mapRowToContact(raw)
        if (contact) contacts.push(contact)
    }

    return contacts
}

/**
 * Divide una línea CSV respetando campos entre comillas.
 */
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

/**
 * Mapea un objeto raw (header → valor) a un contacto de la DB.
 * Retorna null si no hay al menos firstName (fila inválida).
 */
function mapRowToContact(raw: Record<string, string>) {
    const firstName =
        raw['nombres'] ||
        raw['nombre'] ||
        raw['first name'] ||
        raw['first_name'] ||
        raw['name'] ||
        ''

    if (!firstName) return null

    const lastName =
        raw['apellidos'] ||
        raw['apellido'] ||
        raw['last name'] ||
        raw['last_name'] ||
        ''

    return {
        name: [firstName, lastName].filter(Boolean).join(' '),
        first_name: firstName || null,
        last_name: lastName || null,
        email: raw['e-mail'] || raw['email'] || raw['correo'] || null,
        phone:
            raw['teléfono móvil'] ||
            raw['telefono movil'] ||
            raw['teléfono'] ||
            raw['telefono'] ||
            raw['phone'] ||
            null,
        rut:
            raw['rut/dni/pasaporte'] ||
            raw['rut'] ||
            raw['dni'] ||
            raw['pasaporte'] ||
            raw['identification_number'] ||
            null,
        company:
            raw['empresa u organización'] ||
            raw['empresa u organizacion'] ||
            raw['empresa'] ||
            raw['organización'] ||
            raw['organizacion'] ||
            raw['company'] ||
            null,
        position:
            raw['cargo'] ||
            raw['position'] ||
            raw['puesto'] ||
            null,
    }
}

/**
 * Helper: extrae texto plano de cualquier tipo de valor de celda ExcelJS.
 * Maneja: string, number, boolean, Date, RichText, Fórmula.
 */
function cellToText(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value.trim()
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return String(value)
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object' && 'richText' in (value as any)) {
        return ((value as any).richText as Array<{ text: string }>)
            .map(r => r.text)
            .join('')
            .trim()
    }
    if (typeof value === 'object' && 'result' in (value as any)) {
        return cellToText((value as any).result)
    }
    return String(value).trim()
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
 * Finds a contact by its email.
 */
export async function findContactByEmail(email: string) {
    try {
        return await contactService.getByEmail(email)
    } catch (error) {
        console.error('Error finding contact by email:', error)
        return null
    }
}

/**
 * Generates a full report of matches for the dashboard.
 */
export async function getMatchesReport() {
    try {
        return await contactService.getMatchesReport()
    } catch (error) {
        console.error('Error getting matches report:', error)
        return []
    }
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

    if (!firstName) throw new Error('El nombre es obligatorio')

    try {
        await contactService.insertMany([{
            name: fullName,
            first_name: firstName,
            last_name: lastName || null,
            rut,
            email,
            phone,
            company,
            position,
        }])
        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        console.error('Error al crear contacto manual:', error)
        throw new Error(error.message || 'Error al guardar el contacto en la base de datos')
    }
}
