# HLD — FEAT-013: Onboarding KYC / Verificación de Identidad

**BankPortal · Banco Meridian · Sprint 15**

| Campo | Valor |
|---|---|
| Feature | FEAT-013 |
| Sprint | 15 · 2026-03-24 → 2026-04-06 |
| Versión | 1.0 |
| Estado | ✅ Aprobado Tech Lead |
| ADRs | ADR-023 (almacenamiento documentos KYC) · ADR-024 (validación asíncrona) |
| SRS | docs/srs/SRS-FEAT-013.md |
| Normativa | PSD2 · AML EU 2018/843 · RGPD Art.9 |

---

## Análisis de impacto en monorepo

| Servicio/Módulo | Tipo de impacto | Cambios |
|---|---|---|
| `SecurityConfig` | Modificación | Añade `KycAuthorizationFilter` tras `RevokedTokenFilter` |
| `NotificationService` | Reutilización | Disparado por eventos KYC_APPROVED / KYC_REJECTED |
| `SseEmitterRegistry` | Reutilización | Notificaciones in-app estado KYC |
| `AuditLogService` | Extensión | Nuevos eventos KYC_SUBMITTED / KYC_APPROVED / KYC_REJECTED |
| `ProfileController` | Sin cambios | Ya tiene `authenticatedUserId` en request attribute |
| Frontend Angular routes | Modificación | Nuevas rutas `/kyc/**` + `KycGuard` en rutas financieras |
| Flyway | Extensión | V15__kyc_onboarding.sql (nuevas tablas, no altera existentes) |

**Contratos existentes no rotos:** ninguno. Todos los cambios son aditivos.

---

## C4 Nivel 1 — Contexto del sistema

```mermaid
C4Context
  title BankPortal — Contexto KYC (FEAT-013)

  Person(cliente, "Cliente nuevo", "Persona física que inicia el proceso de alta en BankPortal")
  Person(operador, "Operador KYC", "Empleado de Banco Meridian con rol ROLE_KYC_REVIEWER")

  System(bankportal, "BankPortal", "Portal bancario digital — backend Java + frontend Angular")
  System_Ext(smtp, "SMTP / SendGrid", "Envío de emails de notificación KYC")
  System_Ext(storage, "Filesystem seguro", "Almacenamiento cifrado de documentos de identidad")

  Rel(cliente, bankportal, "Sube documentos de identidad, consulta estado KYC", "HTTPS")
  Rel(operador, bankportal, "Revisa y aprueba/rechaza verificaciones pendientes", "HTTPS")
  Rel(bankportal, smtp, "Envía notificaciones APPROVED/REJECTED", "SMTP TLS")
  Rel(bankportal, storage, "Almacena documentos cifrados AES-256", "I/O local")
```

---

## C4 Nivel 2 — Contenedores

```mermaid
C4Container
  title BankPortal — Contenedores KYC

  Person(cliente, "Cliente nuevo")
  Person(operador, "Operador KYC")

  Container(frontend, "Angular 17 SPA", "TypeScript · Angular 17", "KycModule: wizard upload + estado + KycGuard")
  Container(backend, "Spring Boot 3.3 API", "Java 21 · Spring Security", "KYC domain: upload, validate, review, notify")
  ContainerDb(pg, "PostgreSQL 16", "Relacional", "kyc_verifications · kyc_documents + tablas existentes")
  ContainerDb(redis, "Redis", "Cache/PubSub", "JWT blacklist · SSE pub/sub · Rate limiting")
  Container(fs, "Filesystem cifrado", "AES-256-GCM", "KYC_STORAGE_PATH — documentos de identidad")
  System_Ext(smtp, "SMTP / SendGrid")

  Rel(cliente, frontend, "Accede vía browser", "HTTPS")
  Rel(operador, frontend, "Panel admin KYC", "HTTPS")
  Rel(frontend, backend, "API REST", "HTTPS · Bearer JWT")
  Rel(backend, pg, "JPA / Flyway", "JDBC")
  Rel(backend, redis, "Rate limit · SSE", "Lettuce")
  Rel(backend, fs, "Almacena documentos", "Java NIO AES-256")
  Rel(backend, smtp, "Notificaciones email", "SMTP TLS")
```

---

## C4 Nivel 3 — Componentes del backend (módulo KYC)

```mermaid
C4Component
  title Backend — Módulo KYC (Clean Architecture)

  Container_Boundary(kyc, "kyc module") {
    Component(kycCtrl, "KycController", "REST", "POST /kyc/documents · GET /kyc/status")
    Component(adminCtrl, "KycAdminController", "REST", "@PreAuthorize KYC_REVIEWER", "PATCH /admin/kyc/{id}")
    Component(uploadUC, "UploadDocumentUseCase", "Application", "Valida MIME, tamaño, SHA-256, persiste")
    Component(validateUC, "ValidateDocumentUseCase", "Application @Async", "Reglas caducidad + tipo")
    Component(reviewUC, "ReviewKycUseCase", "Application", "APPROVE/REJECT con auditoría")
    Component(statusUC, "GetKycStatusUseCase", "Application", "Estado KYC + documentos")
    Component(storageService, "DocumentStorageService", "Infrastructure", "AES-256-GCM write/read")
    Component(kycFilter, "KycAuthorizationFilter", "Security", "HTTP 403 si kyc_status != APPROVED en endpoints financieros")
    Component(kycRepo, "KycVerificationRepository", "Infrastructure", "JPA kyc_verifications")
    Component(docRepo, "KycDocumentRepository", "Infrastructure", "JPA kyc_documents")
  }

  Container(pg, "PostgreSQL")
  Container(notif, "NotificationService", "existente FEAT-007")

  Rel(kycCtrl, uploadUC, "delega")
  Rel(kycCtrl, statusUC, "delega")
  Rel(adminCtrl, reviewUC, "delega")
  Rel(uploadUC, storageService, "almacena")
  Rel(uploadUC, kycRepo, "persiste estado")
  Rel(uploadUC, validateUC, "@Async dispara")
  Rel(validateUC, kycRepo, "actualiza estado")
  Rel(validateUC, notif, "evento APPROVED/REJECTED")
  Rel(reviewUC, kycRepo, "actualiza estado + reviewer")
  Rel(reviewUC, notif, "evento APPROVED/REJECTED")
  Rel(kycRepo, pg, "JDBC")
  Rel(docRepo, pg, "JDBC")
```

---

## Diagrama de secuencia — Flujo subida y validación automática

```mermaid
sequenceDiagram
  actor C as Cliente
  participant FE as Angular KycWizard
  participant BE as KycController
  participant UC as UploadDocumentUseCase
  participant SS as DocumentStorageService
  participant VA as ValidateDocumentUseCase (@Async)
  participant NS as NotificationService

  C->>FE: Arrastra fichero DNI (JPEG)
  FE->>BE: POST /api/v1/kyc/documents (multipart, Bearer JWT)
  BE->>UC: execute(userId, file, type)
  UC->>UC: Valida MIME + tamaño ≤ 10MB
  UC->>SS: store(file) → AES-256-GCM
  SS-->>UC: filePath + SHA-256
  UC->>UC: Persiste KycDocument + kyc_status = SUBMITTED
  UC-->>BE: { kycId, documentId, status: SUBMITTED }
  BE-->>FE: HTTP 201
  FE-->>C: "Documentos enviados"

  Note over VA: Ejecución asíncrona post-response
  UC->>VA: validateAsync(kycDocumentId)
  VA->>VA: Verifica caducidad + tipo reconocido
  alt Documento válido
    VA->>VA: kyc_status = APPROVED, reviewer_id = 'system'
    VA->>NS: evento KYC_APPROVED(userId)
    NS->>NS: Email + UserNotification in-app
  else Documento dudoso
    VA->>VA: kyc_status permanece SUBMITTED
    VA->>VA: validation_status = CADUCADO | TIPO_NO_RECONOCIDO
  end
```

---

## Diagrama de secuencia — Revisión manual por operador

```mermaid
sequenceDiagram
  actor O as Operador KYC
  participant BE as KycAdminController
  participant RUC as ReviewKycUseCase
  participant NS as NotificationService
  participant AL as AuditLogService

  O->>BE: PATCH /api/v1/admin/kyc/{kycId} {action:APPROVE}
  BE->>BE: @PreAuthorize ROLE_KYC_REVIEWER
  BE->>RUC: execute(kycId, APPROVE, reviewerId, reason=null)
  RUC->>RUC: Verificar estado != APPROVED/REJECTED (no final)
  RUC->>RUC: kyc_status = APPROVED, reviewed_at, reviewer_id
  RUC->>AL: log KYC_REVIEWED (operadorId, kycId, APPROVE)
  RUC->>NS: evento KYC_APPROVED(userId)
  NS-->>RUC: OK
  RUC-->>BE: KycVerification actualizado
  BE-->>O: HTTP 200
```

---

## Diagrama de secuencia — Guard de bloqueo financiero

```mermaid
sequenceDiagram
  actor U as Usuario sin KYC
  participant FE as Angular KycGuard
  participant BE as KycAuthorizationFilter
  participant TC as TransferController

  U->>FE: Navega a /transfers
  FE->>FE: KycGuard.canActivate() — kyc_status != APPROVED
  FE-->>U: Redirige a /kyc/wizard

  Note over BE: Si bypass de Angular (API directa)
  U->>BE: POST /api/v1/transfers (Bearer JWT)
  BE->>BE: Extrae userId de request.getAttribute("authenticatedUserId")
  BE->>BE: Consulta kyc_status desde BD
  alt KYC != APPROVED
    BE-->>U: HTTP 403 { error: KYC_REQUIRED, kycUrl: /kyc/wizard }
  else KYC == APPROVED
    BE->>TC: chain.doFilter()
    TC-->>U: HTTP 201 transferencia ejecutada
  end
```

---

## Modelo de datos — Flyway V15

```mermaid
erDiagram
  users ||--o| kyc_verifications : "tiene"
  kyc_verifications ||--|{ kyc_documents : "contiene"

  kyc_verifications {
    uuid id PK
    uuid user_id FK
    varchar status "PENDING|SUBMITTED|APPROVED|REJECTED|EXPIRED"
    timestamp submitted_at
    timestamp reviewed_at
    uuid reviewer_id "NULL = validación automática si 'system'"
    text rejection_reason
    timestamp created_at
    timestamp updated_at
  }

  kyc_documents {
    uuid id PK
    uuid kyc_id FK
    varchar document_type "DNI|NIE|PASSPORT"
    varchar document_side "FRONT|BACK"
    text file_path "ruta cifrada en KYC_STORAGE_PATH"
    varchar file_hash "SHA-256 hex"
    date expires_at
    varchar validation_status "PENDING|VALID|CADUCADO|TIPO_NO_RECONOCIDO"
    bigint file_size_bytes
    varchar mime_type
    timestamp created_at
  }
```

**Índices:**
- `idx_kyc_verifications_user_id` → `kyc_verifications(user_id)`
- `idx_kyc_verifications_status` → `kyc_verifications(status)`
- `idx_kyc_documents_kyc_id` → `kyc_documents(kyc_id)`
- `UNIQUE (user_id, status='SUBMITTED')` — previene duplicados activos

---

## Estructura de paquetes — Backend

```
kyc/
├── api/
│   ├── KycController.java          # POST /api/v1/kyc/documents · GET /api/v1/kyc/status
│   └── KycAdminController.java     # PATCH /api/v1/admin/kyc/{id} — ROLE_KYC_REVIEWER
├── application/
│   ├── UploadDocumentUseCase.java
│   ├── ValidateDocumentUseCase.java # @Async
│   ├── GetKycStatusUseCase.java
│   ├── ReviewKycUseCase.java
│   └── dto/
│       ├── DocumentUploadResponse.java
│       ├── KycStatusResponse.java
│       ├── KycReviewRequest.java
│       └── KycReviewResponse.java
├── domain/
│   ├── KycVerification.java         # JPA Entity
│   ├── KycDocument.java             # JPA Entity
│   ├── KycStatus.java               # Enum
│   ├── DocumentType.java            # Enum
│   ├── ValidationStatus.java        # Enum
│   ├── KycVerificationRepository.java
│   └── KycDocumentRepository.java
├── infrastructure/
│   └── DocumentStorageService.java  # AES-256-GCM R/W
└── security/
    └── KycAuthorizationFilter.java  # OncePerRequestFilter

resources/db/migration/
└── V15__kyc_onboarding.sql
```

---

## Estructura de paquetes — Frontend Angular

```
features/kyc/
├── kyc.module.ts                   # Lazy-loaded
├── kyc-routing.module.ts           # /kyc/wizard · /kyc/status
├── kyc.guard.ts                    # KycGuard (CanActivateFn)
├── kyc.service.ts                  # HTTP calls al backend KYC
├── components/
│   ├── kyc-wizard/
│   │   ├── kyc-wizard.component.ts
│   │   ├── kyc-wizard.component.html
│   │   └── kyc-wizard.component.spec.ts
│   ├── kyc-upload/
│   │   ├── kyc-upload.component.ts  # Drag & drop + previsualización
│   │   └── kyc-upload.component.html
│   └── kyc-status/
│       ├── kyc-status.component.ts
│       └── kyc-status.component.html
└── models/
    └── kyc.model.ts                # KycStatus · KycDocument interfaces
```

---

## Contrato OpenAPI — FEAT-013

### POST /api/v1/kyc/documents
**Auth:** Bearer JWT · **Content-Type:** multipart/form-data

**Request:**
```
file:         binary  — imagen o PDF del documento (≤ 10MB)
documentType: string  — DNI | NIE | PASSPORT
documentSide: string  — FRONT | BACK
```

**Response 201:**
```json
{ "kycId": "uuid", "documentId": "uuid", "status": "SUBMITTED" }
```

**Errores:** 400 `FILE_TOO_LARGE` | 400 `INVALID_FILE_TYPE` | 409 `KYC_ALREADY_APPROVED` | 401 | 500

---

### GET /api/v1/kyc/status
**Auth:** Bearer JWT

**Response 200:**
```json
{
  "kycId": "uuid",
  "status": "SUBMITTED",
  "submittedAt": "2026-03-24T09:00:00Z",
  "reviewedAt": null,
  "rejectionReason": null,
  "documents": [
    { "documentId": "uuid", "type": "DNI", "side": "FRONT", "validationStatus": "PENDING" }
  ]
}
```

---

### PATCH /api/v1/admin/kyc/{kycId}
**Auth:** Bearer JWT · **Role:** ROLE_KYC_REVIEWER

**Request:**
```json
{ "action": "APPROVE | REJECT", "reason": "string — obligatorio si REJECT" }
```

**Response 200:**
```json
{ "kycId": "uuid", "status": "APPROVED", "reviewedAt": "2026-03-24T10:00:00Z", "reviewerId": "uuid" }
```

**Errores:** 400 `REASON_REQUIRED` | 403 (sin rol) | 409 `KYC_ALREADY_IN_FINAL_STATE` | 404

---

## Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `KYC_STORAGE_PATH` | Ruta base almacenamiento documentos | `/var/data/kyc-docs` |
| `KYC_ENCRYPTION_KEY` | Clave AES-256 para cifrado documentos (32 bytes hex) | `(secret)` |
| `KYC_STORAGE_MAX_FILE_MB` | Tamaño máximo por fichero en MB | `10` |
| `KYC_AUTO_VALIDATION_ENABLED` | Activar/desactivar validación automática | `true` |

---

## RTM actualizada — Columna Arquitectura

| US | Componente Arquitectura |
|---|---|
| US-1301 | `kyc_verifications` · `kyc_documents` · `V15__kyc_onboarding.sql` |
| US-1302 | `KycController` · `UploadDocumentUseCase` · `DocumentStorageService` |
| US-1303 | `ValidateDocumentUseCase` @Async · `KycVerificationRepository` |
| US-1304 | `GetKycStatusUseCase` · `NotificationService` (reutilizado) |
| US-1305 | `KycAuthorizationFilter` · `KycGuard` Angular |
| US-1306 | `KycModule` · `KycWizardComponent` · `KycUploadComponent` · `KycStatusComponent` |
| US-1307 | `KycAdminController` · `ReviewKycUseCase` · `AuditLogService` |

---

*SOFIA Architect Agent — Step 3 | Sprint 15 · FEAT-013*
*CMMI Level 3 — TS SP 1.1 · TS SP 2.1 · TS SP 2.2*
*BankPortal — Banco Meridian — 2026-03-24*
