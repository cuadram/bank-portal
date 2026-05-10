-- ============================================================================
-- V24b__seed_test_users_accounts.sql
-- Seed mínimo de usuarios + cuentas requerido por V25 (txs abril) y V30 (full).
--
-- CONTEXTO: V25 (seed transactions abril 2026) referencia
--   acc00000-0000-0000-0000-000000000001 / 000000000002, pero ninguna
--   migración previa creaba esas cuentas. Antes funcionaba porque la app
--   las servía desde MockAccountRepositoryAdapter (memoria). Al introducir
--   V30 (dataset persistido) y recrear BD desde cero, V25 fallaba por FK.
--
-- ESTA MIGRACIÓN: solo crea usuario principal + 2 cuentas + balances +
-- transfer_limits. El resto (tarjetas, préstamos, depósitos, bizum, KYC,
-- transferencias, presupuestos, objetivos, etc.) se mantiene en V30.
--
-- IDEMPOTENCIA: ON CONFLICT DO NOTHING en todos los INSERT.
-- COMPATIBILIDAD: V30 usa ON CONFLICT (email) DO UPDATE / (id) DO NOTHING,
-- por tanto re-ejecutar V30 sobre estos datos NO duplica ni rompe nada.
-- ============================================================================

-- ── Usuario principal (a.delacuadra) ───────────────────────────────────────
-- password angel123 — hash bcrypt mantenido del seed original
INSERT INTO users (id, username, email, password_hash, two_factor_enabled, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'angel.delacuadra',
   'a.delacuadra@nemtec.es',
   '$2b$10$/5nhuMcdUtt3AMahx99oM.pjfPXTK/XtRu5Kd9OMoWrilGb8a1u7i',
   FALSE,
   NOW() - INTERVAL '12 months', NOW())
ON CONFLICT (email) DO NOTHING;

-- ── Cuentas del usuario principal ──────────────────────────────────────────
INSERT INTO accounts (id, user_id, alias, iban, type, status, created_at) VALUES
  ('acc00000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'Cuenta Corriente Nómina',
   'ES9121000418450200051332',
   'CORRIENTE',
   'ACTIVE',
   NOW() - INTERVAL '12 months'),
  ('acc00000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'Cuenta Ahorro Vacaciones',
   'ES7620770024003102575766',
   'AHORRO',
   'ACTIVE',
   NOW() - INTERVAL '12 months')
ON CONFLICT (id) DO NOTHING;

-- ── Saldos iniciales (ajustados por V30 con saldos finales coherentes) ─────
INSERT INTO account_balances (account_id, available_balance, retained_balance, updated_at) VALUES
  ('acc00000-0000-0000-0000-000000000001',  5000.00,  0.00, NOW()),
  ('acc00000-0000-0000-0000-000000000002', 12000.00,  0.00, NOW())
ON CONFLICT (account_id) DO NOTHING;

-- ── Límites de transferencia ───────────────────────────────────────────────
INSERT INTO transfer_limits (user_id, per_operation_limit, daily_limit, monthly_limit) VALUES
  ('00000000-0000-0000-0000-000000000001', 2000.00, 3000.00, 10000.00)
ON CONFLICT (user_id) DO NOTHING;
