# HLD — FEAT-017 · Domiciliaciones y Recibos (SEPA Direct Debit)

**BankPortal · Banco Meridian · Sprint 19 · v1.19.0**

| Campo | Valor |
|---|---|
| Feature | FEAT-017 |
| Tipo | new-feature |
| Stack | Java 21 / Spring Boot 3.3.4 · Angular 17 · PostgreSQL 16 |
| Generado | 2026-03-27T06:28:42.133Z |
| Agente | Architect — SOFIA v2.2 |

---

## Impact Analysis — FEAT-017

### Servicios afectados

| Servicio | Tipo de impacto | Acción requerida |
|---|---|---|
| `backend-2fa` | Extensión de dominio — nuevas entidades y endpoints | Nueva capa `directdebit` dentro del mismo servicio |
| `CoreBankingAdapter` | Extensión de métodos existentes | Añadir `getMandates()`, `getDebits()` |
| `NotificationService` | Nuevos tipos de evento push | Añadir DEBIT_CHARGED, DEBIT_RETURNED, DEBIT_REJECTED |
| `EmailService` | Nuevas plantillas transaccionales | Añadir plantillas mandato alta/cancelación |
| `frontend-portal` | Módulo nuevo lazy-loaded | `DirectDebitsModule` sin impacto en bundle principal |

### Decisión de impacto
✅ Sin breaking changes en contratos existentes. Extensión aditiva — nuevos endpoints bajo ruta `/api/v1/direct-debits/`. Sin versioning de API requerido.

---

## Diagrama C4 — Nivel 1: Contexto del sistema

```mermaid
C4Context
  title BankPortal — Contexto FEAT-017 Domiciliaciones

  Person(cliente, "Cliente Banco Meridian", "Usuario autenticado 2FA")
  System(bankportal, "BankPortal", "Portal banca digital\nJava 21 / Angular 17")
  System_Ext(corebanking, "CoreBanking", "Sistema central Banco Meridian\nFuente de verdad mandatos")
  System_Ext(sepa, "Red SEPA", "Infraestructura EPC\nSDD Core Rulebook v3.4")
  System_Ext(push, "Push Notifications", "FCM / VAPID\nNotificaciones móvil/web")
  System_Ext(email, "Email Gateway", "SMTP / MailHog (DEV)\nNotificaciones email")

  Rel(cliente, bankportal, "Gestiona domiciliaciones", "HTTPS / Angular SPA")
  Rel(bankportal, corebanking, "Consulta/actualiza mandatos", "REST / mTLS")
  Rel(bankportal, sepa, "Envía instrucciones SDD", "ISO 20022 XML")
  Rel(bankportal, push, "Notificaciones en tiempo real", "FCM/VAPID")
  Rel(bankportal, email, "Emails transaccionales", "SMTP")
```

---

## Diagrama C4 — Nivel 2: Contenedores

```mermaid
C4Container
  title BankPortal — Contenedores FEAT-017

  Person(cliente, "Cliente", "Navegador / App móvil")

  Container_Boundary(bp, "BankPortal") {
    Container(ng, "Angular SPA", "Angular 17", "DirectDebitsModule\nMandateListComponent\nCreateMandateComponent\nDebitHistoryComponent")
    Container(api, "Backend API", "Spring Boot 3.3.4\nJava 21", "DirectDebitController\nMandateCreateService\nMandateCancelService\nDebitEventHandler")
    ContainerDb(pg, "PostgreSQL 16", "Relacional", "debit_mandates\ndirect_debits\naudit_events")
    ContainerDb(redis, "Redis 7", "Cache / Pub-Sub", "Rate limiting\nSession tokens")
    Container(sched, "Scheduler (ShedLock)", "Spring + ShedLock", "SimulaCobroJob\nDebitNotificationJob")
  }

  Container_Ext(cb, "CoreBankingAdapter", "Spring Bean", "Integración core banking")
  Container_Ext(notif, "NotificationService", "Spring Bean", "Push + Email dispatcher")

  Rel(cliente, ng, "HTTPS 443")
  Rel(ng, api, "REST JSON /api/v1/direct-debits/", "HTTPS + JWT")
  Rel(api, pg, "JDBC / Flyway V19")
  Rel(api, redis, "Lettuce client")
  Rel(api, cb, "CoreBankingAdapter.getMandates()")
  Rel(api, notif, "NotificationService.send()")
  Rel(sched, api, "DebitEventHandler.process()")
  Rel(sched, pg, "DirectDebitRepository")
```

---

## Diagrama de flujo — Alta de mandato SEPA

```mermaid
sequenceDiagram
  participant C as Cliente (Angular)
  participant API as Backend API
  participant VAL as IbanValidator
  participant OTP as OtpVerificationService
  participant DB as PostgreSQL
  participant NOTIF as NotificationService
  participant CB as CoreBankingAdapter

  C->>API: POST /api/v1/direct-debits/mandates\n{creditorName, creditorIban, otp, accountId}
  API->>VAL: validateIban(creditorIban)
  alt IBAN inválido
    VAL-->>API: InvalidIbanException
    API-->>C: 422 INVALID_IBAN
  end
  VAL-->>API: OK
  API->>OTP: verify(userId, otp)
  alt OTP incorrecto
    OTP-->>API: InvalidOtpException
    API-->>C: 401 INVALID_OTP
  end
  OTP-->>API: OK
  API->>DB: checkDuplicateMandate(userId, creditorIban)
  alt Mandato duplicado
    DB-->>API: MandateDuplicateException
    API-->>C: 409 DUPLICATE_MANDATE
  end
  DB-->>API: OK
  API->>DB: INSERT debit_mandates(status=ACTIVE, mandate_ref=BNK-{userId6}-{ts})
  DB-->>API: mandateId
  API->>CB: registerMandate(mandateRef, creditorIban)
  API->>NOTIF: send(MANDATE_CREATED, userId, creditorName)
  NOTIF-->>C: Push "Nueva domiciliación autorizada"
  API-->>C: 201 Created + Location: /mandates/{id}
```

---

## Diagrama de flujo — Cancelación con regla PSD2 D-2

```mermaid
sequenceDiagram
  participant C as Cliente (Angular)
  participant API as Backend API
  participant OTP as OtpVerificationService
  participant CAL as HolidayCalendarService
  participant DB as PostgreSQL
  participant NOTIF as NotificationService

  C->>API: DELETE /api/v1/direct-debits/mandates/{id}\n{otp}
  API->>DB: findMandate(id, userId)
  alt No encontrado o no pertenece al usuario
    DB-->>API: NotFoundException / ForbiddenException
    API-->>C: 404 / 403
  end
  DB-->>API: mandate (ACTIVE)
  API->>OTP: verify(userId, otp)
  alt OTP incorrecto
    OTP-->>API: InvalidOtpException
    API-->>C: 401 INVALID_OTP
  end
  OTP-->>API: OK
  API->>CAL: getNextBusinessDays(today, 2)
  CAL-->>API: cutoffDate
  API->>DB: findPendingDebitsBefore(mandateId, cutoffDate)
  alt Recibo PENDING en D-2
    DB-->>API: [debit]
    API-->>C: 422 MANDATE_CANCELLATION_BLOCKED_PSD2\n{dueDate: debit.dueDate}
  end
  DB-->>API: []
  API->>DB: UPDATE debit_mandates SET status=CANCELLED, cancelled_at=now()
  API->>NOTIF: send(MANDATE_CANCELLED, userId, creditorName)
  NOTIF-->>C: Push "Domiciliación cancelada"
  API-->>C: 200 OK {mandateId, status: CANCELLED, cancelledAt}
```

---

## Diagrama de flujo — Scheduler cobro + notificación

```mermaid
sequenceDiagram
  participant SCHED as SimulaCobroJob (ShedLock)
  participant DB as PostgreSQL
  participant CB as CoreBankingAdapter
  participant NOTIF as NotificationService

  SCHED->>DB: findPendingDebits(dueDate <= today)
  loop Por cada recibo PENDING
    SCHED->>CB: processDebit(debit)
    alt Cobro exitoso
      CB-->>SCHED: CHARGED
      SCHED->>DB: UPDATE status=CHARGED, charged_at=now()
      SCHED->>NOTIF: send(DEBIT_CHARGED, userId, creditorName, amount)
    else Saldo insuficiente
      CB-->>SCHED: REJECTED
      SCHED->>DB: UPDATE status=REJECTED
      SCHED->>NOTIF: send(DEBIT_REJECTED, userId, creditorName)
    else Devolución posterior
      CB-->>SCHED: RETURNED {returnReason}
      SCHED->>DB: UPDATE status=RETURNED, return_reason=AM04
      SCHED->>NOTIF: send(DEBIT_RETURNED, userId, creditorName, returnReason)
    end
  end
```

---

## Modelo de datos ER

```mermaid
erDiagram
  ACCOUNTS ||--o{ DEBIT_MANDATES : "tiene"
  USERS ||--o{ DEBIT_MANDATES : "autoriza"
  DEBIT_MANDATES ||--o{ DIRECT_DEBITS : "genera"
  DEBIT_MANDATES ||--o{ AUDIT_EVENTS : "registra"

  DEBIT_MANDATES {
    uuid id PK
    uuid account_id FK
    uuid user_id FK
    varchar140 creditor_name
    varchar34 creditor_iban
    varchar35 mandate_ref UK "BNK-{userId6}-{ts}"
    enum mandate_type "CORE | B2B"
    enum status "ACTIVE | CANCELLED | SUSPENDED"
    date signed_at
    date cancelled_at
    timestamptz created_at
    timestamptz updated_at
  }

  DIRECT_DEBITS {
    uuid id PK
    uuid mandate_id FK
    numeric15_2 amount
    char3 currency "EUR"
    enum status "PENDING | CHARGED | RETURNED | REJECTED"
    date due_date
    timestamptz charged_at
    varchar4 return_reason "AM04 | MS02..."
    timestamptz created_at
  }

  AUDIT_EVENTS {
    uuid id PK
    uuid user_id FK
    varchar50 event_type "MANDATE_CREATED | MANDATE_CANCELLED"
    uuid entity_id
    varchar20 entity_type
    jsonb payload
    varchar45 ip_address
    timestamptz created_at
  }
```

---

## Decisiones de arquitectura

| ADR | Decisión | Estado |
|---|---|---|
| ADR-029 | SEPA mandate storage: BD propia vs. delegación 100% CoreBanking | APROBADO |
| ADR-018 (existente) | Bucket4j rate limiting — reutilizado para DEBT-031 /cards/pin | VIGENTE |
| ADR-028 (existente) | ShedLock scheduler — reutilizado para SimulaCobroJob | VIGENTE |
| ADR-025 (existente) | VAPID push notifications — reutilizado para DEBIT_* eventos | VIGENTE |

---

*Architect Agent · CMMI TS SP 1.1, 2.1 · SOFIA v2.2 · BankPortal — Banco Meridian · Sprint 19*
