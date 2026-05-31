import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateMap = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000

// Límites por ruta (requests por minuto por IP)
const RATE_LIMITS: Array<[string, number]> = [
    ['/api/whatsapp/webhook', 60],
    ['/api/contacts', 120],
    ['/api/', 300],
]

function checkRateLimit(ip: string, pathname: string): boolean {
    const limit = RATE_LIMITS.find(([route]) => pathname.startsWith(route))?.[1] ?? 300
    const key = `${ip}:${pathname.split('/').slice(0, 3).join('/')}`
    const now = Date.now()

    const entry = rateMap.get(key)
    if (!entry || now > entry.resetAt) {
        rateMap.set(key, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }
    if (entry.count >= limit) return false
    entry.count++
    return true
}

function requireBasicAuth(req: NextRequest): NextResponse | null {
    const basicAuth = req.headers.get('authorization')

    if (basicAuth?.startsWith('Basic ')) {
        const decoded = atob(basicAuth.slice(6))
        const colonIdx = decoded.indexOf(':')
        const user = decoded.slice(0, colonIdx)
        const pwd = decoded.slice(colonIdx + 1)
        const validUser = process.env.ADMIN_USERNAME ?? 'x_connect_master77'
        const validPwd = process.env.ADMIN_PASSWORD ?? 'zQ#9mKdL!2vP$wN@xT'

        if (user === validUser && pwd === validPwd) {
            return null
        }
    }

    return new NextResponse('Authentication Required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Joblify Admin"',
        },
    })
}

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/whatsapp/webhook')) {
        if (!checkRateLimit(ip, pathname)) {
            return new NextResponse('Too Many Requests', { status: 429 })
        }
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/matches')) {
        const authResult = requireBasicAuth(req)
        if (authResult) return authResult
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/matches/:path*', '/api/:path*'],
}
