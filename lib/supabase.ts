import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

// Pasamos cache: 'no-store' para que Vercel/Next.js no cachee las queries a Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
            fetch(url, { ...options, cache: 'no-store' })
    }
})
