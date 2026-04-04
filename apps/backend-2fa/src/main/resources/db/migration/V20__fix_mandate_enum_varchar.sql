-- =============================================================
-- V20__fix_mandate_enum_varchar.sql
-- Fix: PostgreSQL ENUM types → VARCHAR para compatibilidad con Hibernate EnumType.STRING
-- Approach: add temp columns, copy, drop old, rename — evita restricciones de ALTER TYPE
-- Sprint 19 post-deploy · BankPortal · SOFIA v2.2
-- =============================================================

-- ── debit_mandates: mandate_type ─────────────────────────────
ALTER TABLE debit_mandates ADD COLUMN mandate_type_new VARCHAR(10);
UPDATE debit_mandates SET mandate_type_new = mandate_type::text;
ALTER TABLE debit_mandates DROP COLUMN mandate_type;
ALTER TABLE debit_mandates RENAME COLUMN mandate_type_new TO mandate_type;
ALTER TABLE debit_mandates ALTER COLUMN mandate_type SET NOT NULL;
ALTER TABLE debit_mandates ALTER COLUMN mandate_type SET DEFAULT 'CORE';

-- ── debit_mandates: status ────────────────────────────────────
ALTER TABLE debit_mandates ADD COLUMN status_new VARCHAR(20);
UPDATE debit_mandates SET status_new = status::text;
ALTER TABLE debit_mandates DROP COLUMN status;
ALTER TABLE debit_mandates RENAME COLUMN status_new TO status;
ALTER TABLE debit_mandates ALTER COLUMN status SET NOT NULL;
ALTER TABLE debit_mandates ALTER COLUMN status SET DEFAULT 'ACTIVE';

-- ── direct_debits: status ─────────────────────────────────────
ALTER TABLE direct_debits ADD COLUMN status_new VARCHAR(20);
UPDATE direct_debits SET status_new = status::text;
ALTER TABLE direct_debits DROP COLUMN status;
ALTER TABLE direct_debits RENAME COLUMN status_new TO status;
ALTER TABLE direct_debits ALTER COLUMN status SET NOT NULL;
ALTER TABLE direct_debits ALTER COLUMN status SET DEFAULT 'PENDING';

-- ── Drop custom ENUM types ────────────────────────────────────
DROP TYPE IF EXISTS mandate_type;
DROP TYPE IF EXISTS mandate_status;
DROP TYPE IF EXISTS debit_status;

-- ── CHECK constraints equivalentes ───────────────────────────
ALTER TABLE debit_mandates
    ADD CONSTRAINT chk_mandate_type   CHECK (mandate_type IN ('CORE','B2B')),
    ADD CONSTRAINT chk_mandate_status CHECK (status IN ('ACTIVE','CANCELLED','SUSPENDED'));

ALTER TABLE direct_debits
    ADD CONSTRAINT chk_debit_status CHECK (status IN ('PENDING','CHARGED','RETURNED','REJECTED'));
