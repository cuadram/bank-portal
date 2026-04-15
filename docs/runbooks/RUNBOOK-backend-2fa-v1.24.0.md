# Runbook Operacional — BankPortal v1.24.0
## Sprint 24 · FEAT-022 Bizum P2P
**Fecha:** 15/04/2026 · **SOFIA v2.7** · **CMMI L3 — CM**

---

## 1. Arranque del Stack (STG)

```bash
cd infra/compose && ./start-local.sh
```

Servicios:
- `postgres`: localhost:5433 (bankportal / bankportal_stg_2026)
- `redis`: localhost:6380 (pass: redis_stg_2026)
- `mailhog`: localhost:1025 (SMTP) / localhost:8025 (Web UI)
- `backend`: localhost:8081
- `frontend`: localhost:4201

**OTP STG bypass:** `totp.stg-bypass-code=123456` en `application-staging.yml`

---

## 2. Variables de Entorno Bizum

```properties
bank.bizum.limit.per-operation-eur=500
bank.bizum.limit.daily-eur=2000
bank.bizum.limit.daily-reset-cron=0 0 0 * * *
spring.redis.url=redis://:redis_stg_2026@redis:6379
```

---

## 3. Flyway — Verificación V27

```bash
docker exec bankportal-postgres psql -U bankportal -d bankportal \
  -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

Esperado: `V27 | bizum | <timestamp>`

---

## 4. Smoke Tests Bizum

```bash
# Estado Bizum del usuario
TOKEN=$(curl -s -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a.delacuadra@nemtec.es","password":"Meridian2026!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -s http://localhost:8081/api/v1/bizum/status \
  -H "Authorization: Bearer $TOKEN"
# Esperado: {"active":true,"phoneMasked":"+34 *** XXXX","dailyLimit":2000,...}
```

---

## 5. Rollback

Si falla V27__bizum.sql:

```bash
docker exec bankportal-postgres psql -U bankportal -d bankportal << 'SQL'
DROP TABLE IF EXISTS bizum_requests CASCADE;
DROP TABLE IF EXISTS bizum_payments CASCADE;
DROP TABLE IF EXISTS bizum_activations CASCADE;
DELETE FROM flyway_schema_history WHERE version = '27';
SQL
docker restart bankportal-backend
```

---

## 6. Monitorización

| Endpoint | Esperado |
|---|---|
| `GET /actuator/health` | `{"status":"UP"}` |
| `GET /actuator/health/liveness` | `{"status":"UP"}` |
| Redis: `KEYS ratelimit:*:bizum:*` | Keys de rate-limit activas |

---

## 7. Contacto

- **SOFIA DevOps Agent** — Experis / ManpowerGroup
- **Cliente:** Banco Meridian
- **Proyecto:** BankPortal v1.24.0

*SOFIA v2.7 · CMMI Level 3 · Confidencial*
