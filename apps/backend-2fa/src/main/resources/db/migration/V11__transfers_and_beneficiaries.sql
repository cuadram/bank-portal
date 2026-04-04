-- V11__transfers_and_beneficiaries.sql
-- FEAT-008: Transferencias Bancarias
-- Sprint 10 — 2026-03-20

-- ── Tabla beneficiaries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beneficiaries (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alias        VARCHAR(64)  NOT NULL,
    iban         VARCHAR(34)  NOT NULL,
    holder_name  VARCHAR(128) NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMP
);

-- Un usuario no puede tener dos beneficiarios activos con el mismo IBAN
CREATE UNIQUE INDEX idx_beneficiaries_user_iban_active
    ON beneficiaries(user_id, iban)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_active
    ON beneficiaries(user_id)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE beneficiaries
    IS 'Libreta de beneficiarios del usuario — FEAT-008 US-803';
COMMENT ON COLUMN beneficiaries.deleted_at
    IS 'Soft delete: NULL = activo. Las transferencias históricas mantienen la referencia.';

-- ── Tabla transfers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfers (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID           NOT NULL REFERENCES users(id),
    source_account UUID           NOT NULL REFERENCES accounts(id),
    target_account UUID           REFERENCES accounts(id),  -- NULL para transferencias a beneficiario
    beneficiary_id UUID           REFERENCES beneficiaries(id),
    amount         DECIMAL(15,2)  NOT NULL CHECK (amount > 0),
    concept        VARCHAR(256),
    status         VARCHAR(16)    NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING','COMPLETED','FAILED','CANCELLED')),
    executed_at    TIMESTAMP,
    created_at     TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT chk_transfer_has_target
        CHECK (target_account IS NOT NULL OR beneficiary_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_transfers_user_created
    ON transfers(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_source_account
    ON transfers(source_account, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_status
    ON transfers(status)
    WHERE status = 'PENDING';

COMMENT ON TABLE transfers
    IS 'Registro de transferencias — FEAT-008 US-801/802';
COMMENT ON COLUMN transfers.amount
    IS 'Siempre DECIMAL(15,2) — nunca float. Evita pérdida de precisión monetaria.';
COMMENT ON COLUMN transfers.target_account
    IS 'NULL para transferencias a beneficiario externo. Mutuamente exclusivo con beneficiary_id.';

-- ── Tabla transfer_limits ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfer_limits (
    user_id               UUID          PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    per_operation_limit   DECIMAL(15,2) NOT NULL DEFAULT 2000.00,
    daily_limit           DECIMAL(15,2) NOT NULL DEFAULT 3000.00,
    monthly_limit         DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    updated_at            TIMESTAMP     NOT NULL DEFAULT now()
);

COMMENT ON TABLE transfer_limits
    IS 'Límites de transferencia por usuario (configurados por el banco) — FEAT-008 US-804';
COMMENT ON COLUMN transfer_limits.per_operation_limit
    IS 'Límite máximo por operación individual en EUR. Default: 2000€ (PSD2 SCA)';
COMMENT ON COLUMN transfer_limits.daily_limit
    IS 'Límite acumulado diario en EUR. Contador en Redis con TTL medianoche UTC. Default: 3000€';
COMMENT ON COLUMN transfer_limits.monthly_limit
    IS 'Límite acumulado mensual en EUR. Default: 10000€';
