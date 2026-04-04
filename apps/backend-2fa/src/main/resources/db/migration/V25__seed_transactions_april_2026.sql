-- V25__seed_transactions_april_2026.sql
-- Seed de transacciones para el mes en curso (Abril 2026)
-- BUG-VER-003 fix: Dashboard KPIs abril = 0.00 EUR sin transacciones mes actual
-- Sprint 22 · STG-Verification · BankPortal · Banco Meridian
--
-- Cuenta corriente : acc00000-0000-0000-0000-000000000001
-- Cuenta ahorro    : acc00000-0000-0000-0000-000000000002
-- Usuario seed     : 00000000-0000-0000-0000-000000000001
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Transacciones ABONO (ingresos) ───────────────────────────────────────────
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type)
VALUES
  -- Nómina abril — Experis ManpowerGroup
  ('a2600401-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-01 08:00:00',
   'NÓMINA ABRIL EXPERIS MANPOWERGROUP',
   3750.00, 12549.89, 'NOMINA', 'ABONO'),

  -- Intereses cuenta ahorro
  ('a2600402-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000002',
   '2026-04-02 00:01:00',
   'LIQUIDACIÓN INTERESES CUENTA AHORRO',
   12.50, 12512.50, 'INTERESES', 'ABONO'),

  -- Transferencia recibida de tercero
  ('a2600415-0003-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-15 11:30:00',
   'TRANSFERENCIA RECIBIDA CARLOS MARTÍNEZ — DEVOLUCIÓN',
   150.00, 10912.51, 'TRANSFERENCIA', 'ABONO')
ON CONFLICT (id) DO NOTHING;

-- ── Transacciones CARGO (gastos) ─────────────────────────────────────────────
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type)
VALUES
  -- Cuota alquiler / hipoteca
  ('a2600401-0002-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-01 09:00:00',
   'RECIBO ALQUILER ABRIL — COMUNIDAD PROPIETARIOS',
   -850.00, 11699.89, 'HOGAR', 'CARGO'),

  -- Supermercado 1
  ('a2600403-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-03 18:45:00',
   'PAGO MERCADONA POZUELO 0342',
   -89.50, 11610.39, 'ALIMENTACION', 'CARGO'),

  -- Gasolina
  ('a2600404-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-04 07:30:00',
   'REPSOL ESTACIÓN 8043 GASOLINA',
   -65.00, 11545.39, 'TRANSPORTE', 'CARGO'),

  -- Netflix
  ('a2600405-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-05 00:00:00',
   'NETFLIX.COM SUSCRIPCIÓN MENSUAL',
   -13.99, 11531.40, 'OCIO', 'CARGO'),

  -- Luz Iberdrola
  ('a2600407-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-07 09:00:00',
   'IBERDROLA FACTURA ELECTRICIDAD ABRIL',
   -78.30, 11453.10, 'SUMINISTROS', 'CARGO'),

  -- Compras El Corte Inglés
  ('a2600409-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-09 16:20:00',
   'EL CORTE INGLÉS CASTELLANA COMPRAS',
   -45.99, 11407.11, 'COMPRAS', 'CARGO'),

  -- Supermercado 2
  ('a2600411-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-11 19:10:00',
   'PAGO MERCADONA POZUELO 0342',
   -62.15, 11344.96, 'ALIMENTACION', 'CARGO'),

  -- Spotify
  ('a2600412-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-12 00:00:00',
   'SPOTIFY PREMIUM SUSCRIPCIÓN',
   -9.99, 11334.97, 'OCIO', 'CARGO'),

  -- Restaurante
  ('a2600413-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-13 14:30:00',
   'RESTAURANTE LA TABERNA REAL COMIDA',
   -42.60, 11292.37, 'RESTAURANTES', 'CARGO'),

  -- Transporte EMT / Metro
  ('a2600414-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-14 08:00:00',
   'RECARGA TARJETA TRANSPORTE ABONO MENSUAL',
   -54.60, 11237.77, 'TRANSPORTE', 'CARGO'),

  -- Transferencia a ahorro
  ('a2600415-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-15 10:00:00',
   'TRANSFERENCIA PROPIA A CUENTA AHORRO',
   -200.00, 10887.77, 'TRANSFERENCIA', 'CARGO'),

  -- Abono de la transferencia en ahorro
  ('a2600415-0002-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000002',
   '2026-04-15 10:01:00',
   'TRANSFERENCIA RECIBIDA DESDE CUENTA CORRIENTE',
   200.00, 12712.50, 'TRANSFERENCIA', 'ABONO'),

  -- Farmacia
  ('a2600416-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-16 11:15:00',
   'FARMACIA CENTRAL MEDICAMENTOS',
   -23.45, 11038.32, 'SALUD', 'CARGO'),

  -- Agua Canal Isabel II
  ('a2600018-0001-0000-0000-000000000001',
   'acc00000-0000-0000-0000-000000000001',
   '2026-04-18 09:00:00',
   'CANAL DE ISABEL II FACTURA AGUA',
   -42.15, 10996.17, 'SUMINISTROS', 'CARGO')
ON CONFLICT (id) DO NOTHING;

-- ── Resumen esperado Abril 2026 ───────────────────────────────────────────────
-- Ingresos  : 3750.00 + 12.50 + 150.00 = 3912.50 EUR
-- Gastos    : 850.00 + 89.50 + 65.00 + 13.99 + 78.30 + 45.99 + 62.15 + 9.99
--             + 42.60 + 54.60 + 200.00 + 23.45 + 42.15 = 1577.72 EUR
-- Saldo neto: 3912.50 - 1577.72 = 2334.78 EUR
-- Transacciones totales: 15
-- ─────────────────────────────────────────────────────────────────────────────

