export interface ContactTemplateData {
    name: string;
    phone?: string | null;
    email?: string | null;
    profile?: string | null;
    company?: string | null;
    position?: string | null;
    industry?: string | null;
    opportunity_description?: string | null;
}

/**
 * Genera el texto del mensaje interactivo de perfil para WhatsApp.
 * En contexto de feria de empleo, el "contacto" es la empresa/reclutador
 * y quien recibe el mensaje es el candidato que escaneó el QR.
 */
export function buildProfileMessageText(contact: ContactTemplateData): string {
    const lines: string[] = [
        `🏢 *Empresa:* ${contact.company || contact.name || 'N/A'}`,
        `👤 *Representante:* ${contact.name || 'N/A'}`,
    ]

    if (contact.position) {
        lines.push(`👔 *Cargo:* ${contact.position}`)
    }

    if (contact.opportunity_description) {
        lines.push(`🎯 *Oportunidades:* ${contact.opportunity_description}`)
    } else if (contact.industry) {
        lines.push(`🏭 *Sector:* ${contact.industry}`)
    }

    lines.push('')
    lines.push('¿Cuál es tu nivel de interés en esta empresa?')

    return lines.join('\n')
}
