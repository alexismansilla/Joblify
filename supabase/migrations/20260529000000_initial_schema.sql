-- ============================================================
-- Schema inicial Joblify
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Función: generate_uid ─────────────────────────────────────────────────────
-- Genera tokens alfanuméricos únicos para QR tokens y access tokens.
CREATE OR REPLACE FUNCTION generate_uid(size INT DEFAULT 10)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars  TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i      INT;
BEGIN
  FOR i IN 1..size LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ── Tabla: contacts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT        NOT NULL,
  first_name              TEXT,
  last_name               TEXT,
  email                   TEXT,
  phone                   TEXT,
  rut                     TEXT,
  company                 TEXT,
  position                TEXT,
  profile                 TEXT,
  industry                TEXT,
  experience_level        TEXT,
  job_search_type         TEXT,
  opportunity_description TEXT,
  access_token            TEXT        UNIQUE,
  plan                    TEXT        DEFAULT 'free',
  qr_token                TEXT        UNIQUE DEFAULT generate_uid(10),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_qr_token
  ON contacts (qr_token);

CREATE INDEX IF NOT EXISTS idx_contacts_access_token
  ON contacts (access_token)
  WHERE access_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_email
  ON contacts (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_phone
  ON contacts (phone)
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_rut
  ON contacts (rut)
  WHERE rut IS NOT NULL;

-- ── Tabla: matches ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id      UUID        REFERENCES contacts(id) ON DELETE CASCADE,
  scanner_id      UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  scanner_phone   TEXT,
  connection_type TEXT        CHECK (connection_type IN ('negocio', 'mentoria', 'casual')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_contact_id
  ON matches (contact_id);

CREATE INDEX IF NOT EXISTS idx_matches_scanner_id
  ON matches (scanner_id)
  WHERE scanner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_scanner_phone
  ON matches (scanner_phone)
  WHERE scanner_phone IS NOT NULL;

-- ── Tabla: authorities ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authorities (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  position     TEXT,
  organization TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Función: remove_duplicate_contacts ───────────────────────────────────────
CREATE OR REPLACE FUNCTION remove_duplicate_contacts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM contacts
  WHERE id NOT IN (
    SELECT DISTINCT ON (
      COALESCE(LOWER(TRIM(name)), ''),
      COALESCE(LOWER(TRIM(email)), ''),
      COALESCE(TRIM(phone), '')
    ) id
    FROM contacts
    ORDER BY
      COALESCE(LOWER(TRIM(name)), ''),
      COALESCE(LOWER(TRIM(email)), ''),
      COALESCE(TRIM(phone), ''),
      created_at ASC
  );
END;
$$;

-- ── Función RPC: get_matches_dashboard ───────────────────────────────────────
CREATE OR REPLACE FUNCTION get_matches_dashboard()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats      JSON;
  v_top        JSON;
BEGIN
  -- Estadísticas globales
  SELECT json_build_object(
    'total_contacts',  (SELECT COUNT(*) FROM contacts),
    'active_contacts', (SELECT COUNT(DISTINCT COALESCE(scanner_id::TEXT, scanner_phone)) FROM matches),
    'total_matches',   (SELECT COUNT(*) FROM matches),
    'negocio',         (SELECT COUNT(*) FROM matches WHERE connection_type = 'negocio'),
    'mentoria',        (SELECT COUNT(*) FROM matches WHERE connection_type = 'mentoria'),
    'casual',          (SELECT COUNT(*) FROM matches WHERE connection_type = 'casual'),
    'no_registrado',   (SELECT COUNT(*) FROM matches WHERE connection_type IS NULL)
  ) INTO v_stats;

  -- Top 20 empresas con más leads
  SELECT json_agg(t)
  FROM (
    SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      c.company,
      COUNT(m.id)::INT AS match_count,
      (
        SELECT json_agg(json_build_object(
          'id',            m2.id,
          'created_at',    m2.created_at,
          'connection_type', m2.connection_type,
          'scanner_phone', m2.scanner_phone,
          'scanner',       CASE
            WHEN s.id IS NOT NULL THEN json_build_object('id', s.id, 'name', s.name)
            ELSE NULL
          END
        ))
        FROM matches m2
        LEFT JOIN contacts s ON s.id = m2.scanner_id
        WHERE m2.contact_id = c.id
      ) AS matches
    FROM contacts c
    JOIN matches m ON m.contact_id = c.id
    GROUP BY c.id
    ORDER BY match_count DESC
    LIMIT 20
  ) t
  INTO v_top;

  RETURN json_build_object('stats', v_stats, 'top_contacts', COALESCE(v_top, '[]'::JSON));
END;
$$;
