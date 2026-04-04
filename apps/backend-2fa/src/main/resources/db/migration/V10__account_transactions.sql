-- V10__account_transactions.sql
-- FEAT-007: Consulta de Cuentas y Movimientos
-- Sprint 9 — 2026-03-17

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensión pg_trgm para búsqueda full-text en concept (US-703)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────────────────────────────────────────
-- accounts — cuentas bancarias del usuario
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alias       VARCHAR(100) NOT NULL,
    iban        VARCHAR(34)  NOT NULL,
    type        VARCHAR(20)  NOT NULL
                             CHECK (type IN ('CORRIENTE','AHORRO','NOMINA')),
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('ACTIVE','INACTIVE','BLOCKED')),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

COMMENT ON TABLE accounts IS
    'Cuentas bancarias del usuario. Sprint 9: datos mock via Flyway. '
    'Sprint 10: poblado desde API core bancario via CoreBankingAccountAdapter.';

-- ─────────────────────────────────────────────────────────────────────────────
-- account_balances — saldos separados para actualización frecuente sin lock
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_balances (
    account_id        UUID          PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    retained_balance  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE account_balances IS
    'Saldos de cuenta separados de accounts para minimizar lock en writes frecuentes.';

-- ─────────────────────────────────────────────────────────────────────────────
-- transactions — movimientos bancarios (US-702/703/704/705)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id       UUID          NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_date TIMESTAMP     NOT NULL,
    concept          VARCHAR(500)  NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,       -- negativo=cargo, positivo=abono
    balance_after    DECIMAL(15,2) NOT NULL,
    category         VARCHAR(50)   NOT NULL DEFAULT 'OTRO',
    type             VARCHAR(20)   NOT NULL CHECK (type IN ('CARGO','ABONO')),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transactions IS
    'Movimientos bancarios. Retención indefinida (extractos). '
    'Categoría asignada lazy por TransactionCategorizationService (US-705).';

-- Índice principal: historial paginado por cuenta ordenado por fecha (US-702)
CREATE INDEX IF NOT EXISTS idx_transactions_account_date
    ON transactions(account_id, transaction_date DESC);

-- Índice full-text GIN para búsqueda por concepto (US-703)
CREATE INDEX IF NOT EXISTS idx_transactions_concept_gin
    ON transactions USING gin(concept gin_trgm_ops);

-- Índice parcial para filtro por tipo (US-702)
CREATE INDEX IF NOT EXISTS idx_transactions_account_type
    ON transactions(account_id, type, transaction_date DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Datos mock: 2 cuentas por usuario de prueba
-- Solo se insertan en entornos NO producción (perfil !production)
-- En producción los datos vienen del CoreBankingAccountAdapter (Sprint 10)
-- ─────────────────────────────────────────────────────────────────────────────

-- NOTA: Los datos mock se gestionan desde MockAccountRepositoryAdapter.java
-- mediante @Profile("!production") + @PostConstruct para evitar datos en
-- migraciones de producción. Esta migración solo crea el esquema.
