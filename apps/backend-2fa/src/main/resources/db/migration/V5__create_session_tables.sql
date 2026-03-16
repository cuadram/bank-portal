-- V5__create_session_tables.sql
-- FEAT-002: Gestión Avanzada de Sesiones
-- Sprint 3 — 2026-04-14

-- ── 1. Columna timeout en users ───────────────────────────────────────────────
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS session_timeout_minutes INT NOT NULL DEFAULT 30
        CHECK (session_timeout_minutes BETWEEN 5 AND 60);

COMMENT ON COLUMN users.session_timeout_minutes
    IS 'Timeout de inactividad elegido por el usuario (5-60 min, PCI-DSS max=60)';

-- ── 2. Tabla user_sessions ────────────────────────────────────────────────────
CREATE TABLE user_sessions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti            VARCHAR(36) NOT NULL,
    token_hash     VARCHAR(64) NOT NULL,
    device_info    JSONB,
    ip_masked      VARCHAR(32),
    last_activity  TIMESTAMP   NOT NULL DEFAULT now(),
    created_at     TIMESTAMP   NOT NULL DEFAULT now(),
    revoked_at     TIMESTAMP,
    revoke_reason  VARCHAR(32) CHECK (revoke_reason IN (
                       'MANUAL','SESSION_EVICTED','TIMEOUT','DENY_LINK','ADMIN'))
);

-- Índice parcial para sesiones activas (la consulta más frecuente)
CREATE UNIQUE INDEX idx_user_sessions_jti
    ON user_sessions(jti);

CREATE INDEX idx_user_sessions_user_active
    ON user_sessions(user_id, last_activity DESC)
    WHERE revoked_at IS NULL;

COMMENT ON TABLE user_sessions
    IS 'Sesiones activas y revocadas — fuente de verdad para gestión de sesiones FEAT-002';
COMMENT ON COLUMN user_sessions.jti
    IS 'JWT ID claim — identifica unívocamente el token emitido';
COMMENT ON COLUMN user_sessions.token_hash
    IS 'SHA-256 del JWT para auditoría — nunca el token en claro';

-- ── 3. Tabla known_devices ────────────────────────────────────────────────────
CREATE TABLE known_devices (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint_hash  VARCHAR(64) NOT NULL,
    first_seen               TIMESTAMP   NOT NULL DEFAULT now(),
    last_seen                TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT uq_known_devices_user_fp UNIQUE (user_id, device_fingerprint_hash)
);

CREATE INDEX idx_known_devices_user ON known_devices(user_id);

COMMENT ON TABLE known_devices
    IS 'Huellas digitales de dispositivos conocidos — detección de login inusual US-105';
COMMENT ON COLUMN known_devices.device_fingerprint_hash
    IS 'SHA-256 de (User-Agent + IP-subnet/16)';

-- ── 4. DEBT-003: Inmutabilidad de audit_log para eventos de sesión ────────────
-- La tabla audit_log ya existe (V4) con trigger de inmutabilidad.
-- Añadir tipos de evento de sesión al check si existe la restricción.
-- (Si el check fue definido como tabla sin restricción CHECK, insertar es suficiente.)

-- ── 5. DEBT-003: Migrar deactivate de DELETE → POST ──────────────────────────
-- No requiere cambio de esquema. El cambio es en el contrato de API (OpenAPI v1.1.0).
-- El endpoint DELETE /api/v1/2fa/deactivate se marca deprecated en el código.
-- Esta migración documenta la decisión de la deuda técnica resuelta.
COMMENT ON TABLE user_sessions
    IS 'DEBT-003 resuelto en Sprint 3: DELETE /deactivate deprecado, POST /deactivate activo';
