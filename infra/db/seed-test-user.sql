-- ============================================================
-- SEED: Usuario de prueba BankPortal STG
-- Email: a.delacuadra@nemtec.es | Password: angel123
-- Generado: 2026-03-22 | SOFIA DevOps
-- ============================================================

BEGIN;

-- ── 1. USUARIO ─────────────────────────────────────────────
INSERT INTO users (id, username, email, password_hash, two_factor_enabled, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'angel.delacuadra',
    'a.delacuadra@nemtec.es',
    '$2b$10$/5nhuMcdUtt3AMahx99oM.pjfPXTK/XtRu5Kd9OMoWrilGb8a1u7i',
    false,
    NOW() - INTERVAL '6 months',
    NOW()
) ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        updated_at    = NOW();

-- ── 2. CUENTAS ──────────────────────────────────────────────
INSERT INTO accounts (id, user_id, alias, iban, type, status, created_at)
SELECT
    '22222222-2222-2222-2222-222222222222',
    id,
    'Cuenta Corriente Nómina',
    'ES91 2100 0418 4502 0005 1332',
    'CORRIENTE',
    'ACTIVE',
    NOW() - INTERVAL '6 months'
FROM users WHERE email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (id, user_id, alias, iban, type, status, created_at)
SELECT
    '33333333-3333-3333-3333-333333333333',
    id,
    'Cuenta Ahorro Vacaciones',
    'ES80 2100 0418 4502 0005 9988',
    'AHORRO',
    'ACTIVE',
    NOW() - INTERVAL '6 months'
FROM users WHERE email = 'a.delacuadra@nemtec.es'
ON CONFLICT (id) DO NOTHING;

-- ── 3. SALDOS ───────────────────────────────────────────────
INSERT INTO account_balances (account_id, available_balance, retained_balance, updated_at)
VALUES
    ('22222222-2222-2222-2222-222222222222', 3842.50,  150.00, NOW()),
    ('33333333-3333-3333-3333-333333333333', 12500.00,   0.00, NOW())
ON CONFLICT (account_id) DO UPDATE
    SET available_balance = EXCLUDED.available_balance,
        updated_at        = NOW();

-- ── 4. LÍMITES DE TRANSFERENCIA ─────────────────────────────
INSERT INTO transfer_limits (user_id, per_operation_limit, daily_limit, monthly_limit)
SELECT id, 2000.00, 3000.00, 10000.00
FROM users WHERE email = 'a.delacuadra@nemtec.es'
ON CONFLICT (user_id) DO NOTHING;

-- ── 5. TRANSACCIONES (6 meses) ───────────────────────────────
-- Mes -5 (Oct 2025)
INSERT INTO transactions (account_id, transaction_date, concept, amount, balance_after, category, type)
VALUES
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months 25 days', 'Nomina Octubre Experis',        3200.00,  3200.00, 'OTROS',        'ABONO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months 20 days', 'Mercadona Leganes',              -89.50,  3110.50, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months 18 days', 'Alquiler Piso Octubre',         -850.00, 2260.50, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months 15 days', 'Endesa Luz Octubre',             -62.40, 2198.10, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months 12 days', 'Cabify Madrid Centro',           -12.30, 2185.80, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months 10 days', 'Spotify Premium',                -10.99, 2174.81, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months  8 days', 'El Corte Ingles Moda',          -145.00, 2029.81, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months  5 days', 'Carrefour Alcobendas',           -67.20, 1962.61, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months  3 days', 'Netflix',                        -17.99, 1944.62, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '5 months  1 day',  'Gasolinera BP Getafe',           -55.00, 1889.62, 'OTRO',         'CARGO'),
-- Mes -4 (Nov 2025)
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months 25 days', 'Nomina Noviembre Experis',      3200.00, 5089.62, 'OTROS',        'ABONO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months 22 days', 'Mercadona Leganes',              -95.30, 4994.32, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months 18 days', 'Alquiler Piso Noviembre',       -850.00, 4144.32, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months 15 days', 'Endesa Luz Noviembre',           -71.80, 4072.52, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months 12 days', 'Metro Madrid Abono',             -54.60, 4017.92, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months 10 days', 'Spotify Premium',                -10.99, 4006.93, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months  7 days', 'Zara Online',                    -79.95, 3926.98, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months  5 days', 'Lidl Leganes',                   -48.75, 3878.23, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months  3 days', 'Cines Cinesa IMAX',              -22.00, 3856.23, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '4 months  1 day',  'Amazon Prime',                   -49.90, 3806.33, 'OTRO',         'CARGO'),
-- Mes -3 (Dic 2025) — Navidad
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months 25 days', 'Nomina Diciembre Paga Extra',   6400.00,10206.33, 'OTROS',        'ABONO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months 22 days', 'Mercadona Leganes',             -142.80,10063.53, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months 20 days', 'Alquiler Piso Diciembre',       -850.00, 9213.53, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months 18 days', 'Amazon Navidad',                -320.50, 8893.03, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months 15 days', 'El Corte Ingles Regalos',       -280.00, 8613.03, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months 12 days', 'Endesa Luz Diciembre',           -88.40, 8524.63, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months 10 days', 'Spotify Premium',                -10.99, 8513.64, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months  8 days', 'Restaurante La Raza',           -195.00, 8318.64, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months  5 days', 'Renfe AVE Familia',             -156.00, 8162.64, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '3 months  2 days', 'Transfer Ahorro Navidad',      -2000.00, 6162.64, 'OTRO',         'CARGO'),
('33333333-3333-3333-3333-333333333333', NOW()-INTERVAL '3 months  2 days', 'Transferencia desde corriente',  2000.00,12000.00, 'OTRO',        'ABONO'),
-- Mes -2 (Ene 2026)
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months 25 days', 'Nomina Enero Experis',          3200.00, 9362.64, 'OTROS',        'ABONO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months 22 days', 'Mercadona Leganes',              -78.90, 9283.74, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months 18 days', 'Alquiler Piso Enero',           -850.00, 8433.74, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months 15 days', 'Endesa Luz Enero',               -94.20, 8339.54, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months 12 days', 'Gym Holmes Place',               -45.00, 8294.54, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months 10 days', 'Spotify Premium',                -10.99, 8283.55, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months  8 days', 'Netflix',                        -17.99, 8265.56, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months  5 days', 'Lidl Leganes',                   -52.40, 8213.16, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months  3 days', 'Cabify Madrid',                  -18.50, 8194.66, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '2 months  1 day',  'Amazon Prime Renovacion',        -49.90, 8144.76, 'OTRO',         'CARGO'),
-- Mes -1 (Feb 2026)
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month  25 days', 'Nomina Febrero Experis',        3200.00,11344.76, 'OTROS',        'ABONO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month  22 days', 'Mercadona Leganes',              -88.60,11256.16, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month  18 days', 'Alquiler Piso Febrero',         -850.00,10406.16, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month  15 days', 'Endesa Luz Febrero',             -78.30,10327.86, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month  12 days', 'Metro Madrid Abono',             -54.60,10273.26, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month  10 days', 'Spotify Premium',                -10.99,10262.27, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month   8 days', 'Cines Odeon Madrid',             -15.50,10246.77, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month   5 days', 'Carrefour Alcobendas',           -71.30,10175.47, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month   3 days', 'Gasolinera Repsol',              -60.00,10115.47, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '1 month   1 day',  'Vueling Vuelo Semana Santa',    -220.00, 9895.47, 'OTRO',         'CARGO'),
-- Mes actual (Mar 2026)
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '20 days', 'Nomina Marzo Experis',               3200.00,13095.47, 'OTROS',        'ABONO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '18 days', 'Mercadona Leganes',                    -92.40,13003.07, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '15 days', 'Alquiler Piso Marzo',                -850.00,12153.07, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '12 days', 'Endesa Luz Marzo',                    -68.90,12084.17, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL '10 days', 'Metro Madrid Abono',                  -54.60,12029.57, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL  '8 days', 'Spotify Premium',                     -10.99,12018.58, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL  '6 days', 'Amazon Compra Tecnica',              -189.99,11828.59, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL  '4 days', 'Lidl Leganes',                        -55.80,11772.79, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL  '2 days', 'Cabify Aeropuerto',                   -32.50,11740.29, 'OTRO',         'CARGO'),
('22222222-2222-2222-2222-222222222222', NOW()-INTERVAL  '1 day',  'Netflix',                             -17.99,11722.30, 'OTRO',         'CARGO');

-- ── 6. BENEFICIARIOS ─────────────────────────────────────────
INSERT INTO beneficiaries (id, user_id, alias, iban, holder_name, created_at)
SELECT gen_random_uuid(), id, 'Maria Garcia (hermana)', 'ES7921000813610123456789', 'Maria Garcia Lopez',        NOW()-INTERVAL '4 months' FROM users WHERE email = 'a.delacuadra@nemtec.es' ON CONFLICT DO NOTHING;
INSERT INTO beneficiaries (id, user_id, alias, iban, holder_name, created_at)
SELECT gen_random_uuid(), id, 'Carlos (amigo piso)',    'ES2100490001512100012345', 'Carlos Martinez Ruiz',      NOW()-INTERVAL '3 months' FROM users WHERE email = 'a.delacuadra@nemtec.es' ON CONFLICT DO NOTHING;
INSERT INTO beneficiaries (id, user_id, alias, iban, holder_name, created_at)
SELECT gen_random_uuid(), id, 'Comunidad Propietarios','ES6100750001996001008375', 'Comunidad Propietarios C/ Alcala 42', NOW()-INTERVAL '5 months' FROM users WHERE email = 'a.delacuadra@nemtec.es' ON CONFLICT DO NOTHING;

-- ── 7. TRANSFERENCIAS ────────────────────────────────────────
INSERT INTO transfers (user_id, source_account, beneficiary_id, amount, concept, status, executed_at, created_at)
SELECT u.id,'22222222-2222-2222-2222-222222222222',b.id, 250.00,'Parte alquiler enero',  'COMPLETED', NOW()-INTERVAL '2 months 5 days', NOW()-INTERVAL '2 months 5 days'
FROM users u JOIN beneficiaries b ON b.user_id=u.id AND b.alias='Carlos (amigo piso)' WHERE u.email='a.delacuadra@nemtec.es';

INSERT INTO transfers (user_id, source_account, beneficiary_id, amount, concept, status, executed_at, created_at)
SELECT u.id,'22222222-2222-2222-2222-222222222222',b.id, 150.00,'Cumpleanos mama regalo','COMPLETED', NOW()-INTERVAL '1 month 10 days', NOW()-INTERVAL '1 month 10 days'
FROM users u JOIN beneficiaries b ON b.user_id=u.id AND b.alias='Maria Garcia (hermana)' WHERE u.email='a.delacuadra@nemtec.es';

-- ── 8. RECIBOS PENDIENTES ────────────────────────────────────
INSERT INTO bills (user_id, issuer, concept, amount, due_date, status, created_at)
SELECT id, 'Endesa',          'Factura Luz Abril 2026',        75.40, CURRENT_DATE+15, 'PENDING', NOW() FROM users WHERE email='a.delacuadra@nemtec.es';
INSERT INTO bills (user_id, issuer, concept, amount, due_date, status, created_at)
SELECT id, 'Movistar',        'Factura Telefono Abril 2026',   49.90, CURRENT_DATE+20, 'PENDING', NOW() FROM users WHERE email='a.delacuadra@nemtec.es';
INSERT INTO bills (user_id, issuer, concept, amount, due_date, status, created_at)
SELECT id, 'Vodafone',        'Factura Fibra Abril 2026',      35.00, CURRENT_DATE+22, 'PENDING', NOW() FROM users WHERE email='a.delacuadra@nemtec.es';
INSERT INTO bills (user_id, issuer, concept, amount, due_date, status, created_at)
SELECT id, 'Canal Isabel II', 'Agua 1er trimestre 2026',       42.15, CURRENT_DATE+8,  'PENDING', NOW() FROM users WHERE email='a.delacuadra@nemtec.es';
INSERT INTO bills (user_id, issuer, concept, amount, due_date, status, created_at)
SELECT id, 'Mapfre',          'Seguro Hogar Anual',           180.00, CURRENT_DATE+45, 'PENDING', NOW() FROM users WHERE email='a.delacuadra@nemtec.es';

-- ── 9. SPENDING CATEGORIES (cache dashboard mes actual) ──────
INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
SELECT u.id, TO_CHAR(NOW(),'YYYY-MM'), 'ALIMENTACION', 248.20, 3, NOW() FROM users u WHERE u.email='a.delacuadra@nemtec.es' ON CONFLICT (user_id,period,category) DO UPDATE SET amount=EXCLUDED.amount, tx_count=EXCLUDED.tx_count;
INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
SELECT u.id, TO_CHAR(NOW(),'YYYY-MM'), 'SERVICIOS',    918.90, 2, NOW() FROM users u WHERE u.email='a.delacuadra@nemtec.es' ON CONFLICT (user_id,period,category) DO UPDATE SET amount=EXCLUDED.amount, tx_count=EXCLUDED.tx_count;
INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
SELECT u.id, TO_CHAR(NOW(),'YYYY-MM'), 'TRANSPORTE',    87.10, 2, NOW() FROM users u WHERE u.email='a.delacuadra@nemtec.es' ON CONFLICT (user_id,period,category) DO UPDATE SET amount=EXCLUDED.amount, tx_count=EXCLUDED.tx_count;
INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
SELECT u.id, TO_CHAR(NOW(),'YYYY-MM'), 'OCIO',          28.98, 2, NOW() FROM users u WHERE u.email='a.delacuadra@nemtec.es' ON CONFLICT (user_id,period,category) DO UPDATE SET amount=EXCLUDED.amount, tx_count=EXCLUDED.tx_count;
INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
SELECT u.id, TO_CHAR(NOW(),'YYYY-MM'), 'OTROS',        189.99, 1, NOW() FROM users u WHERE u.email='a.delacuadra@nemtec.es' ON CONFLICT (user_id,period,category) DO UPDATE SET amount=EXCLUDED.amount, tx_count=EXCLUDED.tx_count;

-- ── 10. VERIFICACION ─────────────────────────────────────────
SELECT 'USUARIO'        AS tipo, email                  AS detalle, id::text AS valor FROM users WHERE email='a.delacuadra@nemtec.es'
UNION ALL
SELECT 'CUENTA',        alias,                          id::text FROM accounts WHERE user_id=(SELECT id FROM users WHERE email='a.delacuadra@nemtec.es')
UNION ALL
SELECT 'SALDO',         a.alias,                        ab.available_balance::text FROM account_balances ab JOIN accounts a ON a.id=ab.account_id WHERE a.user_id=(SELECT id FROM users WHERE email='a.delacuadra@nemtec.es')
UNION ALL
SELECT 'TRANSACCIONES', 'Total movimientos',            COUNT(*)::text FROM transactions WHERE account_id IN (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE email='a.delacuadra@nemtec.es'))
UNION ALL
SELECT 'BILLS',         'Recibos PENDING',              COUNT(*)::text FROM bills WHERE user_id=(SELECT id FROM users WHERE email='a.delacuadra@nemtec.es') AND status='PENDING'
UNION ALL
SELECT 'BENEFICIARIOS', 'Total activos',                COUNT(*)::text FROM beneficiaries WHERE user_id=(SELECT id FROM users WHERE email='a.delacuadra@nemtec.es') AND deleted_at IS NULL
UNION ALL
SELECT 'CATEGORIAS',    'Categorias mes actual',        COUNT(*)::text FROM spending_categories WHERE user_id=(SELECT id FROM users WHERE email='a.delacuadra@nemtec.es') AND period=TO_CHAR(NOW(),'YYYY-MM');

COMMIT;
