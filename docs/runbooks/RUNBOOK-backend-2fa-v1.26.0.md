# Runbook — backend-2fa v1.26.0
## BankPortal · Banco Meridian · Sprint 26 · FEAT-024 Objetivos de Ahorro

---

## 1. Despliegue

```bash
# 1. Build (solo si se compila localmente; en CI se descargan imágenes)
cd /Users/cuadram/proyectos/bank-portal
docker compose -f infra/compose/docker-compose.yml build --no-cache backend frontend

# 2. Levantar servicios
docker compose -f infra/compose/docker-compose.yml up -d

# 3. Verificar estado
docker compose -f infra/compose/docker-compose.yml ps
docker compose -f infra/compose/docker-compose.yml logs backend --tail=80
docker compose -f infra/compose/docker-compose.yml logs frontend --tail=40
```

**Puertos expuestos:**
- PostgreSQL: 5433 → 5432 (host → container)
- Redis: 6380 → 6379
- Backend (Spring Boot): 8081 → 8080
- Frontend (Angular nginx): 4201 → 80
- Mailhog: 8025

---

## 2. Verificación post-despliegue

```bash
# Migraciones Flyway V32 y V33 aplicadas
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT version, description, success FROM flyway_schema_history WHERE version IN ('32','33');"

# Tablas de Savings creadas
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'savings_%' OR table_name LIKE 'goal_%' ORDER BY table_name;"

# Smoke test completo (validate-smoke-vs-openapi)
bash infra/compose/smoke-test-v1.26.0.sh

# Health check backend
curl -s http://localhost:8081/actuator/health | python3 -m json.tool

# OpenAPI 3.1 contract activo
curl -s http://localhost:8081/v3/api-docs | python3 -m json.tool | head -30
```

---

## 3. Endpoints nuevos — verificación manual

```bash
# Obtener JWT válido (OTP bypass staging: 123456)
TOKEN="Bearer <JWT_VALIDO>"

# Listar objetivos del usuario
curl -H "Authorization: $TOKEN" http://localhost:8081/api/v1/savings/goals

# Crear objetivo
curl -X POST -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Vacaciones Japón 2027","targetAmount":3000.00,"deadline":"2027-06-30","category":"VIAJE","icon":"plane","sourceAccountId":"<ACCOUNT_ID>"}' \
  http://localhost:8081/api/v1/savings/goals

# Aportar a objetivo
curl -X POST -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"sourceAccountId":"<ACCOUNT_ID>","amount":150.00}' \
  http://localhost:8081/api/v1/savings/goals/<GOAL_ID>/contributions

# Configurar regla automática
curl -X PUT -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"amount":50.00,"dayOfMonth":5,"sourceAccountId":"<ACCOUNT_ID>"}' \
  http://localhost:8081/api/v1/savings/goals/<GOAL_ID>/auto-rule

# Widget dashboard
curl -H "Authorization: $TOKEN" http://localhost:8081/api/v1/savings/dashboard-widget
```

---

## 4. Verificación frontend

- Login con usuario de prueba (OTP bypass `123456` en staging/local-dev).
- Sidebar muestra ítem "Mis Metas".
- Dashboard muestra widget "Mi ahorro del mes" sin errores en consola.
- Crear objetivo → modal se abre, validaciones funcionan, persiste y aparece en lista.
- Aportar → selector multi-cuenta muestra cuentas con saldos reales (no placeholders).
- Smoke 409: ejecutar 10 aportaciones secuenciales rápidas → frontend recupera con mensaje correcto si aparece conflicto.

---

## 5. Procedimiento de rollback a v1.25.0

```bash
# 1. Detener servicios actuales
docker compose -f infra/compose/docker-compose.yml stop backend frontend

# 2. Editar docker-compose.yml para apuntar a las imágenes v1.25.0
#    image: bankportal-backend-2fa:v1.25.0
#    image: bankportal-frontend-portal:v1.25.0

# 3. Rollback Flyway (manual; V32 y V33 NO se revierten automáticamente)
docker exec bankportal-postgres psql -U bankportal -d bankportal -c "
  DROP TABLE IF EXISTS goal_milestones CASCADE;
  DROP TABLE IF EXISTS goal_auto_rules CASCADE;
  DROP TABLE IF EXISTS goal_allocations CASCADE;
  DROP TABLE IF EXISTS savings_goals CASCADE;
  DELETE FROM flyway_schema_history WHERE version IN ('32','33');
"

# 4. Levantar servicios v1.25.0
docker compose -f infra/compose/docker-compose.yml up -d backend frontend

# 5. Validar smoke v1.25.0
bash infra/compose/smoke-test-v1.25.0.sh
```

**RTO objetivo:** 10 min · **RPO:** 0 (todas las operaciones de Savings se aíslan en tablas dedicadas; las cuentas y movimientos preexistentes no se ven afectados por el DROP).

---

## 6. Monitorización

- **Logs en tiempo real:** `docker compose -f infra/compose/docker-compose.yml logs -f backend`
- **Métricas Spring Actuator:** `http://localhost:8081/actuator/metrics`
- **Endpoint crítico — concurrencia 409:** `POST /api/v1/savings/goals/{id}/contributions`
  - Métrica clave: tasa de 409 vs 201 (target < 5 % en producción).
  - Si > 10 % sostenido: revisar saturación del retry optimista en `SavingsContributionService` y considerar activar DEBT-Q-073 antes de S27.
- **Endpoint crítico — auto-rule scheduler:** ejecución diaria a las 06:00 vía ShedLock.
  - Verificar en logs el lock acquisition diario y el conteo de aportaciones procesadas.
  - Si aparece `LockAcquisitionException` repetido: DEBT-051 puede haberse regresado, revisar configuración ShedLock.
- **Notificaciones push:** revisar Mailhog (UI :8025) para verificar entrega en local-dev.

---

## 7. Side-effects conocidos al cierre Step 7

Los siguientes datos quedaron en BBDD local-dev tras smoke C4:
- `savings_goals.id=51000000-...-1101` ("Vacaciones Japón 2027"): `reservedAmount=3060` (modificado desde 2700).
- Auto-rule del goal Vacaciones Japón: `amount=30, dayOfMonth=5`.
- Cuentas usuario angel: 2 (Cuenta Corriente Nómina + Cuenta Ahorro Vacaciones).

Si se desea baseline limpia para validación adicional, ejecutar:
```bash
bash infra/scripts/cleanup-e2e-data-sprint26.sh
docker compose -f infra/compose/docker-compose.yml down -v
docker compose -f infra/compose/docker-compose.yml up -d
```

---

## 8. Configuración relevante

| Aspecto | Valor |
|---|---|
| Java home | `/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home` |
| Maven binary | `/opt/homebrew/bin/mvn` (sin pom raíz; ejecutar desde `apps/backend-2fa`) |
| Imagen backend | `bankportal-backend-2fa:local-dev` (rebuild 2026-05-08 11:09) |
| Imagen frontend | `bankportal-frontend-portal:local-dev` (rebuild 2026-05-08 13:05) |
| Esquema BBDD | `bankportal` versión 33 |
| OTP bypass staging/local | `123456` |
| Branch release | `feature/FEAT-024-sprint26` (tag `v1.26.0` previsto post-G-9) |

---

## 9. Contactos / escalado

- **Release Manager:** DevOps Agent SOFIA (Step 7 cerrado 2026-05-08T13:07Z)
- **HITL DV:** Angel de la Cuadra (G-7 APROBADO 2026-05-10)
- **HITL PM (G-8 pendiente):** Angel de la Cuadra
- **HITL PO (G-9 pendiente):** Angel de la Cuadra
- **Soporte L2 (cliente):** Banco Meridian — tickets vía canal corporativo

---

*SOFIA DevOps Agent · v2.7 · Sprint 26 · FEAT-024 · 2026-05-10*
