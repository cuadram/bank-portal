-- V22__profile_gdpr.sql
-- Sprint 21 — FEAT-019: Centro de Privacidad y Perfil
-- Tablas: consent_history, gdpr_requests
-- Alteraciones: users (campos privacy), export_audit_log (DEBT-036 iban_masked)

-- ─── Ampliar tabla users ──────────────────────────────────────────────────────
-- Añadir campos de ciclo de vida de privacidad GDPR Art.17
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS deleted_at          TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP;

-- Constraint CHECK para status (sin ENUM — LA-019-13: usar varchar)
-- NOTA: ADD CONSTRAINT IF NOT EXISTS no existe en PostgreSQL — usar DO block
DO $body$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_status'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT chk_user_status
            CHECK (status IN ('ACTIVE','SUSPENDED','DELETED'));
    END IF;
END $body$;

-- ─── Historial de consentimientos GDPR Art.7 (append-only, inmutable) ─────────
CREATE TABLE IF NOT EXISTS consent_history (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    tipo            VARCHAR(20)  NOT NULL,
    valor_anterior  BOOLEAN,
    valor_nuevo     BOOLEAN      NOT NULL,
    ip_origen       VARCHAR(45),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_consent_history PRIMARY KEY (id),
    CONSTRAINT chk_consent_tipo CHECK (tipo IN ('MARKETING','ANALYTICS','COMMUNICATIONS','SECURITY'))
);

-- Índice para consultas por usuario + tipo + fecha
CREATE INDEX IF NOT EXISTS idx_consent_history_user_tipo
    ON consent_history(user_id, tipo, created_at DESC);

-- ─── Solicitudes de derechos GDPR Art.12 — SLA 30 días ───────────────────────
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    tipo            VARCHAR(20)  NOT NULL,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    descripcion     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    sla_deadline    TIMESTAMP    NOT NULL,
    sla_alert_sent  BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_gdpr_requests PRIMARY KEY (id),
    CONSTRAINT chk_gdpr_tipo   CHECK (tipo   IN ('EXPORT','DELETION','CONSENT')),
    CONSTRAINT chk_gdpr_estado CHECK (estado IN ('PENDING','IN_PROGRESS','COMPLETED','REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user
    ON gdpr_requests(user_id, created_at DESC);

-- Índice parcial para búsqueda rápida de solicitudes pendientes próximas al SLA
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_sla
    ON gdpr_requests(estado, sla_deadline)
    WHERE estado NOT IN ('COMPLETED','REJECTED');

-- ─── DEBT-036: campo iban_masked en export_audit_log ─────────────────────────
ALTER TABLE export_audit_log
    ADD COLUMN IF NOT EXISTS iban_masked VARCHAR(10);

-- ─── Seeds: consentimientos por defecto para usuarios existentes ──────────────
-- Insertar estado inicial de consentimientos (solo si no existen ya)
INSERT INTO consent_history (user_id, tipo, valor_anterior, valor_nuevo, ip_origen, created_at)
SELECT u.id, c.tipo, NULL, c.valor_nuevo, '0.0.0.0', NOW()
FROM users u
CROSS JOIN (VALUES
    ('MARKETING',      true),
    ('ANALYTICS',      false),
    ('COMMUNICATIONS', true),
    ('SECURITY',       true)
) AS c(tipo, valor_nuevo)
WHERE NOT EXISTS (
    SELECT 1 FROM consent_history ch
    WHERE ch.user_id = u.id AND ch.tipo = c.tipo
);
