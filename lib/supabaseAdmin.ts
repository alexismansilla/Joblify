import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// IMPORTANTE: Esta key bypassea RLS completamente.
// Solo debe usarse en Server Actions o Route Handlers (server-side).
// Nunca en código client-side ni en variables NEXT_PUBLIC_.
let _supabaseAdminInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
    if (_supabaseAdminInstance) return _supabaseAdminInstance

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        throw new Error(
            '[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
            'Agrégala en las variables de entorno de Vercel o en tu .env local.'
        )
    }

    _supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            // Cliente server-side: no necesita persistencia de sesión
            persistSession: false,
            autoRefreshToken: false,
        },
    })

    return _supabaseAdminInstance
}

