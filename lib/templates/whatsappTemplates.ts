export interface EmpresaTemplateData {
    name: string;
    company?: string | null;
    position?: string | null;
    industry?: string | null;
    opportunity_description?: string | null;
}

/**
 * Genera el texto del mensaje interactivo de perfil para WhatsApp.
 * En contexto de feria de empleo, la "empresa" es la entidad cuyo QR fue escaneado
 * y quien recibe el mensaje es el candidato que escaneó el QR.
 */
export function buildProfileMessageText(empresa: EmpresaTemplateData): string {
    const lines: string[] = [
        `🏢 *Empresa:* ${empresa.company || empresa.name || 'N/A'}`,
        `👤 *Representante:* ${empresa.name || 'N/A'}`,
    ]

    if (empresa.position) {
        lines.push(`👔 *Cargo:* ${empresa.position}`)
    }

    if (empresa.opportunity_description) {
        lines.push(`🎯 *Oportunidades:* ${empresa.opportunity_description}`)
    } else if (empresa.industry) {
        lines.push(`🏭 *Sector:* ${empresa.industry}`)
    }

    lines.push('')
    lines.push('¿Cuál es tu nivel de interés en esta empresa?')

    return lines.join('\n')
}
