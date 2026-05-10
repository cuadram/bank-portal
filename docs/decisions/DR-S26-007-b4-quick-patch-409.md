# DR-S26-007 — B.4 quick patch frontend 409 retry+UX

**Fecha:** 2026-05-08
**Sprint:** 26
**Step origen:** 7 (DevOps)
**Decisión PO:** Angel de la Cuadra
**Modalidad gobernanza:** B.4-pragmatic (self-review DevOps con firma HITL PO+TL)

## Contexto

Sprint 26 / FEAT-024 / Step 6 QA aprobó G-6 con 6 condiciones. La condición C2 (BUG-Q-008 concurrencia) requirió fix backend con `@Version` optimistic lock + 3 retries automáticos en `ContributeManualUseCase`. Tras agotar los 3 retries, el backend devuelve 409 `CONCURRENCY_CONFLICT`.

**Frontend Angular originalmente NO gestionaba 409 sobre POST /contributions.** Bajo carga adversarial, el usuario habría visto un error genérico 500 en lugar de un mensaje claro.

## Datos empíricos

Smoke test C4.4 (10 hilos POST simultáneos sobre mismo goal):
- 7/10 hilos → 201 Created (success)
- 3/10 hilos → 409 CONCURRENCY_CONFLICT
- reservedAmount final exacto: baseline + 7×amount (cero perdida silenciosa de fondos)
- Tiempo elapsed: 432ms

Probabilidad real estimada en producción uso normal: <0.05% (escenario adversarial 40% no representativo de uso humano).

## Opciones evaluadas

| ID | Opción | Coste | Beneficio |
|----|--------|-------|-----------|
| B.1 | Release v1.26.0 ya · DEBT-Q-072 toast S27 | 0 días | UX feo <0.05% durante 2 semanas |
| B.3 | Volver Step 4 frontend completo | 2-4 días + re-trabajo Steps 5-7 | Cero UX feo |
| **B.4** | **Quick patch frontend en Step 7 + DEBT-Q-073 refactor S27** | **~1h** | **UX correcto + cierre Sprint hoy** |
| B.5 | Volver Step 4 backend con backoff extra | 1-2 días | No requiere frontend |

## Decisión

**B.4-pragmatic seleccionada por PO.**

## Implementación aplicada

**Fichero 1:** `apps/frontend-portal/src/app/features/savings/services/savings.service.ts`
- Import: `HttpErrorResponse`, `timer`, `throwError`, `retry` operator
- Método `contribute()`: añadido `.pipe(retry({count:1, delay: ...}))` con condición estricta status===409 + error.error==='CONCURRENCY_CONFLICT'

**Fichero 2:** `apps/frontend-portal/src/app/features/savings/components/contribution-modal/contribution-modal.component.ts`
- Método `mapErrorToMessage()`: branch nuevo para 409 CONCURRENCY_CONFLICT con mensaje "Conflicto de concurrencia detectado. Espera unos segundos y reintenta la aportación."

## Self-review CMMI L3 PPQA (modalidad pragmatic)

| Aspecto | Veredicto |
|---------|-----------|
| Idiomático Angular/RxJS | ✅ |
| Type safety estricto | ✅ |
| Contrato API alineado | ✅ |
| Single Responsibility | ✅ |
| Trazabilidad | ✅ |
| Reversibilidad | ✅ |
| Backoff sin jitter | ⚠️ MINOR-001 → DEBT-Q-073 |
| Logging retry ausente | ⚠️ MINOR-002 → DEBT-Q-073 |
| Manejo otros 409 (genérico) | ✅ |
| Race con submitting flag | ✅ |
| Cobertura otros endpoints (closeGoal, configureAutoRule, pauseAutoRule) | ⚠️ → DEBT-Q-073 |

**Aprobado pragmatic con firma HITL PO+TL (Angel de la Cuadra).**

## Validación end-to-end

- ng build production EXIT 0
- Backend regression 147/147 tests
- Smoke 409 inline real: 7×201 + 3×409, reservedAmount exacto
- Visual: usuario confirma click meta + selector multi-cuenta + saldos visibles

## Deuda generada

DEBT-Q-073 (S27): refactor proper 409 handling
- jitter en backoff
- logging observabilidad
- ampliar a closeGoal, configureAutoRule, pauseAutoRule
- considerar interceptor global vs local pattern
