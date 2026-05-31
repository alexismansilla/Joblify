/**
 * Parsea texto CSV (separado por coma o punto y coma) y devuelve contactos mapeados.
 * Maneja campos entre comillas con comas internas.
 */
export function parseCsvToContacts(text: string) {
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
export function splitCsvLine(line: string, delimiter: string): string[] {
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
export function mapRowToContact(raw: Record<string, string>) {
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
        profile:
            raw['elige tu perfil'] ||
            raw['perfil'] ||
            raw['profile'] ||
            null,
        industry:
            raw['industria'] ||
            raw['industry'] ||
            null,
        experience_level: null,
        job_search_type: null,
        opportunity_description: null,
        access_token: null,
        plan: null,
    }
}

/**
 * Helper: extrae texto plano de cualquier tipo de valor de celda ExcelJS.
 * Maneja: string, number, boolean, Date, RichText, Fórmula.
 */
export function cellToText(value: unknown): string {
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
