export function parseCsvToAuthorities(text: string) {
    const firstLine = text.split(/\r?\n/)[0] ?? ''
    const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ','

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return []

    const headers = splitCsvLine(lines[0], delimiter).map(h => h.toLowerCase().trim())
    const authorities: ReturnType<typeof mapRowToAuthority>[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i], delimiter)
        const raw: Record<string, string> = {}
        headers.forEach((header, idx) => {
            if (header) raw[header] = (values[idx] ?? '').trim().replace(/^"|"$/g, '')
        })

        const auth = mapRowToAuthority(raw)
        if (auth) authorities.push(auth)
    }

    return authorities
}

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

export function cellToText(value: any): string {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
        if (value.richText) return value.richText.map((t: any) => t.text).join('')
        if (value.text) return String(value.text)
        if (value.result !== undefined) return String(value.result) // Para fórmulas
        if (value instanceof Date) return value.toISOString()
    }
    return String(value)
}

export function mapRowToAuthority(raw: Record<string, string>) {
    const firstName = raw['nombre'] || raw['nombres'] || raw['name'] || ''
    const lastName = raw['apellido'] || raw['apellidos'] || raw['last name'] || ''

    // Necesitamos al menos un nombre o apellido
    if (!firstName && !lastName) return null

    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

    const position = raw['cargo'] || raw['position'] || ''
    const organization = raw['organización'] || raw['organizacion'] || raw['organization'] || raw['empresa'] || ''

    return {
        name: fullName,
        position: position,
        organization: organization || null
    }
}
