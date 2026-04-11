# SPRINT-019 — Planning

**BankPortal · Banco Meridian · Sprint 19**

| Campo | Valor |
|---|---|
| Sprint | 19 |
| Período | 2026-05-08 → 2026-05-22 |
| Feature | FEAT-017 — Domiciliaciones y Recibos |
| Objetivo | Gestión completa del ciclo de domiciliaciones bancarias: alta, consulta, baja y simulación de cobro de recibos domiciliados, con historial, notificaciones push y cumplimiento SEPA DD Core |
| Velocity objetivo | 24 SP |
| Velocity media (últimos 4 sprints) | 24.0 SP |
| Release objetivo | v1.19.0 |
| Estado | 🟡 PLANNING — Gate 1 pendiente aprobación PO |

---

## Sprint Goal

> *Permitir al cliente de Banco Meridian gestionar sus domiciliaciones bancarias directamente desde el portal: consultar recibos pendientes y cobrados, dar de alta nuevas domiciliaciones, anular mandatos existentes y recibir notificaciones push en cada cobro, con pleno cumplimiento del esquema SEPA Direct Debit Core.*

---

## Capacidad del equipo

| Rol | Días disponibles | Observaciones |
|---|---|---|
| Backend Dev | 10 días / 40h | Sin ausencias previstas |
| Frontend Dev | 10 días / 40h | Sin ausencias previstas |
| QA Lead | 10 días | Sin ausencias previstas |
| Tech Lead | 10 días | ADR-029 decisión SEPA mandato storage día 1 |
| DevOps | 2 días | Flyway V19 STG |

**Factores de reducción:**
- Ceremonias: −4h/persona
- Buffer impedimentos (10%): −4h/persona
- **Capacidad neta efectiva:** ~32h backend + ~32h frontend

**Velocity de referencia:** 24 SP (constante últimos 4 sprints)

---

## Distribución de capacidad

| Bloque | Items | SP | % Capacidad |
|---|---|---|---|
| Deuda técnica (S1 prioridad) | DEBT-031 | 2 SP | 8% |
| FEAT-017 | US-1701 → US-1706 | 22 SP | 92% |
| **TOTAL** | | **24 SP** | 100% |

---

## Backlog del sprint — Items seleccionados

| # | ID | Tipo | Título | SP | Prioridad | Semana |
|---|---|---|---|---|---|---|
| 1 | DEBT-031 | Tech Debt | Rate limiting específico /cards/{id}/pin (CVSS 4.2) | 2 | MUST — Security | S1 |
| 2 | US-1701 | Feature | Modelo datos `direct_debits` + `debit_mandates` — Flyway V19 | 3 | Must Have | S1 día 1 |
| 3 | US-1702 | Feature | Consulta de domiciliaciones y recibos pendientes/cobrados | 4 | Must Have | S1 |
| 4 | US-1703 | Feature | Alta de nueva domiciliación con mandato SEPA | 4 | Must Have | S1–S2 |
| 5 | US-1704 | Feature | Anulación / revocación de mandato domiciliado | 3 | Must Have | S2 |
| 6 | US-1705 | Feature | Notificaciones push en cobro/devolución de recibo | 4 | Must Have | S2 |
| 7 | US-1706 | Feature | Frontend Angular — gestión completa domiciliaciones | 4 | Must Have | S2 |
| | | | **TOTAL** | **24** | | |

---

## User Stories — Criterios de aceptación

### US-1701 — Modelo datos `direct_debits` + `debit_mandates` — Flyway V19
**Como** sistema BankPortal, **necesito** persistir mandatos SEPA y recibos domiciliados.

**Flyway V19__direct_debits.sql:**
- Tabla `debit_mandates(id UUID PK, account_id UUID FK, user_id UUID FK, creditor_name VARCHAR(140), creditor_iban VARCHAR(34), mandate_ref VARCHAR(35) UNIQUE, mandate_type ENUM(CORE, B2B), status ENUM(ACTIVE, CANCELLED, SUSPENDED), signed_at DATE, cancelled_at DATE, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`
- Tabla `direct_debits(id UUID PK, mandate_id UUID FK, amount NUMERIC(15,2), currency CHAR(3) DEFAULT 'EUR', status ENUM(PENDING, CHARGED, RETURNED, REJECTED), due_date DATE, charged_at TIMESTAMPTZ, return_reason VARCHAR(4), created_at TIMESTAMPTZ)`
- Índices: `(user_id)`, `(account_id)`, `(mandate_ref)`, `(status, due_date)`

**AC:**
- Flyway V19 ejecuta en STG sin errores
- Constraints de integridad referencial validadas
- Índices de rendimiento creados

---

### US-1702 — Consulta domiciliaciones y recibos
**Como** cliente de Banco Meridian, **quiero** ver todas mis domiciliaciones activas y el historial de recibos cobrados y devueltos.

**Endpoints:**
- `GET /api/v1/direct-debits/mandates` — lista mandatos activos/cancelados
- `GET /api/v1/direct-debits/mandates/{id}` — detalle + historial recibos
- `GET /api/v1/direct-debits/debits?status=&from=&to=&page=&size=` — recibos paginados
- `GET /api/v1/direct-debits/debits/{id}` — detalle recibo individual

**AC:**
- Paginación server-side (max 50 por página)
- Filtros por status, rango de fechas, mandato
- Respuesta < 200ms p95

---

### US-1703 — Alta domiciliación con mandato SEPA
**Como** cliente de Banco Meridian, **quiero** autorizar una nueva domiciliación SEPA al acreedor.

**Endpoint:** `POST /api/v1/direct-debits/mandates` con OTP 2FA

**Comportamiento:**
- Validar IBAN acreedor (algoritmo mod-97)
- Generar `mandate_ref` único (formato: BNK-{userId6}-{timestamp})
- Verificar OTP antes de persistir
- Enviar confirmación email + push "Nueva domiciliación autorizada"
- Audit log `MANDATE_CREATED`

**AC:**
- IBAN inválido → 422 con mensaje descriptivo
- OTP incorrecto → 401
- Mandato duplicado (mismo acreedor + IBAN) → 409

---

### US-1704 — Anulación / revocación de mandato
**Como** cliente de Banco Meridian, **quiero** cancelar una domiciliación existente.

**Endpoint:** `DELETE /api/v1/direct-debits/mandates/{id}` con OTP 2FA

**Comportamiento:**
- Status ACTIVE → CANCELLED con `cancelled_at`
- No cancelar si hay recibo PENDING en los próximos 2 días hábiles (PSD2 D-2)
- Notificación push + email "Domiciliación cancelada"
- Audit log `MANDATE_CANCELLED`

---

### US-1705 — Notificaciones push cobro/devolución
**Como** cliente de Banco Meridian, **quiero** recibir notificación push cuando se cobra o devuelve un recibo.

**Eventos:**
- `DEBIT_CHARGED`: "Se ha cobrado un recibo de {creditor} por {amount}€"
- `DEBIT_RETURNED`: "Recibo devuelto de {creditor} — motivo: {return_reason}"
- `DEBIT_REJECTED`: "Recibo rechazado — saldo insuficiente"

---

### US-1706 — Frontend Angular — gestión domiciliaciones
**Como** cliente de Banco Meridian, **quiero** gestionar mis domiciliaciones desde el portal Angular.

**Módulo Angular:** `DirectDebitsModule` (lazy-loaded en `/direct-debits`)

**Componentes:**
- `MandateListComponent` — lista con estado visual (ACTIVE=verde, CANCELLED=gris)
- `MandateDetailComponent` — detalle + historial recibos paginado
- `CreateMandateComponent` — wizard: datos acreedor → IBAN → confirmación OTP
- `CancelMandateComponent` — confirmación + OTP
- `DebitHistoryComponent` — tabla recibos con filtros + exportar PDF
- `DirectDebitService` Angular — wrapper HTTP + estado reactivo

---

## Distribución temporal

### Semana 1 (días 1–5)

| Día | Actividad |
|---|---|
| Día 1 | DEBT-031 rate limiting /cards/pin (Tech Lead). Flyway V19 US-1701 (bloqueante). ADR-029 decisión SEPA storage. |
| Días 2–3 | US-1702 consulta mandatos + recibos backend + API. |
| Días 4–5 | US-1703 alta domiciliación backend. Inicio US-1704 anulación. |

### Semana 2 (días 6–10)

| Día | Actividad |
|---|---|
| Días 6–7 | US-1704 anulación completo. US-1705 notificaciones push. |
| Días 8–9 | US-1706 Frontend Angular. |
| Día 10 | QA integracion + DevOps STG. Code review final. |

---

## Riesgos identificados

| ID | Descripción | Impacto | Probabilidad | Mitigación |
|---|---|---|---|---|
| R-019-01 | Validación IBAN acreedor compleja (34 países) | Medio | Baja | Librería iban4j validada en S11 |
| R-019-02 | Regla PSD2 D-2 (no cancelar recibo en 2 días hábiles) | Medio | Media | Implementar HolidayCalendarService mock |

---

## Normativa aplicable

- **SEPA Direct Debit Core Rulebook v3.4** — estructura mandatos
- **PSD2 RTS Art.80** — notificación previa al cargo
- **PSD2 Art.77** — derecho de reembolso 8 semanas
- **RGPD Art.6.1.b** — base legal tratamiento datos pago

---

*SOFIA Scrum Master Agent · CMMI PP SP 2.1 · BankPortal — Banco Meridian · Sprint 19 · 2026-05-08*
