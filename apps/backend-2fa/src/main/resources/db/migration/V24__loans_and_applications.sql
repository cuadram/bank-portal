-- V24 — FEAT-020 Gestión de Préstamos Personales
-- Sprint 22 · BankPortal · Banco Meridian · 2026-04-02

CREATE TABLE IF NOT EXISTS loans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL,
  tipo              VARCHAR(20) NOT NULL,
  importe_original  NUMERIC(15,2) NOT NULL,
  importe_pendiente NUMERIC(15,2) NOT NULL,
  plazo             INTEGER     NOT NULL,
  tae               NUMERIC(10,6) NOT NULL,
  cuota_mensual     NUMERIC(15,2) NOT NULL,
  estado            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  fecha_inicio      DATE        NOT NULL,
  fecha_fin         DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_estado  ON loans(estado);

CREATE TABLE IF NOT EXISTS loan_applications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL,
  importe        NUMERIC(15,2) NOT NULL,
  plazo          INTEGER     NOT NULL,
  finalidad      VARCHAR(20) NOT NULL,
  estado         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  scoring_result INTEGER,
  otp_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_apps_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_apps_estado  ON loan_applications(estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loan_apps_user_pending
  ON loan_applications(user_id) WHERE estado = 'PENDING';

CREATE TABLE IF NOT EXISTS loan_audit_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL,
  application_id UUID,
  accion         VARCHAR(30) NOT NULL,
  estado_anterior VARCHAR(20),
  estado_nuevo    VARCHAR(20),
  ip_origen       INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed de prueba: 2 préstamos activos para usuario de STG
DO $$
DECLARE
  v_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  INSERT INTO loans (user_id, tipo, importe_original, importe_pendiente, plazo, tae, cuota_mensual, estado, fecha_inicio, fecha_fin)
  VALUES
    (v_user_id, 'REFORMA',   12000.00, 10253.70, 36, 6.950000, 487.30, 'ACTIVE', '2025-10-01', '2028-09-01'),
    (v_user_id, 'VEHICULO',  8500.00,  8488.60,  48, 7.200000, 352.10, 'ACTIVE', '2026-01-15', '2030-01-15')
  ON CONFLICT DO NOTHING;
END $$;
