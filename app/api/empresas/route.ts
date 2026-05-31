import { NextRequest, NextResponse } from 'next/server'
import { empresaService } from '@/lib/services/empresaService'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')))

    try {
        if (q.trim()) {
            const [empresas, total] = await Promise.all([
                empresaService.search(q, page, limit),
                empresaService.searchCount(q),
            ])
            return NextResponse.json({ empresas, total })
        }

        const [empresas, total] = await Promise.all([
            empresaService.getPage(page, limit),
            empresaService.getCount(),
        ])
        return NextResponse.json({ empresas, total })
    } catch {
        return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 })
    }
}
