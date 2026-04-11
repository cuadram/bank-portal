-- ============================================================
-- V17b — DEBT-028: Cifrar push_subscriptions auth/p256dh
-- CVSS 4.1 · Sprint 17 · BankPortal — Banco Meridian
-- SOFIA Developer Agent · 2026-03-24
-- ============================================================

-- Renombrar columnas actuales (texto claro) a temporales
ALTER TABLE push_subscriptions RENAME COLUMN auth TO auth_plain;
ALTER TABLE push_subscriptions RENAME COLUMN p256dh TO p256dh_plain;

-- Añadir columnas cifradas (application-level AES-256-GCM)
ALTER TABLE push_subscriptions
    ADD COLUMN auth   TEXT,
    ADD COLUMN p256dh TEXT;

-- Añadir columna de versión de cifrado para rotación de claves futura
ALTER TABLE push_subscriptions
    ADD COLUMN encryption_version SMALLINT NOT NULL DEFAULT 1;

-- Nota: los valores se migran en caliente desde PushSubscriptionMigrationService
-- al arrancar la aplicación (bootstrap), no en esta migración.
-- Una vez migrados, auth_plain y p256dh_plain se eliminan con V17c (Sprint 18).

COMMENT ON COLUMN push_subscriptions.auth IS 'AES-256-GCM cifrado — clave PUSH_ENCRYPTION_KEY';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'AES-256-GCM cifrado — clave PUSH_ENCRYPTION_KEY';
COMMENT ON COLUMN push_subscriptions.auth_plain IS 'DEPRECADO — eliminar en V17c tras migración';
COMMENT ON COLUMN push_subscriptions.p256dh_plain IS 'DEPRECADO — eliminar en V17c tras migración';
