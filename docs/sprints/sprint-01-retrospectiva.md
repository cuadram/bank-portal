# Retrospectiva — Sprint 01
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Retrospectiva (CMMI Nivel 3 — OPF / OPD)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-03-14
> **Sprint:** 01 · Período: 2026-03-11 → 2026-03-14 (sprint accelerado SOFIA)

---

## 1. Métricas de cierre

| Métrica                          | Objetivo       | Real          | Δ      |
|----------------------------------|----------------|---------------|--------|
| Story Points comprometidos       | 40 SP          | 40 SP         | 0%     |
| Story Points completados (DoD)   | 40 SP          | 40 SP         | ✅ 100% |
| US completadas (Must Have)       | 5              | 7             | +2     |
| NCs detectadas (total CR)        | —              | 17            | —      |
| NCs Mayores                      | 0              | 4             | —      |
| NCs Menores                      | —              | 13            | —      |
| NCs resueltas antes de QA        | 100%           | 100%          | ✅     |
| Cobertura JaCoCo backend         | ≥ 80%          | ≥ 80% ✅      | ✅     |
| Tests unitarios backend          | —              | 35 PASS       | ✅     |
| WCAG 2.1 AA checks (estático)    | —              | 76/76 PASS    | ✅     |
| Deuda técnica generada           | Mínima         | 7 ítems       | Asumida |
| Merge a main                     | Antes de retro | ✅ `567e343`  | ✅     |

**Velocidad real Sprint 01: 40 SP** — usada como baseline para Sprint 02.

---

## 2. What went well ✅

| # | Observación |
|---|-------------|
| 1 | **Pipeline Dev → CR → QA completamente ejecutado** en todas las US. Sin ninguna US mergeada sin CR y QA sign-off. |
| 2 | **Cero NCs abiertas al cierre**. Todas las NCs detectadas (17) fueron resueltas en la misma sesión de Code Review. |
| 3 | **Patrón `exhaustMap` en operaciones destructivas** establecido desde US-002 y aplicado consistentemente en US-003 y US-004 sin retrabajo. |
| 4 | **Accesibilidad WCAG 2.1 AA** verificada estáticamente en todas las US del frontend (76 checks acumulados). El conocimiento se transfirió progresivamente entre US. |
| 5 | **`DisableTwoFactorUseCase`** fue el componente con menos NCs del sprint (2 menores) — los patrones de US anteriores fueron absorbidos correctamente. |
| 6 | **WARN-01 cerrado** antes del merge. La invariante fail-safe del use case ahora tiene cobertura de test explícita para el path de estado corrupto. |
| 7 | **Merge limpio a `main`** con commit de limpieza de índice previo — sin conflictos, sin archivos huérfanos. |

---

## 3. What didn't go well ⚠️

| # | Observación | Impacto |
|---|-------------|---------|
| 1 | **2 archivos frontend fuera del índice git** (`recovery-codes.component.ts`, `two-factor.store.ts`) detectados solo al preparar el merge. Riesgo: el CI hubiera pasado con código no trackeado. | Medio |
| 2 | **DEBT-001** (RateLimiterService in-process) es un riesgo de seguridad real en producción: el rate limiter se pierde al reiniciar la instancia. No mitigable con tests unitarios. | Alto en prod |
| 3 | **DEBT-002** (anti-replay TOTP) no tiene mitigación en Sprint 01. `dev.samstevens.totp` no incluye protección nativa contra replay en la ventana de tolerancia. | Medio |
| 4 | **L4/L6 E2E Playwright** no ejecutado — los flujos completos no están validados en navegador real. Las verificaciones de accesibilidad son solo estáticas. | Medio |
| 5 | **`setTimeout` handles** en `RecoveryCodesComponent.ngOnDestroy` no cancelados (RV-003). Potencial memory leak en navegación rápida. | Bajo |

---

## 4. Acciones de mejora → Sprint 02

| ID | Acción | Responsable | Prioridad | Sprint |
|----|--------|-------------|-----------|--------|
| ACT-01 | Añadir `.gitignore` check a la DoD: `git status --short` debe estar limpio antes de cualquier merge | SM | Alta | Sprint 02 inicio |
| ACT-02 | DEBT-001: migrar RateLimiterService a Bucket4j + Redis (Spring Session) | Backend Dev | Alta | Sprint 02 |
| ACT-03 | DEBT-002: implementar anti-replay TOTP con cache en Redis (Set de OTPs usados, TTL 90s) | Backend Dev | Media | Sprint 02 |
| ACT-04 | L6: configurar Playwright y ejecutar E2E para flujos críticos 2FA | QA | Alta | Sprint 02 |
| ACT-05 | RV-003: cancelar `setTimeout` handles en `ngOnDestroy` | Frontend Dev | Baja | Sprint 02 |
| ACT-06 | DEBT-003: upgrade JaCoCo 0.8.12 → 0.8.13+ | Backend Dev | Baja | Sprint 02 |

---

## 5. Velocidad y capacidad para Sprint 02

| Dato | Valor |
|------|-------|
| Velocidad Sprint 01 | 40 SP |
| Factor de confianza Sprint 02 | 90% (tenemos velocidad histórica de 1 sprint) |
| Capacidad comprometida Sprint 02 | **36 SP** (conservador — incluye deuda técnica pesada) |

> La deuda técnica (DEBT-001, DEBT-002) consume ~10 SP de capacidad sin generar valor de negocio visible. El Sprint Goal de Sprint 02 debe reflejarlo explícitamente.

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 01 · 2026-03-14*
