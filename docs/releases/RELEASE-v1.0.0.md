# Release Notes — v1.0.0 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.0.0 |
| **Fecha release** | 2026-03-27 |
| **Sprint** | Sprint 1 |
| **Proyecto** | BankPortal — Portal Bancario Digital |
| **Cliente** | Banco Meridian |
| **Aprobado por** | Release Manager — Experis |
| **Doble gate QA** | QA Lead ✅ + Product Owner ✅ |
| **Servicios desplegados** | `backend-2fa` v1.0.0 · `frontend-portal` v1.0.0 |

---

## Nuevas funcionalidades

### FEAT-001 — Autenticación de Doble Factor (2FA) con TOTP

Implementación de autenticación de doble factor basada en TOTP (RFC 6238) en el
portal bancario digital. Satisface los requisitos PCI-DSS 4.0 (req. 8.4) e ISO 27001 A.9.4.

**User Stories entregadas en v1.0.0:**

| ID | Descripción | SP |
|---|---|---|
| US-006 | Setup de infraestructura TOTP | 3 |
| US-001 | Activar 2FA con TOTP (enrolamiento) | 8 |
| US-002 | Verificar OTP en flujo de login con rate limiting | 8 |
| US-003 | Generar y gestionar códigos de recuperación | 5 |
| **Total** | | **24 SP** |

**Funcionalidades incluidas:**
- Enrolamiento 2FA con generación de código QR (compatible con Google Authenticator, Authy, Microsoft Authenticator)
- Verificación OTP en el flujo de login — paso adicional post-credenciales
- Tolerancia temporal ±1 período (±30 s) para evitar fallos por deriva de reloj
- Bloqueo automático tras 5 intentos fallidos (15 minutos, por cuenta+IP)
- Generación de 10 códigos de recuperación one-time con descarga obligatoria
- Uso de códigos de recuperación como alternativa al OTP
- Panel de configuración 2FA en el perfil del usuario
- Registro completo de auditoría de eventos 2FA (PCI-DSS req. 10.7)

---

## Cambios de infraestructura

### Base de datos (PostgreSQL)
Tres migraciones Flyway aplicadas automáticamente al arrancar el servicio:

| Migración | Descripción | Impacto |
|---|---|---|
| V1 | `ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE` | Aditiva — sin rotura |
| V2 | Tablas `totp_secrets` + `recovery_codes` con índices | Nueva — sin impacto en datos existentes |
| V3 | Tabla `audit_log` con índices de auditoría | Nueva — sin impacto en datos existentes |

### Nuevas variables de entorno requeridas — `backend-2fa`

| Variable | Descripción | Requerida |
|---|---|---|
| `TOTP_ENCRYPTION_KEY` | Clave AES-256 en base64 (32 bytes) | ✅ Obligatoria |
| `JWT_PARTIAL_SECRET` | Clave JWT sesión parcial (scope=2fa-pending) | ✅ Obligatoria |
| `JWT_FULL_SECRET` | Clave JWT sesión completa (scope=full-session) | ✅ Obligatoria |
| `TOTP_ISSUER` | Nombre emisor en QR (default: "BankPortal - Banco Meridian") | Opcional |
| `RATE_LIMIT_MAX_ATTEMPTS` | Máx. intentos OTP (default: 5) | Opcional |
| `RATE_LIMIT_BLOCK_MINUTES` | Minutos de bloqueo (default: 15) | Opcional |

**Generar claves:**
```bash
# TOTP_ENCRYPTION_KEY (32 bytes AES-256)
openssl rand -base64 32

# JWT secrets (mínimo 32 chars)
openssl rand -base64 64 | tr -d '\n'
```

### Nuevo microservicio: `backend-2fa`
- Puerto: `8081`
- Health: `GET /actuator/health/readiness`
- Métricas: `GET /actuator/prometheus`
- Deployment K8s: `infra/k8s/backend-2fa/deployment.yaml`
- Réplicas: 2 (con HPA, máx. 8)

---

## Breaking Changes

> ⚠️ **Ninguno.** El módulo JWT existente no fue modificado. Las migraciones de BD son
> totalmente aditivas y compatibles hacia adelante. Los usuarios sin 2FA activo
> continúan con el flujo de login anterior sin ninguna interrupción.

---

## Servicios afectados

| Servicio | Versión anterior | Versión nueva | Target | Estrategia |
|---|---|---|---|---|
| `backend-2fa` | — (nuevo) | v1.0.0 | Kubernetes (PROD + STG + DEV) | Rolling update |
| `frontend-portal` | v0.9.x | v1.0.0 | Kubernetes (PROD + STG + DEV) | Rolling update |

---

## Instrucciones de despliegue

### Pre-requisitos (verificar antes del go/no-go)

```bash
# 1. Crear Kubernetes Secret en namespace PROD (si no existe)
kubectl create secret generic backend-2fa-secrets \
  --from-literal=SPRING_DATASOURCE_URL='jdbc:postgresql://<host>:5432/bankportal' \
  --from-literal=SPRING_DATASOURCE_USERNAME='bankportal_user' \
  --from-literal=SPRING_DATASOURCE_PASSWORD='<password>' \
  --from-literal=TOTP_ENCRYPTION_KEY='<openssl rand -base64 32>' \
  --from-literal=JWT_PARTIAL_SECRET='<min-32-chars>' \
  --from-literal=JWT_FULL_SECRET='<min-32-chars>' \
  -n bankportal

# 2. Verificar que el Secret existe
kubectl get secret backend-2fa-secrets -n bankportal
```

### Despliegue (automático via pipeline Jenkins)

```bash
# El pipeline se dispara al crear el tag:
git tag -a v1.0.0 -m "Sprint 1 — 2FA TOTP core flows"
git push origin v1.0.0
```

### Verificación post-deploy

```bash
# Health check PROD
curl -f https://api.bankportal.meridian.com/actuator/health/readiness

# Verificar rollout
kubectl rollout status deployment/backend-2fa -n bankportal

# Ver logs arranque
kubectl logs -l app=backend-2fa -n bankportal --tail=50
```

---

## Procedimiento de rollback

En caso de fallo post-deploy:

```bash
# Rollback automático del Deployment a la versión anterior
kubectl rollout undo deployment/backend-2fa -n bankportal
kubectl rollout undo deployment/frontend-portal -n bankportal

# Verificar rollback
kubectl rollout status deployment/backend-2fa -n bankportal

# Confirmar health check
curl -f https://api.bankportal.meridian.com/actuator/health/readiness
```

> Las migraciones Flyway V1-V3 son aditivas — no requieren rollback de BD.
> Si se requiere, contactar al DBA para ejecutar rollback manual de las tablas `totp_secrets`, `recovery_codes` y `audit_log` y la columna `totp_enabled`.

---

## Deuda técnica registrada (Sprint 2)

| ID | Descripción | Impacto | Sprint objetivo |
|---|---|---|---|
| DEBT-001 | RateLimiterService migrar a Bucket4j + Redis (multi-réplica) | Medio | Sprint 2 |
| DEBT-002 | JwtService migrar de HS256 a RSA-256 con Vault | Alto | Sprint 2 |

---

*Generado por SOFIA DevOps Agent — 2026-03-14*
*Aprobado por: Release Manager · QA Lead · Product Owner*
