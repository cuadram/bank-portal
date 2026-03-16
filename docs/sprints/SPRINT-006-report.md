# Sprint Report — Sprint 6 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 6 |
| **Período** | 2026-05-26 → 2026-06-06 |
| **Release** | v1.5.0 — Go/No-Go APPROVED |

## Sprint Goal
> **"Completar FEAT-004, arrancar FEAT-005, saldar DEBT-007 + ACT-23/25."**

**Estado: ✅ ALCANZADO**

---

## Resumen de resultados

| Métrica | Planificado | Real | Δ |
|---|---|---|---|
| Story Points | 22 (+2 buffer) | 22 | ✅ buffer no consumido |
| Items completados | 7 | 7 | ✅ |
| NCs CR mayores | 0 | 0 | ✅ × 5 sprints consecutivos |
| NCs CR menores | 0 | 2 → resueltas en el ciclo | ⚠️ segunda ocurrencia (observar) |
| Defectos QA | 0 | 0 | ✅ × 6 sprints consecutivos |
| Gates HITL | 6 | 6 | ✅ 100% |
| WCAG 2.1 AA | 96 checks | 96/96 | ✅ |
| PCI-DSS req. 10.7 | US-402 | ✅ PDF/CSV con hash SHA-256 | — |

## Velocidad

| Tipo | SP planificados | SP completados |
|---|---|---|
| Tests deuda (ACT-23) | 2 | 2 |
| Operabilidad (ACT-25) | 2 | 2 |
| Tech-debt (DEBT-007) | 3 | 3 |
| FEAT-004 cierre | 5 | 5 |
| FEAT-005 US-401/402 | 7 | 7 |
| Buffer (R-S6-002) | 3 | — |
| **Total comprometido** | **22** | **22** |

**Velocidad Sprint 6:** 22 SP (sprint con buffer explícito)
**Velocidad media acumulada (6 sprints): 23.7 SP/sprint**

## Gates completados Sprint 6

| Gate | Aprobador | Estado |
|---|---|---|
| Sprint Planning | Product Owner | ✅ |
| ADR-010 + LLD-004 + LLD-005 | Tech Lead | ✅ |
| Code Review (2 NCs menores resueltas) | Tech Lead | ✅ |
| QA Lead | QA Lead | ✅ |
| QA Product Owner | Product Owner | ✅ |
| Go/No-Go PROD v1.5.0 | Release Manager | ✅ |

## Acciones de mejora Sprint 5 — efectividad (ACT-10)

| Acción | Efectividad |
|---|---|
| ACT-22 LLD notification antes del código | ✅ LLD-004 aprobado día 1 — NCs menores tuvieron causa raíz diferente (imports residuales, no gap de diseño) |
| ACT-23 TrustedDevicesComponent.spec.ts | ✅ 8 tests implementados, cobertura ~88% |
| ACT-24 DEBT-007 SSE CDN | ✅ ADR-010 + headers verificados en STG |
| ACT-25 Job HMAC_KEY_PREVIOUS | ✅ Operativo, sin revelar valor de clave |
| ACT-26 buildBody() 13 tipos | ✅ Switch exhaustivo — Java verifica en compilación |

**Efectividad ACT Sprint 5: 5/5 (100%)** — cuarto sprint consecutivo al 100%.

## Métricas acumuladas del proyecto (6 sprints)

| Métrica | Total |
|---|---|
| Sprints completados | 6 |
| SP totales | 142/142 (100%) |
| Defectos QA acumulados | 0 |
| NCs CR mayores acumuladas | 0 × 5 sprints |
| Gates HITL totales | 34 completados |
| Releases PROD | v1.0 → v1.5 |
| ADRs | ADR-001 → ADR-010 |
| LLDs | 10 documentos |
| Efectividad ACTs retro | 5/5 × 4 sprints consecutivos |

---

*SOFIA SM Agent — 2026-06-06 · Sprint 6 CLOSED · v1.5.0 en PROD*
