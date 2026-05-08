-- =============================================================================
-- V33__add_savings_goal_optimistic_lock.sql
-- =============================================================================
-- BUG-S26-Q-008 (CRITICA) · QA Sprint 26 · FEAT-024
--
-- Anade columna 'version' a savings_goals para habilitar optimistic locking
-- (JPA @Version). Soluciona lost-update en POST /contributions concurrentes
-- (TC-API-CONCURRENCY: 5 contribuciones paralelas reservaban solo 60 EUR de
-- los 150 EUR esperados por lectura sucia y last-write-wins).
--
-- Default 0 para filas existentes; NOT NULL para forzar gestion JPA.
-- =============================================================================

ALTER TABLE savings_goals
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN savings_goals.version IS 'FEAT-024 - JPA optimistic lock (BUG-Q-008 fix)';
