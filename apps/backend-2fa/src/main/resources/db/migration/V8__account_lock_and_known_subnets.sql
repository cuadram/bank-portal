-- V8__account_lock_and_known_subnets.sql
-- FEAT-006: Bloqueo de cuenta + Autenticación contextual
-- Sprint 7 — 2026-06-09

-- ── Extensión de tabla users para bloqueo de cuenta (US-601/602) ─────────────

ALTER TABLE users
  ADD COLUMN account_status        VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN failed_otp_attempts   INT          NOT NULL DEFAULT 0,
  ADD COLUMN failed_attempts_since TIMESTAMP,
  ADD COLUMN locked_at             TIMESTAMP,
  ADD COLUMN lock_unlock_token     VARCHAR(128);

ALTER TABLE users
  ADD CONSTRAINT chk_account_status
    CHECK (account_status IN ('ACTIVE', 'LOCKED'));

-- Índice para lookup de unlock token O(1)
CREATE UNIQUE INDEX idx_users_lock_unlock_token
  ON users(lock_unlock_token)
  WHERE lock_unlock_token IS NOT NULL;

-- Índice para identificar cuentas bloqueadas (monitorización operativa)
CREATE INDEX idx_users_locked_accounts
  ON users(locked_at)
  WHERE account_status = 'LOCKED';

-- ── Tabla known_subnets para autenticación contextual (US-603) ───────────────

CREATE TABLE known_subnets (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subnet      VARCHAR(32) NOT NULL,   -- ej. "192.168" (primeros 2 octetos)
    first_seen  TIMESTAMP   NOT NULL DEFAULT now(),
    last_seen   TIMESTAMP   NOT NULL DEFAULT now(),
    confirmed   BOOLEAN     NOT NULL DEFAULT false
);

-- Unicidad subnet por usuario
CREATE UNIQUE INDEX idx_known_subnets_user_subnet
  ON known_subnets(user_id, subnet);

-- Lookup subnets confirmadas — ruta crítica del login contextual
CREATE INDEX idx_known_subnets_user_confirmed
  ON known_subnets(user_id, subnet)
  WHERE confirmed = true;

-- ── Preferencias de notificación por usuario/tipo (US-403) ───────────────────

CREATE TABLE user_notification_preferences (
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  VARCHAR(64) NOT NULL,
    enabled     BOOLEAN     NOT NULL DEFAULT true,
    updated_at  TIMESTAMP   NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_type)
);

-- ── Comments ──────────────────────────────────────────────────────────────────

COMMENT ON COLUMN users.account_status
  IS 'ACTIVE (normal) | LOCKED (bloqueada por N intentos fallidos de OTP — US-601)';
COMMENT ON COLUMN users.failed_otp_attempts
  IS 'Contador de intentos fallidos en ventana de 24h. Reset al login exitoso o al desbloquear.';
COMMENT ON COLUMN users.lock_unlock_token
  IS 'Hash SHA-256 del token HMAC de desbloqueo por email (TTL 1h, one-time use — US-602)';
COMMENT ON TABLE known_subnets
  IS 'Subnets IP confirmadas por usuario para autenticación contextual — US-603';
COMMENT ON TABLE user_notification_preferences
  IS 'Preferencias de visibilidad de notificaciones por tipo. NO afecta audit_log (R-F5-003) — US-403';
