-- ============================================================================
-- V30__seed_test_dataset_complete.sql
-- Juego de datos completo de prueba — todas las funcionalidades S1–S26
-- BankPortal · Banco Meridian · Sprint 26 · v1.26.0
-- SOFIA v2.7 · Generado por Claude · 2026-05-04
-- ============================================================================
--
-- USUARIOS:
--   PRINCIPAL : a.delacuadra@nemtec.es      · UUID 00000000-0000-0000-0000-000000000001
--               password: angel123 (hash bcrypt mantenido del seed previo)
--   SECUNDARIO: maria.garcia@nemtec.es      · UUID 00000000-0000-0000-0000-000000000002
--               password: maria123
--   SECUNDARIO: carlos.martinez@nemtec.es   · UUID 00000000-0000-0000-0000-000000000003
--               password: carlos123 (KYC PENDING — caso límite)
--
-- CUENTAS PRINCIPAL (a.delacuadra):
--   Corriente : acc00000-0000-0000-0000-000000000001  ES91 2100 0418 4502 0005 1332
--   Ahorro    : acc00000-0000-0000-0000-000000000002  ES76 2077 0024 0031 0257 5766
--
-- IDEMPOTENCIA: todos los INSERT usan ON CONFLICT DO NOTHING o equivalentes.
-- COMPATIBILIDAD: respeta seeds previos V18 (cards), V24 (loans), V25 (txs abr),
--                 V26 (deposits), V27 (bizum), V28 (pfm rules).
-- GUARD ENTORNO: aborta si la app está en perfil 'production'.
-- ============================================================================

-- ── 0. Guard de entorno (no ejecutar en producción) ─────────────────────────
DO $$
DECLARE
  v_env TEXT;
BEGIN
  v_env := current_setting('bankportal.environment', true);
  IF v_env = 'production' THEN
    RAISE EXCEPTION 'V30 seed dataset NO debe ejecutarse en producción (env=%)', v_env;
  END IF;
END $$;

-- ============================================================================
-- 1. USUARIOS
-- ============================================================================
-- Hash bcrypt $2b$10$... — passwords:
--   angel123  -> $2b$10$/5nhuMcdUtt3AMahx99oM.pjfPXTK/XtRu5Kd9OMoWrilGb8a1u7i
--   maria123  -> $2b$10$JZlQkqhP2wKlD3R0xR5oVuB.rW3FN2dF0xN5kT9YJ8mP7kQ3vC5Hu
--   carlos123 -> $2b$10$Hk7sP2N9wBxGqJ4zL3vCm.mF8rT1yE5oN7kV2bX4dQ8hP6jR9cU3y

INSERT INTO users (id, username, email, password_hash, two_factor_enabled, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'angel.delacuadra',
   'a.delacuadra@nemtec.es',
   '$2b$10$/5nhuMcdUtt3AMahx99oM.pjfPXTK/XtRu5Kd9OMoWrilGb8a1u7i',
   FALSE,
   NOW() - INTERVAL '12 months', NOW()),
  ('00000000-0000-0000-0000-000000000002',
   'maria.garcia',
   'maria.garcia@nemtec.es',
   '$2b$10$JZlQkqhP2wKlD3R0xR5oVuB.rW3FN2dF0xN5kT9YJ8mP7kQ3vC5Hu',
   FALSE,
   NOW() - INTERVAL '8 months', NOW()),
  ('00000000-0000-0000-0000-000000000003',
   'carlos.martinez',
   'carlos.martinez@nemtec.es',
   '$2b$10$Hk7sP2N9wBxGqJ4zL3vCm.mF8rT1yE5oN7kV2bX4dQ8hP6jR9cU3y',
   FALSE,
   NOW() - INTERVAL '3 months', NOW())
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      updated_at    = NOW();

-- ============================================================================
-- 2. PERFILES DE USUARIO (FEAT-012)
-- ============================================================================
INSERT INTO user_profiles (user_id, phone, street, city, postal_code, country, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '+34612345678', 'Calle Alcalá 42', 'Madrid', '28014', 'ES', NOW()),
  ('00000000-0000-0000-0000-000000000002', '+34622334455', 'Av. Diagonal 200', 'Barcelona', '08018', 'ES', NOW()),
  ('00000000-0000-0000-0000-000000000003', '+34633445566', 'Calle Sierpes 15', 'Sevilla', '41004', 'ES', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Preferencias de notificación
INSERT INTO user_notification_preferences (user_id, event_type, enabled, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'EMAIL_LOGIN',         TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'EMAIL_TRANSFER',      TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'PUSH_BUDGET_ALERT',   TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'PUSH_GOAL_MILESTONE', TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'EMAIL_MARKETING',     FALSE, NOW())
ON CONFLICT (user_id, event_type) DO NOTHING;

-- Histórico de contraseñas (últimas 3 — RN-F012-03)
INSERT INTO password_history (user_id, password_hash, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '$2b$10$old1HashPwdHistoryEntry00000000000000000000000000000000', NOW() - INTERVAL '6 months'),
  ('00000000-0000-0000-0000-000000000001', '$2b$10$old2HashPwdHistoryEntry11111111111111111111111111111111', NOW() - INTERVAL '3 months')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. KYC (FEAT-013)
-- ============================================================================
INSERT INTO kyc_verifications (id, user_id, status, submitted_at, reviewed_at, created_at, updated_at) VALUES
  ('a2000000-0000-0000-0000-00000000a201', '00000000-0000-0000-0000-000000000001', 'APPROVED',
   NOW() - INTERVAL '11 months', NOW() - INTERVAL '11 months' + INTERVAL '2 days',
   NOW() - INTERVAL '11 months', NOW() - INTERVAL '11 months' + INTERVAL '2 days'),
  ('a2000000-0000-0000-0000-00000000a202', '00000000-0000-0000-0000-000000000002', 'APPROVED',
   NOW() - INTERVAL '7 months',  NOW() - INTERVAL '7 months'  + INTERVAL '1 day',
   NOW() - INTERVAL '7 months',  NOW() - INTERVAL '7 months'  + INTERVAL '1 day'),
  ('a2000000-0000-0000-0000-00000000a203', '00000000-0000-0000-0000-000000000003', 'PENDING',
   NOW() - INTERVAL '5 days', NULL,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (user_id) DO NOTHING;

-- Documentos: resolvemos kyc_id desde user_id para tolerar kyc_verifications preexistentes
INSERT INTO kyc_documents (kyc_id, document_type, side, file_path, file_hash, expires_at, validation_status, uploaded_at)
SELECT kv.id, 'DNI', 'FRONT', '/data/kyc/00000001/dni-front.enc', 'sha256:aabbcc1122', '2030-01-15', 'VALID', NOW() - INTERVAL '11 months'
FROM kyc_verifications kv WHERE kv.user_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (kyc_id, document_type, side) DO NOTHING;
INSERT INTO kyc_documents (kyc_id, document_type, side, file_path, file_hash, expires_at, validation_status, uploaded_at)
SELECT kv.id, 'DNI', 'BACK',  '/data/kyc/00000001/dni-back.enc',  'sha256:ddee5566', '2030-01-15', 'VALID', NOW() - INTERVAL '11 months'
FROM kyc_verifications kv WHERE kv.user_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (kyc_id, document_type, side) DO NOTHING;
INSERT INTO kyc_documents (kyc_id, document_type, side, file_path, file_hash, expires_at, validation_status, uploaded_at)
SELECT kv.id, 'DNI', 'FRONT', '/data/kyc/00000002/dni-front.enc', 'sha256:1122aabb', '2031-06-20', 'VALID', NOW() - INTERVAL '7 months'
FROM kyc_verifications kv WHERE kv.user_id = '00000000-0000-0000-0000-000000000002'
ON CONFLICT (kyc_id, document_type, side) DO NOTHING;
INSERT INTO kyc_documents (kyc_id, document_type, side, file_path, file_hash, expires_at, validation_status, uploaded_at)
SELECT kv.id, 'DNI', 'FRONT', '/data/kyc/00000003/dni-front.enc', 'sha256:99887766', NULL, 'PENDING', NOW() - INTERVAL '5 days'
FROM kyc_verifications kv WHERE kv.user_id = '00000000-0000-0000-0000-000000000003'
ON CONFLICT (kyc_id, document_type, side) DO NOTHING;

-- ============================================================================
-- 4. CUENTAS Y SALDOS (FEAT-007)
-- ============================================================================
INSERT INTO accounts (id, user_id, alias, iban, type, status, created_at) VALUES
  -- Principal
  ('acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Cuenta Corriente Nómina',  'ES9121000418450200051332', 'CORRIENTE', 'ACTIVE',   NOW() - INTERVAL '12 months'),
  ('acc00000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Cuenta Ahorro Vacaciones', 'ES7620770024003102575766', 'AHORRO',    'ACTIVE',   NOW() - INTERVAL '12 months'),
  -- Maria
  ('acc00000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Cuenta Nómina Maria',      'ES2100750047960010083751', 'CORRIENTE', 'ACTIVE',   NOW() - INTERVAL '8 months'),
  -- Carlos (cuenta inactiva — caso límite)
  ('acc00000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Cuenta Carlos',            'ES1700810081810001234567', 'CORRIENTE', 'INACTIVE', NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

INSERT INTO account_balances (account_id, available_balance, retained_balance, updated_at) VALUES
  ('acc00000-0000-0000-0000-000000000001', 12343.63,  250.00, NOW()),
  ('acc00000-0000-0000-0000-000000000002', 14000.00,    0.00, NOW()),
  ('acc00000-0000-0000-0000-000000000003',  4128.30,    0.00, NOW()),
  ('acc00000-0000-0000-0000-000000000004',     0.00,    0.00, NOW())
ON CONFLICT (account_id) DO UPDATE
  SET available_balance = EXCLUDED.available_balance,
      retained_balance  = EXCLUDED.retained_balance,
      updated_at        = NOW();

-- Límites de transferencia
INSERT INTO transfer_limits (user_id, per_operation_limit, daily_limit, monthly_limit) VALUES
  ('00000000-0000-0000-0000-000000000001', 2000.00, 3000.00, 10000.00),
  ('00000000-0000-0000-0000-000000000002', 1500.00, 2500.00,  8000.00),
  ('00000000-0000-0000-0000-000000000003', 1000.00, 1500.00,  5000.00)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 5. TRANSACCIONES (FEAT-007) — histórico ene-mar 2026 + complemento abril
--    NOTA: V25 ya insertó parte del histórico de abril 2026; V30 añade meses
--          previos + algunos extras para cubrir todas las categorías PFM.
-- ============================================================================
INSERT INTO transactions (id, account_id, transaction_date, concept, amount, balance_after, category, type) VALUES
  ('a2600000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '0 days 8 hours 0 minutes', 'NÓMINA EXPERIS MANPOWERGROUP', 3750.00, 8750.00, 'NOMINA', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000002', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '4 days 9 hours 0 minutes', 'RECIBO ALQUILER COMUNIDAD', -850.00, 7900.00, 'HOGAR', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000003', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '7 days 18 hours 30 minutes', 'PAGO MERCADONA POZUELO', -89.50, 7810.50, 'ALIMENTACION', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000004', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '9 days 10 hours 0 minutes', 'IBERDROLA LUZ', -71.80, 7738.70, 'SUMINISTROS', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000005', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '11 days 14 hours 20 minutes', 'MOVISTAR FIBRA+MOVIL', -49.90, 7688.80, 'COMUNICACIONES', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000006', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '14 days 13 hours 0 minutes', 'GLOVO PEDIDO RESTAURANTE', -22.50, 7666.30, 'RESTAURANTES', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000007', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '17 days 19 hours 15 minutes', 'CABIFY MADRID CENTRO', -12.30, 7654.00, 'TRANSPORTE', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000008', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '19 days 11 hours 0 minutes', 'FARMACIA LA PAZ', -18.75, 7635.25, 'SALUD', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000009', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '24 days 17 hours 40 minutes', 'IKEA ALCORCÓN MOBILIARIO', -245.00, 7390.25, 'HOGAR', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000000a', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '27 days 22 hours 0 minutes', 'SPOTIFY PREMIUM', -10.99, 7379.26, 'OCIO', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000000b', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '27 days 12 hours 0 minutes', 'TRASPASO A AHORRO M-3', -500.00, 6879.26, 'TRANSFERENCIAS', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000000c', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '0 days 8 hours 0 minutes', 'NÓMINA EXPERIS MANPOWERGROUP', 3750.00, 10629.26, 'NOMINA', 'ABONO'),
  ('a2600000-0000-0000-0000-00000000000d', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '4 days 9 hours 0 minutes', 'RECIBO ALQUILER COMUNIDAD', -850.00, 9779.26, 'HOGAR', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000000e', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '7 days 18 hours 30 minutes', 'CARREFOUR ALCOBENDAS', -78.40, 9700.86, 'ALIMENTACION', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000000f', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '9 days 10 hours 0 minutes', 'NATURGY GAS', -45.20, 9655.66, 'SUMINISTROS', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000010', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '11 days 14 hours 20 minutes', 'VODAFONE FACTURA', -39.90, 9615.76, 'COMUNICACIONES', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000011', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '13 days 21 hours 0 minutes', 'RESTAURANTE LA RAZA SEVILLA', -120.00, 9495.76, 'RESTAURANTES', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000012', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '15 days 9 hours 30 minutes', 'RENFE AVE MADRID-SEVILLA', -156.00, 9339.76, 'TRANSPORTE', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000013', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '19 days 11 hours 0 minutes', 'CLINICA DENTAL REVISIÓN', -85.00, 9254.76, 'SALUD', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000014', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '24 days 17 hours 0 minutes', 'NETFLIX', -17.99, 9236.77, 'OCIO', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000015', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '27 days 12 hours 0 minutes', 'MAPFRE SEGURO COCHE', -180.00, 9056.77, 'SEGUROS', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000016', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '26 days 12 hours 0 minutes', 'TRASPASO A AHORRO M-2', -500.00, 8556.77, 'TRANSFERENCIAS', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000017', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '0 days 8 hours 0 minutes', 'NÓMINA EXPERIS MANPOWERGROUP', 3750.00, 12306.77, 'NOMINA', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000018', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '4 days 9 hours 0 minutes', 'RECIBO ALQUILER COMUNIDAD', -850.00, 11456.77, 'HOGAR', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000019', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '7 days 18 hours 30 minutes', 'LIDL LEGANÉS', -55.80, 11400.97, 'ALIMENTACION', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000001a', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '9 days 10 hours 0 minutes', 'ENDESA LUZ', -68.90, 11332.07, 'SUMINISTROS', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000001b', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '11 days 12 hours 0 minutes', 'MOVISTAR FIBRA+MOVIL', -49.90, 11282.17, 'COMUNICACIONES', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000001c', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '14 days 21 hours 0 minutes', 'TELEPIZZA MADRID', -28.50, 11253.67, 'RESTAURANTES', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000001d', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '17 days 9 hours 0 minutes', 'GASOLINERA REPSOL', -65.00, 11188.67, 'TRANSPORTE', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000001e', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '19 days 11 hours 0 minutes', 'LEROY MERLIN MADRID', -120.00, 11068.67, 'HOGAR', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000001f', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '21 days 16 hours 0 minutes', 'BOOKING HOTEL VALENCIA', -250.00, 10818.67, 'VIAJES', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000020', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '27 days 22 hours 0 minutes', 'AMAZON PRIME RENOVACIÓN', -49.90, 10768.77, 'OCIO', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000021', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '26 days 12 hours 0 minutes', 'TRASPASO A AHORRO M-1', -500.00, 10268.77, 'TRANSFERENCIAS', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000022', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '0 days 8 hours 0 minutes', 'NÓMINA EXPERIS MANPOWERGROUP', 3750.00, 14018.77, 'NOMINA', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000023', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '0 days 9 hours 0 minutes', 'RECIBO ALQUILER COMUNIDAD', -850.00, 13168.77, 'HOGAR', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000024', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '1 days 10 hours 30 minutes', 'IBERDROLA LUZ', -75.40, 13093.37, 'SUMINISTROS', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000025', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '1 days 13 hours 45 minutes', 'PAGO MERCADONA POZUELO', -94.30, 12999.07, 'ALIMENTACION', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000026', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '1 days 18 hours 0 minutes', 'MOVISTAR FIBRA+MOVIL', -49.90, 12949.17, 'COMUNICACIONES', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000027', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '2 days 11 hours 0 minutes', 'BIZUM RECIBIDO MARIA', 30.00, 12979.17, 'TRANSFERENCIAS', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000028', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '2 days 14 hours 20 minutes', 'GLOVO PEDIDO RESTAURANTE', -28.50, 12950.67, 'RESTAURANTES', 'CARGO'),
  ('a2600000-0000-0000-0000-000000000029', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '2 days 16 hours 40 minutes', 'GASOLINERA REPSOL', -65.00, 12885.67, 'TRANSPORTE', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000002a', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '3 days 8 hours 15 minutes', 'CABIFY MADRID', -12.30, 12873.37, 'TRANSPORTE', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000002b', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '3 days 9 hours 30 minutes', 'FARMACIA LA PAZ', -18.75, 12854.62, 'SALUD', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000002c', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '3 days 12 hours 0 minutes', 'SPOTIFY PREMIUM', -10.99, 12843.63, 'OCIO', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000002d', 'acc00000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()) + INTERVAL '3 days 12 hours 1 minutes', 'TRASPASO A AHORRO MES ACTUAL', -500.00, 12343.63, 'TRANSFERENCIAS', 'CARGO'),
  ('a2600000-0000-0000-0000-00000000002e', 'acc00000-0000-0000-0000-000000000002', DATE_TRUNC('month', NOW() - INTERVAL '3 months') + INTERVAL '27 days 12 hours 0 minutes', 'TRASPASO DESDE CORRIENTE', 500.00, 12500.00, 'TRANSFERENCIAS', 'ABONO'),
  ('a2600000-0000-0000-0000-00000000002f', 'acc00000-0000-0000-0000-000000000002', DATE_TRUNC('month', NOW() - INTERVAL '2 months') + INTERVAL '26 days 12 hours 0 minutes', 'TRASPASO DESDE CORRIENTE', 500.00, 13000.00, 'TRANSFERENCIAS', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000030', 'acc00000-0000-0000-0000-000000000002', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '26 days 12 hours 0 minutes', 'TRASPASO DESDE CORRIENTE', 500.00, 13500.00, 'TRANSFERENCIAS', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000031', 'acc00000-0000-0000-0000-000000000002', DATE_TRUNC('month', NOW()) + INTERVAL '3 days 12 hours 1 minutes', 'TRASPASO DESDE CORRIENTE AHORRO MES ACTUAL', 500.00, 14000.00, 'TRANSFERENCIAS', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000032', 'acc00000-0000-0000-0000-000000000003', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '0 days 8 hours 0 minutes', 'NÓMINA TECH SOLUTIONS', 2900.00, 4078.30, 'NOMINA', 'ABONO'),
  ('a2600000-0000-0000-0000-000000000033', 'acc00000-0000-0000-0000-000000000003', DATE_TRUNC('month', NOW() - INTERVAL '1 months') + INTERVAL '14 days 18 hours 0 minutes', 'BIZUM RECIBIDO ANGEL DE LA CUADRA', 50.00, 4128.30, 'TRANSFERENCIAS', 'ABONO')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. BENEFICIARIOS (FEAT-008)
-- ============================================================================
INSERT INTO beneficiaries (id, user_id, alias, iban, holder_name, created_at) VALUES
  ('b0000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-000000000001', 'Maria García V30',           'ES8420770024003102575799', 'María García López',                  NOW() - INTERVAL '8 months'),
  ('b0000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-000000000001', 'Carlos Martínez V30',        'ES8500810081810001234588', 'Carlos Martínez Ruiz',                NOW() - INTERVAL '6 months'),
  ('b0000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-000000000001', 'Comunidad V30',              'ES8800750001996001008300', 'Comunidad Propietarios C/ Alcalá 42', NOW() - INTERVAL '12 months'),
  ('b0000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-000000000002', 'Ángel V30',                  'ES9020770024003102575700', 'Ángel de la Cuadra Martín',           NOW() - INTERVAL '8 months')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. TRANSFERENCIAS EJECUTADAS (FEAT-008)
-- ============================================================================
INSERT INTO transfers (id, user_id, source_account, beneficiary_id, amount, concept, status, executed_at, created_at) VALUES
  ('7a000000-0000-0000-0000-000000007a01', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000b001', 150.00, 'Cumpleaños mamá',         'COMPLETED', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
  ('7a000000-0000-0000-0000-000000007a02', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000b002', 300.00, 'Devolución cena',         'COMPLETED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('7a000000-0000-0000-0000-000000007a03', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000b003',  85.00, 'Comunidad mes',           'PENDING',   NULL,                       NOW() - INTERVAL '1 day'),
  ('7a000000-0000-0000-0000-000000007a04', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000b001', 100.00, 'Cumpleaños primo',        'FAILED',    NULL,                       NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. TRANSFERENCIAS PROGRAMADAS (FEAT-015)
-- ============================================================================
INSERT INTO scheduled_transfers (id, user_id, source_account_id, destination_iban, destination_account_name,
                                  amount, currency, concept, type, status, scheduled_date, next_execution_date,
                                  end_date, max_executions, executions_count, created_at) VALUES
  ('5c000000-0000-0000-0000-000000005c01', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001',
   'ES6100750001996001008375', 'Comunidad Propietarios C/ Alcalá 42',
   85.00, 'EUR', 'Comunidad mes',  'MONTHLY', 'ACTIVE', CURRENT_DATE + 5,  CURRENT_DATE + 5, NULL, NULL, 6, NOW() - INTERVAL '6 months'),
  ('5c000000-0000-0000-0000-000000005c02', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001',
   'ES7620770024003102575766', 'Cuenta Ahorro Vacaciones',
   500.00, 'EUR', 'Ahorro mensual', 'MONTHLY', 'ACTIVE', CURRENT_DATE + 27, CURRENT_DATE + 27, NULL, NULL, 3, NOW() - INTERVAL '3 months'),
  ('5c000000-0000-0000-0000-000000005c03', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001',
   'ES2100750047960010083751', 'María García López',
   200.00, 'EUR', 'Mensualidad mamá', 'MONTHLY', 'PAUSED', CURRENT_DATE + 10, NULL, NULL, NULL, 2, NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

INSERT INTO scheduled_transfer_executions (id, scheduled_transfer_id, scheduled_date, executed_at, status, amount, retried) VALUES
  ('e0000000-0000-0000-0000-00000000e001', '5c000000-0000-0000-0000-000000005c01', CURRENT_DATE - 25, NOW() - INTERVAL '25 days', 'SUCCESS', 85.00, FALSE),
  ('e0000000-0000-0000-0000-00000000e002', '5c000000-0000-0000-0000-000000005c02', CURRENT_DATE - 4,  NOW() - INTERVAL '4 days',  'SUCCESS', 500.00, FALSE),
  ('e0000000-0000-0000-0000-00000000e003', '5c000000-0000-0000-0000-000000005c03', CURRENT_DATE - 20, NOW() - INTERVAL '20 days', 'FAILED_RETRYING', 200.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. RECIBOS Y PAGOS (FEAT-009)
-- ============================================================================
INSERT INTO bills (id, user_id, issuer, concept, amount, due_date, status, created_at) VALUES
  ('c0000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000001', 'Endesa',          'Factura Luz Mayo 2026',         75.40, CURRENT_DATE + 15, 'PENDING',   NOW()),
  ('c0000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000001', 'Movistar',        'Factura Móvil+Fibra Mayo 2026', 49.90, CURRENT_DATE + 20, 'PENDING',   NOW()),
  ('c0000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-000000000001', 'Canal Isabel II', 'Agua 2T 2026',                  42.15, CURRENT_DATE + 8,  'PENDING',   NOW()),
  ('c0000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-000000000001', 'Mapfre',          'Seguro Hogar Anual',           180.00, CURRENT_DATE + 45, 'PENDING',   NOW()),
  ('c0000000-0000-0000-0000-00000000c005', '00000000-0000-0000-0000-000000000001', 'Iberdrola',       'Factura Luz Marzo 2026 (pagada)', 71.80, CURRENT_DATE - 30, 'PAID',      NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bill_payments (id, user_id, bill_id, issuer, amount, source_account, status, paid_at) VALUES
  ('d0000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000c005',
   'Iberdrola', 71.80, 'acc00000-0000-0000-0000-000000000001', 'COMPLETED', NOW() - INTERVAL '28 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. TARJETAS (FEAT-016)
--    NOTA: V18 ya hace seed con LIMIT 1 que crea 2 tarjetas para alguna cuenta.
--    V30 añade tarjetas determinísticas con UUIDs fijos para usuarios test.
-- ============================================================================
-- Solo insertar si el usuario NO tiene tarjetas previas (evita duplicar con seed V18 u otros)
INSERT INTO cards (id, account_id, user_id, pan_masked, card_type, status, expiration_date,
                   daily_limit, monthly_limit,
                   daily_limit_min, daily_limit_max, monthly_limit_min, monthly_limit_max,
                   created_at, updated_at)
SELECT * FROM (VALUES
  ('f0000000-0000-0000-0000-00000000f001'::uuid, 'acc00000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
   'XXXX XXXX XXXX 4321', 'DEBIT',  'ACTIVE',  DATE '2028-12-31',
   1000.00::numeric, 5000.00::numeric, 100.00::numeric, 3000.00::numeric, 500.00::numeric, 15000.00::numeric,
   NOW() - INTERVAL '12 months', NOW()),
  ('f0000000-0000-0000-0000-00000000f002'::uuid, 'acc00000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
   'XXXX XXXX XXXX 8765', 'CREDIT', 'ACTIVE',  DATE '2027-06-30',
   2000.00::numeric, 8000.00::numeric, 200.00::numeric, 5000.00::numeric, 1000.00::numeric, 20000.00::numeric,
   NOW() - INTERVAL '12 months', NOW()),
  ('f0000000-0000-0000-0000-00000000f003'::uuid, 'acc00000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000001'::uuid,
   'XXXX XXXX XXXX 9999', 'DEBIT',  'BLOCKED', DATE '2028-12-31',
   500.00::numeric, 2000.00::numeric, 100.00::numeric, 3000.00::numeric, 500.00::numeric, 15000.00::numeric,
   NOW() - INTERVAL '6 months',  NOW() - INTERVAL '7 days'),
  ('f0000000-0000-0000-0000-00000000f004'::uuid, 'acc00000-0000-0000-0000-000000000003'::uuid, '00000000-0000-0000-0000-000000000002'::uuid,
   'XXXX XXXX XXXX 1111', 'DEBIT',  'ACTIVE',  DATE '2029-03-31',
   1000.00::numeric, 4000.00::numeric, 100.00::numeric, 3000.00::numeric, 500.00::numeric, 15000.00::numeric,
   NOW() - INTERVAL '8 months',  NOW())
) AS v(id, account_id, user_id, pan_masked, card_type, status, expiration_date,
       daily_limit, monthly_limit,
       daily_limit_min, daily_limit_max, monthly_limit_min, monthly_limit_max,
       created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM cards c WHERE c.user_id = v.user_id)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. DOMICILIACIONES SEPA DD (FEAT-017)
-- ============================================================================
INSERT INTO debit_mandates (id, account_id, user_id, creditor_name, creditor_iban, mandate_ref,
                             mandate_type, status, signed_at, created_at, updated_at) VALUES
  ('60000000-0000-0000-0000-000000006001', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'IBERDROLA CLIENTES SAU', 'ES2100490001512100012345', 'MND-IBERDROLA-2026-001', 'CORE', 'ACTIVE',
   CURRENT_DATE - 365, NOW() - INTERVAL '12 months', NOW()),
  ('60000000-0000-0000-0000-000000006002', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'MOVISTAR S.A.',         'ES7600810000123456789012', 'MND-MOVISTAR-2026-001', 'CORE', 'ACTIVE',
   CURRENT_DATE - 365, NOW() - INTERVAL '12 months', NOW()),
  ('60000000-0000-0000-0000-000000006003', 'acc00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'GIMNASIO HOLMES PLACE',  'ES4300810001514321567890', 'MND-HOLMES-2026-001',   'CORE', 'CANCELLED',
   CURRENT_DATE - 200, NOW() - INTERVAL '7 months', NOW() - INTERVAL '2 months')
ON CONFLICT (mandate_ref) DO NOTHING;

UPDATE debit_mandates SET cancelled_at = CURRENT_DATE - 60
 WHERE mandate_ref = 'MND-HOLMES-2026-001' AND cancelled_at IS NULL;

INSERT INTO direct_debits (id, mandate_id, amount, currency, status, due_date, charged_at, return_reason, created_at) VALUES
  ('70000000-0000-0000-0000-00000000dd01', '60000000-0000-0000-0000-000000006001', 71.80, 'EUR', 'CHARGED',  CURRENT_DATE - 30, NOW() - INTERVAL '30 days', NULL,  NOW() - INTERVAL '35 days'),
  ('70000000-0000-0000-0000-00000000dd02', '60000000-0000-0000-0000-000000006001', 75.40, 'EUR', 'PENDING',  CURRENT_DATE + 5,  NULL,                       NULL,  NOW() - INTERVAL '2 days'),
  ('70000000-0000-0000-0000-00000000dd03', '60000000-0000-0000-0000-000000006002', 49.90, 'EUR', 'CHARGED',  CURRENT_DATE - 28, NOW() - INTERVAL '28 days', NULL,  NOW() - INTERVAL '33 days'),
  ('70000000-0000-0000-0000-00000000dd04', '60000000-0000-0000-0000-000000006002', 49.90, 'EUR', 'PENDING',  CURRENT_DATE + 7,  NULL,                       NULL,  NOW() - INTERVAL '1 day'),
  ('70000000-0000-0000-0000-00000000dd05', '60000000-0000-0000-0000-000000006001', 68.90, 'EUR', 'RETURNED', CURRENT_DATE - 60, NULL,                       'AC04', NOW() - INTERVAL '65 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. PRÉSTAMOS (FEAT-020)
--    NOTA: V24 hizo seed con user_id 11111111-... (legacy). Insertamos para 00000001.
-- ============================================================================
INSERT INTO loans (id, user_id, tipo, importe_original, importe_pendiente, plazo, tae,
                   cuota_mensual, estado, fecha_inicio, fecha_fin) VALUES
  ('80000000-0000-0000-0000-000000008001', '00000000-0000-0000-0000-000000000001',
   'REFORMA',  12000.00,  9857.81, 36, 6.950000, 370.25, 'ACTIVE', '2025-10-01', '2028-09-01'),
  ('80000000-0000-0000-0000-000000008002', '00000000-0000-0000-0000-000000000001',
   'VEHICULO',  8500.00,  8037.24, 48, 7.200000, 204.33, 'ACTIVE', '2026-01-15', '2030-01-15')
ON CONFLICT (id) DO NOTHING;

INSERT INTO loan_applications (id, user_id, importe, plazo, finalidad, estado, scoring_result, otp_verified, created_at) VALUES
  ('90000000-0000-0000-0000-000000009001', '00000000-0000-0000-0000-000000000001',
   5000.00, 24, 'PERSONAL', 'PENDING', 720, FALSE, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. DEPÓSITOS (FEAT-021)
-- ============================================================================
INSERT INTO deposits (id, user_id, importe, plazo_meses, tin, tae, estado, renovacion,
                       cuenta_origen_id, fecha_apertura, fecha_vencimiento) VALUES
  ('a1000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000001',
   10000.00, 12, 0.032500, 0.033000, 'ACTIVE', 'RENEW_MANUAL',
   'acc00000-0000-0000-0000-000000000001', '2026-04-01', '2027-04-01'),
  ('a1000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000001',
    5000.00,  6, 0.030000, 0.030400, 'ACTIVE', 'RENEW_AUTO',
   'acc00000-0000-0000-0000-000000000001', '2026-04-01', '2026-10-01')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. BIZUM (FEAT-022)
-- ============================================================================
INSERT INTO bizum_activations (id, user_id, account_id, phone, status, gdpr_consent_at, activated_at) VALUES
  ('b1000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-000000000001', 'acc00000-0000-0000-0000-000000000001', '+34612345678', 'ACTIVE', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
  ('b1000000-0000-0000-0000-00000000b102', '00000000-0000-0000-0000-000000000002', 'acc00000-0000-0000-0000-000000000003', '+34622334455', 'ACTIVE', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO bizum_payments (id, sender_user_id, recipient_phone, amount, concept, status, sepa_ref, created_at, completed_at) VALUES
  ('b2000000-0000-0000-0000-00000000b201', '00000000-0000-0000-0000-000000000001', '+34622334455', 50.00,  'Cena ayer',         'COMPLETED', 'BIZ-2026-04-001', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('b2000000-0000-0000-0000-00000000b202', '00000000-0000-0000-0000-000000000001', '+34633445566', 25.50,  'Café',              'COMPLETED', 'BIZ-2026-04-002', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('b2000000-0000-0000-0000-00000000b203', '00000000-0000-0000-0000-000000000002', '+34612345678', 30.00,  'Devolución',        'COMPLETED', 'BIZ-2026-04-003', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('b2000000-0000-0000-0000-00000000b204', '00000000-0000-0000-0000-000000000001', '+34699887766', 15.00,  'Pendiente cobro',   'PENDING',   NULL,              NOW() - INTERVAL '1 hour',  NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bizum_requests (id, requester_user_id, recipient_phone, amount, concept, status, expires_at, created_at, payment_id) VALUES
  ('b3000000-0000-0000-0000-00000000b301', '00000000-0000-0000-0000-000000000001', '+34633445566', 40.00, 'Tu parte cena', 'PENDING',   NOW() + INTERVAL '6 days',  NOW() - INTERVAL '1 day',  NULL),
  ('b3000000-0000-0000-0000-00000000b302', '00000000-0000-0000-0000-000000000001', '+34622334455', 60.00, 'Concierto',     'COMPLETED', NOW() + INTERVAL '6 days',  NOW() - INTERVAL '5 days', 'b2000000-0000-0000-0000-00000000b203')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 15. PFM — MI DINERO (FEAT-023)
--    Las reglas del sistema (pfm_category_rules) ya las inserta V28.
-- ============================================================================
INSERT INTO pfm_user_rules (id, user_id, concept_pattern, category_code, created_at) VALUES
  ('c1000000-0000-0000-0000-00000000c1a1', '00000000-0000-0000-0000-000000000001', 'CARNICERIA EL ROBLE',  'ALIMENTACION', NOW() - INTERVAL '2 months'),
  ('c1000000-0000-0000-0000-00000000c1a2', '00000000-0000-0000-0000-000000000001', 'BAR PEPE',             'RESTAURANTES', NOW() - INTERVAL '1 month')
ON CONFLICT (user_id, concept_pattern) DO NOTHING;

INSERT INTO pfm_budgets (id, user_id, category_code, amount_limit, threshold_percent, budget_month, created_at) VALUES
  ('c2000000-0000-0000-0000-00000000c201', '00000000-0000-0000-0000-000000000001', 'ALIMENTACION', 400.00,  80, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), NOW() - INTERVAL '15 days'),
  ('c2000000-0000-0000-0000-00000000c202', '00000000-0000-0000-0000-000000000001', 'RESTAURANTES', 200.00,  80, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), NOW() - INTERVAL '15 days'),
  ('c2000000-0000-0000-0000-00000000c203', '00000000-0000-0000-0000-000000000001', 'OCIO',         100.00,  90, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), NOW() - INTERVAL '15 days'),
  ('c2000000-0000-0000-0000-00000000c204', '00000000-0000-0000-0000-000000000001', 'TRANSPORTE',   150.00,  85, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), NOW() - INTERVAL '15 days')
ON CONFLICT (user_id, category_code, budget_month) DO NOTHING;

-- Alerta ya emitida para el presupuesto de OCIO (RN-F023-09 — 1/presupuesto/mes)
INSERT INTO pfm_budget_alerts (id, budget_id, alert_month, emitted_at) VALUES
  ('c3000000-0000-0000-0000-00000000c301', 'c2000000-0000-0000-0000-00000000c203', TO_CHAR(CURRENT_DATE, 'YYYY-MM'), NOW() - INTERVAL '3 days')
ON CONFLICT (budget_id, alert_month) DO NOTHING;

-- ============================================================================
-- 16. OBJETIVOS DE AHORRO (FEAT-024)
-- ============================================================================
INSERT INTO savings_goals (id, user_id, name, target_amount, reserved_amount, target_date,
                            category, custom_category, icon, color, status, source_account_id,
                            created_at, updated_at, closed_at) VALUES
  -- ACTIVE — en progreso (45%)
  ('51000000-0000-0000-0000-000000001101', '00000000-0000-0000-0000-000000000001',
   'Vacaciones Japón 2027', 6000.00, 2700.00, '2027-06-30',
   'VIAJES', NULL, 'beach', '#3B82F6', 'ACTIVE',
   'acc00000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '4 months', NOW(), NULL),
  -- ACTIVE — en progreso (12%)
  ('51000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000000001',
   'Coche eléctrico nuevo', 25000.00, 3000.00, '2028-12-31',
   'VEHICULO', NULL, 'car', '#10B981', 'ACTIVE',
   'acc00000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '3 months', NOW(), NULL),
  -- PAUSED
  ('51000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000000001',
   'Reforma cocina',         8000.00, 1500.00, '2027-03-31',
   'HOGAR', NULL, 'home', '#F59E0B', 'PAUSED',
   'acc00000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '5 months', NOW() - INTERVAL '2 weeks', NULL),
  -- COMPLETED
  ('51000000-0000-0000-0000-000000001104', '00000000-0000-0000-0000-000000000001',
   'Fondo emergencia 3 meses', 4500.00, 4500.00, CURRENT_DATE - 30,
   'OTROS', 'Fondo Emergencia', 'shield', '#8B5CF6', 'COMPLETED',
   'acc00000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '10 months', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  -- CLOSED (cerrado sin completar — caso límite)
  ('51000000-0000-0000-0000-000000001105', '00000000-0000-0000-0000-000000000001',
   'Curso fotografía pro',   1200.00,  450.00, '2026-02-28',
   'EDUCACION', NULL, 'camera', '#EF4444', 'CLOSED',
   'acc00000-0000-0000-0000-000000000001',
   NOW() - INTERVAL '6 months', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- Aportaciones (manuales y auto)
INSERT INTO goal_allocations (id, goal_id, amount, allocation_type, source_account_id, rule_id,
                               allocation_month, status, executed_at) VALUES
  ('52000000-0000-0000-0000-000000005201', '51000000-0000-0000-0000-000000001101',  500.00, 'MANUAL', 'acc00000-0000-0000-0000-000000000001', NULL, '2026-01', 'SUCCESS', NOW() - INTERVAL '4 months'),
  ('52000000-0000-0000-0000-000000005202', '51000000-0000-0000-0000-000000001101',  500.00, 'AUTO',   'acc00000-0000-0000-0000-000000000001', '53000000-0000-0000-0000-000000005301', '2026-02', 'SUCCESS', NOW() - INTERVAL '3 months'),
  ('52000000-0000-0000-0000-000000005203', '51000000-0000-0000-0000-000000001101',  500.00, 'AUTO',   'acc00000-0000-0000-0000-000000000001', '53000000-0000-0000-0000-000000005301', '2026-03', 'SUCCESS', NOW() - INTERVAL '2 months'),
  ('52000000-0000-0000-0000-000000005204', '51000000-0000-0000-0000-000000001101',  600.00, 'MANUAL', 'acc00000-0000-0000-0000-000000000001', NULL, '2026-04', 'SUCCESS', NOW() - INTERVAL '1 month'),
  ('52000000-0000-0000-0000-000000005205', '51000000-0000-0000-0000-000000001101',  600.00, 'AUTO',   'acc00000-0000-0000-0000-000000000001', '53000000-0000-0000-0000-000000005301', '2026-05', 'SUCCESS', NOW() - INTERVAL '1 day'),
  ('52000000-0000-0000-0000-000000005206', '51000000-0000-0000-0000-000000001102', 3000.00, 'MANUAL', 'acc00000-0000-0000-0000-000000000001', NULL, '2026-04', 'SUCCESS', NOW() - INTERVAL '15 days'),
  ('52000000-0000-0000-0000-000000005207', '51000000-0000-0000-0000-000000001103', 1500.00, 'MANUAL', 'acc00000-0000-0000-0000-000000000001', NULL, '2026-02', 'SUCCESS', NOW() - INTERVAL '3 months'),
  ('52000000-0000-0000-0000-000000005208', '51000000-0000-0000-0000-000000001104', 4500.00, 'MANUAL', 'acc00000-0000-0000-0000-000000000001', NULL, '2026-03', 'SUCCESS', NOW() - INTERVAL '2 months'),
  ('52000000-0000-0000-0000-000000005209', '51000000-0000-0000-0000-000000001105',  450.00, 'MANUAL', 'acc00000-0000-0000-0000-000000000001', NULL, '2025-12', 'SUCCESS', NOW() - INTERVAL '5 months'),
  -- Una fallida (caso límite)
  ('52000000-0000-0000-0000-00000000520a', '51000000-0000-0000-0000-000000001102',  500.00, 'AUTO',   'acc00000-0000-0000-0000-000000000001', NULL, '2026-05', 'FAILED', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

UPDATE goal_allocations SET failure_reason = 'INSUFFICIENT_FUNDS'
 WHERE id = '52000000-0000-0000-0000-00000000520a' AND failure_reason IS NULL;

-- Hitos alcanzados (RN-F024-09 — idempotencia 25/50/75/100)
INSERT INTO goal_milestones (id, goal_id, percent, reached_at, notification_id) VALUES
  ('54000000-0000-0000-0000-000000005401', '51000000-0000-0000-0000-000000001101',  25, NOW() - INTERVAL '3 months', NULL),
  ('54000000-0000-0000-0000-000000005402', '51000000-0000-0000-0000-000000001104',  25, NOW() - INTERVAL '8 months', NULL),
  ('54000000-0000-0000-0000-000000005403', '51000000-0000-0000-0000-000000001104',  50, NOW() - INTERVAL '6 months', NULL),
  ('54000000-0000-0000-0000-000000005404', '51000000-0000-0000-0000-000000001104',  75, NOW() - INTERVAL '4 months', NULL),
  ('54000000-0000-0000-0000-000000005405', '51000000-0000-0000-0000-000000001104', 100, NOW() - INTERVAL '30 days',  NULL)
ON CONFLICT (goal_id, percent) DO NOTHING;

-- Reglas de aportación automática (1 activa por meta — uk_goal_active_rule)
INSERT INTO goal_auto_rules (id, goal_id, amount, day_of_month, source_account_id,
                              active, next_execution_at, last_execution_at, created_at) VALUES
  ('53000000-0000-0000-0000-000000005301', '51000000-0000-0000-0000-000000001101',
   600.00, 1, 'acc00000-0000-0000-0000-000000000001', TRUE,
   DATE_TRUNC('month', NOW()) + INTERVAL '1 month', NOW() - INTERVAL '1 day',
   NOW() - INTERVAL '4 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 17. NOTIFICACIONES (FEAT-009 / FEAT-005)
-- ============================================================================
INSERT INTO user_notifications (id, user_id, event_type, title, body, action_url,
                                 context_id, read_at, created_at, ip_subnet, unusual_location) VALUES
  ('e1000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-000000000001', 'LOGIN_SUCCESS',
   'Inicio de sesión correcto', 'Has iniciado sesión desde Madrid.', '/security/sessions',
   NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', '192.168', FALSE),
  ('e1000000-0000-0000-0000-00000000e102', '00000000-0000-0000-0000-000000000001', 'TRANSFER_COMPLETED',
   'Transferencia ejecutada', 'Transferencia de 300,00 € a Carlos Martínez completada.', '/transfers/history',
   '7a000000-0000-0000-0000-000000007a02', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', '192.168', FALSE),
  ('e1000000-0000-0000-0000-00000000e103', '00000000-0000-0000-0000-000000000001', 'GOAL_MILESTONE_REACHED',
   '¡Hito 100% alcanzado!', 'Has completado tu objetivo "Fondo emergencia 3 meses".', '/savings-goals/51000000-0000-0000-0000-000000001104',
   '51000000-0000-0000-0000-000000001104', NULL, NOW() - INTERVAL '30 days', '192.168', FALSE),
  ('e1000000-0000-0000-0000-00000000e104', '00000000-0000-0000-0000-000000000001', 'BUDGET_THRESHOLD_REACHED',
   'Has superado el 90% del presupuesto OCIO', 'Llevas gastados 92€ de 100€ este mes.', '/pfm/budgets',
   'c2000000-0000-0000-0000-00000000c203', NULL, NOW() - INTERVAL '3 days', '192.168', FALSE),
  ('e1000000-0000-0000-0000-00000000e105', '00000000-0000-0000-0000-000000000001', 'LOGIN_UNUSUAL_LOCATION',
   'Inicio sesión desde ubicación inusual', 'Detectamos un acceso desde Barcelona.', '/security/sessions',
   NULL, NULL, NOW() - INTERVAL '7 days', '85.45', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Preferencias de notificación (canales)
INSERT INTO notification_preferences (user_id, event_type, email_enabled, push_enabled, in_app_enabled, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'LOGIN_SUCCESS',           FALSE, TRUE,  TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'LOGIN_UNUSUAL_LOCATION',  TRUE,  TRUE,  TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'TRANSFER_COMPLETED',      TRUE,  TRUE,  TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'BUDGET_THRESHOLD_REACHED',TRUE,  TRUE,  TRUE,  NOW()),
  ('00000000-0000-0000-0000-000000000001', 'GOAL_MILESTONE_REACHED',  TRUE,  TRUE,  TRUE,  NOW())
ON CONFLICT DO NOTHING;

-- Suscripciones push web
INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at, last_used_at) VALUES
  ('e2000000-0000-0000-0000-00000000e201', '00000000-0000-0000-0000-000000000001',
   'https://fcm.googleapis.com/fcm/send/test-endpoint-001',
   'p256dh-key-encrypted-base64-test-001==',
   'auth-key-encrypted-base64-test-001==',
   'Mozilla/5.0 (Macintosh) Chrome/124.0', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 18. SESIONES, DISPOSITIVOS Y AUDITORÍA (FEAT-005, FEAT-006)
-- ============================================================================
INSERT INTO trusted_devices (id, user_id, token_hash, device_fingerprint_hash, device_os, device_browser,
                              ip_masked, created_at, last_used_at, expires_at) VALUES
  ('e3000000-0000-0000-0000-00000000e301', '00000000-0000-0000-0000-000000000001',
   'sha256:trusted-token-001', 'sha256:fp-macbook-001', 'macOS 14', 'Chrome 124',
   '192.168.x.x', NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '27 days'),
  ('e3000000-0000-0000-0000-00000000e302', '00000000-0000-0000-0000-000000000001',
   'sha256:trusted-token-002', 'sha256:fp-iphone-001', 'iOS 17', 'Safari Mobile 17',
   '192.168.x.x', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 day', NOW() + INTERVAL '28 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO known_subnets (id, user_id, subnet, first_seen, last_seen, confirmed) VALUES
  ('e4000000-0000-0000-0000-00000000e401', '00000000-0000-0000-0000-000000000001', '192.168', NOW() - INTERVAL '12 months', NOW(), TRUE),
  ('e4000000-0000-0000-0000-00000000e402', '00000000-0000-0000-0000-000000000001', '85.45',   NOW() - INTERVAL '7 days',    NOW() - INTERVAL '7 days', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_log (user_id, event_type, ip_address, user_agent, event_timestamp, result) VALUES
  ('00000000-0000-0000-0000-000000000001', 'LOGIN_SUCCESS',           '192.168.1.10', 'Mozilla/5.0 Chrome/124', NOW() - INTERVAL '2 hours', 'SUCCESS'),
  ('00000000-0000-0000-0000-000000000001', 'TWO_FACTOR_VERIFIED',     '192.168.1.10', 'Mozilla/5.0 Chrome/124', NOW() - INTERVAL '2 hours', 'SUCCESS'),
  ('00000000-0000-0000-0000-000000000001', 'PASSWORD_CHANGED',        '192.168.1.10', 'Mozilla/5.0 Chrome/124', NOW() - INTERVAL '3 months','SUCCESS'),
  ('00000000-0000-0000-0000-000000000001', 'LOGIN_UNUSUAL_LOCATION',  '85.45.10.20',  'Mozilla/5.0 Firefox/125',NOW() - INTERVAL '7 days',  'SUCCESS'),
  (NULL,                                    'LOGIN_FAILED',            '203.0.113.5',  'curl/8.0',               NOW() - INTERVAL '1 day',   'FAILURE');

-- Códigos de recuperación (3 sin usar, 1 usado — FEAT-001)
INSERT INTO recovery_codes (user_id, code_hash, used, used_at, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '$2b$10$rec1HashRecoveryCode00000000000000000000000000000000000', FALSE, NULL, NOW() - INTERVAL '11 months'),
  ('00000000-0000-0000-0000-000000000001', '$2b$10$rec2HashRecoveryCode11111111111111111111111111111111111', FALSE, NULL, NOW() - INTERVAL '11 months'),
  ('00000000-0000-0000-0000-000000000001', '$2b$10$rec3HashRecoveryCode22222222222222222222222222222222222', FALSE, NULL, NOW() - INTERVAL '11 months'),
  ('00000000-0000-0000-0000-000000000001', '$2b$10$rec4HashRecoveryCode33333333333333333333333333333333333', TRUE,  NOW() - INTERVAL '5 months', NOW() - INTERVAL '11 months')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 19. GDPR / PRIVACIDAD (FEAT-018, FEAT-019)
-- ============================================================================
INSERT INTO consent_history (user_id, tipo, valor_anterior, valor_nuevo, ip_origen, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'MARKETING',   NULL, FALSE, '192.168.1.10', NOW() - INTERVAL '12 months'),
  ('00000000-0000-0000-0000-000000000001', 'ANALYTICS',   NULL, TRUE,  '192.168.1.10', NOW() - INTERVAL '12 months'),
  ('00000000-0000-0000-0000-000000000001', 'MARKETING',   FALSE,TRUE,  '192.168.1.10', NOW() - INTERVAL '6 months'),
  ('00000000-0000-0000-0000-000000000001', 'MARKETING',   TRUE, FALSE, '192.168.1.10', NOW() - INTERVAL '2 months');

INSERT INTO gdpr_requests (user_id, tipo, estado, descripcion, created_at, sla_deadline) VALUES
  ('00000000-0000-0000-0000-000000000001', 'EXPORT',  'COMPLETED', 'Solicitud portabilidad datos',  NOW() - INTERVAL '90 days', NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-0000-000000000001', 'CONSENT', 'PENDING',   'Revisión de consentimientos GDPR',     NOW() - INTERVAL '5 days',  NOW() + INTERVAL '25 days');

-- ============================================================================
-- 20. EXPORT AUDIT LOG (FEAT-019)
-- ============================================================================
INSERT INTO export_audit_log (user_id, timestamp_utc, iban, fecha_desde, fecha_hasta,
                               tipo_movimiento, formato, num_registros, ip_origen, user_agent) VALUES
  ('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days',
   'ES9121000418450200051332', '2026-01-01', '2026-03-31', 'TODOS', 'PDF', 30, '192.168.1.10', 'Mozilla/5.0 Chrome/124'),
  ('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days',
   'ES9121000418450200051332', '2026-04-01', '2026-04-30', 'CARGO', 'CSV', 18, '192.168.1.10', 'Mozilla/5.0 Chrome/124');

-- ============================================================================
-- 21. DASHBOARD — spending_categories (cache mes actual)
-- ============================================================================
-- Recalculado dinámicamente desde transactions del mes actual (siempre coherente con datos reales)
INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
SELECT a.user_id, TO_CHAR(NOW(), 'YYYY-MM'), t.category, ABS(SUM(t.amount)), COUNT(*), NOW()
FROM transactions t JOIN accounts a ON t.account_id = a.id
WHERE a.user_id = '00000000-0000-0000-0000-000000000001'
  AND t.type = 'CARGO'
  AND TO_CHAR(t.transaction_date, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM')
GROUP BY a.user_id, t.category
ON CONFLICT (user_id, period, category) DO UPDATE
  SET amount = EXCLUDED.amount, tx_count = EXCLUDED.tx_count, computed_at = NOW();

-- Alerta de presupuesto general (FEAT-011)
INSERT INTO budget_alerts (user_id, period, monthly_budget, threshold_pct, current_amount, triggered_at, notified) VALUES
  ('00000000-0000-0000-0000-000000000001', TO_CHAR(NOW(), 'YYYY-MM'), 2500.00, 80, 2780.23, NOW() - INTERVAL '3 days', TRUE);

-- ============================================================================
-- 22. VERIFICACIÓN DEL SEED
-- ============================================================================
DO $$
DECLARE
  cnt_users     INT;
  cnt_accounts  INT;
  cnt_txs       INT;
  cnt_goals     INT;
  cnt_loans     INT;
  cnt_deposits  INT;
  cnt_bizum     INT;
  cnt_budgets   INT;
BEGIN
  SELECT COUNT(*) INTO cnt_users     FROM users
    WHERE email IN ('a.delacuadra@nemtec.es','maria.garcia@nemtec.es','carlos.martinez@nemtec.es');
  SELECT COUNT(*) INTO cnt_accounts  FROM accounts
    WHERE user_id::text LIKE '00000000-0000-0000-0000-00000000000%';
  SELECT COUNT(*) INTO cnt_txs       FROM transactions
    WHERE account_id::text LIKE 'acc00000-0000-0000-0000-00000000000%';
  SELECT COUNT(*) INTO cnt_goals     FROM savings_goals
    WHERE user_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO cnt_loans     FROM loans
    WHERE user_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO cnt_deposits  FROM deposits
    WHERE user_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO cnt_bizum     FROM bizum_payments
    WHERE sender_user_id = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO cnt_budgets   FROM pfm_budgets
    WHERE user_id = '00000000-0000-0000-0000-000000000001';

  RAISE NOTICE 'V30 seed OK — users:% accounts:% transactions:% goals:% loans:% deposits:% bizum:% budgets:%',
    cnt_users, cnt_accounts, cnt_txs, cnt_goals, cnt_loans, cnt_deposits, cnt_bizum, cnt_budgets;

  IF cnt_users < 3 THEN
    RAISE EXCEPTION 'V30: usuarios insuficientes (esperado 3, encontrado %)', cnt_users;
  END IF;
  IF cnt_goals < 5 THEN
    RAISE EXCEPTION 'V30: objetivos de ahorro insuficientes (esperado 5, encontrado %)', cnt_goals;
  END IF;
END $$;
