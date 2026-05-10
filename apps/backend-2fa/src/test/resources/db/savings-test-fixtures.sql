-- Fixture idempotente para ITs Savings (FEAT-024 Sprint 26)
-- Inserta user + account + balance con UUIDs fijos NO conflictivos con Bizum (..0099/..0199)
-- ni con seeds existentes.
-- Saldo 10000.00 EUR para permitir reservas hasta target_amount=500000 con multiples allocations.

INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000299',
    'savings_test_user',
    'savings.test@integration.local',
    '$2a$10$dummyhashforintegrationtestonly0000000000000000000000',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Segundo user para tests de ownership (403)
INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000399',
    'savings_test_user_other',
    'savings.other@integration.local',
    '$2a$10$dummyhashforintegrationtestonly0000000000000000000000',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (id, user_id, alias, iban, type, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000299',
    '00000000-0000-0000-0000-000000000299',
    'Cuenta Test Savings',
    'ES9121000418450200052999',
    'CORRIENTE',
    'ACTIVE',
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (id, user_id, alias, iban, type, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000399',
    '00000000-0000-0000-0000-000000000399',
    'Cuenta Test Savings Other',
    'ES9121000418450200053999',
    'CORRIENTE',
    'ACTIVE',
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO account_balances (account_id, available_balance, retained_balance, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000299',
    10000.00,
    0.00,
    NOW()
) ON CONFLICT (account_id) DO UPDATE
    SET available_balance = 10000.00,
        retained_balance = 0.00,
        updated_at = NOW();

INSERT INTO account_balances (account_id, available_balance, retained_balance, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000399',
    5000.00,
    0.00,
    NOW()
) ON CONFLICT (account_id) DO UPDATE
    SET available_balance = 5000.00,
        retained_balance = 0.00,
        updated_at = NOW();
