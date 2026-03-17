-- V9__notification_center.sql
-- FEAT-004: Centro de Notificaciones de Seguridad
-- Sprint 8 — 2026-03-17

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla principal de notificaciones del usuario (US-301/302/303)
-- ─────────────────────────────────────────────────────────────────────────────

-- NOTA: V7 puede haber creado una tabla user_notifications con distinto esquema.
-- Si existe, la renombramos y creamos la nueva con la estructura FEAT-004.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_notifications'
    ) THEN
        ALTER TABLE user_notifications RENAME TO user_notifications_v7_backup;
    END IF;
END $$;

CREATE TABLE user_notifications (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type      VARCHAR(64)  NOT NULL,
    title           VARCHAR(128) NOT NULL,
    body            TEXT,
    action_url      VARCHAR(256),               -- deep-link US-304
    context_id      VARCHAR(128),               -- sessionId / deviceId para deep-links
    read_at         TIMESTAMP,                  -- NULL = no leída
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    source_audit_id UUID,                       -- referencia soft a audit_log
    ip_subnet       VARCHAR(64),                -- subnet origen del evento (enmascarada)
    unusual_location BOOLEAN     NOT NULL DEFAULT false
);

COMMENT ON TABLE user_notifications IS
    'Notificaciones de seguridad del usuario. Retención: 90 días (job nocturno).';
COMMENT ON COLUMN user_notifications.action_url IS
    'Deep-link de acción directa para US-304 (ej. /security/sessions?highlight=<id>)';
COMMENT ON COLUMN user_notifications.read_at IS
    'NULL = no leída. Actualizada por US-302 mark-as-read.';

-- Índices para queries US-301 (historial paginado) y US-303 (unread count)
CREATE INDEX idx_user_notif_user_created
    ON user_notifications(user_id, created_at DESC);

CREATE INDEX idx_user_notif_unread
    ON user_notifications(user_id, read_at)
    WHERE read_at IS NULL;

CREATE INDEX idx_user_notif_event_type
    ON user_notifications(user_id, event_type, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Preferencias de notificación por tipo de evento (US-403 extensión)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE notification_preferences (
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    enabled    BOOLEAN     NOT NULL DEFAULT true,
    updated_at TIMESTAMP   NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_type)
);

COMMENT ON TABLE notification_preferences IS
    'Preferencias de notificación por tipo de evento. '
    'ACCOUNT_LOCKED y LOGIN_NEW_CONTEXT_DETECTED no se pueden deshabilitar (PCI-DSS 4.0).';

-- Tipos críticos siempre habilitados — se insertan pero no se permite disabled
-- (enforced a nivel de aplicación en NotificationPreferencesUseCase)
COMMENT ON COLUMN notification_preferences.enabled IS
    'false desactiva la notificación visible pero NO el registro en audit_log (R-F5-003).';

-- ─────────────────────────────────────────────────────────────────────────────
-- Claim jti en JWT context-pending — columna en known_subnets para correlación
-- (DEBT-009: el jti se guarda para correlacionar blacklist Redis con BD si necesario)
-- ─────────────────────────────────────────────────────────────────────────────

-- No se requiere nueva tabla — la blacklist es exclusivamente Redis (ADR-012).
-- Se añade un índice adicional en known_subnets para queries de historial inusual.
CREATE INDEX IF NOT EXISTS idx_known_subnets_user_subnet
    ON known_subnets(user_id, subnet);
