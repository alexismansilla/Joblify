import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// IMPORTANTE: Esta key bypasea RLS completamente.
// Solo debe usarse en Server Actions o Route Handlers (server-side).
// Nunca en código client-side ni en variables NEXT_PUBLIC_.
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        // Deshabilitamos la persistencia de sesión ya que es un cliente server-side
        persistSession: false,
        autoRefreshToken: false,
    },
})
