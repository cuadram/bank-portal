-- V18b — DROP columnas plain de push_subscriptions (FEAT-016 Sprint 18 / DEBT-028 cleanup)
-- Prerequisito: verificar que ninguna query activa referencia auth_plain o p256dh_plain
-- Ejecutar solo en Semana 2 post-validación STG

ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS auth_plain;
ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS p256dh_plain;
