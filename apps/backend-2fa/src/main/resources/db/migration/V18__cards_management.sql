-- V18 — Gestión de Tarjetas (FEAT-016 Sprint 18)
-- CMMI: CM SP 1.1 · CM SP 1.2

CREATE TABLE IF NOT EXISTS cards (
    id                UUID         NOT NULL DEFAULT gen_random_uuid(),
    account_id        UUID         NOT NULL,
    user_id           UUID         NOT NULL,
    pan_masked        VARCHAR(19)  NOT NULL,
    card_type         VARCHAR(10)  NOT NULL CHECK (card_type IN ('DEBIT','CREDIT')),
    status            VARCHAR(12)  NOT NULL DEFAULT 'ACTIVE'
                                   CHECK (status IN ('ACTIVE','BLOCKED','EXPIRED','CANCELLED')),
    expiration_date   DATE         NOT NULL,
    daily_limit       NUMERIC(15,2) NOT NULL,
    monthly_limit     NUMERIC(15,2) NOT NULL,
    daily_limit_min   NUMERIC(15,2) NOT NULL,
    daily_limit_max   NUMERIC(15,2) NOT NULL,
    monthly_limit_min NUMERIC(15,2) NOT NULL,
    monthly_limit_max NUMERIC(15,2) NOT NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_cards PRIMARY KEY (id),
    CONSTRAINT fk_cards_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT fk_cards_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id    ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_cards_status     ON cards(status);

-- SeedData: 2 tarjetas por usuario de prueba
INSERT INTO cards (account_id, user_id, pan_masked, card_type, status,
    expiration_date, daily_limit, monthly_limit,
    daily_limit_min, daily_limit_max, monthly_limit_min, monthly_limit_max)
SELECT a.id, a.user_id,
    'XXXX XXXX XXXX 1234', 'DEBIT', 'ACTIVE', '2028-12-31',
    1000.00, 5000.00, 100.00, 3000.00, 500.00, 15000.00
FROM accounts a
LIMIT 1;

INSERT INTO cards (account_id, user_id, pan_masked, card_type, status,
    expiration_date, daily_limit, monthly_limit,
    daily_limit_min, daily_limit_max, monthly_limit_min, monthly_limit_max)
SELECT a.id, a.user_id,
    'XXXX XXXX XXXX 5678', 'CREDIT', 'ACTIVE', '2027-06-30',
    2000.00, 8000.00, 200.00, 5000.00, 1000.00, 20000.00
FROM accounts a
LIMIT 1;
