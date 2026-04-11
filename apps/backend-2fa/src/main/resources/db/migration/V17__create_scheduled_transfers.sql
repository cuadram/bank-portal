-- ============================================================
-- V17 — FEAT-015: Transferencias Programadas y Recurrentes
-- Sprint 17 · BankPortal — Banco Meridian
-- SOFIA Developer Agent · 2026-03-24
-- ============================================================

CREATE TABLE IF NOT EXISTS scheduled_transfers (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID         NOT NULL REFERENCES users(id),
    source_account_id        UUID         NOT NULL REFERENCES accounts(id),
    destination_iban         VARCHAR(34)  NOT NULL,
    destination_account_name VARCHAR(100) NOT NULL,
    amount                   NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency                 VARCHAR(3)   NOT NULL DEFAULT 'EUR',
    concept                  VARCHAR(140) NOT NULL,
    type                     VARCHAR(20)  NOT NULL CHECK (type IN ('ONCE','WEEKLY','BIWEEKLY','MONTHLY')),
    status                   VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                               CHECK (status IN ('PENDING','ACTIVE','PAUSED','COMPLETED','FAILED','CANCELLED')),
    scheduled_date           DATE         NOT NULL,
    next_execution_date      DATE,
    end_date                 DATE,
    max_executions           INT,
    executions_count         INT          NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    cancelled_at             TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scheduled_transfer_executions (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_transfer_id    UUID         NOT NULL REFERENCES scheduled_transfers(id),
    transfer_id              UUID         REFERENCES transfers(id),
    scheduled_date           DATE         NOT NULL,
    executed_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status                   VARCHAR(30)  NOT NULL
                               CHECK (status IN ('SUCCESS','FAILED_RETRYING','SKIPPED','CANCELLED')),
    amount                   NUMERIC(15,2) NOT NULL,
    failure_reason           TEXT,
    retried                  BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Consulta principal del Scheduler
CREATE INDEX IF NOT EXISTS idx_sched_transfers_due
    ON scheduled_transfers (next_execution_date, status)
    WHERE status IN ('PENDING','ACTIVE');

-- Idempotencia: previene doble ejecución en mismo día
CREATE UNIQUE INDEX idx_exec_transfer_date
    ON scheduled_transfer_executions (scheduled_transfer_id, scheduled_date);

-- Listado por usuario
CREATE INDEX IF NOT EXISTS idx_sched_transfers_user
    ON scheduled_transfers (user_id, status);
