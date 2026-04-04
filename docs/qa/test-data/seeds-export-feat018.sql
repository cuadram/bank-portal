-- =============================================================
-- seeds-export-feat018.sql
-- Datos de prueba para FEAT-018: Exportacion de movimientos PDF/CSV
-- BankPortal · Banco Meridian · Sprint 20 · v1.20.0
-- SOFIA v2.3 · QA Agent
-- Ejecutar: psql -h localhost -p 5433 -U bankportal -d bankportal -f seeds-export-feat018.sql
-- =============================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────
-- 0. LIMPIEZA PREVIA (idempotente)
-- ──────────────────────────────────────────────────────────────
DELETE FROM export_audit_log WHERE user_id IN (
    SELECT id FROM users WHERE username IN ('test.export.user', 'test.export.lite')
);
DELETE FROM transactions WHERE account_id IN (
    SELECT a.id FROM accounts a
    JOIN users u ON u.id = a.user_id
    WHERE u.username IN ('test.export.user', 'test.export.lite')
);
DELETE FROM account_balances WHERE account_id IN (
    SELECT a.id FROM accounts a
    JOIN users u ON u.id = a.user_id
    WHERE u.username IN ('test.export.user', 'test.export.lite')
);
DELETE FROM accounts WHERE user_id IN (
    SELECT id FROM users WHERE username IN ('test.export.user', 'test.export.lite')
);
DELETE FROM users WHERE username IN ('test.export.user', 'test.export.lite');

-- ──────────────────────────────────────────────────────────────
-- 1. USUARIOS DE PRUEBA
--    password: Test1234! (BCrypt $2a$10$ precomputado)
-- ──────────────────────────────────────────────────────────────
INSERT INTO users (id, username, email, password_hash)
VALUES
  -- Usuario principal: volumen alto de movimientos
  ('a1b2c3d4-0001-0001-0001-000000000001',
   'test.export.user',
   'test.export@meridian-test.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lsiO'),

  -- Usuario light: solo 5 movimientos (test aislamiento y rango vacio)
  ('a1b2c3d4-0002-0002-0002-000000000002',
   'test.export.lite',
   'test.lite@meridian-test.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lsiO');

-- ──────────────────────────────────────────────────────────────
-- 2. CUENTAS
-- ──────────────────────────────────────────────────────────────
INSERT INTO accounts (id, user_id, alias, iban, type, status)
VALUES
  -- Usuario principal: cuenta nomina (fuente principal de transacciones)
  ('b1000000-0001-0001-0001-000000000001',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'Cuenta Nomina TEST',
   'ES7621000813610123456789',
   'NOMINA', 'ACTIVE'),

  -- Usuario principal: cuenta ahorro (sin transacciones — test export vacio)
  ('b1000000-0001-0001-0001-000000000002',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'Cuenta Ahorro TEST',
   'ES9121000813610123456790',
   'AHORRO', 'ACTIVE'),

  -- Usuario lite: cuenta corriente
  ('b2000000-0002-0002-0002-000000000001',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'Cuenta Corriente LITE',
   'ES3000491500051234567892',
   'CORRIENTE', 'ACTIVE');

-- ──────────────────────────────────────────────────────────────
-- 3. SALDOS
-- ──────────────────────────────────────────────────────────────
INSERT INTO account_balances (account_id, available_balance, retained_balance)
VALUES
  ('b1000000-0001-0001-0001-000000000001',  4827.35,  250.00),
  ('b1000000-0001-0001-0001-000000000002', 12540.00,    0.00),
  ('b2000000-0002-0002-0002-000000000001',   320.15,    0.00);

-- ──────────────────────────────────────────────────────────────
-- 4. TRANSACCIONES — Cuenta Nomina Principal
--    Cubre todos los tipoMovimiento del ExportRequest:
--    TODOS | TRANSFERENCIA_EMITIDA | TRANSFERENCIA_RECIBIDA |
--    DOMICILIACION | PAGO_TARJETA | INGRESO | COMISION
--    Rango: oct-2025 a mar-2026 (6 meses)
-- ──────────────────────────────────────────────────────────────

-- ── MARZO 2026 (19 movimientos) ──────────────────────────────
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type) VALUES
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-28 08:00:00', 'INGRESO NOMINA MARZO EXPERIS SPAIN SL', 2850.00, 5200.00, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-27 10:15:00', 'BIZUM RECIBIDO DE CARLOS MARTINEZ', 50.00, 2350.00, 'TRANSFERENCIA_RECIBIDA', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-26 09:00:00', 'DOMICILIACION HIPOTECA BANKINTER MES MARZO', -892.50, 2300.00, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-25 14:22:00', 'COMPRA TPV AMAZON ES MADRID', -67.99, 3192.50, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-24 11:00:00', 'RECIBO DOMICILIADO IBERDROLA LUZ MARZO', -124.30, 3260.49, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-23 16:30:00', 'TRANSFERENCIA EMITIDA LUCIA GARCIA GARCIA', -200.00, 3384.79, 'TRANSFERENCIA_EMITIDA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-22 09:45:00', 'COMPRA TPV MERCADONA S.A. MADRID', -89.45, 3584.79, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-21 18:00:00', 'RECIBO DOMICILIADO ENDESA GAS MARZO', -54.80, 3674.24, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-20 12:00:00', 'COMISION MANTENIMIENTO CUENTA TRIMESTRAL', -9.00, 3729.04, 'COMISION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-18 10:10:00', 'COMPRA TPV ZARA ONLINE ARTEIXO', -79.90, 3738.04, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-17 09:00:00', 'RECIBO DOMICILIADO VODAFONE MOVIL MARZO', -42.90, 3817.94, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-15 15:00:00', 'TRANSFERENCIA RECIBIDA DEVOLUCION HACIENDA IRPF', 1230.00, 3860.84, 'TRANSFERENCIA_RECIBIDA', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-14 11:30:00', 'COMPRA TPV EL CORTE INGLES MADRID', -154.00, 2630.84, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-13 09:15:00', 'RECIBO DOMICILIADO SEGUROS MAPFRE HOGAR', -38.50, 2784.84, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-10 13:00:00', 'TRANSFERENCIA EMITIDA LAURA SANCHEZ RODRIGUEZ', -500.00, 2823.34, 'TRANSFERENCIA_EMITIDA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-08 08:00:00', 'RECIBO DOMICILIADO NETFLIX STREAMING', -17.99, 3323.34, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-05 10:00:00', 'COMPRA TPV CARREFOUR MADRID POZUELO', -112.34, 3341.33, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-03 16:00:00', 'COMISION TRANSFERENCIA INTERNACIONAL USD', -15.00, 3453.67, 'COMISION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-03-01 09:00:00', 'RECIBO DOMICILIADO COMUNIDAD PROPIETARIOS MARZO', -75.00, 3468.67, 'DOMICILIACION', 'CARGO');

-- ── FEBRERO 2026 (13 movimientos) ───────────────────────────
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type) VALUES
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-28 08:00:00', 'INGRESO NOMINA FEBRERO EXPERIS SPAIN SL', 2850.00, 3543.67, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-26 09:00:00', 'DOMICILIACION HIPOTECA BANKINTER MES FEBRERO', -892.50, 693.67, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-24 14:30:00', 'COMPRA TPV AMAZON ES MADRID', -43.50, 1586.17, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-22 11:00:00', 'RECIBO DOMICILIADO IBERDROLA LUZ FEBRERO', -108.70, 1629.67, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-20 09:00:00', 'RECIBO DOMICILIADO VODAFONE MOVIL FEBRERO', -42.90, 1738.37, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-18 17:00:00', 'TRANSFERENCIA EMITIDA JOSE LUIS PEREZ', -150.00, 1781.27, 'TRANSFERENCIA_EMITIDA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-15 10:00:00', 'BIZUM RECIBIDO DE ANA GOMEZ RUIZ', 30.00, 1931.27, 'TRANSFERENCIA_RECIBIDA', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-12 12:30:00', 'COMPRA TPV MERCADONA S.A. MADRID', -95.20, 1901.27, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-10 09:00:00', 'COMISION EMISION TARJETA DEBITO VISA', -20.00, 1996.47, 'COMISION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-08 08:00:00', 'RECIBO DOMICILIADO NETFLIX STREAMING', -17.99, 2016.47, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-05 14:00:00', 'INGRESO INTERESES CUENTA AHORRO', 12.50, 2034.46, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-03 16:00:00', 'COMPRA TPV EL CORTE INGLES MADRID', -88.00, 2021.96, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-02-01 09:00:00', 'RECIBO DOMICILIADO COMUNIDAD PROPIETARIOS FEB', -75.00, 2109.96, 'DOMICILIACION', 'CARGO');

-- ── ENERO 2026 (12 movimientos) ─────────────────────────────
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type) VALUES
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-30 08:00:00', 'INGRESO NOMINA ENERO EXPERIS SPAIN SL', 2850.00, 2184.96, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-28 09:00:00', 'DOMICILIACION HIPOTECA BANKINTER MES ENERO', -892.50, -665.04, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-25 10:00:00', 'COMPRA TPV AMAZON ES REBAJAS ENERO', -189.99, 227.46, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-22 09:00:00', 'RECIBO DOMICILIADO IBERDROLA LUZ ENERO', -131.40, 417.45, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-20 15:00:00', 'TRANSFERENCIA RECIBIDA DE MARIA LOPEZ FERNANDEZ', 300.00, 548.85, 'TRANSFERENCIA_RECIBIDA', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-18 08:00:00', 'RECIBO DOMICILIADO NETFLIX STREAMING', -17.99, 248.85, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-15 11:30:00', 'COMISION MANTENIMIENTO CUENTA TRIMESTRAL', -9.00, 266.84, 'COMISION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-12 10:00:00', 'COMPRA TPV MEDIAMARKT MADRID', -299.00, 275.84, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-10 09:00:00', 'RECIBO DOMICILIADO VODAFONE MOVIL ENERO', -42.90, 574.84, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-08 14:00:00', 'TRANSFERENCIA EMITIDA ALQUILER PISO MADRID', -850.00, 617.74, 'TRANSFERENCIA_EMITIDA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-05 09:00:00', 'RECIBO DOMICILIADO COMUNIDAD PROPIETARIOS ENE', -75.00, 1467.74, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2026-01-02 10:00:00', 'COMPRA TPV EL CORTE INGLES REBAJAS', -210.50, 1542.74, 'PAGO_TARJETA', 'CARGO');

-- ── OCTUBRE-DICIEMBRE 2025 (7 movimientos — rango historico) ─
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type) VALUES
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2025-12-31 08:00:00', 'INGRESO NOMINA DICIEMBRE EXPERIS SPAIN SL', 3100.00, 1753.24, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2025-12-28 09:00:00', 'DOMICILIACION HIPOTECA BANKINTER MES DIC', -892.50, -1346.76, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2025-12-24 12:00:00', 'COMPRA TPV AMAZON NAVIDAD', -345.78, -454.26, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2025-11-30 08:00:00', 'INGRESO NOMINA NOVIEMBRE EXPERIS SPAIN SL', 2850.00, -108.48, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2025-11-28 09:00:00', 'DOMICILIACION HIPOTECA BANKINTER MES NOV', -892.50, -2958.48, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2025-10-31 08:00:00', 'INGRESO NOMINA OCTUBRE EXPERIS SPAIN SL', 2850.00, -2065.98, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b1000000-0001-0001-0001-000000000001', '2025-10-28 09:00:00', 'DOMICILIACION HIPOTECA BANKINTER MES OCT', -892.50, -4915.98, 'DOMICILIACION', 'CARGO');

-- ──────────────────────────────────────────────────────────────
-- 5. TRANSACCIONES — Cuenta LITE (5 movimientos, otro usuario)
--    Uso: TC-014 aislamiento cuenta / TC-004 rango vacio
-- ──────────────────────────────────────────────────────────────
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type) VALUES
  (gen_random_uuid(), 'b2000000-0002-0002-0002-000000000001', '2026-03-15 10:00:00', 'INGRESO NOMINA MARZO', 1200.00, 1200.00, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b2000000-0002-0002-0002-000000000001', '2026-03-10 09:00:00', 'RECIBO DOMICILIADO ALQUILER MARZO', -650.00, 550.00, 'DOMICILIACION', 'CARGO'),
  (gen_random_uuid(), 'b2000000-0002-0002-0002-000000000001', '2026-03-05 15:30:00', 'COMPRA TPV MERCADONA BARCELONA', -52.80, 497.20, 'PAGO_TARJETA', 'CARGO'),
  (gen_random_uuid(), 'b2000000-0002-0002-0002-000000000001', '2026-02-28 08:00:00', 'INGRESO NOMINA FEBRERO', 1200.00, 550.00, 'INGRESO', 'ABONO'),
  (gen_random_uuid(), 'b2000000-0002-0002-0002-000000000001', '2026-02-25 09:00:00', 'RECIBO DOMICILIADO ALQUILER FEBRERO', -650.00, -650.00, 'DOMICILIACION', 'CARGO');

-- ──────────────────────────────────────────────────────────────
-- 6. EXPORT AUDIT LOG — entradas previas (test historial auditoria)
-- ──────────────────────────────────────────────────────────────
INSERT INTO export_audit_log
    (user_id, iban, fecha_desde, fecha_hasta, tipo_movimiento, formato, num_registros, ip_origen, hash_sha256)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001',
   'ES7621000813610123456789',
   '2026-01-01', '2026-01-31', 'TODOS', 'PDF', 12,
   '192.168.1.100',
   'a3f8c2d1e4b5a6f7c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1'),

  ('a1b2c3d4-0001-0001-0001-000000000001',
   'ES7621000813610123456789',
   '2026-02-01', '2026-02-28', 'DOMICILIACION', 'CSV', 6,
   '192.168.1.100',
   NULL);

COMMIT;

-- ──────────────────────────────────────────────────────────────
-- VERIFICACION POST-INSERT (ejecutar para confirmar seeds OK)
-- ──────────────────────────────────────────────────────────────
SELECT 'USUARIOS'      AS tabla, COUNT(*) AS total FROM users
    WHERE username IN ('test.export.user', 'test.export.lite')
UNION ALL
SELECT 'CUENTAS',       COUNT(*) FROM accounts a
    JOIN users u ON u.id = a.user_id WHERE u.username IN ('test.export.user', 'test.export.lite')
UNION ALL
SELECT 'TRANSACCIONES', COUNT(*) FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    JOIN users u ON u.id = a.user_id WHERE u.username IN ('test.export.user', 'test.export.lite')
UNION ALL
SELECT 'AUDIT_LOG_PREV', COUNT(*) FROM export_audit_log
    WHERE user_id = 'a1b2c3d4-0001-0001-0001-000000000001';

-- Resultado esperado:
--   USUARIOS        | 2
--   CUENTAS         | 3
--   TRANSACCIONES   | 56
--   AUDIT_LOG_PREV  | 2
