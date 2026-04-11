# FA-FEAT-020 — Gestión de Préstamos Personales
**Sprint:** 22 | **Versión:** v1.22.0 | **Feature:** FEAT-020
**Fecha:** 2026-04-02 | **Agente:** FA-Agent v2.3 | **SOFIA:** v2.6

---

## FA-020-A — Consulta de Préstamos Activos

**Módulo:** loans | **Sprint:** 22 | **Estado:** PLANNED
**Jira:** SCRUM-115
**Descripción:** El usuario autenticado puede consultar el listado paginado de sus préstamos y el detalle de cada uno, incluyendo capital original, saldo pendiente, TAE, cuota mensual y cuotas pagadas/pendientes.
**Endpoints:**
- `GET /api/v1/loans` → lista paginada de préstamos del usuario
- `GET /api/v1/loans/{id}` → detalle completo del préstamo
**Regulación:** Ley 16/2011 de crédito al consumo | Directiva 2008/48/CE
**Reglas de negocio:** RN-F020-01, RN-F020-02, RN-F020-03

---

## FA-020-B — Simulador de Préstamo Personal

**Módulo:** loans | **Sprint:** 22 | **Estado:** PLANNED
**Jira:** SCRUM-116
**Descripción:** Simulación stateless del coste de un préstamo. Devuelve cuota mensual, TAE, coste total y cuadro de amortización completo calculado con método francés (anualidad constante) y BigDecimal escala 10 (ADR-034).
**Endpoints:**
- `POST /api/v1/loans/simulate` → simulación sin persistencia
**Regulación:** Directiva 2008/48/CE (TAE), Ley 16/2011
**Reglas de negocio:** RN-F020-04, RN-F020-05, RN-F020-06, RN-F020-07, RN-F020-08

---

## FA-020-C — Solicitud de Préstamo con Pre-scoring y 2FA

**Módulo:** loans | **Sprint:** 22 | **Estado:** PLANNED
**Jira:** SCRUM-117
**Descripción:** El usuario puede solicitar un préstamo personal con validación OTP 2FA previa y pre-scoring automático (mock CoreBanking en STG). Genera audit log de todas las solicitudes.
**Endpoints:**
- `POST /api/v1/loans/applications` → crear solicitud (OTP 2FA obligatorio)
- `GET /api/v1/loans/applications/{id}` → estado de la solicitud
**Regulación:** PSD2, Ley 16/2011, GDPR (audit log)
**Reglas de negocio:** RN-F020-09, RN-F020-10, RN-F020-11, RN-F020-12, RN-F020-13, RN-F020-14

---

## FA-020-D — Cuadro de Amortización

**Módulo:** loans | **Sprint:** 22 | **Estado:** PLANNED
**Jira:** SCRUM-118
**Descripción:** Generación dinámica del cuadro de amortización mensual de un préstamo activo. Muestra: nº cuota, fecha, capital, intereses, cuota total, saldo pendiente. No persistido — calculado en tiempo real.
**Endpoints:**
- `GET /api/v1/loans/{id}/amortization` → cuadro de amortización completo
**Regulación:** Directiva 2008/48/CE, Ley 16/2011
**Reglas de negocio:** RN-F020-17, RN-F020-08, RN-F020-18

---

## FA-020-E — Cancelación de Solicitud de Préstamo

**Módulo:** loans | **Sprint:** 22 | **Estado:** PLANNED
**Jira:** SCRUM-118
**Descripción:** El usuario puede cancelar una solicitud de préstamo en estado PENDING. No se puede cancelar si está en estado APPROVED o PAID_OFF.
**Endpoints:**
- `DELETE /api/v1/loans/applications/{id}` → cancelar solicitud PENDING
**Regulación:** Ley 16/2011 (derecho de desistimiento)
**Reglas de negocio:** RN-F020-15, RN-F020-16

---

## FA-020-F — Frontend Angular — Módulo Préstamos

**Módulo:** frontend/loans | **Sprint:** 22 | **Estado:** PLANNED
**Jira:** SCRUM-119
**Descripción:** Módulo Angular completo con lazy loading para gestión de préstamos. Componentes: LoanListComponent, LoanDetailComponent, LoanSimulatorComponent, LoanApplicationFormComponent, AmortizationTableComponent. Ruta /prestamos registrada en app-routing.module.ts.
**Guardrails:** LA-FRONT-001 (ruta + nav item), LA-STG-001 (catchError→of([])), LA-STG-002 (environment.ts), LA-FRONT-004 (verificar endpoint backend antes de ruta)
**Reglas de negocio:** RN-F020-01..18 (consumidos desde API)

---

## FA-DEBT043-A — Endpoints Notificaciones y Sesiones en Perfil

**Módulo:** profile | **Sprint:** 22 | **Estado:** PLANNED | **Tipo:** DEUDA
**Jira:** SCRUM-120
**Descripción:** Implementación de endpoints ausentes detectados en STG Verification v1.21.0. GET /profile/notifications y GET /profile/sessions devolvían 404 en producción, dejando las secciones de Mi Perfil vacías.
**Endpoints:**
- `GET /api/v1/profile/notifications` → lista notificaciones recientes
- `GET /api/v1/profile/sessions` → lista sesiones activas (IP, dispositivo, última actividad)
**Reglas de negocio:** RN-F020-19, RN-F020-20

---

## FA-DEBT036-A — IBAN en Audit Log y Validación PAN Maestro

**Módulo:** export/cards | **Sprint:** 22 | **Estado:** PLANNED | **Tipo:** DEUDA
**Jira:** SCRUM-121
**Descripción:** (DEBT-036) ExportAuditService registra userId sin IBAN real — trazabilidad regulatoria incompleta. Fix: inyectar AccountRepository y resolver IBAN en momento de escritura. (DEBT-037) Regex PAN Maestro no cubre 19 dígitos (CVSS 2.1).
**Reglas de negocio:** RN-F020-21, RN-F020-22

---

## Reglas de Negocio FEAT-020

| ID | Descripción | FA |
|---|---|---|
| RN-F020-01 | Listado devuelve solo préstamos del usuario autenticado — nunca de otros usuarios | FA-020-A |
| RN-F020-02 | Estados válidos de préstamo: ACTIVE, PENDING, APPROVED, REJECTED, PAID_OFF, CANCELLED | FA-020-A |
| RN-F020-03 | Detalle incluye: capital original, saldo pendiente, TAE, cuota mensual, cuotas pagadas/pendientes | FA-020-A |
| RN-F020-04 | Simulación es stateless — no persiste ningún dato en base de datos | FA-020-B |
| RN-F020-05 | Importe válido para simulación y solicitud: 1.000 – 60.000 EUR | FA-020-B, FA-020-C |
| RN-F020-06 | Plazo válido: 12 – 84 meses | FA-020-B, FA-020-C |
| RN-F020-07 | TAE calculada según fórmula Directiva 2008/48/CE (crédito al consumo europeo) | FA-020-B |
| RN-F020-08 | Cálculo cuota: método francés, BigDecimal escala 10, RoundingMode.HALF_EVEN (ADR-034) | FA-020-B, FA-020-D |
| RN-F020-09 | Solicitud de préstamo requiere validación OTP 2FA previa (patrón LA-DEBT-041) | FA-020-C |
| RN-F020-10 | Pre-scoring mock: hash(userId) % 1000 → score > 600 = PENDING; ≤ 600 = REJECTED (RSK-022-01) | FA-020-C |
| RN-F020-11 | Solicitud duplicada con estado PENDING activo → HTTP 409 Conflict | FA-020-C |
| RN-F020-12 | Campos obligatorios en solicitud: importe, plazo, finalidad | FA-020-C |
| RN-F020-13 | Finalidades válidas: CONSUMO, VEHICULO, REFORMA, OTROS | FA-020-C |
| RN-F020-14 | Audit log obligatorio para toda solicitud de préstamo (creación, cambio estado, cancelación) | FA-020-C |
| RN-F020-15 | No se puede cancelar solicitud en estado APPROVED o PAID_OFF — HTTP 422 | FA-020-E |
| RN-F020-16 | Solo el propietario (mismo userId) puede cancelar su propia solicitud — HTTP 403 si otro | FA-020-E |
| RN-F020-17 | Cuadro de amortización generado dinámicamente desde parámetros del préstamo — no persistido | FA-020-D |
| RN-F020-18 | Cumplimiento Ley 16/2011: información precontractual obligatoria en simulación y solicitud | FA-020-D, FA-020-B |
| RN-F020-19 | GET /api/v1/profile/notifications → HTTP 200 con [] si sin datos — nunca 404 (DEBT-043) | FA-DEBT043-A |
| RN-F020-20 | GET /api/v1/profile/sessions → HTTP 200 con [] si sin datos — nunca 404 (DEBT-043) | FA-DEBT043-A |
| RN-F020-21 | ExportAuditService debe registrar IBAN real resuelto desde AccountRepository (DEBT-036, LA-020-03) | FA-DEBT036-A |
| RN-F020-22 | Regex PAN Maestro acepta 12–19 dígitos — CVSS 2.1 corregido (DEBT-037) | FA-DEBT036-A |

---

*FA-Agent v2.3 | SOFIA v2.6 | BankPortal — Banco Meridian | Sprint 22 | 2026-04-02*
