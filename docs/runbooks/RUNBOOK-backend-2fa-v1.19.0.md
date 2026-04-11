# Runbook — backend-2fa v1.19.0

**BankPortal · Banco Meridian · Sprint 19 · FEAT-017**

| Campo | Valor |
|---|---|
| Versión | v1.19.0 |
| Imagen | backend-2fa:v1.19.0 |
| Feature | FEAT-017 Domiciliaciones y Recibos |
| Generado | 2026-03-27T13:51:37.799108Z |
| Agente | DevOps Agent — SOFIA v2.2 |

---

## Nuevos endpoints — verificación post-deploy

```bash
TOKEN='Bearer eyJ...'
BASE='https://stg.bankportal.bancomeridia.es/api/v1'

# Health check general
curl -s $BASE/actuator/health | jq .status
# Esperado: UP

# Verificar nuevo módulo domiciliaciones
curl -s -H "Authorization: $TOKEN" $BASE/direct-debits/mandates
# Esperado: 200 {content:[], totalElements:0, totalPages:0, hasNext:false}

# Verificar Flyway V19 aplicada
curl -s $BASE/actuator/flyway | jq '.contexts[].flywayBeans[].migrations[] | select(.script | contains("V19"))'
# Esperado: {script: V19__direct_debits.sql, state: SUCCESS}
```

---

## Diagnóstico de problemas comunes

### Flyway V19 falla al arrancar
```bash
docker logs bankportal-backend 2>&1 | grep -A 8 'APPLICATION FAILED'
# Causas comunes:
# - FK a accounts/users no existe → verificar que V1-V18 están aplicadas
# - ENUM type ya existe → DROP TYPE IF EXISTS mandate_type CASCADE
```

### 404 en /api/v1/direct-debits/*
```bash
# Verificar que el bounded context directdebit está registrado en Spring
docker logs bankportal-backend 2>&1 | grep 'DirectDebitController'
# Esperado: Mapped {[/api/v1/direct-debits/mandates],methods=[GET]}
```

### SimulaCobroJob no ejecuta
```bash
# Verificar ShedLock tabla y cron
docker logs bankportal-backend 2>&1 | grep 'SimulaCobroJob'
# El job solo ejecuta en días hábiles a las 08:00
# Verificar que la tabla shedlock existe (V18c debe estar aplicada)
```

### Rate limiting /cards/pin no actúa
```bash
# Verificar PinRateLimitingConfig cargado
docker logs bankportal-backend 2>&1 | grep 'PinRateLimitingConfig'
# Test: 4 intentos rápidos → el 4° debe devolver 429
```

---

## Migraciones incluidas en v1.19.0

| Versión | Script | Estado |
|---|---|---|
| V19 | V19__direct_debits.sql | NUEVO |
| V1-V18c | Scripts anteriores | VIGENTES |

---

## Configuración Jenkinsfile — pipeline CI/CD

Sin cambios en Jenkinsfile respecto a v1.18.0.
El pipeline existente (4 jobs: build/test/security/deploy) cubre v1.19.0.

---

*DevOps Agent · CMMI CM SP 2.2 · SOFIA v2.2 · BankPortal — Banco Meridian · Sprint 19*