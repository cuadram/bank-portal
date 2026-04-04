# Runbook — backend-2fa v1.22.0
## BankPortal · Banco Meridian · Sprint 22

---

## 1. Despliegue

```bash
# 1. Build completo (cambios backend + frontend Angular)
docker compose build --no-cache backend frontend

# 2. Levantar servicios
docker compose up -d

# 3. Verificar estado
docker compose ps
docker compose logs backend --tail=50
```

## 2. Verificación post-despliegue

```bash
# Flyway V24 aplicada
docker compose exec db psql -U bankportal -c \
  "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 3;"

# Smoke test completo
bash infra/compose/smoke-test-v1.22.0.sh

# Health check backend
curl -s http://localhost:8081/actuator/health | python3 -m json.tool
```

## 3. Endpoints nuevos — verificación manual

```bash
TOKEN="Bearer <JWT_VALIDO>"

# Listado préstamos
curl -H "Authorization: $TOKEN" http://localhost:8081/api/v1/loans

# Simulación (sin auth fuerte)
curl -X POST -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
  -d '{"importe":15000,"plazo":36,"finalidad":"CONSUMO"}' \
  http://localhost:8081/api/v1/loans/simulate

# Notificaciones perfil (DEBT-043)
curl -H "Authorization: $TOKEN" http://localhost:8081/api/v1/profile/notifications
```

## 4. Rollback

```bash
# Rollback a v1.21.0
docker compose stop backend frontend
docker compose pull --policy=always
# Editar docker-compose.yml: image: backend-2fa:v1.21.0
docker compose up -d backend frontend

# NOTA: Flyway V24 NO se revierte automáticamente.
# Si es necesario, ejecutar manualmente:
# docker compose exec db psql -U bankportal -c \
#   "DROP TABLE IF EXISTS loan_audit_log, loan_applications, loans CASCADE;"
# Y eliminar registro V24 de flyway_schema_history.
```

## 5. Monitorización

- Logs: `docker compose logs -f backend`
- Métricas: `http://localhost:8081/actuator/metrics`
- Endpoint crítico a monitorizar: `POST /api/v1/loans/applications` (OTP + scoring)

---

*SOFIA DevOps Agent — Sprint 22 — 2026-04-02*
