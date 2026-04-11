-- V13__dashboard_analytics.sql
-- FEAT-010 Sprint 12 — Dashboard analítico de gastos y movimientos
-- SOFIA Developer Agent — 2026-03-22

CREATE TABLE IF NOT EXISTS spending_categories (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period       CHAR(7)       NOT NULL,
    category     VARCHAR(32)   NOT NULL,
    amount       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tx_count     INTEGER       NOT NULL DEFAULT 0,
    computed_at  TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT uq_spending_cat UNIQUE (user_id, period, category)
);
CREATE INDEX IF NOT EXISTS idx_spending_cat_user_period ON spending_categories(user_id, period);

CREATE TABLE IF NOT EXISTS budget_alerts (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id),
    period          CHAR(7)       NOT NULL,
    monthly_budget  DECIMAL(15,2) NOT NULL CHECK (monthly_budget > 0),
    threshold_pct   INTEGER       NOT NULL DEFAULT 80,
    current_amount  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    triggered_at    TIMESTAMP     NOT NULL DEFAULT now(),
    notified        BOOLEAN       NOT NULL DEFAULT false,
    CONSTRAINT uq_budget_alert UNIQUE (user_id, period)
);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id, period);

COMMENT ON TABLE spending_categories IS 'Cache de gastos categorizados por usuario/periodo — FEAT-010 US-1002';
COMMENT ON TABLE budget_alerts IS 'Alertas de presupuesto disparadas — FEAT-010 US-1005';
