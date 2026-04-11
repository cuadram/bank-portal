# LLD Backend — FEAT-013: Onboarding KYC

## Metadata

| Campo | Valor |
|---|---|
| Servicio | `bankportal-backend-2fa` |
| Stack | Java 21 · Spring Boot 3.3 · PostgreSQL 15 · Flyway |
| Feature | FEAT-013 — Sprint 15 |
| Versión | 1.0 |
| Estado | APPROVED — Tech Lead (2026-03-24) |

---

## Estructura de módulo `kyc`

```
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/kyc/
├── api/
│   ├── KycController.java               # US-1302 / US-1304 — POST /documents · GET /status
│   └── KycAdminController.java          # US-1307 — PATCH /admin/kyc/{id}  @PreAuthorize KYC_REVIEWER
├── application/
│   ├── UploadDocumentUseCase.java        # US-1302 — validación + almacenamiento + hash SHA-256
│   ├── ValidateDocumentUseCase.java      # US-1303 — motor validación automática
│   ├── GetKycStatusUseCase.java          # US-1304 — consulta estado + documentos
│   ├── ReviewKycUseCase.java             # US-1307 — aprobación / rechazo manual
│   ├── DocumentStorageService.java       # ADR-023 — AES-256 filesystem local
│   └── dto/
│       ├── DocumentUploadResponse.java   # { documentId, kycStatus }
│       ├── KycStatusResponse.java        # { status, submittedAt, documents[] }
│       ├── KycReviewRequest.java         # { action: APPROVE|REJECT, reason? }
│       └── DocumentSummaryDto.java       # { id, documentType, side, validationStatus }
├── domain/
│   ├── KycVerification.java             # @Entity — kyc_verifications
│   ├── KycDocument.java                 # @Entity — kyc_documents
│   ├── KycStatus.java                   # NONE|PENDING|SUBMITTED|APPROVED|REJECTED|EXPIRED
│   ├── DocumentType.java                # DNI|NIE|PASSPORT
│   ├── KycVerificationRepository.java   # JPA — findByUserId, findById
│   └── KycDocumentRepository.java       # JPA — findByKycId, existsByKycIdAndTypeAndSide
└── security/
    └── KycAuthorizationFilter.java      # US-1305 — OncePerRequestFilter · bloqueo financiero
```

---

## Diagrama de clases — dominio KYC

```mermaid
classDiagram
  class KycVerification {
    +UUID id PK
    +UUID userId UK
    +KycStatus status
    +LocalDateTime submittedAt
    +LocalDateTime reviewedAt
    +UUID reviewerId
    +String rejectionReason
    +LocalDateTime createdAt
    +LocalDateTime updatedAt
  }

  class KycDocument {
    +UUID id PK
    +UUID kycId FK
    +DocumentType documentType
    +String side FRONT|BACK
    +String filePath
    +String fileHash SHA256
    +LocalDate expiresAt
    +String validationStatus PENDING|VALID|INVALID
    +LocalDateTime uploadedAt
  }

  class KycStatus {
    <<enumeration>>
    NONE
    PENDING
    SUBMITTED
    APPROVED
    REJECTED
    EXPIRED
  }

  class DocumentType {
    <<enumeration>>
    DNI
    NIE
    PASSPORT
  }

  class UploadDocumentUseCase {
    +execute(userId, docType, side, file) DocumentUploadResponse
    -validateFile(file)
  }

  class ValidateDocumentUseCase {
    +execute(kycId, userId)
    -allDocumentsPresent(kyc, docs) boolean
    -validateDocument(doc, userId) boolean
  }

  class ReviewKycUseCase {
    +execute(kycId, reviewerId, req) KycVerification
  }

  class DocumentStorageService {
    +store(file) StorageResult
    +verifyIntegrity(path, hash) boolean
  }

  KycVerification "1" --> "*" KycDocument : contiene
  KycVerification --> KycStatus
  KycDocument --> DocumentType
  UploadDocumentUseCase --> KycVerification
  UploadDocumentUseCase --> KycDocument
  UploadDocumentUseCase --> DocumentStorageService
  UploadDocumentUseCase --> ValidateDocumentUseCase
  ValidateDocumentUseCase --> KycVerification
  ValidateDocumentUseCase --> KycDocument
  ReviewKycUseCase --> KycVerification
```

---

## Diagrama de secuencia — US-1302 / US-1303: Subida y validación

```mermaid
sequenceDiagram
  participant C as KycController
  participant UC as UploadDocumentUseCase
  participant V as ValidateDocumentUseCase
  participant SS as DocumentStorageService
  participant KR as KycVerificationRepository
  participant DR as KycDocumentRepository
  participant A as AuditLogService

  C->>UC: execute(userId, docType, side, file)
  UC->>UC: validateFile(file)
  UC->>KR: findByUserId(userId)
  alt sin KYC previo
    KR-->>UC: empty
    UC->>KR: save(new KycVerification PENDING)
    KR-->>UC: kyc
  else KYC existente
    KR-->>UC: kyc
    UC->>UC: assert status ≠ APPROVED
  end
  UC->>DR: existsByKycIdAndDocumentTypeAndSide?
  DR-->>UC: false
  UC->>SS: store(file)
  SS->>SS: AES-256-GCM encrypt + SHA-256 hash
  SS-->>UC: StorageResult {filePath, sha256Hash}
  UC->>DR: save(KycDocument)
  UC->>A: log("KYC_DOCUMENT_UPLOADED")
  UC->>V: execute(kycId, userId)
  V->>DR: findByKycId(kycId)
  DR-->>V: [docs]
  V->>V: allDocumentsPresent?
  alt documentos completos
    V->>V: validateDocument (caducidad + integridad)
    alt todos válidos
      V->>KR: save(status=APPROVED)
      V->>A: log("KYC_AUTO_APPROVED")
    else alguno inválido
      V->>KR: save(status=SUBMITTED)
      V->>A: log("KYC_SUBMITTED_FOR_REVIEW")
    end
  else documentos incompletos
    note over V: KYC permanece PENDING
  end
  V-->>UC: void
  UC->>KR: findById(kycId)
  KR-->>UC: updated
  UC-->>C: DocumentUploadResponse {docId, kycStatus}
  C-->>C: HTTP 201
```

---

## Diagrama de secuencia — US-1307: Revisión manual

```mermaid
sequenceDiagram
  participant C as KycAdminController
  participant UC as ReviewKycUseCase
  participant KR as KycVerificationRepository
  participant NS as NotificationService
  participant A as AuditLogService

  C->>C: @PreAuthorize hasRole(KYC_REVIEWER)
  C->>UC: execute(kycId, reviewerId, {action, reason})
  UC->>KR: findById(kycId)
  KR-->>UC: kyc
  UC->>UC: assert status not final (APPROVED/REJECTED)
  alt action = APPROVE
    UC->>KR: save(status=APPROVED, reviewedAt, reviewerId)
    UC->>NS: sendKycApprovedEmail(userId)
  else action = REJECT
    UC->>UC: assert reason not blank
    UC->>KR: save(status=REJECTED, rejectionReason, reviewedAt)
    UC->>NS: sendKycRejectedEmail(userId, reason)
  end
  UC->>A: log("KYC_MANUAL_REVIEW", reviewerId)
  UC-->>C: updated KycVerification
  C-->>C: HTTP 200 {kycId, newStatus, reviewedAt}
```

---

## Diagrama de secuencia — US-1305: KycAuthorizationFilter

```mermaid
sequenceDiagram
  participant Req as HTTP Request
  participant JWT as JwtAuthenticationFilter
  participant RT as RevokedTokenFilter
  participant KF as KycAuthorizationFilter
  participant Ctrl as Controller

  Req->>JWT: Bearer token
  JWT->>JWT: validateAndExtract → userId attribute
  JWT->>RT: chain.doFilter
  RT->>RT: verifyNotRevoked
  RT->>KF: chain.doFilter
  KF->>KF: isFinancialEndpoint?
  alt no es endpoint financiero
    KF->>Ctrl: chain.doFilter
  else es endpoint financiero
    KF->>KF: userId from request attribute
    KF->>KF: kycRepo.findByUserId
    alt KYC APPROVED o sin registro (gracia)
      KF->>Ctrl: chain.doFilter
    else PENDING | SUBMITTED | REJECTED
      KF-->>Req: HTTP 403 KYC_REQUIRED {kycStatus, kycWizardUrl}
    end
  end
```

---

## Modelo de datos (ER)

```mermaid
erDiagram
  users {
    uuid id PK
    varchar username
    varchar email
    timestamp created_at
  }

  kyc_verifications {
    uuid id PK
    uuid user_id FK
    varchar status "PENDING|SUBMITTED|APPROVED|REJECTED|EXPIRED"
    timestamp submitted_at
    timestamp reviewed_at
    uuid reviewer_id
    varchar rejection_reason
    timestamp created_at
    timestamp updated_at
  }

  kyc_documents {
    uuid id PK
    uuid kyc_id FK
    varchar document_type "DNI|NIE|PASSPORT"
    varchar side "FRONT|BACK"
    varchar file_path "AES-256 cifrado"
    varchar file_hash "SHA-256"
    date expires_at
    varchar validation_status "PENDING|VALID|INVALID"
    timestamp uploaded_at
  }

  users ||--o| kyc_verifications : "tiene un"
  kyc_verifications ||--o{ kyc_documents : "contiene"
```

---

## Contrato OpenAPI

### GET /api/v1/kyc/status

**Descripción:** Consulta el estado KYC del usuario autenticado.
**Auth:** Bearer JWT

**Response 200:**
```json
{
  "kycId": "uuid",
  "status": "PENDING|SUBMITTED|APPROVED|REJECTED",
  "submittedAt": "2026-03-24T10:00:00Z",
  "reviewedAt": null,
  "documents": [
    {
      "id": "uuid",
      "documentType": "DNI",
      "side": "FRONT",
      "validationStatus": "VALID",
      "uploadedAt": "2026-03-24T09:55:00Z"
    }
  ]
}
```
**Errores:** 401 (sin auth)

---

### POST /api/v1/kyc/documents

**Descripción:** Sube un documento de identidad (multipart).
**Auth:** Bearer JWT
**Content-Type:** `multipart/form-data`

**Request (form fields):**
```
documentType: DNI | NIE | PASSPORT
side:         FRONT | BACK
file:         <binary — image/jpeg | image/png | application/pdf, máx 10MB>
```

**Response 201:**
```json
{
  "documentId": "uuid",
  "kycStatus": "SUBMITTED"
}
```

**Errores:**
- `400 FILE_TOO_LARGE` — fichero > 10MB
- `400 UNSUPPORTED_FORMAT` — MIME no permitido
- `400 FILE_EMPTY` — fichero vacío
- `409 KYC_ALREADY_APPROVED` — KYC ya aprobado
- `409 DOCUMENT_ALREADY_UPLOADED` — ese tipo+cara ya subido

---

### PATCH /api/v1/admin/kyc/{kycId}

**Descripción:** Aprueba o rechaza un KYC (operadores con ROLE_KYC_REVIEWER).
**Auth:** Bearer JWT + `ROLE_KYC_REVIEWER`

**Request:**
```json
{
  "action": "APPROVE | REJECT",
  "reason": "string — requerido si action=REJECT"
}
```

**Response 200:**
```json
{
  "kycId": "uuid",
  "newStatus": "APPROVED",
  "reviewedAt": "2026-03-24T11:00:00Z"
}
```

**Errores:**
- `400 REASON_REQUIRED` — REJECT sin motivo
- `403` — rol insuficiente
- `404` — kycId no encontrado
- `409 KYC_ALREADY_IN_FINAL_STATE` — intento modificar estado final

---

## Estrategia de datos

| Aspecto | Decisión |
|---|---|
| Motor | PostgreSQL 15 |
| Migraciones | Flyway — `V15__kyc_onboarding.sql` |
| Cifrado en reposo | AES-256-GCM — `DocumentStorageService` (ADR-023) |
| Hash integridad | SHA-256 por documento — verificado en cada read |
| Retención | ≥ 5 años desde aprobación (RGPD + AML) — job de expiración en sprint futuro |
| Índices | `idx_kyc_verifications_user`, `idx_kyc_verifications_status`, `idx_kyc_documents_kyc_id` |

---

## Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `KYC_STORAGE_PATH` | Directorio base almacenamiento documentos | `/data/kyc-docs` |
| `KYC_ENCRYPTION_KEY` | Clave AES-256 Base64 (32 bytes) | `<secret>` |
| `kyc.grace-period-days` | Días de gracia sin KYC para usuarios existentes | `90` |

---

*SOFIA Architect Agent — Step 3 | Sprint 15 · FEAT-013*
*CMMI Level 3 — TS SP 2.1 · TS SP 3.1*
*BankPortal — Banco Meridian — 2026-03-24*
