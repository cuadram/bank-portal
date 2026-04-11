-- V26 — FEAT-021 Depósitos a Plazo Fijo
-- Sprint 23 · BankPortal · Banco Meridian · 2026-04-09

CREATE TABLE IF NOT EXISTS deposits (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID          NOT NULL,
  importe            NUMERIC(15,2) NOT NULL,
  plazo_meses        INTEGER       NOT NULL,
  tin                NUMERIC(10,6) NOT NULL,
  tae                NUMERIC(10,6) NOT NULL,
  estado             VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  renovacion         VARCHAR(30)   NOT NULL DEFAULT 'RENEW_MANUAL',
  cuenta_origen_id   UUID          NOT NULL,
  fecha_apertura     DATE          NOT NULL,
  fecha_vencimiento  DATE          NOT NULL,
  penalizacion       NUMERIC(15,2),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id      ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_estado        ON deposits(estado);
CREATE INDEX IF NOT EXISTS idx_deposits_vencimiento   ON deposits(fecha_vencimiento);

CREATE TABLE IF NOT EXISTS deposit_applications (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL,
  importe          NUMERIC(15,2) NOT NULL,
  plazo_meses      INTEGER       NOT NULL,
  cuenta_origen_id UUID          NOT NULL,
  renovacion       VARCHAR(30)   NOT NULL DEFAULT 'RENEW_MANUAL',
  estado           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  otp_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
  deposit_id       UUID          REFERENCES deposits(id),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dep_apps_user_id ON deposit_applications(user_id);

-- Seed STG: 2 depósitos activos para usuario de pruebas
DO $$
DECLARE
  v_user UUID := '11111111-1111-1111-1111-111111111111';
  v_acc  UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  INSERT INTO deposits
    (user_id, importe, plazo_meses, tin, tae, estado, renovacion,
     cuenta_origen_id, fecha_apertura, fecha_vencimiento)
  VALUES
    (v_user, 10000.00, 12, 0.032500, 0.033000, 'ACTIVE', 'RENEW_MANUAL',
     v_acc, '2026-04-01', '2027-04-01'),
    (v_user,  5000.00,  6, 0.030000, 0.030400, 'ACTIVE', 'RENEW_AUTO',
     v_acc, '2026-04-01', '2026-10-01')
  ON CONFLICT DO NOTHING;
END $$;
