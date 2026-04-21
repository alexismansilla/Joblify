import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Carga las variables del entorno
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno (URL o SERVICE_ROLE_KEY).')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function cleanDuplicates() {
  console.log('🧹 Iniciando limpieza de duplicados en Supabase...')
  
  const { data, error } = await supabase.rpc('remove_duplicate_contacts')

  if (error) {
    console.error('❌ Error ejecutando la limpieza:', error.message)
    return
  }

  const count = (data && data.length > 0) ? data[0].removed_count : 0
  console.log(`✅ ¡Limpieza completada! Se eliminaron ${count} registros duplicados.`)
}

cleanDuplicates()
