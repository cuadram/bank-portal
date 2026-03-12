-- V2: Columnas 2FA en tabla users
-- FEAT-001 | US-006 | BankPortal | Banco Meridian | Sprint 01
-- Backward compatible: columnas nullable o con DEFAULT FALSE

ALTER TABLE users
    ADD COLUMN two_factor_enabled     BOOLEAN   NOT NULL DEFAULT FALSE,
    ADD COLUMN totp_secret_enc        TEXT      NULL,       -- AES-256-CBC Base64 (CryptoService)
    ADD COLUMN two_factor_enrolled_at TIMESTAMP NULL;       -- UTC. NULL = no enrolado
