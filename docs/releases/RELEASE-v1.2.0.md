# Release Notes — v1.2.0 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.2.0 |
| **Fecha** | 2026-04-25 |
| **Sprint** | Sprint 3 |
| **Cliente** | Banco Meridian |
| **Release Manager** | (pendiente firma Go/No-Go) |
| **Servicios desplegados** | `bankportal-backend-2fa` · `frontend-portal` |
| **Rama** | `feature/FEAT-002-session-management` → `main` |
| **Tag git** | `v1.2.0` |

---

## Sprint Goal alcanzado

> "Iniciar FEAT-002: sesiones activas visibles, revocación remota con OTP y control de concurrencia. Resolver DEBT-003 (REST semántico DELETE→POST)."
>
> **Estado: ✅ ALCANZADO — 24/24 SP entregados**

---

## Nuevas funcionalidades

### FEAT-002 — Gestión Avanzada de Sesiones

| US | Funcionalidad | Endpoints |
|---|---|---|
| US-101 | Ver sesiones activas con dispositivo, IP enmascarada y última actividad | `GET /api/v1/sessions` |
| US-102 | Cerrar sesión remota individual o todas (confirmación OTP) | `DELETE /api/v1/sessions/{id}` · `DELETE /api/v1/sessions` |
| US-103 | Timeout de inactividad configurable: 15/30/60 min (máx. 60, PCI-DSS) | `PUT /api/v1/sessions/timeout` |
| US-104 | Control de concurrencia: máx. 3 sesiones · evicción LRU automática | (interno en login flow) |
| US-105 | Notificación email en login desde dispositivo nuevo · enlace "No fui yo" | `GET /api/v1/sessions/deny/{token}` |

**Componentes Angular nuevos:**
- Panel `SecuritySettingsComponent` en `/security/sessions`
- `SessionCardComponent` — tarjeta por sesión con accesibilidad WCAG 2.1 AA
- `RevokeConfirmModalComponent` — modal OTP con focus trap
- `SessionStore` (NgRx Signal Store)

---

## Deuda técnica resuelta

| ID | Descripción |
|---|---|
| DEBT-003 | `DELETE /api/v1/2fa/deactivate` → `POST /api/v1/2fa/deactivate` operativo · DELETE marcado deprecated |

---

## Infraestructura nueva

| Componente | Cambio |
|---|---|
| PostgreSQL | Nuevas tablas `user_sessions` + `known_devices` · columna `session_timeout_minutes` en `users` (Flyway V5) |
| Redis | Nuevos namespaces `sessions:blacklist:*` y `sessions:active:*` |
| SMTP | Integración SendGrid / SES para alertas de seguridad |
| `TokenBlacklistFilter` | `OncePerRequestFilter` antes de Spring Security — invalidación de JWT en O(1) |

---

## Breaking changes

Ninguno. Todos los cambios son compatibles hacia atrás.

> ⚠️ `DELETE /api/v1/2fa/deactivate` está deprecated desde v1.1.0. Usar `POST /api/v1/2fa/deactivate`.
> Se eliminará en v2.0.0.

---

## Nuevos secrets requeridos antes del deploy

```bash
# bankportal-session-secrets (NUEVO en Sprint 3)
kubectl create secret generic bankportal-session-secrets \
  --from-literal=SESSION_DENY_LINK_HMAC_KEY=$(openssl rand -hex 32) \
  -n bankportal-prod

# bankportal-email-secrets (NUEVO en Sprint 3)
kubectl create secret generic bankportal-email-secrets \
  --from-literal=EMAIL_API_KEY=<sendgrid-api-key> \
  -n bankportal-prod
```

---

## Servicios afectados

| Servicio | Versión anterior | Versión nueva | Namespace |
|---|---|---|---|
| `bankportal-backend-2fa` | v1.1.0 | v1.2.0 | `bankportal-prod` |
| `frontend-portal` | v1.1.0 | v1.2.0 | `bankportal-prod` |

---

## Checklist de release

- [ ] `bankportal-session-secrets` creado en K8s PROD
- [ ] `bankportal-email-secrets` creado en K8s PROD
- [ ] Flyway V5 migración ejecutada en BD PROD (automático en startup)
- [ ] Redis AOF habilitado en PROD (`appendonly yes`)
- [ ] Smoke test PROD: `GET /api/v1/health` → 200
- [ ] Smoke test sesiones: `GET /api/v1/sessions` → 200 con JWT válido
- [ ] Verificar email de alerta en nuevo login (test controlado)

---

## Procedimiento de rollback

```bash
# 1. Imagen anterior
kubectl set image deployment/bankportal-2fa \
  bankportal-2fa=registry.meridian.internal/bankportal-backend-2fa:v1.1.0 \
  -n bankportal-prod

# 2. Verificar rollout
kubectl rollout status deployment/bankportal-2fa -n bankportal-prod

# 3. Flyway: V5 no se revierte automáticamente.
#    Si es necesario: ejecutar rollback manual con script V5__rollback.sql
#    (eliminar tablas user_sessions, known_devices y columna session_timeout_minutes)

# 4. Notificar al PM y al cliente
# 5. Documentar causa raíz en post-mortem
```

---

## Deuda técnica generada en Sprint 3

| ID | Descripción | Impacto | Sprint objetivo |
|---|---|---|---|
| DEBT-004 | `DeviceFingerprintService` — migrar parser manual a ua-parser-java | Bajo | Sprint 4 |
| DEBT-005 | `DELETE /deactivate` sin header `Deprecation: true` | Bajo | Sprint 4 |

---

*Generado por SOFIA DevOps Agent · BankPortal · Sprint 3 · 2026-04-25*
