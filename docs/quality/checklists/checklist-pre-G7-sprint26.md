# Checklist pre-G-7 — Sprint 26 / FEAT-024 Objetivos de Ahorro

**Sprint:** 26
**Feature:** FEAT-024 Objetivos de Ahorro
**Release:** v1.26.0
**Step:** 7 (DevOps)
**Gate:** G-7 (HITL DV)
**Generado:** 2026-05-08
**Owner:** SOFIA DevOps Agent
**DEBT origen:** DEBT-050 (checklist-pre-G7 formal)

---

## Items canónicos pre-release

| # | Item | Estado | Evidencia |
|---|------|--------|-----------|
| 1 | Compile backend sin errores | ✅ PASS | `mvn compile` EXIT 0 (Java 21.0.10, Maven 3.9.13) |
| 2 | Tests backend lista canónica 21 clases | ✅ PASS | 147/147 · `docs/quality/evidence/sprint-26/devops-step7-tests-21clases.log` |
| 3 | Backend image construible | ✅ PASS | `bankportal-backend-2fa:local-dev` rebuild OK + healthy |
| 4 | Frontend ng build production | ✅ PASS | EXIT 0 con todos los fixes B.4 + Hallazgo 1 + OBS-008/009 |
| 5 | Frontend image construible | ✅ PASS | `bankportal-frontend-portal:local-dev` rebuild OK + healthy |
| 6 | Flyway V32+V33 aplicadas idempotentes | ✅ PASS | `flyway_schema_history` rows V32/V33 success=t |
| 7 | Smoke 409 inline (BUG-Q-008 fix) | ✅ PASS | C4.4: 7×201 + 3×409 · reservedAmount delta exacto · 0 perdidas |
| 8 | PUT auto-rule idempotencia (BUG-Q-003 fix) | ✅ PASS | C4.6: 200/200 · `docs/quality/evidence/sprint-26/qa-retest-step7-fixes.log` |
| 9 | smoke-test-v1.26.0.sh creado y syntax OK | ✅ PASS | `infra/compose/smoke-test-v1.26.0.sh` 11 checks |
| 10 | Categoría VIAJE (BUG-Q-001 fix V32) | ✅ PASS | C4.2: GET /goals retorna VIAJE, no VIAJES |
| 11 | Interceptor 409 cableado y funcional (B.4 quick patch) | ✅ PASS | savings.service.ts retry(1) backoff 500ms · contribution-modal.component.ts mensaje UX inline · ng build OK · self-review pragmatic firmada |

---

## Items adicionales Step 7 ampliado

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 12 | Hallazgo 1 (auth guard storage inconsistency) | ✅ FIX | goal-owner.guard.ts unificado con localStorage.access_token · DEBT-FE-074 abierta |
| 13 | OBS-008 (multi-cuenta selector fidelidad prototipo) | ✅ FIX | contribution-modal.component.ts muestra cuentas reales del usuario via AccountService |
| 14 | OBS-009 (saldos disponibles en summary-box) | ✅ FIX | summary-box muestra saldo real + disponible tras aportar |
| 15 | OBS-005 (selector cuenta en goal-create) | ⚠️ DEBT | DEBT-FE-075 abierta (prototipo HITL G-2c no exige aquí, baja prioridad) |
| 16 | DEBT-Q-073 (refactor 409 handling clean) | ⚠️ DEBT | quick patch B.4 funcional, refactor proper a S27 |

---

## Decision Records vinculados

- DR-S26-007 — B.4 quick patch 409 retry+UX inline
- DR-S26-008 — Hallazgos 1+3 auth guard + multi-cuenta selector

---

## DEBT abierta

| ID | Scope | Priorida | Sprint destino |
|----|-------|----------|----------------|
| DEBT-Q-073 | Refactor 409 handling: jitter + logging + ampliar a closeGoal/configureAutoRule/pauseAutoRule | Media | S27 |
| DEBT-FE-074 | Refactor unificado auth: 1 storage, 1 interceptor, 1 guard pattern (cierra DEBT-033 + 3-systems coexistence) | Alta | S27 |
| DEBT-FE-075 | Fidelidad prototipo: OBS-005 + cobertura E2E UI-driven | Media | S27 |
| DEBT-052 | springdoc política prod | Media | pre-PROD |
| DEBT-053 | userId() helper duplicado controllers | Baja | backlog |

---

## LA candidatas pendientes promoción SOFIA-CORE

- `GR-SHELL-001` · mvn en allowlist + TIMEOUT 600s shell SOFIA (commit `998f430` aplicado)
- `GR-SHELL-002` · soporte VAR=val cmd inline en allowlist (Step 7 wrapper python3 fue workaround)
- `GR-FE-002` · cobertura E2E UI-driven obligatoria pre-G-5/G-6 (originada en Hallazgo 1+OBS ocultas)

---

## Conclusión DevOps

✅ **G-7 RECOMENDADO PARA APROBACIÓN HITL DV**

Todos los items críticos pre-release verde. Deuda formalizada y trazable. Hallazgos preexistentes (auth guard, OBS multi-cuenta) resueltos en alcance ampliado Step 7 con DRs y DEBTs documentadas.

---
