-- V27__bizum.sql — FEAT-022 Bizum P2P · Sprint 24
-- Flyway migration: tablas bizum_activations, bizum_payments, bizum_requests

CREATE TABLE bizum_activations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    account_id      UUID NOT NULL REFERENCES accounts(id),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    gdpr_consent_at TIMESTAMPTZ NOT NULL,
    activated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at  TIMESTAMPTZ
);

CREATE TABLE bizum_payments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_user_id   UUID NOT NULL REFERENCES users(id),
    recipient_phone  VARCHAR(20) NOT NULL,
    amount           NUMERIC(12,2) NOT NULL,
    concept          VARCHAR(35),
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sepa_ref         VARCHAR(50),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

CREATE TABLE bizum_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_user_id   UUID NOT NULL REFERENCES users(id),
    recipient_phone     VARCHAR(20) NOT NULL,
    amount              NUMERIC(12,2) NOT NULL,
    concept             VARCHAR(35),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    payment_id          UUID REFERENCES bizum_payments(id)
);

CREATE INDEX idx_bizum_payments_sender ON bizum_payments(sender_user_id, created_at DESC);
CREATE INDEX idx_bizum_requests_requester ON bizum_requests(requester_user_id, status);
CREATE INDEX idx_bizum_requests_recipient ON bizum_requests(recipient_phone, status);

-- Seeds STG — RN-F022-01/02 compliant
INSERT INTO bizum_activations (id, user_id, account_id, phone, status, gdpr_consent_at, activated_at)
SELECT gen_random_uuid(), u.id, a.id, '+34612345678', 'ACTIVE', NOW(), NOW()
FROM users u JOIN accounts a ON a.user_id = u.id
WHERE u.email = 'a.delacuadra@nemtec.es' AND a.type = 'CORRIENTE'
LIMIT 1
ON CONFLICT (phone) DO NOTHING;
