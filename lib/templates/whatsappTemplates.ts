export interface ContactTemplateData {
    name: string;
    phone?: string | null;
    email?: string | null;
    profile?: string | null;
    company?: string | null;
    position?: string | null;
    industry?: string | null;
    sector?: string | null;
}

/**
 * Genera el texto del mensaje interactivo de perfil para WhatsApp.
 * Este template usa saltos de línea reales para que sea más fácil de leer y editar.
 */
export function buildProfileMessageText(contact: ContactTemplateData): string {
    return [
        `👤 *Nombre:* ${contact.name || 'N/A'}`,
        `📱 *Teléfono:* ${contact.phone || 'N/A'}`,
        `📧 *Email:* ${contact.email || 'N/A'}`,
        `🧑‍💻 *Perfil:* ${contact.profile || 'N/A'}`,
        `💼 *Empresa:* ${contact.company || 'N/A'}`,
        `👔 *Cargo:* ${contact.position || 'N/A'}`,
        `🏭 *Industria:* ${contact.industry || 'N/A'}`,
        `🏢 *Sector:* ${contact.sector || 'N/A'}`,
        '',
        '¿Cómo clasificarías esta conexión?'
    ].join('\n');
}
