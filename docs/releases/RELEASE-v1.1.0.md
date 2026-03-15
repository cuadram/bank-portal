# Release Notes — v1.1.0 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.1.0 |
| **Fecha release** | 2026-04-10 |
| **Sprint** | Sprint 2 |
| **Proyecto** | BankPortal — Portal Bancario Digital |
| **Cliente** | Banco Meridian |
| **Aprobado por** | Release Manager — Experis |
| **QA doble gate** | QA Lead ✅ + Product Owner ✅ |
| **Servicios desplegados** | `backend-2fa` v1.1.0 · `frontend-portal` v1.1.0 |

---

## FEAT-001 — Completada al 100%

Esta versión completa la implementación de Autenticación de Doble Factor (2FA)
iniciada en v1.0.0. El módulo cumple todos los requisitos PCI-DSS 4.0 (req. 8.4)
e ISO 27001 A.9.4.

### Nuevas funcionalidades (Sprint 2)

| ID | Descripción | SP |
|---|---|---|
| US-004 | Desactivar 2FA con confirmación de contraseña | 5 |
| US-005 | Auditoría completa e inmutable de eventos 2FA | 5 |
| US-007 | Suite E2E Playwright automatizada | 6 |

### Deuda técnica resuelta

| ID | Descripción | Impacto |
|---|---|---|
| DEBT-001 | RateLimiterService → Bucket4j + Redis distribuido | Soporte multi-réplica |
| DEBT-002 | JwtService → JJWT RSA-256 con keypair real | Seguridad mejorada + JWKS ready |

---

## Cambios de infraestructura

### Nuevas variables de entorno requeridas en v1.1.0

| Variable | Descripción | Requerida |
|---|---|---|
| `SPRING_REDIS_URL` | URL de Redis para rate limiting distribuido | ✅ Obligatoria |
| `JWT_PRIVATE_KEY` | Clave privada RSA-2048 en base64 PKCS8 | ✅ Obligatoria |
| `JWT_PUBLIC_KEY` | Clave pública RSA-2048 en base64 X509 | ✅ Obligatoria |

**Generar keypair RSA-256 (ejecutar antes del deploy):**
```bash
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
cat jwt-private.pem | base64 -w 0   # → JWT_PRIVATE_KEY
cat jwt-public.pem  | base64 -w 0   # → JWT_PUBLIC_KEY
```

### Nuevas migraciones Flyway

| Migración | Descripción |
|---|---|
| V4 | `audit_log` inmutable — REVOKE UPDATE/DELETE + trigger PG |
| V5 | Índices compuestos adicionales para consultas de auditoría |

### Kubernetes — actualizar Secret con nuevas variables

```bash
kubectl patch secret backend-2fa-secrets -n bankportal \
  --type=json \
  -p='[
    {"op":"add","path":"/data/SPRING_REDIS_URL","value":"<base64>"},
    {"op":"add","path":"/data/JWT_PRIVATE_KEY","value":"<base64>"},
    {"op":"add","path":"/data/JWT_PUBLIC_KEY","value":"<base64>"}
  ]'
kubectl rollout restart deployment/backend-2fa -n bankportal
```

---

## Breaking Changes

> ⚠️ **Variables de entorno `JWT_FULL_SECRET` y `JWT_PARTIAL_SECRET` ya no son necesarias.**
> Con la migración a RSA-256 (DEBT-002), estas variables quedan obsoletas.
> Se pueden eliminar del Secret tras verificar que el deploy de v1.1.0 es estable.
> **No eliminar durante el deploy inicial** — esperar a que los health checks pasen.

---

## Servicios afectados

| Servicio | v anterior | v nueva | Cambios |
|---|---|---|---|
| `backend-2fa` | v1.0.0 | v1.1.0 | Redis + RSA-256 + US-004/005 |
| `frontend-portal` | v1.0.0 | v1.1.0 | Deactivate2FAComponent + E2E suite |

---

## Procedimiento de rollback a v1.0.0

```bash
# 1. Rollback imagen
kubectl rollout undo deployment/backend-2fa -n bankportal

# 2. Las migraciones V4/V5 son aditivas — no requieren rollback de BD
# 3. Restaurar variables de entorno antiguas si fuera necesario:
#    JWT_FULL_SECRET y JWT_PARTIAL_SECRET (conservar en Secret hasta confirmación)

# 4. Verificar
kubectl rollout status deployment/backend-2fa -n bankportal
curl -sf https://api.bankportal.meridian.com/actuator/health/readiness
```

---

## FEAT-001 — Estado final v1.1.0

| US | Descripción | SP | Estado |
|---|---|---|---|
| US-006 | Setup TOTP | 3 | ✅ v1.0.0 |
| US-001 | Activar 2FA | 8 | ✅ v1.0.0 |
| US-002 | Verificar OTP login | 8 | ✅ v1.0.0 |
| US-003 | Recovery codes | 5 | ✅ v1.0.0 |
| US-004 | Desactivar 2FA | 5 | ✅ v1.1.0 |
| US-005 | Auditoría inmutable | 5 | ✅ v1.1.0 |
| US-007 | Suite E2E | 6 | ✅ v1.1.0 |
| **Total** | | **40 SP** | **✅ COMPLETA** |

**PCI-DSS 4.0 req. 8.4: ✅ CUMPLE · ISO 27001 A.9.4: ✅ CUMPLE**

---

*SOFIA DevOps Agent — Experis · 2026-04-10*
