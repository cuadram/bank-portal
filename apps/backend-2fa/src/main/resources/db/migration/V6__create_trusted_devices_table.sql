-- V6__create_trusted_devices_table.sql
-- FEAT-003: Dispositivos de Confianza
-- Sprint 4 — 2026-04-28

-- ── Tabla trusted_devices ─────────────────────────────────────────────────────
CREATE TABLE trusted_devices (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash               VARCHAR(64) NOT NULL,
    device_fingerprint_hash  VARCHAR(64) NOT NULL,
    device_os                VARCHAR(64),
    device_browser           VARCHAR(64),
    ip_masked                VARCHAR(32),
    created_at               TIMESTAMP   NOT NULL DEFAULT now(),
    last_used_at             TIMESTAMP   NOT NULL DEFAULT now(),
    expires_at               TIMESTAMP   NOT NULL,
    revoked_at               TIMESTAMP,
    revoke_reason            VARCHAR(32)
);

-- Lookup rápido por token hash (login filter O(1))
CREATE UNIQUE INDEX idx_trusted_devices_token_hash
    ON trusted_devices(token_hash)
    WHERE revoked_at IS NULL;

-- Lista dispositivos activos de un usuario
CREATE INDEX idx_trusted_devices_user_active
    ON trusted_devices(user_id, last_used_at DESC)
    WHERE revoked_at IS NULL AND expires_at > now();

-- Job de limpieza nocturna (US-204)
CREATE INDEX idx_trusted_devices_expires
    ON trusted_devices(expires_at)
    WHERE revoked_at IS NULL;

COMMENT ON TABLE trusted_devices
    IS 'Dispositivos de confianza — omiten OTP en login (FEAT-003 US-201/203/204)';
COMMENT ON COLUMN trusted_devices.token_hash
    IS 'SHA-256 del trust token — nunca el token en claro (ADR-008)';
COMMENT ON COLUMN trusted_devices.device_fingerprint_hash
    IS 'SHA-256 de (User-Agent + IP-subnet/16) — binding del trust token al dispositivo';
COMMENT ON COLUMN trusted_devices.expires_at
    IS 'TTL 30 días desde creación — renovado en cada uso (US-204)';

-- ── Nuevos eventos de auditoría (extensión de check si existe restricción) ────
-- Los nuevos event_type son: TRUSTED_DEVICE_CREATED, TRUSTED_DEVICE_LOGIN,
-- TRUSTED_DEVICE_REVOKED, TRUSTED_DEVICE_REVOKE_ALL, TRUSTED_DEVICE_EXPIRED_CLEANUP
-- audit_log usa VARCHAR sin CHECK constraint — no requiere ALTER TABLE.

COMMENT ON TABLE trusted_devices
    IS 'FEAT-003 Sprint 4 — Dispositivos de confianza con cookie HttpOnly (ADR-008)';
