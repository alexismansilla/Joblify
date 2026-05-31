'use server'

import { candidatoService } from '@/lib/services/candidatoService'
import { revalidatePath } from 'next/cache'

export async function getCandidatos() {
    try {
        return await candidatoService.getAll()
    } catch (error) {
        console.error('Error fetching candidatos:', error)
        return []
    }
}

export async function getCandidatosCount(): Promise<number> {
    try {
        return await candidatoService.getCount()
    } catch (error) {
        console.error('Error counting candidatos:', error)
        return 0
    }
}

export async function getCandidatoById(id: string) {
    try {
        return await candidatoService.getById(id)
    } catch (error) {
        console.error(`Error fetching candidato ${id}:`, error)
        return null
    }
}

export async function findCandidatoByIdentifier(identifier: string) {
    try {
        return await candidatoService.getByIdentifier(identifier)
    } catch (error) {
        console.error('Error finding candidato:', error)
        return null
    }
}

export async function createCandidato(formData: FormData) {
    const firstName = (formData.get('first_name') as string)?.trim() || ''
    const lastName = (formData.get('last_name') as string)?.trim() || ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    const rut = (formData.get('rut') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const profile = (formData.get('profile') as string)?.trim() || null
    const industry = (formData.get('industry') as string)?.trim() || null
    const experience_level = (formData.get('experience_level') as string)?.trim() || null
    const job_search_type = (formData.get('job_search_type') as string)?.trim() || null

    if (!firstName) throw new Error('El nombre es obligatorio')

    try {
        const inserted = await candidatoService.insertMany([{
            name: fullName,
            first_name: firstName,
            last_name: lastName || null,
            rut,
            email,
            phone,
            profile,
            industry,
            experience_level,
            job_search_type,
        }])
        revalidatePath('/admin')
        const candidatoId = inserted?.[0]?.id ?? null
        return { success: true, candidatoId }
    } catch (error: any) {
        console.error('Error al crear candidato:', error)
        throw new Error(error.message || 'Error al guardar el candidato en la base de datos')
    }
}

export async function deleteAllCandidatos() {
    try {
        await candidatoService.deleteAll()
        revalidatePath('/')
        revalidatePath('/admin')
        return { success: true }
    } catch (error: any) {
        console.error('Delete error:', error)
        throw new Error(error.message || 'Error al borrar la base de datos')
    }
}
