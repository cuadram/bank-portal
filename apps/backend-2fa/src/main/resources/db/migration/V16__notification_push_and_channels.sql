-- V16__notification_push_and_channels.sql
-- FEAT-014: Notificaciones Push & In-App — Sprint 16
-- Extiende módulo notification (FEAT-004/FEAT-007) de forma aditiva, sin breaking changes
-- CMMI Level 3 — TS SP 2.1

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extensión aditiva de user_notifications
--    La tabla actual (V9) tiene: id, user_id, event_type, title, body,
--    action_url, context_id, read_at, created_at, source_audit_id,
--    ip_subnet, unusual_location.
--    Añadimos: category, severity, metadata (JSONB).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_notifications
    ADD COLUMN IF NOT EXISTS category  VARCHAR(20) NOT NULL DEFAULT 'SECURITY',
    ADD COLUMN IF NOT EXISTS severity  VARCHAR(10) NOT NULL DEFAULT 'INFO',
    ADD COLUMN IF NOT EXISTS metadata  JSONB;

COMMENT ON COLUMN user_notifications.category IS
    'Canal semántico: TRANSACTION | SECURITY | KYC | SYSTEM. Default SECURITY para datos pre-FEAT-014.';
COMMENT ON COLUMN user_notifications.severity IS
    'Severidad: INFO | HIGH. HIGH ignora preferencias de usuario para email/in-app.';
COMMENT ON COLUMN user_notifications.metadata IS
    'Datos del evento en formato JSONB: amount, iban, deviceId, etc.';

-- Índice adicional para filtro por categoría (panel FEAT-014)
CREATE INDEX IF NOT EXISTS idx_user_notif_user_cat
    ON user_notifications(user_id, category, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Migrar notification_preferences (V9: un flag enabled → tres canales)
--    V9 tenía: (user_id, event_type, enabled, updated_at) PK (user_id, event_type)
--    FEAT-014 necesita: email_enabled, push_enabled, in_app_enabled separados
-- ─────────────────────────────────────────────────────────────────────────────

-- Backup de preferencias existentes antes de migrar
CREATE TABLE IF NOT EXISTS notification_preferences_v9_backup AS
    SELECT * FROM notification_preferences;

-- Drop y recrear con nuevo esquema multicanal
DROP TABLE IF EXISTS notification_preferences CASCADE;

CREATE TABLE IF NOT EXISTS notification_preferences (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type     VARCHAR(64)  NOT NULL,
    email_enabled  BOOLEAN      NOT NULL DEFAULT true,
    push_enabled   BOOLEAN      NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN      NOT NULL DEFAULT true,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_pref_user_event UNIQUE(user_id, event_type)
);

-- Migrar datos del backup: enabled=false → todos los canales false
INSERT INTO notification_preferences (user_id, event_type, email_enabled, push_enabled, in_app_enabled, updated_at)
SELECT
    b.user_id,
    b.event_type,
    b.enabled,   -- email_enabled
    b.enabled,   -- push_enabled
    b.enabled,   -- in_app_enabled
    COALESCE(b.updated_at, now())
FROM notification_preferences_v9_backup b
ON CONFLICT (user_id, event_type) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user
    ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS
    'Preferencias de canal por usuario y tipo de evento — FEAT-014. '
    'Eventos severity=HIGH ignoran email_enabled e in_app_enabled (hardcoded en NotificationHub).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Nueva tabla: push_subscriptions (Web Push VAPID multi-device)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint     TEXT         NOT NULL,
    p256dh       TEXT         NOT NULL,
    auth         TEXT         NOT NULL,
    user_agent   TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    CONSTRAINT uq_push_endpoint UNIQUE(endpoint)
);

COMMENT ON TABLE push_subscriptions IS
    'Suscripciones Web Push VAPID por usuario y dispositivo — FEAT-014. '
    'Máximo 5 suscripciones activas por usuario (enforced en ManagePushSubscriptionUseCase). '
    'Endpoints HTTP 410 se eliminan automáticamente en WebPushService.';

CREATE INDEX IF NOT EXISTS idx_push_sub_user
    ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_sub_created
    ON push_subscriptions(user_id, created_at DESC);
