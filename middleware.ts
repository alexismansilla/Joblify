import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
    const basicAuth = req.headers.get('authorization')
    const url = req.nextUrl

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1]
        const [user, pwd] = atob(authValue).split(':')

        // Usa variables de entorno, o estas credenciales por defecto si no están definidas
        const validUser = process.env.ADMIN_USERNAME || 'x_connect_master77'
        const validPwd = process.env.ADMIN_PASSWORD || 'zQ#9mKdL!2vP$wN@xT'

        if (user === validUser && pwd === validPwd) {
            return NextResponse.next()
        }
    }

    // Si las credenciales no son válidas o no se proveyeron, pedir autenticación nativa
    return new NextResponse('Authentication Required.', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Connectify Admin Secure Area"',
        },
    })
}

// Configurar el middleware para que solo actúe bajo las rutas de admin
export const config = {
    matcher: ['/admin', '/admin/:path*'],
}
