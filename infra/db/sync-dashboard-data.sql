-- =============================================================
-- SYNC: spending_categories + account_balances coherentes
-- con las transacciones reales de la tabla transactions
-- Usuario: a.delacuadra@nemtec.es
-- 2026-03-28
-- =============================================================

BEGIN;

-- ── 1. Sincronizar spending_categories con transacciones reales ──────────────
DELETE FROM spending_categories WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO spending_categories (user_id, period, category, amount, tx_count, computed_at)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM'),
    category,
    SUM(CASE WHEN type = 'CARGO' THEN ABS(amount) ELSE 0 END),
    COUNT(*) FILTER (WHERE type = 'CARGO'),
    NOW()
FROM transactions
WHERE account_id IN (
    SELECT id FROM accounts WHERE user_id = '00000000-0000-0000-0000-000000000001'
)
AND transaction_date >= NOW() - INTERVAL '6 months'
AND category IS NOT NULL
AND category != 'OTROS'
GROUP BY TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM'), category
HAVING SUM(CASE WHEN type = 'CARGO' THEN ABS(amount) ELSE 0 END) > 0
ON CONFLICT (user_id, period, category) DO UPDATE 
    SET amount = EXCLUDED.amount, tx_count = EXCLUDED.tx_count, computed_at = NOW();

-- ── 2. Sincronizar saldos reales con las transacciones ───────────────────────
-- Saldo corriente: calculado desde el último saldo conocido
UPDATE account_balances
SET available_balance = (
    SELECT COALESCE(SUM(amount), 0)
    FROM transactions
    WHERE account_id = 'acc00000-0000-0000-0000-000000000001'
),
updated_at = NOW()
WHERE account_id = 'acc00000-0000-0000-0000-000000000001';

-- ── 3. Budget alerts coherentes con gastos reales ───────────────────────────
DELETE FROM budget_alerts WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO budget_alerts (user_id, period, monthly_budget, threshold_pct, current_amount, triggered_at, notified)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    TO_CHAR(NOW(), 'YYYY-MM'),
    2000.00,  -- presupuesto mensual configurado
    80,
    SUM(CASE WHEN type = 'CARGO' THEN ABS(amount) ELSE 0 END),
    NOW() - INTERVAL '2 days',
    true
FROM transactions
WHERE account_id IN (SELECT id FROM accounts WHERE user_id = '00000000-0000-0000-0000-000000000001')
  AND transaction_date >= DATE_TRUNC('month', NOW())
ON CONFLICT (user_id, period) DO UPDATE
    SET current_amount = EXCLUDED.current_amount,
        triggered_at   = EXCLUDED.triggered_at;

-- ── 4. Verificación ─────────────────────────────────────────────────────────
SELECT '=== SPENDING CATEGORIES MES ACTUAL ===' AS info;
SELECT category, amount, tx_count 
FROM spending_categories 
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND period = TO_CHAR(NOW(), 'YYYY-MM')
ORDER BY amount DESC;

SELECT '=== RESUMEN MES ACTUAL ===' AS info;
SELECT 
    SUM(CASE WHEN type='ABONO' THEN amount ELSE 0 END) AS ingresos,
    SUM(CASE WHEN type='CARGO' THEN ABS(amount) ELSE 0 END) AS gastos,
    SUM(amount) AS neto,
    COUNT(*) AS transacciones
FROM transactions
WHERE account_id IN (SELECT id FROM accounts WHERE user_id = '00000000-0000-0000-0000-000000000001')
  AND transaction_date >= DATE_TRUNC('month', NOW());

SELECT '=== SALDOS ===' AS info;
SELECT a.alias, ab.available_balance
FROM account_balances ab JOIN accounts a ON a.id = ab.account_id
WHERE a.user_id = '00000000-0000-0000-0000-000000000001';

SELECT '=== BUDGET ALERT ===' AS info;
SELECT period, monthly_budget, current_amount, 
       ROUND(current_amount/monthly_budget*100,1) AS pct_usado
FROM budget_alerts WHERE user_id = '00000000-0000-0000-0000-000000000001';

COMMIT;
