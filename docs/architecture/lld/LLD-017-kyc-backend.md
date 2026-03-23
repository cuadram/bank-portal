# LLD-017 — KYC Backend
# BankPortal / Banco Meridian — FEAT-013

## Metadata

| Campo | Valor |
|---|---|
| Documento | LLD-017 |
| Servicio | `backend-2fa` — módulo `kyc` |
| Stack | Java 21 / Spring Boot 3.3.4 / Spring Data JPA / Spring Security |
| Feature | FEAT-013 — Onboarding KYC |
| Sprint | 15 | Versión | 1.0 |
| Estado | PENDING APPROVAL — Gate 3 Tech Lead |
| Fecha | 2026-03-23 |

---

## Estructura de módulo (arquitectura hexagonal)

```
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/
└── kyc/
    ├── domain/
    │   ├── model/
    │   │   ├── KycVerification.java     # @Entity — estado KYC por usuario
    │   │   ├── KycDocument.java         # @Entity — documento subido
    │   │   ├── KycStatus.java           # enum: NONE/PENDING/SUBMITTED/APPROVED/REJECTED/EXPIRED
    │   │   └── DocumentType.java        # enum: DNI/NIE/PASSPORT
    │   └── port/
    │       ├── KycVerificationRepository.java   # Interface JPA (puerto salida)
    │       └── KycDocumentRepository.java       # Interface JPA (puerto salida)
    ├── application/
    │   ├── usecase/
    │   │   ├── GetKycStatusUseCase.java
    │   │   ├── UploadDocumentUseCase.java
    │   │   ├── ValidateDocumentUseCase.java      # motor validación automática
    │   │   └── ReviewKycUseCase.java             # revisión manual (admin)
    │   ├── service/
    │   │   └── DocumentStorageService.java       # cifrado AES-256 + SHA-256
    │   └── dto/
    │       ├── KycStatusResponse.java
    │       ├── DocumentUploadRequest.java
    │       └── KycReviewRequest.java
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── KycVerificationJpaRepository.java
    │   │   └── KycDocumentJpaRepository.java
    │   └── storage/
    │       └── LocalEncryptedDocumentStorage.java  # AES-256 file I/O
    ├── api/
    │   ├── KycController.java           # /api/v1/kyc/**
    │   └── KycAdminController.java      # /api/v1/admin/kyc/**
    └── security/
        └── KycAuthorizationFilter.java  # OncePerRequestFilter — bloqueo financiero
```

---

## Diagrama de clases — dominio

```mermaid
classDiagram
    class KycVerification {
        +UUID id
        +UUID userId FK
        +KycStatus status
        +LocalDateTime submittedAt
        +LocalDateTime reviewedAt
        +UUID reviewerId
        +String rejectionReason
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class KycDocument {
        +UUID id
        +UUID kycId FK
        +DocumentType documentType
        +String side
        +String filePath
        +String fileHash
        +LocalDate expiresAt
        +String validationStatus
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

    class ValidateDocumentUseCase {
        +execute(kycId) void
        -checkFormat(doc) boolean
        -checkExpiry(doc) boolean
        -checkIntegrity(doc) boolean
        -allDocumentsPresent(kyc) boolean
    }

    KycVerification "1" --> "1..*" KycDocument : contiene
    KycVerification --> KycStatus
    KycDocument --> DocumentType
    ValidateDocumentUseCase --> KycVerification : evalúa
```

---

## Diagramas de secuencia — flujos críticos

### Flujo: Subida de documento (US-1302)

```mermaid
sequenceDiagram
    participant C as KycController
    participant UC as UploadDocumentUseCase
    participant DSS as DocumentStorageService
    participant KR as KycVerificationRepo
    participant DR as KycDocumentRepo
    participant VAL as ValidateDocumentUseCase
    participant AL as AuditLogService

    C->>UC: execute(userId, documentType, side, file)
    UC->>KR: findByUserId(userId)
    alt KYC no existe
        UC->>KR: save(new KycVerification(PENDING))
    end
    UC->>UC: validateMimeType(file) + checkSize(file ≤ 10MB)
    alt Validación fallida
        UC-->>C: throw DocumentValidationException → 400
    end
    UC->>DSS: store(file) → filePath + fileHash (SHA-256)
    UC->>DR: save(new KycDocument(kycId, type, side, filePath, fileHash))
    UC->>VAL: execute(kycId) async
    UC->>AL: log(KYC_DOCUMENT_UPLOADED, userId)
    UC-->>C: DocumentUploadResponse{documentId} → 201 Created
```

### Flujo: Validación automática (US-1303)

```mermaid
sequenceDiagram
    participant VAL as ValidateDocumentUseCase
    participant DR as KycDocumentRepo
    participant KR as KycVerificationRepo
    participant NS as NotificationService
    participant AL as AuditLogService

    VAL->>DR: findByKycId(kycId)
    VAL->>VAL: allDocumentsPresent(docs, documentType)
    alt Documentos incompletos
        VAL-->>VAL: return (noop — KYC permanece PENDING)
    end
    VAL->>VAL: checkFormat(docs) + checkExpiry(docs) + checkIntegrity(docs)
    alt Todas las reglas pasan
        VAL->>KR: updateStatus(APPROVED)
        VAL->>NS: sendApprovedEmail(userId)
        VAL->>AL: log(KYC_AUTO_APPROVED, userId)
    else Al menos una regla falla
        VAL->>KR: updateStatus(SUBMITTED)
        VAL->>NS: sendSubmittedInApp(userId)
        VAL->>AL: log(KYC_SUBMITTED_FOR_REVIEW, userId)
    end
```

### Flujo: KycAuthorizationFilter (US-1305)

```mermaid
sequenceDiagram
    participant REQ as HTTP Request
    participant KAF as KycAuthorizationFilter
    participant KR as KycVerificationRepo
    participant CHAIN as FilterChain

    REQ->>KAF: doFilterInternal(request)
    KAF->>KAF: isFinancialEndpoint(path)?
    alt No es /transfers/** ni /bills/**
        KAF->>CHAIN: proceed (sin verificación)
    else Es endpoint financiero
        KAF->>KAF: userId = request.getAttribute("authenticatedUserId")
        KAF->>KR: findByUserId(userId)
        alt KYC no existe (NONE) y cuenta < 90 días
            KAF->>CHAIN: proceed (período de gracia)
        else KYC = APPROVED
            KAF->>CHAIN: proceed
        else KYC ≠ APPROVED
            KAF-->>REQ: 403 {error: KYC_REQUIRED, kycStatus, kycWizardUrl: "/kyc"}
        end
    end
```

---

## Modelo de datos — Flyway V15

```mermaid
erDiagram
    users {
        uuid id PK
        string email
        timestamp created_at
    }

    kyc_verifications {
        uuid id PK
        uuid user_id FK
        string status
        timestamp submitted_at
        timestamp reviewed_at
        uuid reviewer_id
        string rejection_reason
        timestamp created_at
        timestamp updated_at
    }

    kyc_documents {
        uuid id PK
        uuid kyc_id FK
        string document_type
        string side
        string file_path
        string file_hash
        date expires_at
        string validation_status
        timestamp uploaded_at
    }

    users ||--o| kyc_verifications : "tiene"
    kyc_verifications ||--o{ kyc_documents : "contiene"
```

**Índices:**
- `kyc_verifications(user_id)` — UNIQUE
- `kyc_verifications(status)` — para queries de revisión admin
- `kyc_documents(kyc_id)` — lookup por verificación
- `kyc_documents(kyc_id, document_type, side)` — UNIQUE (un doc por tipo+cara)

---

## Contrato OpenAPI (definido por Architect)

### GET /api/v1/kyc/status
**Auth:** Bearer JWT

**Response 200:**
```json
{
  "userId": "uuid",
  "status": "PENDING | SUBMITTED | APPROVED | REJECTED | EXPIRED | NONE",
  "submittedAt": "ISO-8601 | null",
  "rejectionReason": "string | null",
  "kycWizardUrl": "/kyc",
  "estimatedReviewHours": 24
}
```

---

### POST /api/v1/kyc/documents
**Auth:** Bearer JWT
**Content-Type:** multipart/form-data

**Fields:**
- `documentType`: `DNI | NIE | PASSPORT`
- `side`: `FRONT | BACK`
- `file`: binary (JPEG, PNG, PDF ≤ 10MB)

**Response 201:**
```json
{ "documentId": "uuid", "kycStatus": "PENDING | SUBMITTED" }
```

**Errores:**
- `400 FILE_TOO_LARGE` — fichero > 10MB
- `400 UNSUPPORTED_FORMAT` — MIME type no aceptado
- `400 DOCUMENT_ALREADY_UPLOADED` — ya existe ese tipo+cara para este KYC
- `409 KYC_ALREADY_APPROVED` — KYC ya aprobado, no se aceptan nuevos documentos

---

### PATCH /api/v1/admin/kyc/{kycId}
**Auth:** Bearer JWT + `ROLE_KYC_REVIEWER`

**Request:**
```json
{
  "action": "APPROVE | REJECT",
  "reason": "string (obligatorio si action=REJECT)"
}
```

**Response 200:**
```json
{ "kycId": "uuid", "newStatus": "APPROVED | REJECTED", "reviewedAt": "ISO-8601" }
```

**Errores:**
- `400 INVALID_KYC_TRANSITION` — estado actual no permite la transición
- `403 Forbidden` — usuario sin `ROLE_KYC_REVIEWER`
- `404 Not Found` — kycId no existe

---

## Variables de entorno requeridas (nuevas)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `KYC_STORAGE_PATH` | Directorio raíz almacenamiento documentos | `/data/kyc-documents` |
| `KYC_ENCRYPTION_KEY` | Clave AES-256 para cifrado de ficheros (32 bytes en Base64) | (secret) |
| `KYC_GRACE_PERIOD_DAYS` | Días de gracia para usuarios NONE | `90` |
| `KYC_AUTO_REVIEW_ENABLED` | Activa/desactiva validación automática | `true` |

---

*SOFIA Architect Agent — Step 3 Gate 3 pending*
*CMMI Level 3 — TS SP 1.1 · TS SP 2.1 · TS SP 2.2*
*BankPortal Sprint 15 — FEAT-013 Backend — 2026-03-23*
