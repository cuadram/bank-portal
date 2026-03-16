# Release Notes — v1.6.0

## Metadata

| Campo | Valor |
|---|---|
| **Release** | v1.6.0 |
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 7 (Semana 1) |
| **Fecha** | 2026-06-09 |
| **Rama** | `feature/FEAT-006-sprint7` → `main` |
| **Deploy** | Kubernetes rolling update — 0 downtime |
| **Autor** | SOFIA DevOps Agent |

---

## Resumen de cambios

### ✅ DEBT-008 — Dashboard paralelo (CompletableFuture.allOf)

El `SecurityDashboardUseCase` migra de ejecución secuencial (~45ms) a paralela con `CompletableFuture.allOf()`, reduciendo la latencia del endpoint `GET /api/v1/security/dashboard` en ~4×. Latencia STG verificada: **11ms** (objetivo: < 30ms). Se añade un `ThreadPoolTaskExecutor` dedicado (`dashboardExecutor`, core=6, max=30) con timeout de seguridad de 5s configurable vía `SOFIA_DASHBOARD_TIMEOUT_SECONDS`.

### ✅ US-403 — Preferencias de seguridad unificadas

Nueva sección "Preferencias de seguridad" en el Panel de Auditoría (`/security/audit/prefs`). El usuario puede gestionar: timeout de sesión (guardado automático), preferencias de notificaciones por tipo de evento, y ver el estado del 2FA con enlace a gestión. El disclaimer de R-F5-003 (audit_log siempre activo, PCI-DSS req. 10.2) es siempre visible e incolapsable.

### ✅ US-601 — Bloqueo automático de cuenta

La cuenta se bloquea automáticamente tras **10 intentos fallidos consecutivos** de OTP en 24h. El sistema emite avisos progresivos desde el intento 7 (`attemptsRemaining` en el response). Cualquier intento posterior devuelve HTTP 423. El email de notificación de bloqueo está aislado en try-catch — el bloqueo en BD persiste aunque el SMTP falle transitoriamente.

**Cumplimiento:** PCI-DSS 4.0 req. 8.3.4.

### ✅ US-604 — Historial de cambios de configuración

Nuevo endpoint `GET /api/v1/security/config-history` y vista Angular `ConfigHistoryComponent` con paginación, filtro por tipo de evento e indicador visual `unusualLocation` para cambios desde subnets no habituales. No requiere tabla nueva en BD — filtra `audit_log` por `event_category = 'CONFIG_CHANGE'`.

**Cumplimiento:** PCI-DSS 4.0 req. 10.2.

---

## Cambios técnicos por capa

### Backend (Java 17 · Spring Boot 3.x)

| Archivo | Cambio |
|---|---|
| `AccountLockUseCase.java` | NUEVO — lógica US-601, aviso progresivo, try-catch email (RV-S7-001) |
| `AccountLockUseCaseTest.java` | NUEVO — 9 tests incluyendo tolerancia a fallo SMTP |
| `SecurityAuditController.java` | MODIFICADO — Javadoc completo, endpoint `/config-history` |
| `DashboardExecutorConfig.java` | NUEVO — ThreadPoolTaskExecutor para DEBT-008 |
| `SecurityDashboardUseCase.java` | MODIFICADO — CompletableFuture.allOf() |
| `V8__account_lock_and_known_subnets.sql` | NUEVO — Flyway V8 |

### Frontend (Angular 17)

| Archivo | Cambio |
|---|---|
| `security-preferences.component.ts/html` | MODIFICADO — Signals, disclaimer R-F5-003, isDirty |
| `config-history.component.ts/html` | NUEVO — paginación, filtro, estado vacío |
| `config-history-item.component.ts` | NUEVO — presentacional |
| `security-audit.service.ts` | MODIFICADO — `getConfigHistory()` añadido |
| `security-audit.routes.ts` | MODIFICADO — ruta `/config-history` |

### Arquitectura / Contratos

| Artefacto | Cambio |
|---|---|
| `openapi-2fa.yaml` | v1.4.0 → **v1.4.1** — endpoint + schemas config-history |
| `ADR-011` | Estado PROPUESTO → **ACEPTADO** |
| `deployment.yaml` | v1.4.0 → **v1.6.0** — 4 env vars nuevas (account lock + dashboard timeout) |

---

## Variables de entorno nuevas (secrets y configuración)

| Variable | Destino | Tipo | Valor por defecto |
|---|---|---|---|
| `ACCOUNT_LOCK_MAX_ATTEMPTS` | K8s ConfigMap | Int | `10` |
| `ACCOUNT_LOCK_WARNING_THRESHOLD` | K8s ConfigMap | Int | `7` |
| `ACCOUNT_LOCK_WINDOW_HOURS` | K8s ConfigMap | Int | `24` |
| `ACCOUNT_UNLOCK_LINK_TTL_SECONDS` | K8s ConfigMap | Int | `3600` |
| `ACCOUNT_UNLOCK_HMAC_KEY` | K8s Secret `bankportal-account-secrets` | Secret | — |
| `JWT_CONTEXT_PENDING_TTL_SECONDS` | K8s ConfigMap | Int | `900` |
| `SOFIA_DASHBOARD_TIMEOUT_SECONDS` | K8s ConfigMap | Int | `5` |
| `UNLOCK_BASE_URL` | K8s ConfigMap | String | `https://api.bankportal.meridian.com/v1/account/unlock` |

> ⚠️ **Acción requerida antes del deploy PROD:** crear el secret `bankportal-account-secrets` con la clave `ACCOUNT_UNLOCK_HMAC_KEY` (HMAC-SHA256, 32 bytes, generado con `openssl rand -hex 32`).

---

## Flyway V8 — Migración de BD

```sql
-- V8__account_lock_and_known_subnets.sql
-- Se ejecuta automáticamente en el arranque del servicio
-- STG: verificado sin errores con datos de volumen

ALTER TABLE users
  ADD COLUMN account_status        VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN failed_otp_attempts   INT         NOT NULL DEFAULT 0,
  ADD COLUMN failed_attempts_since TIMESTAMP,
  ADD COLUMN locked_at             TIMESTAMP,
  ADD COLUMN lock_unlock_token     VARCHAR(128);

CREATE TABLE known_subnets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subnet     VARCHAR(32) NOT NULL,
    first_seen TIMESTAMP NOT NULL DEFAULT now(),
    last_seen  TIMESTAMP NOT NULL DEFAULT now(),
    confirmed  BOOLEAN NOT NULL DEFAULT false
);
```

**Rollback:** `ALTER TABLE users DROP COLUMN account_status, failed_otp_attempts, ...` + `DROP TABLE known_subnets` (coordinar con DBA si hay datos en PROD).

---

## Procedimiento de deploy

```bash
# 1. Verificar secret previo al deploy
kubectl get secret bankportal-account-secrets -n bankportal-prod

# 2. Si no existe, crear:
kubectl create secret generic bankportal-account-secrets \
  --from-literal=ACCOUNT_UNLOCK_HMAC_KEY=$(openssl rand -hex 32) \
  -n bankportal-prod

# 3. Aplicar el deployment
kubectl apply -f infra/k8s/backend-2fa/deployment.yaml

# 4. Verificar rollout
kubectl rollout status deployment/bankportal-2fa -n bankportal-prod --timeout=300s

# 5. Health check post-deploy
curl https://api.bankportal.meridian.com/actuator/health/readiness
```

---

## Rollback

```bash
# Revertir al deployment anterior
kubectl rollout undo deployment/bankportal-2fa -n bankportal-prod

# Verificar
kubectl rollout status deployment/bankportal-2fa -n bankportal-prod
```

> ⚠️ El rollback NO revierte Flyway V8. Las columnas nuevas en `users` y la tabla `known_subnets` permanecen. La versión anterior ignora estas columnas sin error.

---

## Métricas de calidad

| Métrica | Valor |
|---|---|
| Test cases QA | 24 PASS / 0 FAIL |
| Cobertura Gherkin | 100% (9/9 escenarios) |
| Defectos abiertos | 0 |
| Cobertura unitaria backend | 94% |
| Cobertura unitaria Angular | 91% |
| Latencia dashboard STG | 11ms (objetivo < 30ms ✅) |
| Vulnerabilidades Trivy CRITICAL/HIGH | 0 |

---

*SOFIA DevOps Agent · BankPortal · Sprint 7 · 2026-06-09*
*Doble gate QA aprobado: QA Lead + Product Owner · 2026-06-09*
