# Runbook — BankPortal Backend · v1.25.0

## Informacion del servicio

| Campo | Valor |
|---|---|
| **Version** | v1.25.0 |
| **Puerto backend** | 8181 |
| **Puerto frontend** | 4201 |
| **Health endpoint** | http://localhost:8181/actuator/health |
| **Logs backend** | docker logs bankportal-backend |
| **Logs frontend** | docker logs bankportal-frontend |
| **Dependencias** | PostgreSQL · Redis · Flyway V28 |

---

## Arranque y parada

```bash
# Arranque completo
docker compose -f infra/compose/docker-compose.yml up -d

# Parada
docker compose -f infra/compose/docker-compose.yml down

# Restart solo backend
docker compose -f infra/compose/docker-compose.yml restart backend

# Verificar estado
docker compose -f infra/compose/docker-compose.yml ps
curl http://localhost:8181/actuator/health
```

---

## Verificacion post-deploy v1.25.0

```bash
# 1. Health check general
curl -s http://localhost:8181/actuator/health | python3 -m json.tool

# 2. Flyway V28 ejecutada
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"

# 3. Tablas PFM presentes (4 esperadas)
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'pfm_%' ORDER BY 1;"

# 4. Seed de categorias (72 reglas esperadas)
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT category_code, COUNT(*) FROM pfm_category_rules GROUP BY 1 ORDER BY 2 DESC;"

# 5. Smoke test completo (20 checks esperados)
chmod +x infra/compose/smoke-test-v1.25.0.sh
./infra/compose/smoke-test-v1.25.0.sh
```

---

## Procedimiento de rollback a v1.24.0

**SLA rollback: 10 minutos**

```bash
# Paso 1: Parar servicios
docker compose -f infra/compose/docker-compose.yml stop backend frontend

# Paso 2: Revertir Flyway (tablas PFM son aditivas — sin datos PFM en PROD aun)
docker exec bankportal-postgres psql -U bankportal -d bankportal -c "
  DROP TABLE IF EXISTS pfm_budget_alerts;
  DROP TABLE IF EXISTS pfm_budgets;
  DROP TABLE IF EXISTS pfm_user_rules;
  DROP TABLE IF EXISTS pfm_category_rules;
  DELETE FROM flyway_schema_history WHERE version = '28';"

# Paso 3: Actualizar tags en docker-compose.yml
#   bankportal-backend: v1.24.0
#   bankportal-frontend: v1.24.0

# Paso 4: Arrancar version anterior
docker compose -f infra/compose/docker-compose.yml up -d backend frontend

# Paso 5: Verificar
curl -s http://localhost:8181/actuator/health
./infra/compose/smoke-test-v1.24.0.sh

# Paso 6: Notificar al PM y al cliente
# Paso 7: Registrar causa raiz en LESSONS_LEARNED.md
```

---

## Endpoints FEAT-023 PFM (reales — PfmController)

| Metodo | Endpoint | Descripcion | Auth |
|---|---|---|---|
| GET | /api/v1/pfm/overview | Movimientos categorizados + KPIs mes actual | JWT |
| GET | /api/v1/pfm/budgets | Lista presupuestos del usuario | JWT |
| POST | /api/v1/pfm/budgets | Crear presupuesto (max 10/usuario) | JWT |
| DELETE | /api/v1/pfm/budgets/{id} | Eliminar presupuesto | JWT |
| GET | /api/v1/pfm/analysis | Analisis comparativo mes actual vs anterior | JWT |
| GET | /api/v1/pfm/distribution | Distribucion por categoria + top-10 comercios | JWT |
| PUT | /api/v1/pfm/movimientos/{txId}/category | Override manual + persiste regla | JWT |
| GET | /api/v1/pfm/widget | Resumen para widget dashboard (degradacion elegante) | JWT |

> **Nota:** la ruta de override esta en espanol (`/movimientos/`) — no `/movements/`.
> El top-10 comercios esta integrado dentro de `/distribution`, no es un endpoint aparte.
> El umbral de alerta se configura en el `POST /budgets` (campo `thresholdPercent`), no hay endpoint dedicado.

---

## Alertas y respuesta

| Alerta | Causa probable | Accion |
|---|---|---|
| pfm/overview 500 | Error en PfmCategorizationService o BD | Revisar logs: docker logs bankportal-backend --tail 100 |
| pfm/widget degradado en dashboard | Timeout endpoint widget — log.warn activo | Normal si BD lenta; revisar p95 en metrics |
| pfm_category_rules 0 filas | Flyway V28 no ejecutada o rollback parcial | Re-ejecutar: docker compose up -d (Flyway re-applies) |
| BUDGET_ALERT no llega | NotificationService caido (FEAT-014) | Verificar servicio notificaciones |
| Health check failing | BD o Redis no disponible | docker compose restart db redis |

---

## Comandos utiles

```bash
# Logs en tiempo real
docker logs -f bankportal-backend

# Logs ultimas 2 horas
docker logs --since 2h bankportal-backend

# Consultar presupuestos en BD (diagnostico) — columna correcta: budget_month
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT user_id, category_code, amount_limit, budget_month FROM pfm_budgets LIMIT 20;"

# Consultar alertas disparadas
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT * FROM pfm_budget_alerts WHERE fired = true ORDER BY fired_at DESC LIMIT 10;"

# Verificar reglas de usuario
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT user_id, concept_pattern, category_code FROM pfm_user_rules LIMIT 20;"
```

---

*DevOps Agent · SOFIA v2.7 · Sprint 25 · FEAT-023 · BankPortal · Banco Meridian*
*Actualizado 2026-04-17 — endpoints alineados con PfmController.java*
