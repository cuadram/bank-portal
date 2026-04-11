# Code Review Report — FEAT-021: Depositos a Plazo Fijo
**Sprint 23 · BankPortal · Banco Meridian · Code Reviewer Agent · SOFIA v2.7**
**Fecha:** 2026-04-09 | **Veredicto:** APPROVED

---

## Resumen

| Categoria   | Cantidad |
|-------------|----------|
| Bloqueantes | 0        |
| Mayores     | 0        |
| Menores     | 2        |
| Sugerencias | 1        |

**APPROVED — avanza a QA sin condiciones.**

---

## Checklist (LA-020-09, LA-020-10)

- [x] Paquete raiz: com.experis.sofia.bankportal.deposit correcto
- [x] NUNCA anotacion-AuthPrincipal: req.getAttribute("authenticatedUserId") en todos los endpoints (LA-TEST-001)
- [x] BigDecimal HALF_EVEN en todos los calculos: IrpfRetentionCalculator, DepositSimulatorService, PenaltyCalculator, CancelDepositUseCase (ADR-036)
- [x] DATE -> LocalDate, TIMESTAMPTZ -> Instant en DepositEntity (LA-019-13)
- [x] OTP validado ANTES de persistir en OpenDepositUseCase y CancelDepositUseCase (LA-TEST-003)
- [x] DepositExceptionHandler cubre todas las excepciones custom incluyendo InvalidOtpException (patron BUG-STG-022-002)
- [x] Ruta /depositos lazy en app-routing.module.ts (LA-FRONT-001)
- [x] Nav item Depositos en shell.component.ts (LA-FRONT-001)
- [x] Sin [href] interno: router.navigate() en todos los componentes Angular (LA-023-01)
- [x] catchError devuelve of(default) — nunca EMPTY (LA-STG-001)
- [x] ActivatedRoute.paramMap en DepositDetailComponent (LA-019-11)
- [x] V26__deposits.sql con ON CONFLICT DO NOTHING en seeds (LA-022-09)
- [x] bank.products.deposit.* externalizados en application.yml — DEBT-044 CLOSED
- [x] CardPanValidator: regex ^[0-9]{13,19}$ + Luhn — DEBT-037 CLOSED
- [x] ExportAuditService: AccountRepositoryPort inyectado — DEBT-036 verificado CLOSED

---

## Hallazgos

**RV-F021-01** [Menor] DepositApplicationFormComponent: boton submit no deshabilita durante loading.
Correccion aplicada: [disabled]="loading" anadido.

**RV-F021-02** [Menor] CancelDepositUseCase: log poco descriptivo en guard diasTotales==0.
Correccion aplicada: log.warn con contexto de depositId.

**RV-F021-S01** [Sugerencia] Indice compuesto (user_id, estado) para listados de depositos activos.
Diferido a backlog tecnico DEBT-045 (baja prioridad).

---

## Verificaciones grep

grep [href] features/deposits/ -> Sin resultados (LA-023-01 OK)
grep TAE_STG SimulateLoanUseCase -> Sin resultados (DEBT-044 OK)
grep -r "^package" deposit/ | head -1 -> com.experis.sofia.bankportal.deposit (paquete correcto)

---

## Tests revisados

| Clase | TCs | Cobertura |
|---|---|---|
| IrpfRetentionCalculatorTest | TC-001..006 | Tramos 19/21/23%, limite exacto, escala 2d, importe cero |
| OpenDepositUseCaseTest | TC-007..011 | OTP-first, no-persist-on-fail, CoreBanking-after-save, estado ACTIVE, renovacion MANUAL |

*Code Reviewer Agent — SOFIA v2.7 — Sprint 23 — 2026-04-09*
