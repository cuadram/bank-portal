-- =============================================================================
-- V32__fix_savings_goal_category_typo.sql
-- =============================================================================
-- BUG-S26-Q-001 (CRITICA) · QA Sprint 26 · FEAT-024
--
-- Fix: V30__seed_test_dataset_complete.sql linea 414 inserto category='VIAJES'
-- (plural, valor de PFM transactions) en savings_goals, pero el enum de dominio
-- GoalCategory define el valor singular 'VIAJE'. Resultado: GET /api/v1/savings/goals
-- responde 400 con "No enum constant GoalCategory.VIAJES" para cualquier usuario
-- con seed cargado, bloqueando el listado del feature en STG/Demo.
--
-- NO se edita V30 (ya aplicada en cualquier entorno persistente). Esta migracion
-- normaliza el dato existente y queda como evidencia historica del fix.
--
-- Idempotente: la clausula WHERE no impacta filas ya correctas.
-- =============================================================================

UPDATE savings_goals
SET category = 'VIAJE'
WHERE category = 'VIAJES';
