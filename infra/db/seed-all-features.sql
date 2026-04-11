-- =============================================================
-- SEED COMPLETO — BankPortal STG v1.19.0
-- Todas las funcionalidades S1–S19
-- Usuario: a.delacuadra@nemtec.es
-- USER_ID   : 00000000-0000-0000-0000-000000000001
-- ACCOUNT_C : acc00000-0000-0000-0000-000000000001  ← alias, ver abajo
-- ACCOUNT_A : acc00000-0000-0000-0000-000000000002  ← alias, ver abajo
-- SOFIA v2.2 · 2026-03-27
-- =============================================================

BEGIN;

-- IDs reales obtenidos de la BD:
-- Cuenta Corriente : acc00000-0000-0000-0000-000000000001
-- Cuenta Ahorro    : acc00000-0000-0000-0000-000000000002

-- ════════════════════════════════════════════════════════════
-- PERFIL DE USUARIO
-- ════════════════════════════════════════════════════════════
INSERT INTO user_profiles (id, user_id, phone, street, city, postal_code, country, updated_at)
VALUES (
    'a0000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '+34 612 345 678', 'Calle Alcalá 42, 3ºB', 'Madrid', '28014', 'ES', NOW()
) ON CONFLICT (user_id) DO UPDATE
    SET phone=EXCLUDED.phone, street=EXCLUDED.street, city=EXCLUDED.city,
        postal_code=EXCLUDED.postal_code, updated_at=NOW();

-- ════════════════════════════════════════════════════════════
-- TARJETAS (FEAT-016)
-- ════════════════════════════════════════════════════════════
INSERT INTO cards (id, account_id, user_id, pan_masked, card_type, status, expiration_date,
    daily_limit, monthly_limit, daily_limit_min, daily_limit_max, monthly_limit_min, monthly_limit_max,
    created_at, updated_at)
VALUES
    ('ca000001-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     '**** **** **** 4521', 'DEBIT', 'ACTIVE', '2028-12-31',
     600.00, 3000.00, 10.00, 2000.00, 100.00, 6000.00,
     NOW()-INTERVAL '2 years', NOW()),
    ('ca000001-0000-0000-0000-000000000002',
     'acc00000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     '**** **** **** 8834', 'CREDIT', 'ACTIVE', '2027-06-30',
     1500.00, 5000.00, 100.00, 3000.00, 500.00, 10000.00,
     NOW()-INTERVAL '1 year', NOW()),
    ('ca000001-0000-0000-0000-000000000003',
     'acc00000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     '**** **** **** 2267', 'DEBIT', 'BLOCKED', '2026-09-30',
     300.00, 1500.00, 10.00, 1000.00, 100.00, 3000.00,
     NOW()-INTERVAL '3 years', NOW())
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- BENEFICIARIOS (FEAT-008)
-- ════════════════════════════════════════════════════════════
INSERT INTO beneficiaries (id, user_id, alias, iban, holder_name, created_at)
VALUES
    ('be000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'María García (hermana)',  'ES7921000813610123456789', 'María García López',        NOW()-INTERVAL '4 months'),
    ('be000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'Carlos (piso)',           'ES2100490001512100012345', 'Carlos Martínez Ruiz',      NOW()-INTERVAL '3 months'),
    ('be000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'Comunidad Propietarios',  'ES6100750001996001008375', 'Comunidad C/ Alcalá 42',   NOW()-INTERVAL '5 months'),
    ('be000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
     'Papás',                   'ES9000246912501234567891', 'Antonio de la Cuadra',     NOW()-INTERVAL '2 months'),
    ('be000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
     'Hacienda AEAT',           'ES5000491500051234567892', 'Agencia Tributaria',       NOW()-INTERVAL '6 months')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- TRANSFERENCIAS EJECUTADAS (FEAT-008)
-- ════════════════════════════════════════════════════════════
INSERT INTO transfers (id, user_id, source_account, beneficiary_id, amount, concept, status, executed_at, created_at)
VALUES
    ('ef000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001', 'be000001-0000-0000-0000-000000000002',
     250.00, 'Parte alquiler enero', 'COMPLETED', NOW()-INTERVAL '2 months 5 days', NOW()-INTERVAL '2 months 5 days'),
    ('ef000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001', 'be000001-0000-0000-0000-000000000001',
     150.00, 'Cumpleaños mamá regalo', 'COMPLETED', NOW()-INTERVAL '1 month 10 days', NOW()-INTERVAL '1 month 10 days'),
    ('ef000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001', 'be000001-0000-0000-0000-000000000003',
     89.50, 'Cuota comunidad marzo', 'COMPLETED', NOW()-INTERVAL '15 days', NOW()-INTERVAL '15 days'),
    ('ef000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001', 'be000001-0000-0000-0000-000000000004',
     500.00, 'Ayuda reforma cocina', 'COMPLETED', NOW()-INTERVAL '3 months', NOW()-INTERVAL '3 months'),
    ('ef000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001', 'be000001-0000-0000-0000-000000000002',
     300.00, 'Parte alquiler febrero', 'COMPLETED', NOW()-INTERVAL '1 month 5 days', NOW()-INTERVAL '1 month 5 days'),
    ('ef000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001', 'be000001-0000-0000-0000-000000000005',
     1245.80, 'Pago IRPF 2025', 'COMPLETED', NOW()-INTERVAL '45 days', NOW()-INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- TRANSFERENCIAS PROGRAMADAS (FEAT-015)
-- ════════════════════════════════════════════════════════════
INSERT INTO scheduled_transfers (id, user_id, source_account_id, destination_iban, destination_account_name,
    amount, currency, concept, type, status, scheduled_date, next_execution_date, end_date,
    max_executions, executions_count, created_at, updated_at)
VALUES
    ('5c000001-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001',
     'ES2100490001512100012345', 'Carlos Martínez Ruiz',
     300.00, 'EUR', 'Parte alquiler mensual', 'MONTHLY', 'ACTIVE',
     (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days')::date,
     (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '4 days')::date,
     '2027-12-31', NULL, 3, NOW()-INTERVAL '3 months', NOW()),
    ('5c000001-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001',
     'ES9121000418450200051332', 'Ángel de la Cuadra Ahorro',
     200.00, 'EUR', 'Ahorro mensual automático', 'MONTHLY', 'ACTIVE',
     (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '27 days')::date,
     (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '27 days')::date,
     NULL, NULL, 5, NOW()-INTERVAL '5 months', NOW()),
    ('5c000001-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001',
     'ES4000491500051234567892', 'Mapfre Seguros',
     420.00, 'EUR', 'Seguro coche anual', 'ONCE', 'ACTIVE',
     (CURRENT_DATE + INTERVAL '20 days')::date,
     (CURRENT_DATE + INTERVAL '20 days')::date,
     NULL, 1, 0, NOW()-INTERVAL '10 days', NOW()),
    ('5c000001-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000001',
     'acc00000-0000-0000-0000-000000000001',
     'ES9000246912501234567891', 'Antonio de la Cuadra',
     100.00, 'EUR', 'Ayuda mensual padres', 'MONTHLY', 'PAUSED',
     (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days')::date,
     (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '14 days')::date,
     NULL, NULL, 2, NOW()-INTERVAL '2 months', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO scheduled_transfer_executions (id, scheduled_transfer_id, scheduled_date, amount, status, executed_at)
VALUES
    ('4e000001-0000-0000-0000-000000000001', '5c000001-0000-0000-0000-000000000001', CURRENT_DATE-INTERVAL '3 months', 300.00, 'SUCCESS', NOW()-INTERVAL '3 months'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000002', '5c000001-0000-0000-0000-000000000001', CURRENT_DATE-INTERVAL '2 months', 300.00, 'SUCCESS', NOW()-INTERVAL '2 months'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000003', '5c000001-0000-0000-0000-000000000001', CURRENT_DATE-INTERVAL '1 month',  300.00, 'SUCCESS', NOW()-INTERVAL '1 month'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000004', '5c000001-0000-0000-0000-000000000002', CURRENT_DATE-INTERVAL '5 months', 200.00, 'SUCCESS', NOW()-INTERVAL '5 months'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000005', '5c000001-0000-0000-0000-000000000002', CURRENT_DATE-INTERVAL '4 months', 200.00, 'SUCCESS', NOW()-INTERVAL '4 months'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000006', '5c000001-0000-0000-0000-000000000002', CURRENT_DATE-INTERVAL '3 months', 200.00, 'SUCCESS', NOW()-INTERVAL '3 months'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000007', '5c000001-0000-0000-0000-000000000002', CURRENT_DATE-INTERVAL '2 months', 200.00, 'FAILED_RETRYING', NOW()-INTERVAL '2 months'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000008', '5c000001-0000-0000-0000-000000000002', CURRENT_DATE-INTERVAL '1 month',  200.00, 'SUCCESS', NOW()-INTERVAL '1 month'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000009', '5c000001-0000-0000-0000-000000000004', CURRENT_DATE-INTERVAL '2 months', 100.00, 'SUCCESS', NOW()-INTERVAL '2 months'+INTERVAL '1 hour'),
    ('4e000001-0000-0000-0000-000000000010', '5c000001-0000-0000-0000-000000000004', CURRENT_DATE-INTERVAL '1 month',  100.00, 'SUCCESS', NOW()-INTERVAL '1 month'+INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- DOMICILIACIONES SEPA DD (FEAT-017)
-- ════════════════════════════════════════════════════════════
DELETE FROM direct_debits WHERE mandate_id IN (SELECT id FROM debit_mandates WHERE user_id='00000000-0000-0000-0000-000000000001');
DELETE FROM debit_mandates WHERE user_id='00000000-0000-0000-0000-000000000001';

INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref, mandate_type, status, signed_at, created_at, updated_at)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Endesa Energía SAU',       'ES8000492352082414205416', 'BNK-A1B2C3-1700000001', 'CORE', 'ACTIVE',    CURRENT_DATE-INTERVAL '5 months',  NOW()-INTERVAL '5 months',  NOW()),
    ('d0000001-0000-0000-0000-000000000002', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Movistar España SL',       'ES3500817615983596416154', 'BNK-A1B2C3-1700000002', 'CORE', 'ACTIVE',    CURRENT_DATE-INTERVAL '4 months',  NOW()-INTERVAL '4 months',  NOW()),
    ('d0000001-0000-0000-0000-000000000003', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Canal Isabel II',          'ES7900491682692912741176', 'BNK-A1B2C3-1700000003', 'CORE', 'ACTIVE',    CURRENT_DATE-INTERVAL '6 months',  NOW()-INTERVAL '6 months',  NOW()),
    ('d0000001-0000-0000-0000-000000000004', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Netflix International BV', 'NL62ABNA0651413499',       'BNK-A1B2C3-1700000004', 'CORE', 'ACTIVE',    CURRENT_DATE-INTERVAL '12 months', NOW()-INTERVAL '12 months', NOW()),
    ('d0000001-0000-0000-0000-000000000005', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Gym Holmes Place Madrid',  'ES9121000418450200051111', 'BNK-A1B2C3-1700000005', 'CORE', 'CANCELLED', CURRENT_DATE-INTERVAL '8 months',  NOW()-INTERVAL '8 months',  NOW()-INTERVAL '1 month'),
    ('d0000001-0000-0000-0000-000000000006', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'Mapfre Seguros Generales', 'ES4000491500051234567892', 'BNK-A1B2C3-1700000006', 'CORE', 'ACTIVE',    CURRENT_DATE-INTERVAL '2 months',  NOW()-INTERVAL '2 months',  NOW())
ON CONFLICT (id) DO NOTHING;

UPDATE debit_mandates SET cancelled_at = CURRENT_DATE-INTERVAL '1 month'
WHERE id = 'd0000001-0000-0000-0000-000000000005';

INSERT INTO direct_debits (id, mandate_id, amount, currency, status, due_date, charged_at, return_reason, created_at) VALUES
    ('dd000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 62.40, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '5 months', NOW()-INTERVAL '5 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '5 months'),
    ('dd000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001', 71.80, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '4 months', NOW()-INTERVAL '4 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '4 months'),
    ('dd000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001', 88.40, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '3 months', NOW()-INTERVAL '3 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '3 months'),
    ('dd000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001', 94.20, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '2 months', NOW()-INTERVAL '2 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '2 months'),
    ('dd000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001', 78.30, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '1 month',  NOW()-INTERVAL '1 month'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '1 month'),
    ('dd000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000001', 68.90, 'EUR', 'PENDING', CURRENT_DATE+INTERVAL '5 days',   NULL, NULL, NOW()),
    ('dd000002-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '4 months', NOW()-INTERVAL '4 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '4 months'),
    ('dd000002-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '3 months', NOW()-INTERVAL '3 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '3 months'),
    ('dd000002-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000002', 52.40, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '2 months', NOW()-INTERVAL '2 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '2 months'),
    ('dd000002-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '1 month',  NOW()-INTERVAL '1 month'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '1 month'),
    ('dd000002-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000002', 49.90, 'EUR', 'PENDING', CURRENT_DATE+INTERVAL '8 days',   NULL, NULL, NOW()),
    ('dd000003-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000003', 38.70, 'EUR', 'CHARGED',  CURRENT_DATE-INTERVAL '6 months', NOW()-INTERVAL '6 months'+INTERVAL '1 day', NULL,   NOW()-INTERVAL '6 months'),
    ('dd000003-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000003', 41.20, 'EUR', 'RETURNED', CURRENT_DATE-INTERVAL '3 months', NULL, 'AM04', NOW()-INTERVAL '3 months'),
    ('dd000003-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000003', 42.15, 'EUR', 'PENDING',  CURRENT_DATE+INTERVAL '8 days',   NULL, NULL,   NOW()),
    ('dd000004-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '11 months', NOW()-INTERVAL '11 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '11 months'),
    ('dd000004-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '10 months', NOW()-INTERVAL '10 months'+INTERVAL '1 day', NULL, NOW()-INTERVAL '10 months'),
    ('dd000004-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '9 months',  NOW()-INTERVAL '9 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '9 months'),
    ('dd000004-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '8 months',  NOW()-INTERVAL '8 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '8 months'),
    ('dd000004-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '7 months',  NOW()-INTERVAL '7 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '7 months'),
    ('dd000004-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '6 months',  NOW()-INTERVAL '6 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '6 months'),
    ('dd000004-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '5 months',  NOW()-INTERVAL '5 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '5 months'),
    ('dd000004-0000-0000-0000-000000000008', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '4 months',  NOW()-INTERVAL '4 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '4 months'),
    ('dd000004-0000-0000-0000-000000000009', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '3 months',  NOW()-INTERVAL '3 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '3 months'),
    ('dd000004-0000-0000-0000-000000000010', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '2 months',  NOW()-INTERVAL '2 months'+INTERVAL '1 day',  NULL, NOW()-INTERVAL '2 months'),
    ('dd000004-0000-0000-0000-000000000011', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'CHARGED', CURRENT_DATE-INTERVAL '1 month',   NOW()-INTERVAL '1 month'+INTERVAL '1 day',   NULL, NOW()-INTERVAL '1 month'),
    ('dd000004-0000-0000-0000-000000000012', 'd0000001-0000-0000-0000-000000000004', 17.99, 'EUR', 'PENDING', CURRENT_DATE+INTERVAL '3 days',    NULL, NULL, NOW()),
    ('dd000006-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000006', 180.00,'EUR', 'PENDING', CURRENT_DATE+INTERVAL '45 days',   NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- RECIBOS (FEAT-012)
-- ════════════════════════════════════════════════════════════
DELETE FROM bills WHERE user_id = '00000000-0000-0000-0000-000000000001';
INSERT INTO bills (user_id, issuer, concept, amount, due_date, status, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Endesa',          'Factura Luz Abril 2026',         75.40, CURRENT_DATE+15, 'PENDING', NOW()),
    ('00000000-0000-0000-0000-000000000001', 'Movistar',        'Factura Teléfono Abril 2026',    49.90, CURRENT_DATE+20, 'PENDING', NOW()),
    ('00000000-0000-0000-0000-000000000001', 'Vodafone',        'Factura Fibra Abril 2026',       35.00, CURRENT_DATE+22, 'PENDING', NOW()),
    ('00000000-0000-0000-0000-000000000001', 'Canal Isabel II', 'Agua 1er trimestre 2026',        42.15, CURRENT_DATE+8,  'PENDING', NOW()),
    ('00000000-0000-0000-0000-000000000001', 'Mapfre',          'Seguro Hogar Anual 2026',       180.00, CURRENT_DATE+45, 'PENDING', NOW()),
    ('00000000-0000-0000-0000-000000000001', 'Amazon',          'Amazon Prime Renovación',        49.90, CURRENT_DATE+30, 'PENDING', NOW()),
    ('00000000-0000-0000-0000-000000000001', 'Endesa',          'Factura Luz Marzo 2026',         68.90, CURRENT_DATE-5,  'PAID',    NOW()-INTERVAL '5 days'),
    ('00000000-0000-0000-0000-000000000001', 'Movistar',        'Factura Teléfono Marzo 2026',    49.90, CURRENT_DATE-10, 'PAID',    NOW()-INTERVAL '10 days'),
    ('00000000-0000-0000-0000-000000000001', 'Comunidad',       'Cuota Comunidad Propietarios',   89.50, CURRENT_DATE-2,  'PENDING', NOW()-INTERVAL '32 days');

-- ════════════════════════════════════════════════════════════
-- DASHBOARD — budget_alerts y spending_categories (FEAT-011)
-- ════════════════════════════════════════════════════════════
DELETE FROM budget_alerts    WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM spending_categories WHERE user_id = '00000000-0000-0000-0000-000000000001';
INSERT INTO budget_alerts (user_id, period, monthly_budget, threshold_pct, current_amount, triggered_at, notified)
VALUES
    ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW(),'YYYY-MM'), 2000.00, 80, 1723.50, NOW()-INTERVAL '3 days', true),
    ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW()-INTERVAL '1 month','YYYY-MM'), 1850.00, 75, 1620.30, NOW()-INTERVAL '35 days', true)
ON CONFLICT (user_id, period) DO UPDATE
    SET monthly_budget=EXCLUDED.monthly_budget, current_amount=EXCLUDED.current_amount, notified=EXCLUDED.notified;

INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW(),'YYYY-MM'), 'ALIMENTACION', 248.20, 4, NOW()),
    ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW(),'YYYY-MM'), 'SERVICIOS',    918.90, 5, NOW()),
    ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW(),'YYYY-MM'), 'TRANSPORTE',    87.10, 3, NOW()),
    ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW(),'YYYY-MM'), 'OCIO',          45.98, 2, NOW()),
    ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW(),'YYYY-MM'), 'OTROS',        423.32, 4, NOW())
ON CONFLICT (user_id, period, category) DO UPDATE SET amount=EXCLUDED.amount, tx_count=EXCLUDED.tx_count;

-- ════════════════════════════════════════════════════════════
-- NOTIFICACIONES (FEAT-009)
-- ════════════════════════════════════════════════════════════
DELETE FROM user_notifications WHERE user_id = '00000000-0000-0000-0000-000000000001';
INSERT INTO user_notifications (id, user_id, event_type, title, body, action_url, read_at, unusual_location, category, severity, created_at)
VALUES
    ('9f000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TRANSFER_COMPLETED',
     'Transferencia enviada', 'Has enviado 300,00 € a Carlos Martínez', '/transfers',
     NOW()-INTERVAL '5 days', false, 'TRANSACTIONS', 'INFO', NOW()-INTERVAL '5 days'),
    ('9f000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'BILL_DUE_SOON',
     'Recibo próximo a vencer', 'Canal Isabel II vence en 8 días — 42,15 €', '/bills',
     NULL, false, 'BILLS', 'WARNING', NOW()-INTERVAL '2 hours'),
    ('9f000001-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'BUDGET_ALERT',
     'Alerta de presupuesto', 'Has superado el 80% de tu presupuesto mensual', '/dashboard',
     NULL, false, 'BUDGET', 'WARNING', NOW()-INTERVAL '3 days'),
    ('9f000001-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'MANDATE_CREATED',
     'Nueva domiciliación activa', 'Domiciliación con Endesa Energía activada', '/direct-debits',
     NOW()-INTERVAL '20 days', false, 'MANDATES', 'INFO', NOW()-INTERVAL '5 months'),
    ('9f000001-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'DEBIT_CHARGED',
     'Recibo domiciliado cobrado', 'Endesa Energía ha cargado 78,30 € en tu cuenta', '/direct-debits',
     NOW()-INTERVAL '1 month'+INTERVAL '2 days', false, 'MANDATES', 'INFO', NOW()-INTERVAL '1 month'+INTERVAL '1 day'),
    ('9f000001-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'DEBIT_RETURNED',
     'Recibo devuelto', 'Canal Isabel II (41,20 €) fue devuelto. Código: AM04', '/direct-debits',
     NULL, false, 'MANDATES', 'ERROR', NOW()-INTERVAL '3 months'+INTERVAL '2 days'),
    ('9f000001-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'LOGIN_SUCCESS',
     'Inicio de sesión', 'Acceso desde Madrid — Safari/macOS', NULL,
     NOW()-INTERVAL '1 hour', false, 'SECURITY', 'INFO', NOW()-INTERVAL '1 hour'),
    ('9f000001-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'SCHEDULED_EXECUTED',
     'Transferencia programada ejecutada', 'Se han enviado 300,00 € a Carlos (alquiler)', '/transfers/scheduled',
     NOW()-INTERVAL '25 days', false, 'TRANSACTIONS', 'INFO', NOW()-INTERVAL '1 month'+INTERVAL '1 day'),
    ('9f000001-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'CARD_BLOCKED',
     'Tarjeta bloqueada', 'Tu tarjeta *2267 ha sido bloqueada a tu solicitud', '/cards',
     NOW()-INTERVAL '10 days', false, 'SECURITY', 'WARNING', NOW()-INTERVAL '10 days'),
    ('9f000001-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'BILL_OVERDUE',
     'Recibo vencido', 'Cuota Comunidad de Propietarios vencida — 89,50 €', '/bills',
     NULL, false, 'BILLS', 'ERROR', NOW()-INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- KYC (FEAT-015)
-- ════════════════════════════════════════════════════════════
INSERT INTO kyc_verifications (id, user_id, status, submitted_at, reviewed_at, created_at, updated_at)
VALUES (
    'fc000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'APPROVED',
    NOW()-INTERVAL '6 months',
    NOW()-INTERVAL '6 months'+INTERVAL '4 hours',
    NOW()-INTERVAL '6 months',
    NOW()-INTERVAL '6 months'+INTERVAL '4 hours'
) ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- DISPOSITIVOS DE CONFIANZA (FEAT-005)
-- ════════════════════════════════════════════════════════════
DELETE FROM trusted_devices WHERE user_id = '00000000-0000-0000-0000-000000000001';
INSERT INTO trusted_devices (id, user_id, token_hash, device_fingerprint_hash, device_os, device_browser,
    ip_masked, created_at, last_used_at, expires_at)
VALUES
    ('de000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'fp001macbookprom3aabbccdd00112233',
     'macOS 15.3', 'Safari 26.3', '81.46.***.***',
     NOW()-INTERVAL '2 months', NOW()-INTERVAL '1 hour', NOW()+INTERVAL '28 days'),
    ('de000001-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
     'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7', 'fp002iphone15aabbccdd00112233445',
     'iOS 18.3', 'Safari Mobile 18', '81.46.***.***',
     NOW()-INTERVAL '1 month', NOW()-INTERVAL '2 days', NOW()+INTERVAL '29 days')
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ════════════════════════════════════════════════════════════
SELECT tabla, COUNT(*) AS registros FROM (
    SELECT 'cards'                AS tabla FROM cards              WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'beneficiaries'               FROM beneficiaries        WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'transfers'                   FROM transfers            WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'scheduled_transfers'         FROM scheduled_transfers  WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'bills'                       FROM bills                WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'debit_mandates'              FROM debit_mandates       WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'direct_debits'              FROM direct_debits WHERE mandate_id IN
        (SELECT id FROM debit_mandates WHERE user_id='00000000-0000-0000-0000-000000000001') UNION ALL
    SELECT 'user_notifications'          FROM user_notifications   WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'trusted_devices'             FROM trusted_devices      WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'budget_alerts'               FROM budget_alerts        WHERE user_id='00000000-0000-0000-0000-000000000001' UNION ALL
    SELECT 'kyc_verifications'           FROM kyc_verifications    WHERE user_id='00000000-0000-0000-0000-000000000001'
) t GROUP BY tabla ORDER BY tabla;

COMMIT;
