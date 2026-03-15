-- V3: Tabla recovery_codes
-- FEAT-001 | US-003 | BankPortal | Banco Meridian | Sprint 01

CREATE TABLE recovery_codes (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash  VARCHAR(255) NOT NULL,      -- BCrypt cost=10 del código en texto plano
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    used_at    TIMESTAMP    NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Índice compuesto: búsqueda de códigos disponibles por usuario
CREATE INDEX idx_recovery_codes_user_used ON recovery_codes(user_id, used);
