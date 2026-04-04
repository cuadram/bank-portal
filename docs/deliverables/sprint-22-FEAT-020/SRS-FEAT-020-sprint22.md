# SRS — FEAT-020: Gestión de Préstamos Personales
## Sprint 22 · BankPortal · Banco Meridian

**Versión:** 1.0 | **Fecha:** 2026-04-02 | **Estado:** APROBADO PO
**Autor:** Requirements Agent — SOFIA v2.6 | **Revisado por:** Product Owner (Angel)
**CMMI:** RD SP 1.1, 1.2, 2.1, 3.1

---

## 1. Contexto y objetivo

El módulo de **Préstamos Personales** permite al usuario de Banco Meridian consultar sus préstamos activos, simular nuevas financiaciones con cuadro de amortización y solicitar un préstamo personal de forma 100% digital, con cumplimiento regulatorio PSD2 y Ley 16/2011 de crédito al consumo.

**Sprint Goal:**
> *Permitir al usuario de Banco Meridian consultar sus préstamos activos, simular nuevas financiaciones y solicitar un préstamo personal de forma digital, con cuadro de amortización y cumplimiento PSD2 / Ley 16/2011 de crédito al consumo.*

---

## 2. Alcance funcional

### 2.1 Nuevas funcionalidades (19 SP)

| ID | Funcionalidad | Jira | SP |
|---|---|---|---|
| FA-020-A | Consulta de Préstamos Activos (listado + detalle) | SCRUM-115 | 3 |
| FA-020-B | Simulador de Préstamo Personal (método francés + TAE) | SCRUM-116 | 3 |
| FA-020-C | Solicitud de Préstamo con Pre-scoring y 2FA | SCRUM-117 | 4 |
| FA-020-D | Cuadro de Amortización (dinámico, no persistido) | SCRUM-118 | 3 |
| FA-020-E | Cancelación de Solicitud de Préstamo | SCRUM-118 | — |
| FA-020-F | Frontend Angular — Módulo Préstamos completo | SCRUM-119 | 5 |
| Arq | Arquitectura + modelo de dominio (SCRUM-114) | SCRUM-114 | 2 |

### 2.2 Deuda técnica (5 SP)

| ID | Deuda | Jira | SP |
|---|---|---|---|
| FA-DEBT043-A | GET /profile/notifications + /sessions (404 → 200) | SCRUM-120 | 2 |
| FA-DEBT036-A | IBAN real en audit log + Regex PAN Maestro 19d | SCRUM-121 | 2 |
| SCRUM-114 | Arquitectura incluida en feature | — | — |

---

## 3. Modelo de dominio

```
Loan {
  id: UUID
  userId: UUID
  tipo: LoanType (PERSONAL, VEHICULO, REFORMA)
  importeOriginal: BigDecimal
  importePendiente: BigDecimal
  plazo: Integer (meses)
  tae: BigDecimal
  cuotaMensual: BigDecimal
  estado: LoanStatus
  fechaInicio: LocalDate
  fechaFin: LocalDate
}

LoanApplication {
  id: UUID
  userId: UUID
  importe: BigDecimal
  plazo: Integer
  finalidad: LoanPurpose
  estado: ApplicationStatus
  scoringResult: Integer
  otpVerified: Boolean
  createdAt: Instant
}

AmortizationSchedule {
  loanId: UUID
  cuotas: [{
    n: Integer
    fecha: LocalDate
    capital: BigDecimal
    intereses: BigDecimal
    cuotaTotal: BigDecimal
    saldoPendiente: BigDecimal
  }]
}

LoanStatus:       ACTIVE | PENDING | APPROVED | REJECTED | PAID_OFF | CANCELLED
LoanPurpose:      CONSUMO | VEHICULO | REFORMA | OTROS
ApplicationStatus: PENDING | APPROVED | REJECTED | CANCELLED
```

---

## 4. API Endpoints

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | /api/v1/loans | Lista paginada préstamos del usuario | JWT |
| GET | /api/v1/loans/{id} | Detalle préstamo | JWT |
| GET | /api/v1/loans/{id}/amortization | Cuadro amortización | JWT |
| POST | /api/v1/loans/simulate | Simulación stateless | JWT |
| POST | /api/v1/loans/applications | Crear solicitud (requiere OTP) | JWT + OTP |
| GET | /api/v1/loans/applications/{id} | Estado solicitud | JWT |
| DELETE | /api/v1/loans/applications/{id} | Cancelar solicitud PENDING | JWT |
| GET | /api/v1/profile/notifications | Notificaciones usuario | JWT |
| GET | /api/v1/profile/sessions | Sesiones activas | JWT |

---

## 5. Reglas de negocio (22 reglas)

| ID | Regla |
|---|---|
| RN-F020-01 | Listado solo devuelve préstamos del usuario autenticado |
| RN-F020-02 | Estados válidos: ACTIVE, PENDING, APPROVED, REJECTED, PAID_OFF, CANCELLED |
| RN-F020-03 | Detalle: capital original, saldo pendiente, TAE, cuota mensual, cuotas pagadas/pendientes |
| RN-F020-04 | Simulación stateless — sin persistencia |
| RN-F020-05 | Importe: 1.000 – 60.000 EUR |
| RN-F020-06 | Plazo: 12 – 84 meses |
| RN-F020-07 | TAE calculada según Directiva 2008/48/CE |
| RN-F020-08 | Método francés, BigDecimal escala 10, HALF_EVEN (ADR-034) |
| RN-F020-09 | OTP 2FA obligatorio antes de crear solicitud |
| RN-F020-10 | Pre-scoring mock: hash(userId)%1000 > 600 = PENDING; ≤ 600 = REJECTED |
| RN-F020-11 | Solicitud duplicada PENDING activo → HTTP 409 |
| RN-F020-12 | Campos obligatorios: importe, plazo, finalidad |
| RN-F020-13 | Finalidades: CONSUMO, VEHICULO, REFORMA, OTROS |
| RN-F020-14 | Audit log obligatorio en todas las operaciones de solicitud |
| RN-F020-15 | No cancelar solicitud en estado APPROVED o PAID_OFF → HTTP 422 |
| RN-F020-16 | Solo el propietario puede cancelar su solicitud → HTTP 403 si otro |
| RN-F020-17 | Cuadro amortización generado dinámicamente — no persistido |
| RN-F020-18 | Información precontractual obligatoria (Ley 16/2011) |
| RN-F020-19 | GET /profile/notifications → 200+[] si vacío, nunca 404 |
| RN-F020-20 | GET /profile/sessions → 200+[] si vacío, nunca 404 |
| RN-F020-21 | ExportAuditService registra IBAN real (DEBT-036) |
| RN-F020-22 | Regex PAN Maestro: 12–19 dígitos (DEBT-037, CVSS 2.1) |

---

## 6. Flyway

- **V24__loans_and_applications.sql** — tablas `loans`, `loan_applications`
- **V23__unique_idx_gdpr_active_export.sql** — ya aplicada en pre-sprint S22

---

## 7. Riesgos

| ID | Riesgo | Prob | Impacto | Mitigación |
|---|---|---|---|---|
| RSK-022-01 | CoreBanking scoring no disponible en STG | Alta | Alto | Mock determinista hash(userId)%1000 |
| RSK-022-02 | Precisión BigDecimal TAE | Media | Medio | 5 tests regulatorios antes de G-4 |
| RSK-022-03 | DEBT-043 más complejo de lo estimado | Baja | Bajo | Cap 3 SP |

---

## 8. Criterios de aceptación globales

- [ ] Todos los endpoints responden con el status HTTP correcto
- [ ] Simulación: cuota mensual correcta según método francés (5 tests regulatorios)
- [ ] OTP 2FA valida correctamente antes de crear solicitud
- [ ] Audit log registra toda operación sobre solicitudes
- [ ] Frontend: módulo cargado con lazy loading, ruta /prestamos activa, nav item visible
- [ ] catchError en todos los observables Angular → of([]) nunca EMPTY (LA-STG-001)
- [ ] STG Verification: listado, simulador, solicitud, cuadro amortización operativos
- [ ] /profile/notifications y /profile/sessions retornan 200 (cierre DEBT-043)

---

## 9. Trazabilidad Gherkin (escenarios a cubrir)

| # | Escenario | FA | RN |
|---|---|---|---|
| G-001 | Usuario consulta préstamos activos | FA-020-A | RN-F020-01 |
| G-002 | Usuario consulta detalle de préstamo | FA-020-A | RN-F020-03 |
| G-003 | Usuario simula préstamo 10.000€ 36m | FA-020-B | RN-F020-04..08 |
| G-004 | Simulación rechaza importe < 1.000€ | FA-020-B | RN-F020-05 |
| G-005 | Simulación rechaza plazo > 84m | FA-020-B | RN-F020-06 |
| G-006 | Usuario solicita préstamo con 2FA OK | FA-020-C | RN-F020-09..14 |
| G-007 | Solicitud rechazada por scoring bajo | FA-020-C | RN-F020-10 |
| G-008 | Solicitud duplicada retorna 409 | FA-020-C | RN-F020-11 |
| G-009 | Usuario consulta cuadro amortización | FA-020-D | RN-F020-17 |
| G-010 | Usuario cancela solicitud PENDING | FA-020-E | RN-F020-15,16 |
| G-011 | Cancelar solicitud APPROVED → 422 | FA-020-E | RN-F020-15 |
| G-012 | Navegación módulo préstamos frontend | FA-020-F | LA-FRONT-001 |
| G-013 | /profile/notifications retorna 200 | FA-DEBT043-A | RN-F020-19 |
| G-014 | /profile/sessions retorna 200 | FA-DEBT043-A | RN-F020-20 |

---

*Requirements Agent · SOFIA v2.6 · BankPortal — Banco Meridian · Sprint 22 · 2026-04-02*
*CMMI Level 3 — RD SP 1.1, 1.2, 2.1, 3.1*
