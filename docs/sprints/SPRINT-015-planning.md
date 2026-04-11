# Sprint 15 — Planning

## Metadata CMMI (PP SP 2.1)

| Campo | Valor |
|---|---|
| Sprint | 15 |
| Feature principal | FEAT-013 — Onboarding KYC / Verificación de Identidad |
| Deuda técnica | RV-020 · SAST-001 · SAST-002 |
| Sprint Goal | Implementar el flujo completo de verificación de identidad KYC para nuevos clientes de Banco Meridian, cumpliendo la normativa AML/PSD2, e integrar el módulo con el flujo de registro existente |
| Período | 2026-03-23 → 2026-04-06 (14 días) |
| Capacidad | 24 SP |
| Release objetivo | v1.15.0 |
| Rama | `feature/FEAT-013-sprint15` |
| Jira Epic | SCRUM-36 |

---

## Velocidad y capacidad (PP SP 2.2)

| Sprint | SP | Feature |
|---|---|---|
| Sprint 12 | 24 | FEAT-010 Dashboard backend |
| Sprint 13 | 24 | FEAT-011 Frontend Angular Dashboard |
| Sprint 14 | 24 | FEAT-012-A Gestión de Perfil |
| **Sprint 15** | **24** | **FEAT-013 Onboarding KYC** |
| Media 14 sprints | ~23.7 | — |

---

## Contexto de negocio — FEAT-013

**KYC (Know Your Customer)** es el proceso obligatorio por normativa bancaria
(PSD2, AML Directive EU 2018/843, RGPD) que verifica la identidad de nuevos
clientes antes de activar su cuenta operativa. Sin KYC aprobado, el usuario
puede registrarse pero no puede realizar operaciones financieras.

### Flujo KYC de Banco Meridian

```
[Registro básico] → [Subida documentos] → [Validación automática] 
→ [Revisión manual si dudoso] → [Aprobación/Rechazo] → [Cuenta activa]
```

### Documentos aceptados
- DNI / NIE (España)
- Pasaporte (cualquier país UE)
- Tarjeta de residencia

### Estados del proceso KYC
```
PENDING   → El usuario ha iniciado pero no completado la verificación
SUBMITTED → Documentos enviados, pendientes de validación
APPROVED  → Verificación exitosa — cuenta operativa
REJECTED  → Verificación fallida — motivo informado al usuario
EXPIRED   → Documentos caducados — reenvío requerido
```

---

## Sprint Backlog

### Semana 1 — Deuda técnica + KYC backend base (11 SP)

| # | ID | Título | Tipo | SP | Sem |
|---|---|---|---|---|---|
| 1 | RV-020 | `twoFactorEnabled` desde BD en `GetProfileUseCase` | Tech Debt | 1 | S1 |
| 2 | SAST-001 | Ofuscar IP en `audit_log` (RGPD Art.25) | Tech Debt | 1 | S1 |
| 3 | SAST-002 | Rate limiting en `POST /api/v1/profile/password` | Tech Debt | 1 | S1 |
| 4 | US-1301 | Modelo de datos KYC + Flyway V15 | Feature | 3 | S1 |
| 5 | US-1302 | API subida documentos (`POST /api/v1/kyc/documents`) | Feature | 3 | S1 |
| 6 | US-1303 | Motor de validación automática básica (formato + caducidad) | Feature | 2 | S1 |

### Semana 2 — KYC flujo completo + frontend (13 SP)

| # | ID | Título | Tipo | SP | Sem |
|---|---|---|---|---|---|
| 7 | US-1304 | Estado KYC y notificaciones (APPROVED/REJECTED/PENDING) | Feature | 3 | S2 |
| 8 | US-1305 | Guard de acceso financiero (bloqueo si KYC no aprobado) | Feature | 2 | S2 |
| 9 | US-1306 | Frontend Angular — KYC wizard (upload + estado) | Feature | 5 | S2 |
| 10 | US-1307 | Admin endpoint revisión manual (PATCH estado KYC) | Feature | 3 | S2 |
| | | **TOTAL** | | **24** | |

---

## Descripción de User Stories

### US-1301 — Modelo de datos KYC (3 SP)
**Como** sistema, **necesito** un modelo de datos para almacenar el estado
KYC de cada usuario y los documentos subidos, **para** gestionar el proceso
de verificación con trazabilidad completa.

**Tablas Flyway V15:**
- `kyc_verifications (id, user_id, status, submitted_at, reviewed_at, reviewer_id, rejection_reason)`
- `kyc_documents (id, kyc_id, document_type, file_path, file_hash, expires_at, validation_status)`

---

### US-1302 — Subida de documentos (3 SP)
**Como** nuevo cliente, **quiero** subir mi DNI/Pasaporte/NIE, **para** iniciar
el proceso de verificación de identidad.

**Endpoints:**
- `POST /api/v1/kyc/documents` — subir documento (multipart/form-data)
- `GET /api/v1/kyc/status` — consultar estado actual del KYC

**Validaciones:** tipo MIME (image/jpeg, image/png, application/pdf), tamaño ≤ 10MB,
hash SHA-256 para integridad, almacenamiento en sistema de ficheros seguro.

---

### US-1303 — Validación automática básica (2 SP)
**Como** sistema, **quiero** validar automáticamente los documentos recibidos,
**para** aprobar directamente los casos claros sin intervención manual.

**Reglas automáticas:**
- Documento no caducado (campo `expires_at` del documento)
- Formato de imagen legible (no corrupto)
- Tipo de documento reconocido
- Si pasa → estado `APPROVED` automático
- Si falla → estado `SUBMITTED` para revisión manual

---

### US-1304 — Estado KYC y notificaciones (3 SP)
**Como** cliente, **quiero** recibir una notificación cuando mi verificación
sea aprobada o rechazada, **para** saber cuándo puedo operar con mi cuenta.

**Notificaciones:**
- Email APPROVED: "Tu cuenta está activa — ya puedes operar"
- Email REJECTED: "Tu verificación no fue exitosa — motivo + cómo reintentar"
- In-app banner en el dashboard mientras KYC está PENDING/SUBMITTED

---

### US-1305 — Guard de acceso financiero (2 SP)
**Como** sistema, **quiero** bloquear el acceso a operaciones financieras
(transferencias, pagos) si el KYC del usuario no está APPROVED, **para**
cumplir la normativa AML/PSD2.

**Implementación:** `KycGuard` en Angular + interceptor backend que verifica
`kyc_status = APPROVED` antes de ejecutar cualquier operación financiera.
Respuesta para KYC no aprobado: `403 KYC_REQUIRED` con enlace al wizard.

---

### US-1306 — Frontend KYC wizard (5 SP)
**Como** nuevo cliente, **quiero** un asistente paso a paso para subir mis
documentos de identidad, **para** completar la verificación de forma intuitiva.

**Pasos del wizard:**
1. Bienvenida + explicación del proceso
2. Selección tipo de documento
3. Subida frontal del documento (drag & drop)
4. Subida reverso (si aplica)
5. Confirmación + estado en tiempo real (SSE)

---

### US-1307 — Admin endpoint revisión manual (3 SP)
**Como** operador de Banco Meridian, **quiero** revisar y aprobar/rechazar
manualmente las verificaciones dudosas, **para** garantizar la calidad del
proceso KYC.

**Endpoint:** `PATCH /api/v1/admin/kyc/{kycId}` — requiere rol `ROLE_KYC_REVIEWER`
**Body:** `{ "action": "APPROVE" | "REJECT", "reason": "string" }`

---

## Deuda técnica detallada

### RV-020 — `twoFactorEnabled` desde BD (1 SP)
**Archivo:** `GetProfileUseCase.java:30`
Actualmente hardcodeado a `false`. Consultar `users.totp_enabled` desde BD.

### SAST-001 — IP ofuscada en audit_log (1 SP)
**Archivo:** `UpdateProfileUseCase.java:42`
`auditLog.log("PROFILE_UPDATE", userId, "ip=" + ip)` → ofuscar últimos 2 octetos.

### SAST-002 — Rate limiting en /profile/password (1 SP)
**Archivo:** `ProfileController.java`
Añadir `@RateLimiter` de Bucket4j en `POST /profile/password` — máx 5 intentos/10min.

---

## Riesgos Sprint 15

| ID | Descripción | Prob | Impacto | Respuesta |
|---|---|---|---|---|
| R-S15-01 | Almacenamiento de documentos KYC con datos biométricos — RGPD Art.9 datos especiales | M | A | Cifrado AES-256 en reposo, acceso restringido por rol, retención máx 5 años — ADR-023 |
| R-S15-02 | Validación automática con tasa de falsos positivos/negativos — reclamaciones de usuarios | M | M | MVP conservador: aprobar solo casos muy claros, derivar dudosos a revisión manual |
| R-S15-03 | Subida de ficheros hasta 10MB — impacto en rendimiento del endpoint | B | M | Procesamiento asíncrono, límite de tamaño en nginx/spring, timeout 30s |

---

## Dependencias técnicas

- **Flyway V15** — prerequisito bloqueante para US-1302..1307
- **`ROLE_KYC_REVIEWER`** — nuevo rol en Spring Security (US-1307)
- **Almacenamiento seguro** — directorio configurable via `KYC_STORAGE_PATH` env var
- **SSE existente** (FEAT-007/008) — reutilizable para notificaciones en tiempo real

---

## Action items día 1

- [ ] RV-020/SAST-001/SAST-002 completados antes del mediodía
- [ ] Flyway V15 DDL definido y revisado con Architect
- [ ] ADR-023 (estrategia almacenamiento documentos KYC) aprobado por Tech Lead

---

*SOFIA Scrum Master Agent — Step 1 Gate 1 pending*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1*
*BankPortal Sprint 15 — FEAT-013 — 2026-03-23*
