-- ============================================================
-- Migración: Separar contacts en Candidatos + Empresas
-- 
-- La tabla contacts actualmente mezcla candidatos y empresas
-- en una sola tabla. Esta migración:
-- 1. Crea tabla candidatos (sin qr_token/access_token/plan)
-- 2. Crea tabla empresas (con qr_token como dueña)
-- 3. Migra datos existentes
-- 4. Actualiza matches para referenciar empresa_id
-- 5. Mantiene contacts como vista/backward compat
-- ============================================================

-- ── 1. Tabla candidatos ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidatos (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT        NOT NULL,
  first_name              TEXT,
  last_name               TEXT,
  email                   TEXT,
  phone                   TEXT,
  rut                     TEXT,
  qr_token                TEXT        UNIQUE DEFAULT generate_uid(10),
  profile                 TEXT,
  industry                TEXT,
  experience_level        TEXT,
  job_search_type         TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidatos_email
  ON candidatos (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidatos_phone
  ON candidatos (phone)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidatos_rut
  ON candidatos (rut)
  WHERE rut IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidatos_qr_token
  ON candidatos (qr_token);

-- ── 2. Tabla empresas ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT        NOT NULL,
  company                 TEXT,
  position                TEXT,
  industry                TEXT,
  opportunity_description TEXT,
  phone                   TEXT,
  email                   TEXT,
  qr_token                TEXT        UNIQUE DEFAULT generate_uid(10),
  access_token            TEXT        UNIQUE,
  plan                    TEXT        DEFAULT 'free',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empresas_qr_token
  ON empresas (qr_token);

CREATE INDEX IF NOT EXISTS idx_empresas_access_token
  ON empresas (access_token)
  WHERE access_token IS NOT NULL;

-- ── 3. Migrar datos: contacts → candidatos + empresas ───────
-- Heurística: un contacto es "empresa" si tiene opportunity_description
-- o access_token o plan no-nulo. El resto son candidatos.

INSERT INTO candidatos (id, name, first_name, last_name, email, phone, rut, qr_token, profile, industry, experience_level, job_search_type, created_at)
SELECT
  c.id, c.name, c.first_name, c.last_name,
  c.email, c.phone, c.rut, c.qr_token, c.profile, c.industry,
  c.experience_level, c.job_search_type, c.created_at
FROM contacts c
WHERE c.opportunity_description IS NULL
  AND c.access_token IS NULL
  AND (c.plan IS NULL OR c.plan = 'free');

INSERT INTO empresas (id, name, company, position, industry, opportunity_description, qr_token, access_token, plan, created_at)
SELECT
  c.id, c.name, c.company, c.position, c.industry,
  c.opportunity_description, c.qr_token, c.access_token,
  COALESCE(c.plan, 'free'), c.created_at
FROM contacts c
WHERE c.opportunity_description IS NOT NULL
   OR c.access_token IS NOT NULL
   OR (c.plan IS NOT NULL AND c.plan != 'free');

-- ── 4. Actualizar matches: agregar empresa_id ───────────────
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Para matches existentes que referencian una empresa migrada,
-- copiamos el contacto referenciado si existe como empresa
UPDATE matches m
SET empresa_id = m.contact_id
FROM empresas e
WHERE e.id = m.contact_id
  AND m.empresa_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_matches_empresa_id
  ON matches (empresa_id)
  WHERE empresa_id IS NOT NULL;

-- ── 5. Nueva RPC: get_matches_dashboard_v2 (para nuevas tablas) ──
CREATE OR REPLACE FUNCTION get_matches_dashboard_v2()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats JSON;
  v_top   JSON;
BEGIN
  SELECT json_build_object(
    'total_candidatos', (SELECT COUNT(*) FROM candidatos),
    'total_empresas',   (SELECT COUNT(*) FROM empresas),
    'active_matches',   (SELECT COUNT(DISTINCT COALESCE(candidato_phone, candidato_id::TEXT)) FROM matches),
    'total_matches',    (SELECT COUNT(*) FROM matches),
    'negocio',          (SELECT COUNT(*) FROM matches WHERE connection_type = 'negocio'),
    'mentoria',         (SELECT COUNT(*) FROM matches WHERE connection_type = 'mentoria'),
    'casual',           (SELECT COUNT(*) FROM matches WHERE connection_type = 'casual'),
    'no_registrado',    (SELECT COUNT(*) FROM matches WHERE connection_type IS NULL)
  ) INTO v_stats;

  SELECT json_agg(t)
  FROM (
    SELECT
      e.id,
      e.name,
      e.company,
      COUNT(m.id)::INT AS match_count,
      (
        SELECT json_agg(json_build_object(
          'id',             m2.id,
          'created_at',     m2.created_at,
          'connection_type', m2.connection_type,
          'candidato_phone', m2.candidato_phone,
          'candidato_id',   m2.candidato_id
        ))
        FROM matches m2
        WHERE m2.empresa_id = e.id
        ORDER BY m2.created_at DESC
        LIMIT 5
      ) AS matches
    FROM empresas e
    JOIN matches m ON m.empresa_id = e.id
    GROUP BY e.id
    ORDER BY match_count DESC
    LIMIT 20
  ) t
  INTO v_top;

  RETURN json_build_object('stats', v_stats, 'top_empresas', COALESCE(v_top, '[]'::JSON));
END;
$$;

-- Migrar datos de matches: agregar candidato_phone desde scanner_phone
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS candidato_id UUID,
  ADD COLUMN IF NOT EXISTS candidato_phone TEXT;

UPDATE matches m
SET
  candidato_phone = m.scanner_phone,
  candidato_id    = CASE
    WHEN s.id IS NOT NULL THEN s.id
    ELSE NULL
  END
FROM candidatos s
WHERE s.id = m.scanner_id
  AND m.candidato_phone IS NULL;
