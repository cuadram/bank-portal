-- V12: bills y bill_payments — FEAT-009 Sprint 11
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issuer VARCHAR(128) NOT NULL, concept VARCHAR(256) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_bills_user_status ON bills(user_id, status);

CREATE TABLE bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    bill_id UUID REFERENCES bills(id), reference VARCHAR(64), issuer VARCHAR(128),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    source_account UUID NOT NULL REFERENCES accounts(id),
    status VARCHAR(16) NOT NULL DEFAULT 'COMPLETED', core_txn_id VARCHAR(64),
    paid_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_bill_payment_source CHECK (bill_id IS NOT NULL OR reference IS NOT NULL)
);
CREATE INDEX idx_bill_payments_user ON bill_payments(user_id, paid_at DESC);
