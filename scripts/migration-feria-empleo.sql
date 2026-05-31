-- ============================================================
-- Migración: Connectify → Feria de Empleo
-- Ejecutar en Supabase SQL Editor (Settings → SQL Editor)
-- Todas las columnas son nullable para no romper datos existentes
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS experience_level       TEXT,
  ADD COLUMN IF NOT EXISTS job_search_type        TEXT,
  ADD COLUMN IF NOT EXISTS opportunity_description TEXT,
  ADD COLUMN IF NOT EXISTS access_token           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS plan                   TEXT DEFAULT 'free';

-- Índice para lookup rápido del portal de empresa
CREATE INDEX IF NOT EXISTS idx_contacts_access_token
  ON contacts (access_token)
  WHERE access_token IS NOT NULL;

-- Comentarios de referencia para los valores esperados:
-- experience_level:    'Sin experiencia' | 'Junior' | 'Semi-senior' | 'Senior'
-- job_search_type:     'Trabajo full-time' | 'Trabajo part-time' | 'Práctica' | 'Freelance' | 'Solo información'
-- opportunity_description: texto libre (lo completa la empresa)
-- access_token:        UUID generado por el sistema para el portal de empresa
-- plan:                'free' | 'basic' | 'pro' | 'premium'

-- job_search_type para empresas (qué tipo de búsqueda/búsqueda laboral ofrece la empresa)
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS job_search_type TEXT;

-- job_search_type values for companies:
-- 'Trabajo full-time' | 'Trabajo part-time' | 'Práctica' | 'Freelance' | 'Todos los tipos'

-- Columnas para capturar perfil del candidato al momento del escaneo QR
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS scanner_name              TEXT,
  ADD COLUMN IF NOT EXISTS scanner_profile           TEXT,
  ADD COLUMN IF NOT EXISTS scanner_experience_level  TEXT,
  ADD COLUMN IF NOT EXISTS scanner_job_search_type   TEXT,
  ADD COLUMN IF NOT EXISTS scanner_email             TEXT,
  ADD COLUMN IF NOT EXISTS lead_status               TEXT DEFAULT 'pending';

-- lead_status values: 'pending' | 'contacted' | 'highlighted' | 'dismissed'
