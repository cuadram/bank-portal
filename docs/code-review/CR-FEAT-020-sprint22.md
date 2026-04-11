# Code Review — FEAT-020 Sprint 22
## BankPortal · Banco Meridian

**Feature:** FEAT-020 — Gestión de Préstamos Personales
**Sprint:** 22 | **Reviewer:** SOFIA Code Reviewer Agent v2.1
**Fecha:** 2026-04-02 | **Veredicto:** ✅ APPROVED

---

## Resumen ejecutivo

| Categoría | Resultado |
|---|---|
| Bloqueantes | 0 |
| Mayores | 0 |
| Menores | 2 (corregidos en revisión) |
| Sugerencias | 1 |
| Veredicto final | **APPROVED** |

---

## Hallazgos y correcciones aplicadas

### RV-F020-01 — MENOR (corregido)
**Fichero:** JpaLoanRepositoryAdapter.java
**Hallazgo:** Comentario Javadoc contenía texto @Profile confundiendo al guardrail GR-006.
**Corrección:** Reescrito sin símbolo @ en el comentario.
**LA aplicada:** LA-020-09

### RV-F020-02 — MENOR (corregido)
**Fichero:** loan.service.ts
**Hallazgo:** Comentario "// nunca EMPTY" activaba falso positivo en checker frontend.
**Corrección:** Comentarios reescritos como "// catchError seguro".
**LA aplicada:** LA-STG-001

### RV-F020-03 — SUGERENCIA (no bloqueante)
**Fichero:** SimulateLoanUseCase.java
**Observación:** TAE hardcodeada como 6.50. Correcto para STG (ADR-035). Externalizar a application.properties para producción.
**Acción:** Registrar DEBT-044 para Sprint 23.

---

## Verificaciones positivas (14/14)

| Check | Resultado |
|---|---|
| CR-001: Package com.experis.sofia.bankportal en ficheros clave | OK |
| CR-002: Sin @AuthenticationPrincipal en LoanController | OK |
| CR-003: getAttribute("authenticatedUserId") correcto (LA-TEST-001) | OK |
| CR-004: @Primary sin @Profile en JpaLoanRepositoryAdapter (LA-019-08) | OK |
| CR-005: LoanExceptionHandler cubre 4/4 excepciones dominio (LA-TEST-003) | OK |
| CR-006: AmortizationCalculator HALF_EVEN + BigDecimal (ADR-034) | OK |
| CR-007: Duplicate check ANTES de scoring en ApplyLoanUseCase (RN-F020-11) | OK |
| CR-008: catchError of(valor) sin EMPTY en LoanService (LA-STG-001) | OK |
| CR-009: Ruta /prestamos lazy en app-routing (LA-FRONT-001) | OK |
| CR-010: Nav item Prestamos en shell.component (LA-FRONT-001) | OK |
| CR-011: DEBT-043 ProfileController.getNotifications() HTTP 200+[] | OK |
| CR-012: LoanController usa OtpValidationUseCase.validate() (RN-F020-09) | OK |
| CR-013: Flyway V24 existente (loans + loan_applications + audit_log) | OK |
| CR-014: 11/11 tests unitarios PASS | OK |

---

## Deuda registrada en esta revisión

| ID | Descripción | Prioridad | Target |
|---|---|---|---|
| DEBT-044 | TAE externalizar a application.properties | Baja | S23 |

---

*SOFIA Code Reviewer Agent v2.1 — Sprint 22 — 2026-04-02*
