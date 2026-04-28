-- ============================================================================
-- V29__savings_goals.sql · FEAT-024 Objetivos de Ahorro · Sprint 26
-- Architect: SOFIA v2.7 · 2026-04-27 · ADR-040
-- ============================================================================

CREATE TABLE savings_goals (
  id                 UUID PRIMARY KEY,
  user_id            UUID NOT NULL,
  name               VARCHAR(100) NOT NULL,
  target_amount      NUMERIC(12,2) NOT NULL CHECK (target_amount BETWEEN 100 AND 500000),
  reserved_amount    NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (reserved_amount >= 0),
  target_date        DATE NOT NULL,
  category           VARCHAR(20) NOT NULL,
  custom_category    VARCHAR(50),
  icon               VARCHAR(30),
  color              VARCHAR(10),
  status             VARCHAR(15) NOT NULL CHECK (status IN ('ACTIVE','PAUSED','CLOSED','COMPLETED')),
  source_account_id  UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at          TIMESTAMPTZ,
  CONSTRAINT uk_user_goal_name UNIQUE (user_id, name) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT chk_reserved_le_target CHECK (reserved_amount <= target_amount)
);
CREATE INDEX idx_savings_goals_user_status ON savings_goals(user_id, status);

CREATE TABLE goal_allocations (
  id                 UUID PRIMARY KEY,
  goal_id            UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount             NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  allocation_type    VARCHAR(10) NOT NULL CHECK (allocation_type IN ('MANUAL','AUTO')),
  source_account_id  UUID NOT NULL,
  rule_id            UUID,
  allocation_month   CHAR(7),
  status             VARCHAR(10) NOT NULL CHECK (status IN ('PENDING','SUCCESS','FAILED')),
  failure_reason     VARCHAR(50),
  executed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uk_goal_month UNIQUE (goal_id, allocation_month) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX idx_goal_allocations_goal_time ON goal_allocations(goal_id, executed_at DESC);

CREATE TABLE goal_milestones (
  id              UUID PRIMARY KEY,
  goal_id         UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  percent         SMALLINT NOT NULL CHECK (percent IN (25,50,75,100)),
  reached_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_id UUID,
  CONSTRAINT uk_goal_milestone UNIQUE (goal_id, percent)
);

CREATE TABLE goal_auto_rules (
  id                UUID PRIMARY KEY,
  goal_id           UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL CHECK (amount BETWEEN 10 AND 5000),
  day_of_month      SMALLINT NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  source_account_id UUID NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  next_execution_at TIMESTAMPTZ NOT NULL,
  last_execution_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_goal_active_rule ON goal_auto_rules(goal_id) WHERE active = TRUE;

COMMENT ON TABLE savings_goals IS 'FEAT-024 - objetivos de ahorro virtuales (ADR-040 alpha)';
COMMENT ON TABLE goal_allocations IS 'FEAT-024 - aportaciones manuales y automaticas';
COMMENT ON TABLE goal_milestones IS 'FEAT-024 - hitos 25/50/75/100 emitidos (idempotencia RN-F024-09)';
COMMENT ON TABLE goal_auto_rules IS 'FEAT-024 - reglas de aportacion automatica mensual';
