-- =============================================================
-- V19__direct_debits.sql
-- FEAT-017: Domiciliaciones y Recibos SEPA DD Core
-- Sprint 19 · BankPortal · Banco Meridian · v1.19.0
-- SOFIA v2.2 · Developer Agent
-- =============================================================

CREATE TYPE mandate_type   AS ENUM ('CORE', 'B2B');
CREATE TYPE mandate_status AS ENUM ('ACTIVE', 'CANCELLED', 'SUSPENDED');
CREATE TYPE debit_status   AS ENUM ('PENDING', 'CHARGED', 'RETURNED', 'REJECTED');

CREATE TABLE debit_mandates (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID         NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id       UUID         NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
    creditor_name VARCHAR(140) NOT NULL,
    creditor_iban VARCHAR(34)  NOT NULL,
    mandate_ref   VARCHAR(35)  NOT NULL,
    mandate_type  mandate_type NOT NULL DEFAULT 'CORE',
    status        mandate_status NOT NULL DEFAULT 'ACTIVE',
    signed_at     DATE         NOT NULL DEFAULT CURRENT_DATE,
    cancelled_at  DATE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_mandate_ref UNIQUE (mandate_ref),
    CONSTRAINT chk_cancelled_at CHECK (
        cancelled_at IS NULL OR status IN ('CANCELLED', 'SUSPENDED')
    )
);

CREATE TABLE direct_debits (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id    UUID         NOT NULL REFERENCES debit_mandates(id) ON DELETE RESTRICT,
    amount        NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency      CHAR(3)      NOT NULL DEFAULT 'EUR',
    status        debit_status  NOT NULL DEFAULT 'PENDING',
    due_date      DATE         NOT NULL,
    charged_at    TIMESTAMPTZ,
    return_reason VARCHAR(4),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Índices de rendimiento
CREATE INDEX idx_dm_user_id        ON debit_mandates(user_id);
CREATE INDEX idx_dm_account_id     ON debit_mandates(account_id);
CREATE INDEX idx_dm_status         ON debit_mandates(status);
CREATE INDEX idx_dm_user_status    ON debit_mandates(user_id, status);
CREATE INDEX idx_dd_mandate_id     ON direct_debits(mandate_id);
CREATE INDEX idx_dd_status_due     ON direct_debits(status, due_date);
CREATE INDEX idx_dd_due_date       ON direct_debits(due_date);

COMMENT ON TABLE debit_mandates IS 'SEPA DD Core mandates — FEAT-017 Sprint 19';
COMMENT ON TABLE direct_debits  IS 'SEPA DD debit records per mandate — FEAT-017 Sprint 19';
