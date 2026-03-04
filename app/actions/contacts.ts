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
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.worksheets[0]
        const contacts: any[] = []

        const headerRow = worksheet.getRow(1)
        const headers: { [key: number]: string } = {}
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').toLowerCase().trim()
        })

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return

            const contact: any = {}
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber]
                if (header === 'name' || header === 'nombre') contact.name = String(cell.value || '')
                if (header === 'email' || header === 'correo') contact.email = String(cell.value || '')
                if (header === 'phone' || header === 'teléfono' || header === 'telefono') contact.phone = String(cell.value || '')
                if (header === 'rut') contact.rut = String(cell.value || '').trim()
                if (header === 'company' || header === 'empresa' || header === 'organización' || header === 'organizacion') contact.company = String(cell.value || '').trim()
            })

            if (contact.name) {
                contacts.push({
                    name: contact.name,
                    email: contact.email || '',
                    phone: String(contact.phone || ''),
                    rut: contact.rut ? String(contact.rut) : null,
                    company: contact.company ? String(contact.company) : null,
                })
            }
        })

        if (contacts.length === 0) {
            throw new Error('No se encontraron contactos válidos en el archivo')
        }

        await contactService.insertMany(contacts)

        revalidatePath('/')
        return { success: true, count: contacts.length }
    } catch (error: any) {
        console.error('Excel processing error:', error)
        throw new Error(error.message || 'Error al procesar el archivo Excel')
    }
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
