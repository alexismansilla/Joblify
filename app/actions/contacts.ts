'use server'

import { supabase } from '@/lib/supabase'
import ExcelJS from 'exceljs'
import { revalidatePath } from 'next/cache'

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

        // Obtener las cabeceras de la primera fila
        const headerRow = worksheet.getRow(1)
        const headers: { [key: number]: string } = {}
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').toLowerCase().trim()
        })

        // Procesar las filas (empezando desde la 2)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return // Saltar cabecera

            const contact: any = {}
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber]
                if (header === 'name' || header === 'nombre') contact.name = String(cell.value || '')
                if (header === 'email' || header === 'correo') contact.email = String(cell.value || '')
                if (header === 'phone' || header === 'teléfono' || header === 'telefono') contact.phone = String(cell.value || '')
            })

            if (contact.name) {
                contacts.push({
                    name: contact.name,
                    email: contact.email || '',
                    phone: String(contact.phone || ''),
                })
            }
        })

        if (contacts.length === 0) {
            throw new Error('No se encontraron contactos válidos en el archivo')
        }

        const { error } = await supabase
            .from('contacts')
            .insert(contacts)

        if (error) {
            console.error('Error inserting contacts:', error)
            throw new Error('Error al guardar los contactos en Supabase')
        }

        revalidatePath('/')
        return { success: true, count: contacts.length }
    } catch (error: any) {
        console.error('Excel processing error:', error)
        throw new Error(error.message || 'Error al procesar el archivo Excel')
    }
}

export async function getContacts() {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contacts:', error)
        return []
    }

    return data || []
}

export async function registerMatch(contactId: string, scannerId?: string) {
    const { error } = await supabase
        .from('matches')
        .insert([{
            contact_id: contactId,
            scanner_id: scannerId || null
        }])

    if (error) {
        console.error('Error registering match:', error)
        return { success: false }
    }

    return { success: true }
}

export async function findContactByIdentifier(identifier: string) {
    const { data, error } = await supabase
        .from('contacts')
        .select('id, name')
        .or(`email.eq.${identifier},phone.eq.${identifier}`)
        .maybeSingle()

    if (error) return null
    return data
}

export async function getMatchesReport() {
    const { data, error } = await supabase
        .from('contacts')
        .select(`
      id,
      name,
      email,
      phone,
      matches:matches!matches_contact_id_fkey (
        id,
        created_at,
        scanner_id,
        scanner:contacts!matches_scanner_id_fkey (
          id,
          name
        )
      )
    `)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error getting matches report:', error)
        return []
    }

    return data || []
}
