-- DEBT-064 · Setup idempotente de la BD de integracion (perfil integration-compose)
-- Crea rol de test dedicado (sin secreto real) y BD propia, aislada de la BD dev.
--
-- PRECONDICION COMPLETA (desde la raiz del repo):
--   1) Levantar servicios (postgres del compose base + redis-it sin auth):
--      docker compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.it.yml up -d postgres redis-it
--   2) Crear rol+BD de test (este script):
--      cat apps/backend-2fa/src/test/resources/it-db/it-db-setup.sql | docker exec -i bankportal-postgres psql -U bankportal -d bankportal -v ON_ERROR_STOP=1
--   3) Ejecutar los IT:
--      mvn -Pintegration-compose verify   (en apps/backend-2fa)
--
-- Endpoints (ver application-integration-compose.yml): pg localhost:5433/bankportal_it, redis localhost:6381, mail localhost:1025.
-- Reproducible en local y CI. Password local-only, no es secreto de produccion.
DROP DATABASE IF EXISTS bankportal_it;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bankportal_it') THEN
    CREATE ROLE bankportal_it LOGIN PASSWORD 'it_local_only';
  END IF;
END
$$;
CREATE DATABASE bankportal_it OWNER bankportal_it;
\connect bankportal_it
ALTER SCHEMA public OWNER TO bankportal_it;
GRANT ALL ON SCHEMA public TO bankportal_it;
