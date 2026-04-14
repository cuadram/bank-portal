-- Fixture idempotente para ITs Bizum — inserta usuario + cuenta con UUIDs fijos
-- Evita FK violations en bizum_payments, bizum_activations, bizum_requests
-- Los ITs deben usar TEST_USER_ID / TEST_ACCOUNT_ID de BizumIntegrationTestBase

INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000099',
    'bizum_test_user',
    'bizum.test@integration.local',
    '$2a$10$dummyhashforintegrationtestonly0000000000000000000000',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (id, user_id, alias, iban, type, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000199',
    '00000000-0000-0000-0000-000000000099',
    'Cuenta Test Bizum',
    'ES9121000418450200051332',
    'CORRIENTE',
    'ACTIVE',
    NOW()
) ON CONFLICT (id) DO NOTHING;
