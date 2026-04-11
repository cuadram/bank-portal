-- =============================================================
-- SEED: Datos de prueba FEAT-017 — Domiciliaciones SEPA DD
-- BankPortal STG · Sprint 19 · v1.19.0
-- Usuario: a.delacuadra@nemtec.es
-- SOFIA v2.2 · 2026-03-27
-- =============================================================

BEGIN;

-- ── MANDATOS SEPA DD ─────────────────────────────────────────
INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref, mandate_type, status, signed_at, created_at, updated_at)
SELECT
    '10000001-0000-0000-0000-000000000001',
    'acc00000-0000-0000-0000-000000000001',
    u.id,
    'Endesa Energía SAU',
    'ES8000492352082414205416',
    'BNK-A1B2C3-1700000001',
    'CORE',
    'ACTIVE',
    CURRENT_DATE - INTERVAL '5 months',
    NOW() - INTERVAL '5 months',
    NOW() - INTERVAL '5 months'
FROM users u WHERE u.email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref, mandate_type, status, signed_at, created_at, updated_at)
SELECT
    '10000001-0000-0000-0000-000000000002',
    'acc00000-0000-0000-0000-000000000001',
    u.id,
    'Movistar España SL',
    'ES3500817615983596416154',
    'BNK-A1B2C3-1700000002',
    'CORE',
    'ACTIVE',
    CURRENT_DATE - INTERVAL '4 months',
    NOW() - INTERVAL '4 months',
    NOW() - INTERVAL '4 months'
FROM users u WHERE u.email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref, mandate_type, status, signed_at, created_at, updated_at)
SELECT
    '10000001-0000-0000-0000-000000000003',
    'acc00000-0000-0000-0000-000000000001',
    u.id,
    'Canal Isabel II',
    'ES7900491682692912741176',
    'BNK-A1B2C3-1700000003',
    'CORE',
    'ACTIVE',
    CURRENT_DATE - INTERVAL '6 months',
    NOW() - INTERVAL '6 months',
    NOW() - INTERVAL '6 months'
FROM users u WHERE u.email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref, mandate_type, status, signed_at, created_at, updated_at)
SELECT
    '10000001-0000-0000-0000-000000000004',
    'acc00000-0000-0000-0000-000000000001',
    u.id,
    'Netflix International BV',
    'NL62ABNA0651413499',
    'BNK-A1B2C3-1700000004',
    'CORE',
    'ACTIVE',
    CURRENT_DATE - INTERVAL '12 months',
    NOW() - INTERVAL '12 months',
    NOW() - INTERVAL '12 months'
FROM users u WHERE u.email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref, mandate_type, status, signed_at, cancelled_at, created_at, updated_at)
SELECT
    '10000001-0000-0000-0000-000000000005',
    'acc00000-0000-0000-0000-000000000001',
    u.id,
    'Gym Holmes Place Madrid',
    'ES9121000418450200051111',
    'BNK-A1B2C3-1700000005',
    'CORE',
    'CANCELLED',
    CURRENT_DATE - INTERVAL '8 months',
    CURRENT_DATE - INTERVAL '1 month',
    NOW() - INTERVAL '8 months',
    NOW() - INTERVAL '1 month'
FROM users u WHERE u.email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref, mandate_type, status, signed_at, created_at, updated_at)
SELECT
    '10000001-0000-0000-0000-000000000006',
    'acc00000-0000-0000-0000-000000000001',
    u.id,
    'Mapfre Seguros Generales',
    'ES4000491500051234567892',
    'BNK-A1B2C3-1700000006',
    'CORE',
    'ACTIVE',
    CURRENT_DATE - INTERVAL '2 months',
    NOW() - INTERVAL '2 months',
    NOW() - INTERVAL '2 months'
FROM users u WHERE u.email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

-- ── RECIBOS DOMICILIADOS (direct_debits) ─────────────────────
-- Endesa — 5 meses de recibos
INSERT INTO direct_debits (id, mandate_id, amount, currency, status, due_date, charged_at, created_at)
VALUES
    ('20000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', 62.40, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '5 months', NOW() - INTERVAL '5 months' + INTERVAL '1 day', NOW() - INTERVAL '5 months'),
    ('20000001-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000001', 71.80, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '4 months', NOW() - INTERVAL '4 months' + INTERVAL '1 day', NOW() - INTERVAL '4 months'),
    ('20000001-0000-0000-0000-000000000003', '10000001-0000-0000-0000-000000000001', 88.40, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '3 months', NOW() - INTERVAL '3 months' + INTERVAL '1 day', NOW() - INTERVAL '3 months'),
    ('20000001-0000-0000-0000-000000000004', '10000001-0000-0000-0000-000000000001', 94.20, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '2 months', NOW() - INTERVAL '2 months' + INTERVAL '1 day', NOW() - INTERVAL '2 months'),
    ('20000001-0000-0000-0000-000000000005', '10000001-0000-0000-0000-000000000001', 78.30, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '1 month',  NOW() - INTERVAL '1 month'  + INTERVAL '1 day', NOW() - INTERVAL '1 month'),
    ('20000001-0000-0000-0000-000000000006', '10000001-0000-0000-0000-000000000001', 68.90, 'EUR', 'PENDING', CURRENT_DATE + INTERVAL '5 days',   NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Movistar — 4 meses cobrados + 1 pendiente
INSERT INTO direct_debits (id, mandate_id, amount, currency, status, due_date, charged_at, created_at)
VALUES
    ('20000002-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '4 months', NOW() - INTERVAL '4 months' + INTERVAL '1 day', NOW() - INTERVAL '4 months'),
    ('20000002-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '3 months', NOW() - INTERVAL '3 months' + INTERVAL '1 day', NOW() - INTERVAL '3 months'),
    ('20000002-0000-0000-0000-000000000003', '10000001-0000-0000-0000-000000000002', 52.40, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '2 months', NOW() - INTERVAL '2 months' + INTERVAL '1 day', NOW() - INTERVAL '2 months'),
    ('20000002-0000-0000-0000-000000000004', '10000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '1 month',  NOW() - INTERVAL '1 month'  + INTERVAL '1 day', NOW() - INTERVAL '1 month'),
    ('20000002-0000-0000-0000-000000000005', '10000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'PENDING', CURRENT_DATE + INTERVAL '8 days',   NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Canal Isabel II — trimestral, 1 devuelto
INSERT INTO direct_debits (id, mandate_id, amount, currency, status, due_date, charged_at, return_reason, created_at)
VALUES
    ('20000003-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000003', 38.70, 'EUR', 'CHARGED',  CURRENT_DATE - INTERVAL '6 months', NOW() - INTERVAL '6 months' + INTERVAL '1 day', NULL, NOW() - INTERVAL '6 months'),
    ('20000003-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000003', 41.20, 'EUR', 'RETURNED', CURRENT_DATE - INTERVAL '3 months', NULL, 'AM04', NOW() - INTERVAL '3 months'),
    ('20000003-0000-0000-0000-000000000003', '10000001-0000-0000-0000-000000000003', 42.15, 'EUR', 'PENDING',  CURRENT_DATE + INTERVAL '8 days',   NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Netflix — mensual 12 meses
INSERT INTO direct_debits (id, mandate_id, amount, currency, status, due_date, charged_at, created_at)
VALUES
    ('20000004-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '11 months', NOW() - INTERVAL '11 months' + INTERVAL '1 day', NOW() - INTERVAL '11 months'),
    ('20000004-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '10 months', NOW() - INTERVAL '10 months' + INTERVAL '1 day', NOW() - INTERVAL '10 months'),
    ('20000004-0000-0000-0000-000000000003', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '9 months',  NOW() - INTERVAL '9 months'  + INTERVAL '1 day', NOW() - INTERVAL '9 months'),
    ('20000004-0000-0000-0000-000000000004', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '8 months',  NOW() - INTERVAL '8 months'  + INTERVAL '1 day', NOW() - INTERVAL '8 months'),
    ('20000004-0000-0000-0000-000000000005', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '7 months',  NOW() - INTERVAL '7 months'  + INTERVAL '1 day', NOW() - INTERVAL '7 months'),
    ('20000004-0000-0000-0000-000000000006', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '6 months',  NOW() - INTERVAL '6 months'  + INTERVAL '1 day', NOW() - INTERVAL '6 months'),
    ('20000004-0000-0000-0000-000000000007', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '5 months',  NOW() - INTERVAL '5 months'  + INTERVAL '1 day', NOW() - INTERVAL '5 months'),
    ('20000004-0000-0000-0000-000000000008', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '4 months',  NOW() - INTERVAL '4 months'  + INTERVAL '1 day', NOW() - INTERVAL '4 months'),
    ('20000004-0000-0000-0000-000000000009', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '3 months',  NOW() - INTERVAL '3 months'  + INTERVAL '1 day', NOW() - INTERVAL '3 months'),
    ('20000004-0000-0000-0000-000000000010', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '2 months',  NOW() - INTERVAL '2 months'  + INTERVAL '1 day', NOW() - INTERVAL '2 months'),
    ('20000004-0000-0000-0000-000000000011', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE - INTERVAL '1 month',   NOW() - INTERVAL '1 month'   + INTERVAL '1 day', NOW() - INTERVAL '1 month'),
    ('20000004-0000-0000-0000-000000000012', '10000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'PENDING', CURRENT_DATE + INTERVAL '3 days',    NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Mapfre — anual
INSERT INTO direct_debits (id, mandate_id, amount, currency, status, due_date, charged_at, created_at)
VALUES
    ('20000006-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000006', 180.00, 'EUR', 'PENDING', CURRENT_DATE + INTERVAL '45 days', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- ── VERIFICACIÓN ──────────────────────────────────────────────
SELECT 'MANDATOS' AS tipo, status, COUNT(*) AS total
FROM debit_mandates
WHERE user_id = (SELECT id FROM users WHERE email = 'a.delacuadra@nemtec.es')
GROUP BY status
UNION ALL
SELECT 'RECIBOS', status, COUNT(*)
FROM direct_debits
WHERE mandate_id IN (
    SELECT id FROM debit_mandates
    WHERE user_id = (SELECT id FROM users WHERE email = 'a.delacuadra@nemtec.es')
)
GROUP BY status
ORDER BY 1, 2;

COMMIT;
