# Runbook — backend-2fa v1.21.0
## BankPortal — Banco Meridian | FEAT-019 Centro de Privacidad GDPR

**Versión:** v1.21.0 | **Sprint:** 21 | **Fecha:** 2026-03-31
**Generado por:** SOFIA DevOps Agent v2.3

---

## Información del servicio

| Campo | Valor |
|---|---|
| Puerto interno | 8080 |
| Health endpoint | `GET /actuator/health` |
| Métricas | `GET /actuator/prometheus` |
| Logs | `docker logs backend-2fa` / `kubectl logs deployment/backend-2fa` |
| Imagen | `backend-2fa:v1.21.0` |
| Flyway versión activa | V22 |

**Dependencias:**
- PostgreSQL 16 (tablas: `users`, `consent_history`, `gdpr_requests`, `export_audit_log`)
- Redis 7 (JWT blacklist, sesiones)
- Notificación push (FEAT-014) — para data-export completado

---

## Módulos nuevos en v1.21.0 (FEAT-019)

| Módulo | Paquete | Descripción |
|---|---|---|
| `privacy` | `com.experis.sofia.bankportal.privacy` | Centro de privacidad GDPR completo |
| `profile` | `com.experis.sofia.bankportal.profile` | Perfil de usuario (DEBT-039 resuelto) |

---

## Arranque y verificación

```bash
# Docker Compose (entorno local/STG)
docker compose build --no-cache backend-2fa
docker compose up -d backend-2fa

# Verificar arranque correcto (esperar Flyway V22)
docker logs -f backend-2fa 2>&1 | grep -E "Started|Flyway|ERROR"

# Health check
curl -f http://localhost:8080/actuator/health
# Respuesta esperada: {"status":"UP"}

# Verificar Flyway V22 aplicada
curl http://localhost:8080/actuator/flyway
# Debe mostrar V22__profile_gdpr.sql con estado SUCCESS
```

---

## Endpoints críticos — verificación post-deploy

```bash
# Obtener token de prueba
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@meridian.es","password":"Test@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken','ERROR'))")

echo "Token: ${TOKEN:0:20}..."

# Verificar endpoints FEAT-019
curl -s -o /dev/null -w "GET /profile → %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/profile

curl -s -o /dev/null -w "GET /privacy/consents → %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/privacy/consents

curl -s -o /dev/null -w "POST /privacy/data-export → %{http_code}\n" \
  -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/privacy/data-export

# Verificar protección admin (debe dar 403 con USER token)
curl -s -o /dev/null -w "GET /admin/gdpr-requests con USER → %{http_code} (esperado 403)\n" \
  -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/admin/gdpr-requests
```

---

## SLA job — GdprRequestService.checkSlaAlerts

El scheduler ejecuta **diariamente a las 08:00** para detectar solicitudes GDPR
próximas a vencer (< 5 días).

```bash
# Verificar que el scheduler está activo en logs
docker logs backend-2fa 2>&1 | grep "FEAT-019.*SLA"

# Si no hay logs del scheduler, verificar AsyncConfig y @EnableScheduling
# Forzar ejecución en entorno de prueba (solo DEV):
curl -X POST http://localhost:8080/actuator/scheduledtasks
```

---

## Alertas y respuesta

| Alerta | Causa probable | Acción |
|---|---|---|
| `consent_history` — INSERT fallando | Constraint `chk_consent_tipo` — tipo inválido | Verificar payload del cliente |
| `gdpr_requests` — INSERT fallando | `sla_deadline` NULL en `@PrePersist` | Verificar que `GdprRequest.prePersist()` se ejecuta |
| `DataExportService` — 409 inesperado | Race condition (DEBT-040) | Aplicar unique index parcial (parche pendiente S21) |
| `requestDeletion` — acepta OTP inválido | DEBT-041 no resuelto | Prioridad: integrar `OtpService` antes del cierre S21 |
| `AdminGdprController` — 403 con ADMIN | Rol configurado incorrectamente en JWT | Verificar claims del token — debe incluir `ROLE_ADMIN` |
| Flyway V22 fallida | Script DDL con error | Ver logs Flyway — verificar `V22__profile_gdpr.sql` |

---

## Rollback a v1.20.0

```bash
# 1. Detener v1.21.0
docker compose stop backend-2fa frontend-portal

# 2. Actualizar docker-compose.yml a imagen v1.20.0
sed -i 's/backend-2fa:v1.21.0/backend-2fa:v1.20.0/g' docker-compose.yml
sed -i 's/frontend-portal:v1.21.0/frontend-portal:v1.20.0/g' docker-compose.yml

# 3. Arrancar versión anterior
docker compose up -d backend-2fa frontend-portal

# 4. Verificar
curl -f http://localhost:8080/actuator/health

# 5. Nota sobre Flyway V22:
# Las tablas consent_history y gdpr_requests son additive — no es necesario
# eliminarlas para que v1.20.0 funcione. El backend simplemente no las usará.
# Solo eliminar si hay conflicto de migración al re-aplicar V22 en el futuro.

# 6. Notificar PM y documentar causa raíz
```

---

## Comandos útiles

```bash
# Ver logs últimas 2h
docker logs --since 2h backend-2fa

# Ver logs en tiempo real filtrando FEAT-019
docker logs -f backend-2fa 2>&1 | grep "FEAT-019"

# Ver logs del SLA scheduler
docker logs backend-2fa 2>&1 | grep "SLA ALERT"

# Ver audit log de accesos admin GDPR
docker logs backend-2fa 2>&1 | grep "GDPR-AUDIT"

# Contar solicitudes activas en BD
docker compose exec db psql -U bankportal -c \
  "SELECT tipo, estado, COUNT(*) FROM gdpr_requests GROUP BY tipo, estado;"

# Contar consentimientos por tipo
docker compose exec db psql -U bankportal -c \
  "SELECT tipo, valor_nuevo, COUNT(*) FROM consent_history GROUP BY tipo, valor_nuevo ORDER BY tipo;"

# Verificar que tablas V22 existen
docker compose exec db psql -U bankportal -c \
  "SELECT table_name FROM information_schema.tables WHERE table_name IN ('consent_history','gdpr_requests');"
```

---

## Variables de entorno requeridas (sin cambios en v1.21.0)

| Variable | Descripción | Cambio en v1.21.0 |
|---|---|---|
| `DB_URL` | Connection string PostgreSQL | Sin cambio |
| `DB_USERNAME` / `DB_PASSWORD` | Credenciales BD | Sin cambio |
| `JWT_SECRET` | Clave HMAC JWT | Sin cambio |
| `REDIS_URL` | URL Redis (blacklist) | Sin cambio |

> FEAT-019 no introduce nuevas variables de entorno.

---

*Generado por SOFIA DevOps Agent v2.3 — 2026-03-31*
*Pipeline: Sprint 21 / FEAT-019 / Step 7*
