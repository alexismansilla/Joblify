import { NextRequest, NextResponse } from 'next/server'
import { contactService } from '@/lib/services/contactService'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))

    try {
        if (q.trim()) {
            const [contacts, total] = await Promise.all([
                contactService.search(q, page, limit),
                contactService.searchCount(q),
            ])
            return NextResponse.json({ contacts, total })
        }

        const [contacts, total] = await Promise.all([
            contactService.getPage(page, limit),
            contactService.getCount(),
        ])
        return NextResponse.json({ contacts, total })
    } catch {
        return NextResponse.json({ error: 'Error al obtener contactos' }, { status: 500 })
    }
}
