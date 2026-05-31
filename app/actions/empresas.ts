'use server'

import { empresaService } from '@/lib/services/empresaService'
import { revalidatePath } from 'next/cache'

export async function getEmpresas() {
    try {
        return await empresaService.getAll()
    } catch (error) {
        console.error('Error fetching empresas:', error)
        return []
    }
}

export async function getEmpresasCount(): Promise<number> {
    try {
        return await empresaService.getCount()
    } catch (error) {
        console.error('Error counting empresas:', error)
        return 0
    }
}

export async function getEmpresaById(id: string) {
    try {
        return await empresaService.getById(id)
    } catch (error) {
        console.error(`Error fetching empresa ${id}:`, error)
        return null
    }
}

/**
 * Find empresa by qr_token — used in WhatsApp webhook @TOKEN flow
 * and connect page redirection.
 */
export async function getEmpresaByQrToken(qrToken: string) {
    try {
        return await empresaService.getByQrToken(qrToken)
    } catch (error) {
        console.error('Error fetching empresa by qr_token:', error)
        return null
    }
}

/**
 * Find empresa by access_token — used for empresa portal.
 */
export async function getEmpresaByToken(token: string) {
    try {
        return await empresaService.getByAccessToken(token)
    } catch (error) {
        console.error('Error fetching empresa by access_token:', error)
        return null
    }
}

/**
 * Get leads (matches) for an empresa.
 */
export async function getLeadsForEmpresa(empresaId: string) {
    try {
        return await empresaService.getLeads(empresaId)
    } catch (error) {
        console.error('Error fetching leads:', error)
        return []
    }
}

/**
 * Generate (or reuse) an access_token for the empresa portal.
 */
export async function generateEmpresaToken(empresaId: string): Promise<string> {
    return empresaService.generateAccessToken(empresaId)
}

/**
 * Update empresa's subscription plan.
 */
export async function updateEmpresaPlan(empresaId: string, plan: string): Promise<void> {
    return empresaService.updatePlan(empresaId, plan)
}

/**
 * Create a new empresa manually (from admin UI).
 */
export async function createEmpresa(formData: FormData) {
    const name = (formData.get('name') as string)?.trim() || ''
    const company = (formData.get('company_name') as string)?.trim() || null
    const position = (formData.get('position') as string)?.trim() || null
    const industry = (formData.get('industry') as string)?.trim() || null
    const opportunity_description = (formData.get('opportunity_description') as string)?.trim() || null
    const phone = (formData.get('phone') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const job_search_type = (formData.get('job_search_type') as string)?.trim() || null

    if (!company) {
        throw new Error('El nombre de la empresa es obligatorio')
    }

    // Use company name as "name" if only company provided
    const empresaName = name || company || ''

    try {
        const inserted = await empresaService.create({
            name: empresaName,
            company,
            position,
            industry,
            opportunity_description,
            phone,
            email,
            job_search_type,
            access_token: null,
            plan: 'free',
        })

        revalidatePath('/admin')
        revalidatePath('/admin/empresas')
        const empresaId = inserted?.id ?? null
        return { success: true, empresaId }
    } catch (error: any) {
        console.error('Error al crear empresa:', error)
        throw new Error(error.message || 'Error al guardar la empresa en la base de datos')
    }
}

export async function registerMatchForEmpresa(
    empresaId: string,
    candidatoPhone: string,
    candidatoId?: string,
    scannerData?: {
        name: string
        profile: string
        experience_level: string
        job_search_type: string
        interest: string
    }
) {
    try {
        const result = await empresaService.registerMatch(
            empresaId,
            candidatoPhone,
            candidatoId,
            scannerData,
        )
        return result
    } catch (error) {
        console.error('Error registering match:', error)
        return null
    }
}

export async function registerMatchFromScan(
    empresaId: string,
    scannerPhone: string,
    scannerData: {
        name: string
        profile: string
        experience_level: string
        job_search_type: string
        interest: string
    }
) {
    try {
        const result = await empresaService.registerMatch(
            empresaId,
            scannerPhone,
            undefined,
            scannerData,
        )
        return result
    } catch (error) {
        console.error('Error registering match from scan:', error)
        return null
    }
}

export async function getSuggestedEmpresas(excludeId: string, profile?: string, interest?: string) {
    try {
        return await empresaService.getSuggestedEmpresas(excludeId, profile, interest)
    } catch (error) {
        console.error('Error fetching suggested empresas:', error)
        return []
    }
}

export async function getMatchById(matchId: string) {
    try {
        return await empresaService.getMatchById(matchId)
    } catch (error) {
        console.error('Error fetching match:', error)
        return null
    }
}

export async function updateLeadStatus(matchId: string, status: string) {
    try {
        const result = await empresaService.updateLeadStatus(matchId, status)
        return !!result
    } catch (error) {
        console.error('Error updating lead status:', error)
        return false
    }
}

export async function updateScannerData(matchId: string, data: {
    scanner_name?: string
    scanner_email?: string
    scanner_phone?: string
}) {
    try {
        const result = await empresaService.updateScannerData(matchId, data)
        return !!result
    } catch (error) {
        console.error('Error updating scanner data:', error)
        return false
    }
}

export async function getMatchesDashboard() {
    try {
        return await empresaService.getDashboard()
    } catch (error) {
        console.error('Error getting matches dashboard:', error)
        return null
    }
}
