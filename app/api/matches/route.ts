import { NextRequest, NextResponse } from 'next/server'
import { empresaService } from '@/lib/services/empresaService'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))

    try {
        if (q.trim()) {
            const [matches, total] = await Promise.all([
                empresaService.searchMatches(q, page, limit),
                empresaService.searchMatchesCount(q),
            ])
            return NextResponse.json({ matches, total })
        }

        const [matches, total] = await Promise.all([
            empresaService.getAllMatchesPaginated(page, limit),
            empresaService.getAllMatchesCount(),
        ])
        return NextResponse.json({ matches, total })
    } catch {
        return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 })
    }
}
