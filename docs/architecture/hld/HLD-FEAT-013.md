# HLD-FEAT-013 — Onboarding KYC / Verificación de Identidad
# BankPortal / Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| Feature | FEAT-013 — Onboarding KYC / Verificación de Identidad |
| Proyecto | BankPortal — Banco Meridian |
| Stack | Java 21 / Spring Boot 3.3.4 + Angular 17 |
| Tipo de trabajo | new-feature |
| Sprint | 15 |
| Versión | 1.0 |
| Estado | PENDING APPROVAL — Gate 3 Tech Lead |
| Fecha | 2026-03-23 |
| Autor | SOFIA Architect Agent |

---

## Análisis de impacto en monorepo (Paso 0)

| Servicio/Módulo | Tipo de impacto | Acción requerida |
|---|---|---|
| `SecurityFilterChain` | Nuevo filtro `KycAuthorizationFilter` antes de controllers financieros | Añadir `addFilterAfter(kycFilter, RevokedTokenFilter.class)` |
| `SecurityConfig` | Nuevo rol `ROLE_KYC_REVIEWER` | Añadir en Spring Security — no requiere cambios en BD si se gestiona via JWT claims |
| `transfers/**` endpoints | `KycAuthorizationFilter` intercepta antes del controller | Sin cambios en controller — filtro transparente |
| `bills/**` endpoints | Mismo que transfers | Sin cambios en controller |
| `audit_log` (FEAT-005) | Nuevos event types: KYC_DOCUMENT_UPLOADED, KYC_AUTO_APPROVED, KYC_MANUAL_APPROVED, KYC_REJECTED | INSERT-only — compatible hacia adelante |
| `user_notification_preferences` (FEAT-012) | Nuevos códigos de notificación KYC | Sin migración — inserción de nuevas filas |
| Flyway V14 → V15 | Nueva migración aditiva sin modificar V14 | kyc_verifications + kyc_documents |
| SSE (FEAT-007/008) | Reutilización del SseRegistry para notificaciones en tiempo real | Sin cambios — reutilización directa |

**Decisión:** Impacto acotado. Nuevo módulo `kyc` hexagonal independiente. El único cambio en código existente es la inserción de `KycAuthorizationFilter` en la cadena de seguridad — sin tocar controllers existentes.

---

## Contexto del sistema — C4 Nivel 1

```mermaid
C4Context
  title BankPortal — FEAT-013 Onboarding KYC

  Person(newUser, "Nuevo cliente", "Usuario registrado sin KYC — no puede operar financieramente")
  Person(verifiedUser, "Cliente verificado", "KYC APPROVED — acceso completo al portal")
  Person(reviewer, "Revisor KYC", "Operador Banco Meridian — rol ROLE_KYC_REVIEWER")

  System(bankportal, "BankPortal Backend", "Spring Boot 3.3 / Java 21. Gestiona KYC, documentos, validación y bloqueo financiero")

  System_Ext(fileStorage, "Almacenamiento seguro", "Sistema de ficheros cifrado AES-256. Documentos KYC en reposo. Path configurable KYC_STORAGE_PATH")

  System_Ext(postgres, "PostgreSQL 16", "kyc_verifications + kyc_documents + audit_log")

  System_Ext(angular, "BankPortal Frontend", "Angular 17. KycModule con wizard 5 pasos + KycGuard")

  System_Ext(smtp, "SMTP / MailHog STG", "Notificaciones email KYC APPROVED/REJECTED/EXPIRED")

  Rel(newUser, angular, "Completa wizard KYC", "HTTPS")
  Rel(reviewer, bankportal, "Revisa y decide vía API admin", "HTTPS / JWT ROLE_KYC_REVIEWER")
  Rel(angular, bankportal, "Sube documentos + consulta estado", "HTTPS / multipart + JSON")
  Rel(bankportal, fileStorage, "Almacena documentos cifrados", "Local FS / AES-256")
  Rel(bankportal, postgres, "Persiste estado KYC y auditoría", "JDBC / HikariCP")
  Rel(bankportal, smtp, "Envía notificaciones KYC", "SMTP")
```

---

## Componentes involucrados — C4 Nivel 2

```mermaid
C4Container
  title BankPortal — Componentes FEAT-013 KYC

  Person(user, "Nuevo cliente")
  Person(reviewer, "Revisor KYC")

  Container(ng, "Angular SPA", "Angular 17", "KycModule: wizard 5 pasos, KycGuard, KycService, SSE estado tiempo real")

  Container(kycCtrl, "KycController", "Spring Boot / REST", "POST /kyc/documents, GET /kyc/status")
  Container(adminCtrl, "KycAdminController", "Spring Boot / REST", "PATCH /admin/kyc/{id} — ROLE_KYC_REVIEWER")

  Container(app, "KYC Application Layer", "Spring Boot", "UploadDocumentUseCase, ValidateDocumentUseCase, ReviewKycUseCase, GetKycStatusUseCase")

  Container(domain, "KYC Domain", "Java Entities + Enums", "KycVerification, KycDocument, KycStatus, DocumentType, ValidationRule")

  Container(infra, "KYC Infrastructure", "Spring Data JPA + FS", "KycVerificationRepository, KycDocumentRepository, DocumentStorageService (AES-256)")

  Container(filter, "KycAuthorizationFilter", "Spring Security Filter", "OncePerRequestFilter — bloquea /transfers/** y /bills/** si KYC != APPROVED")

  ContainerDb(pg, "PostgreSQL", "PostgreSQL 16", "kyc_verifications, kyc_documents")
  ContainerDb(fs, "File Storage", "Cifrado AES-256", "Documentos KYC en reposo — KYC_STORAGE_PATH")

  Rel(user, ng, "Wizard KYC", "HTTPS")
  Rel(reviewer, adminCtrl, "Revisión manual", "HTTPS / Bearer + ROLE_KYC_REVIEWER")
  Rel(ng, kycCtrl, "REST + Bearer JWT", "HTTPS")
  Rel(kycCtrl, app, "Delega")
  Rel(adminCtrl, app, "Delega")
  Rel(app, domain, "Opera con")
  Rel(app, infra, "Via puertos")
  Rel(infra, pg, "JPA / JDBC")
  Rel(infra, fs, "AES-256 encrypt/decrypt")
  Rel(filter, pg, "Verifica kyc_status en cada request financiera")
```

---

## Servicios nuevos y modificados

| Servicio/Módulo | Acción | Bounded Context | Descripción |
|---|---|---|---|
| `kyc` (backend) | NUEVO | Identity Verification | Módulo hexagonal completo — subida, validación, revisión |
| `KycAuthorizationFilter` | NUEVO | Security | Bloquea `/transfers/**` y `/bills/**` si KYC ≠ APPROVED |
| `SecurityConfig` | MODIFICADO | Security | Registro de `KycAuthorizationFilter` en la cadena |
| `KycModule` (Angular) | NUEVO | Frontend | Wizard 5 pasos + KycGuard + KycService |
| `AppRoutingModule` | MODIFICADO | Frontend | Nueva ruta `/kyc` con `canActivate: [AuthGuard]` |

---

## Cadena de filtros Spring Security (post FEAT-013)

```
Request entrante
    ↓
JwtAuthenticationFilter       (autentica JWT, extrae userId/jti)
    ↓
RevokedTokenFilter             (verifica jti no revocado)
    ↓
KycAuthorizationFilter         (bloquea /transfers/** /bills/** si KYC ≠ APPROVED)
    ↓
Controller                     (procesa la request)
```

---

## Decisiones técnicas — ADRs generados

- **ADR-023:** Almacenamiento de documentos KYC — filesystem local cifrado vs object storage
- **ADR-024:** Estrategia de validación KYC — automática MVP vs integración proveedor externo

---

## Contrato de integración backend ↔ frontend

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/kyc/status` | JWT | Estado KYC del usuario |
| POST | `/api/v1/kyc/documents` | JWT | Subir documento (multipart) |
| PATCH | `/api/v1/admin/kyc/{kycId}` | JWT + ROLE_KYC_REVIEWER | Aprobar/rechazar |

---

*SOFIA Architect Agent — Step 3 Gate 3 pending*
*CMMI Level 3 — TS SP 1.1 · TS SP 2.1 · TS SP 2.2*
*BankPortal Sprint 15 — FEAT-013 — 2026-03-23*
