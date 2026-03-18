import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * POST /api/qz-sign
 * Firma el challenge de QZ Tray server-side usando la private key
 * almacenada como variable de entorno. Esto evita exponer la clave privada
 * en el bundle del browser.
 *
 * Body: { toSign: string }
 * Response: { signature: string } (base64)
 */
export async function POST(req: NextRequest) {
    const privateKeyPem = process.env.QZ_PRIVATE_KEY

    if (!privateKeyPem) {
        return NextResponse.json(
            { error: 'QZ_PRIVATE_KEY no configurada en variables de entorno' },
            { status: 500 }
        )
    }

    const { toSign } = await req.json()

    if (!toSign || typeof toSign !== 'string') {
        return NextResponse.json(
            { error: 'Campo toSign requerido' },
            { status: 400 }
        )
    }

    const privateKey = crypto.createPrivateKey(privateKeyPem)
    const sign = crypto.createSign('SHA512')
    sign.update(toSign)
    sign.end()

    const signature = sign.sign(privateKey, 'base64')

    return NextResponse.json({ signature })
}
