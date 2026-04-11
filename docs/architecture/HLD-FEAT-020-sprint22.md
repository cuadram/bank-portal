# HLD — FEAT-020 Gestión de Préstamos Personales
## BankPortal · Banco Meridian · Sprint 22

**Feature:** FEAT-020 | **Proyecto:** BankPortal | **Cliente:** Banco Meridian  
**Stack:** Java 21 / Spring Boot 3.3.4 + Angular 17  
**Tipo:** new-feature  
**Sprint:** 22 | **Versión:** 1.0 | **Estado:** APPROVED  
**Jira:** SCRUM-114..121 | **SOFIA:** v2.6

---

## 1. Análisis de impacto en monorepo

| Servicio/Módulo | Tipo de impacto | Acción |
|---|---|---|
| `backend-2fa` | MODIFICADO — nuevos paquetes `loan/` | Añadir dominio loans sin afectar existentes |
| `frontend` Angular | MODIFICADO — nuevo módulo lazy `loans/` | Registrar ruta + nav item (LA-FRONT-001) |
| `ProfileController` | MODIFICADO — endpoints notif+sessions | Cierre DEBT-043 en paquete `profile/` |
| `ExportAuditService` | MODIFICADO — IBAN real | Cierre DEBT-036: inyectar AccountRepository |
| `CardMaskingService` | MODIFICADO — regex PAN Maestro 19d | Cierre DEBT-037: ampliar regex |
| `AuthService / OtpValidationUseCase` | REUTILIZADO sin cambios | Préstamo reutiliza OTP de FEAT-019 |
| Otros módulos (account, transfer, cards...) | SIN IMPACTO | — |

**Decisión:** sin breaking changes en contratos existentes. Nuevos endpoints en namespace `/api/v1/loans`.

---

## 2. Contexto del sistema — C4 Nivel 1

```mermaid
C4Context
  Person(user, "Cliente Banco Meridian", "Usuario final BankPortal")
  System(bp, "BankPortal", "Plataforma bancaria digital — backend Java + frontend Angular")
  System_Ext(cb, "CoreBanking Mock (STG)", "Simulador de scoring crediticio")
  System_Ext(otp, "OTP Service", "Validación 2FA — reutilizado FEAT-019")
  System_Ext(notif, "Notification Service", "Push VAPID — reutilizado FEAT-014")
  System_Ext(audit, "Audit Log", "Registro inmutable — GDPR + Ley 16/2011")

  Rel(user, bp, "Consulta préstamos, simula, solicita", "HTTPS/TLS")
  Rel(bp, cb, "POST /scoring — pre-scoring solicitud", "REST/HTTP mock STG")
  Rel(bp, otp, "Valida OTP antes de crear solicitud", "Interno — OtpValidationUseCase")
  Rel(bp, notif, "Push: resultado solicitud", "Interno — NotificationService")
  Rel(bp, audit, "Audit log solicitudes — GDPR", "Interno — LoanAuditService")
```

---

## 3. Componentes involucrados — C4 Nivel 2

```mermaid
C4Container
  Person(user, "Cliente")
  
  Container(ng, "Angular SPA", "Angular 17", "Módulo /prestamos — lazy loading")
  Container(api, "LoanController", "Spring Boot 3 REST", "GET/POST /api/v1/loans")
  Container(app, "Application Layer", "Spring Boot", "UseCases: List, Detail, Simulate, Apply, Cancel, Amortize")
  Container(domain, "Domain Layer", "Java 21", "Loan, LoanApplication, AmortizationCalculator")
  Container(infra, "Infrastructure", "Spring Data JPA", "LoanJpaRepository, LoanApplicationJpaRepository")
  Container(db, "PostgreSQL 16", "DB", "loans, loan_applications — Flyway V24")
  Container(redis, "Redis 7", "Cache", "OTP sessions — reutilizado")
  Container(profile, "ProfileController", "Spring Boot REST", "GET /profile/notifications|sessions (DEBT-043)")

  Rel(user, ng, "HTTPS")
  Rel(ng, api, "JWT Bearer", "REST")
  Rel(ng, profile, "JWT Bearer", "REST — DEBT-043")
  Rel(api, app, "delega")
  Rel(app, domain, "usa")
  Rel(app, infra, "puerto")
  Rel(infra, db, "JPA")
  Rel(app, redis, "OTP validation — reutiliza OtpValidationUseCase")
```

---

## 4. Flujos críticos

### 4.1 Simulación de préstamo (stateless)

```mermaid
sequenceDiagram
  participant NG as Angular
  participant LC as LoanController
  participant SIM as SimulateLoanUseCase
  participant CALC as AmortizationCalculator

  NG->>LC: POST /api/v1/loans/simulate {importe, plazo, finalidad}
  LC->>SIM: execute(SimulateRequest)
  SIM->>CALC: calcularMetodoFrances(importe, plazo, taeAnual)
  Note over CALC: BigDecimal escala 10, HALF_EVEN (ADR-034)
  CALC-->>SIM: SimulationResult {cuota, tae, total, schedule[]}
  SIM-->>LC: SimulationResponse
  LC-->>NG: HTTP 200 — Sin persistencia, sin audit log
```

### 4.2 Solicitud de préstamo con 2FA

```mermaid
sequenceDiagram
  participant NG as Angular
  participant LC as LoanController
  participant OTP as OtpValidationUseCase
  participant AUC as ApplyLoanUseCase
  participant SCORE as CoreBankingMockClient
  participant AUDIT as LoanAuditService
  participant DB as PostgreSQL

  NG->>LC: POST /api/v1/loans/applications {otp, importe, plazo, finalidad}
  LC->>OTP: validate(userId, otpCode)
  OTP-->>LC: OTP_VALID / OTP_INVALID
  alt OTP inválido
    LC-->>NG: HTTP 401 Unauthorized
  end
  LC->>AUC: execute(ApplyLoanRequest)
  AUC->>DB: findActivePendingByUserId → 409 si duplicado
  AUC->>SCORE: score(userId) → hash(userId)%1000
  SCORE-->>AUC: score > 600 → PENDING | ≤ 600 → REJECTED
  AUC->>DB: save(LoanApplication {estado})
  AUC->>AUDIT: log(CREATE, userId, applicationId, estado)
  AUC-->>LC: ApplicationResponse {id, estado}
  LC-->>NG: HTTP 201 Created
```

---

## 5. Flyway — Migraciones

### V24__loans_and_applications.sql
```sql
-- Tabla principal de préstamos
CREATE TABLE loans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  tipo           VARCHAR(20) NOT NULL,           -- PERSONAL, VEHICULO, REFORMA
  importe_original NUMERIC(15,2) NOT NULL,
  importe_pendiente NUMERIC(15,2) NOT NULL,
  plazo          INTEGER NOT NULL,               -- meses
  tae            NUMERIC(10,6) NOT NULL,         -- escala 6 decimales
  cuota_mensual  NUMERIC(15,2) NOT NULL,
  estado         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_estado  ON loans(estado);

-- Tabla de solicitudes de préstamo
CREATE TABLE loan_applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  importe        NUMERIC(15,2) NOT NULL,
  plazo          INTEGER NOT NULL,
  finalidad      VARCHAR(20) NOT NULL,           -- CONSUMO, VEHICULO, REFORMA, OTROS
  estado         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  scoring_result INTEGER,
  otp_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loan_apps_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_apps_estado  ON loan_applications(estado);
-- RN-F020-11: índice parcial para detectar solicitudes PENDING duplicadas
CREATE UNIQUE INDEX idx_loan_apps_user_pending
  ON loan_applications(user_id)
  WHERE estado = 'PENDING';

-- Audit log de operaciones sobre solicitudes (RN-F020-14, GDPR)
CREATE TABLE loan_audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  application_id UUID,
  accion         VARCHAR(30) NOT NULL,           -- CREATE, APPROVE, REJECT, CANCEL
  estado_anterior VARCHAR(20),
  estado_nuevo   VARCHAR(20),
  ip_origen      INET,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Decisiones técnicas — ver ADRs

- **ADR-034:** Cálculo de cuota y TAE con BigDecimal escala 10 (método francés)
- **ADR-035:** Pre-scoring mock determinista `hash(userId) % 1000` para STG

---

## 7. Variables de entorno nuevas

Ninguna nueva. El módulo reutiliza: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `REDIS_URL`.

---

*Architect Agent · SOFIA v2.6 · BankPortal — Banco Meridian · Sprint 22 · 2026-04-02*
