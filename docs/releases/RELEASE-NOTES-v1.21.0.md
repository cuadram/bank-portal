# Release Notes — v1.21.0 — BankPortal

## Metadata
- **Fecha release:** 2026-03-31
- **Sprint:** 21 | **Feature:** FEAT-019 | **Cliente:** Banco Meridian
- **Servicios desplegados:** `backend-2fa` · `frontend-portal`
- **Tag Git:** `v1.21.0`
- **Aprobado por:** Release Manager — SOFIA Pipeline Sprint 21

---

## Nuevas funcionalidades

### FEAT-019 — Centro de Privacidad y Gestión de Identidad Digital (GDPR)

**Objetivo:** Dar al usuario de Banco Meridian control total sobre su identidad digital:
consultar y actualizar perfil, gestionar consentimientos GDPR y ejercer derechos
de portabilidad y supresión.

| US | Jira | Funcionalidad |
|---|---|---|
| RF-019-01/02 | SCRUM-106 | Consulta y actualización de perfil personal |
| RF-019-03 | SCRUM-107 | Gestión de sesiones activas — cierre remoto |
| RF-019-04 | SCRUM-108 | Centro de consentimientos GDPR (Art.7) — historial inmutable |
| RF-019-05 | SCRUM-109 | Portabilidad de datos — JSON firmado SHA-256 (Art.15/20) |
| RF-019-06 | SCRUM-110 | Derecho al olvido — supresión de cuenta en 2 fases (Art.17) |
| RF-019-07 | SCRUM-111 | Panel de administración GDPR — log + SLA 30 días (Art.12) |
| DEBT-036 | SCRUM-112 | ExportAuditService — IBAN real en export_audit_log |
| SCRUM-113 | SCRUM-113 | PdfDocumentGenerator — paginación multi-página |

**Endpoints nuevos:**
```
GET    /api/v1/profile
PATCH  /api/v1/profile
GET    /api/v1/profile/sessions
DELETE /api/v1/profile/sessions/{id}
GET    /api/v1/privacy/consents
PATCH  /api/v1/privacy/consents
POST   /api/v1/privacy/data-export
GET    /api/v1/privacy/data-export/status
POST   /api/v1/privacy/deletion-request
GET    /api/v1/privacy/deletion-request/confirm
GET    /api/v1/admin/gdpr-requests
```

---

## Correcciones de seguridad aplicadas en este release

| ID | CVSS | Descripción | Fix |
|---|---|---|---|
| RV-F019-01 | — | AdminGdprController sin @PreAuthorize (rol incorrecto) | `@PreAuthorize("hasRole('ADMIN')")` añadido |

---

## Deuda técnica incorporada (target S21 — pendiente de resolución)

| DEBT | CVSS | Descripción |
|---|---|---|
| DEBT-040 | 5.3 | Race condition DataExportService — unique index gdpr_requests pendiente |
| DEBT-041 | 4.8 | OTP 2FA no validado en requestDeletion — integrar OtpService |

> ⚠️ **DEBT-040 y DEBT-041 deben resolverse antes del cierre del Sprint 21** (LA-020-02: CVSS ≥ 4.0).

---

## Cambios de base de datos

### Flyway V22 — `V22__profile_gdpr.sql`

| Cambio | Descripción |
|---|---|
| `ALTER TABLE users` | Añade `status VARCHAR(20)`, `deleted_at TIMESTAMP`, `deletion_requested_at TIMESTAMP` |
| `CREATE TABLE consent_history` | Historial inmutable de consentimientos GDPR |
| `CREATE TABLE gdpr_requests` | Log de solicitudes de derechos GDPR con SLA |
| `ALTER TABLE export_audit_log` | Añade `iban_masked VARCHAR(10)` (DEBT-036) |
| Seeds | Consentimientos por defecto para usuarios existentes |

---

## Cambios de infraestructura

**Variables de entorno nuevas:** ninguna.
**Dependencias nuevas:** ninguna (FEAT-019 usa exclusivamente Spring Data JPA + Lombok existentes).
**Breaking changes:** ninguno.

---

## Servicios afectados

| Servicio | Versión anterior | Versión nueva | Cambios |
|---|---|---|---|
| `backend-2fa` | v1.20.0 | **v1.21.0** | 11 endpoints nuevos, Flyway V22, módulo `privacy/` |
| `frontend-portal` | v1.20.0 | **v1.21.0** | Módulos `profile/` y `privacy/`, rutas `/perfil` y `/privacidad` |

---

## Instrucciones de despliegue

```bash
# 1. Verificar que la rama feature está mergeada a main/develop
git checkout main && git pull

# 2. Crear tag de release
git tag -a v1.21.0 -m "Sprint 21 — FEAT-019: Centro de Privacidad GDPR"
git push origin v1.21.0

# 3. Pipeline Jenkins se dispara automáticamente con el tag

# 4. Verificar Flyway V22 aplicada en STG
docker compose exec backend-2fa \
  java -jar app.jar --spring.flyway.info

# 5. Ejecutar smoke test post-deploy
chmod +x infra/compose/smoke-test-v1.21.0.sh
./infra/compose/smoke-test-v1.21.0.sh http://stg.bankportal.meridian.es $USER_JWT $ADMIN_JWT
```

---

## Procedimiento de rollback a v1.20.0

```bash
# 1. Revertir imagen backend
docker compose stop backend-2fa
docker compose pull backend-2fa  # bajará v1.20.0 del registry
docker compose up -d backend-2fa

# 2. Revertir Flyway (manual — V22 es additive, no destructiva)
# Las tablas consent_history y gdpr_requests pueden mantenerse vacías.
# Si se requiere rollback completo: contactar DBA para DROP TABLE.

# 3. Revertir imagen frontend
docker compose stop frontend-portal
docker compose up -d frontend-portal

# 4. Verificar health
curl -f http://stg.bankportal.meridian.es/actuator/health

# 5. Notificar al PM y cliente con causa raíz
```

---

## Checklist de go/no-go

```
[x] QA Report aprobado — QA Lead + Product Owner
[x] Code Review APROBADO — 0 bloqueantes
[x] Security Report — Semáforo YELLOW, 0 CVE críticos
[x] Flyway V22 verificada (consent_history, gdpr_requests, users.status)
[x] Smoke test v1.21.0 generado y validado
[x] DEBT-040 y DEBT-041 registrados con target S21
[x] Release Notes publicadas
[x] Runbook actualizado
```

---

*Generado por SOFIA DevOps Agent v2.3 — 2026-03-31*
*Pipeline: Sprint 21 / FEAT-019 / Step 7*
