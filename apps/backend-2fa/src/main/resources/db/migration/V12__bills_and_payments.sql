-- V12__bills_and_payments.sql
-- FEAT-009 Sprint 11 — Pagos de servicios: recibos domiciliados y facturas
-- SOFIA Developer Agent — 2026-03-21

CREATE TABLE IF NOT EXISTS bills (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issuer     VARCHAR(128)  NOT NULL,
    concept    VARCHAR(256)  NOT NULL,
    amount     DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    due_date   DATE          NOT NULL,
    status     VARCHAR(16)   NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING','PAID','CANCELLED')),
    created_at TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_user_status ON bills(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date    ON bills(due_date);

CREATE TABLE IF NOT EXISTS bill_payments (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID          NOT NULL REFERENCES users(id),
    bill_id        UUID          REFERENCES bills(id),
    reference      VARCHAR(64),
    issuer         VARCHAR(128),
    amount         DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    source_account UUID          NOT NULL REFERENCES accounts(id),
    status         VARCHAR(16)   NOT NULL DEFAULT 'COMPLETED',
    core_txn_id    VARCHAR(64),
    paid_at        TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT chk_bill_payment_source
        CHECK (bill_id IS NOT NULL OR reference IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_bill_payments_user    ON bill_payments(user_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON bill_payments(bill_id);

COMMENT ON TABLE bills          IS 'Recibos domiciliados del usuario — FEAT-009 US-903';
COMMENT ON TABLE bill_payments  IS 'Registro de pagos de recibos y facturas — FEAT-009 US-903/904';
