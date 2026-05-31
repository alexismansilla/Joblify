import { NextRequest, NextResponse } from 'next/server'
import { candidatoService } from '@/lib/services/candidatoService'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))

    try {
        if (q.trim()) {
            const [candidatos, total] = await Promise.all([
                candidatoService.search(q, page, limit),
                candidatoService.searchCount(q),
            ])
            return NextResponse.json({ candidatos, total })
        }

        const [candidatos, total] = await Promise.all([
            candidatoService.getPage(page, limit),
            candidatoService.getCount(),
        ])
        return NextResponse.json({ candidatos, total })
    } catch {
        return NextResponse.json({ error: 'Error al obtener candidatos' }, { status: 500 })
    }
}
