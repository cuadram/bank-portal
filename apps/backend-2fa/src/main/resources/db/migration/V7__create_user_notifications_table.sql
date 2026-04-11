-- V7__create_user_notifications_table.sql
-- FEAT-004: Centro de Notificaciones de Seguridad
-- Sprint 5 — 2026-05-12

CREATE TABLE user_notifications (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type   VARCHAR(64)  NOT NULL,
    title        VARCHAR(128) NOT NULL,
    body         TEXT,
    metadata     JSONB,
    action_url   VARCHAR(256),
    is_read      BOOLEAN      NOT NULL DEFAULT false,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    expires_at   TIMESTAMP    NOT NULL DEFAULT now() + INTERVAL '90 days'
);

-- Listado paginado de notificaciones de un usuario (US-301)
CREATE INDEX idx_user_notifications_user_created
    ON user_notifications(user_id, created_at DESC);

-- Badge de no leídas — lookup O(1) (US-303)
CREATE INDEX idx_user_notifications_user_unread
    ON user_notifications(user_id)
    WHERE is_read = false;

-- Job de limpieza nocturna de expiradas (US-204 pattern)
-- NOTA: now() no es IMMUTABLE, no se puede usar en predicado de índice parcial
CREATE INDEX idx_user_notifications_expires
    ON user_notifications(expires_at);

COMMENT ON TABLE user_notifications
    IS 'Centro de Notificaciones de Seguridad — FEAT-004 Sprint 5';
COMMENT ON COLUMN user_notifications.metadata
    IS 'Datos del evento: device, browser, ip, sessionId, etc. (JSONB)';
COMMENT ON COLUMN user_notifications.action_url
    IS 'Deep-link al recurso relacionado (US-304): /security/sessions#{sessionId}';
COMMENT ON COLUMN user_notifications.expires_at
    IS 'Notificaciones expiran a los 90 días — eliminadas por job nocturno';
