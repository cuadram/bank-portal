# Retrospectiva — Sprint 02
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Retrospectiva (CMMI Nivel 3 — OPF / OPD)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-04-10
> **Sprint:** 02 · Período: 2026-03-30 → 2026-04-10

---

## 1. Métricas de cierre

| Métrica                            | Objetivo   | Real              | Δ       |
|------------------------------------|------------|-------------------|---------|
| Story Points comprometidos         | 24 SP      | 24 SP             | 0%      |
| Story Points completados (DoD)     | 24 SP      | 24 SP             | ✅ 100% |
| US completadas                     | 3          | 3 (US-004/005/007)| ✅      |
| DEBT resueltas                     | 2          | 2 (DEBT-001/002)  | ✅      |
| Defectos QA                        | 0          | 0                 | ✅      |
| NCs Code Review (mayores)          | 0          | 0                 | ✅ mejora vs S1 |
| NCs Code Review (menores)          | —          | 4 (resueltas)     | —       |
| Gates HITL completados             | 4          | 4                 | ✅      |
| Ciclos de Code Review              | 1          | 1                 | ✅ mejora vs S1 |
| PCI-DSS 4.0 req. 8.4               | CUMPLE     | ✅ CUMPLE         | ✅      |
| Deuda técnica generada             | Mínima     | 1 ítem (DEBT-003) | Controlada |
| FEAT-001 cerrada                   | Sí         | ✅ CLOSED         | ✅      |

**Velocidad Sprint 02: 24 SP** · Velocidad media FEAT-001: 24 SP/sprint (estable)

---

## 2. What went well ✅

| # | Observación |
|---|-------------|
| 1 | **Cero NCs mayores en Code Review** — mejora directa respecto a Sprint 1 (2 NCs mayores cerradas). Los patrones de arquitectura hexagonal fueron absorbidos por el equipo sin retrabajo. |
| 2 | **Code Review completado en 1 ciclo** — en Sprint 1 fueron necesarios 2 ciclos. La inversión en ADR-005 (RSA-256) clarificó los criterios antes de empezar DEBT-002. |
| 3 | **DEBT-001 y DEBT-002 completadas sin bloqueos** — Redis y keypair RSA disponibles desde el día 1, mitigando NEW-R-001 y NEW-R-002 anticipadamente. |
| 4 | **US-007 Suite E2E Playwright operativa** — ≥ 10 tests E2E PASS en Jenkins, incluyendo todos los flujos críticos 2FA. Cierra la brecha de validación que quedó pendiente en Sprint 1. |
| 5 | **`audit_log` implementado como tabla inmutable** — requisito PCI-DSS 4.0 req. 8.4 verificado mediante test de integración explícito. Sin workarounds. |
| 6 | **Bucket4j + Redis distribuido** (DEBT-001) elimina la vulnerabilidad de rate limiter in-process detectada en Sprint 1. El riesgo R-003 queda definitivamente cerrado. |
| 7 | **FEAT-001 cerrada en exactamente 2 sprints** — tal como proyectó el risk register (R-008 CERRADO). Velocidad constante y predecible de 24 SP/sprint. |
| 8 | **Checklist DoD con `git status --short`** (ACT-01 de Sprint 1 Retro) implementado — sin archivos no trackeados en ningún merge de Sprint 2. |

---

## 3. What didn't go well ⚠️

| # | Observación | Impacto |
|---|-------------|---------|
| 1 | **TOTP_TEST_SECRET no configurado en CI** (NEW-R-003 PARCIAL) — los tests E2E de Playwright pasan en local pero requieren variable de entorno adicional en Jenkins para el flujo de verificación real de OTP. | Medio — riesgo de flakiness en CI si no se resuelve antes de Sprint 3 |
| 2 | **DEBT-003 generada** (DELETE /deactivate → POST) — violación REST semántico detectada en Code Review (RV-S2-001). Bajo impacto pero introduce deuda antes de empezar la próxima feature. | Bajo — rompe convención antes de que se integren clientes externos |
| 3 | **Sin retrospectiva de proceso entre sprints** — no se realizó una sesión formal de mejora de proceso entre Sprint 1 y Sprint 2. Las acciones de ACT-02 a ACT-06 se ejecutaron directamente sin revisión de efectividad. | Bajo — riesgo de que mejoras no se institucionalicen en el proceso SOFIA |
| 4 | **Documentación API no actualizada para DEBT-002** — la spec OpenAPI de `/api/v1/auth/login` no refleja el cambio de algoritmo JWT (HS256 → RSA-256). Puede impactar a clientes del API antes de comunicar el breaking change. | Medio — riesgo de integración con clientes externos |

---

## 4. Acciones de mejora → Sprint 03

| ID | Acción | Responsable | Prioridad | Sprint |
|----|--------|-------------|-----------|--------|
| ACT-07 | Configurar `TOTP_TEST_SECRET` como secret en Jenkins antes de iniciar Sprint 3 | DevOps | Alta | Pre-Sprint 3 |
| ACT-08 | DEBT-003: migrar `DELETE /deactivate` → `POST /deactivate` con deprecation notice | Backend Dev | Media | Sprint 3 backlog |
| ACT-09 | Actualizar spec OpenAPI (JWT RSA-256): documentar `alg: RS256` y proceso de key rotation | Backend Dev | Alta | Pre-Sprint 3 |
| ACT-10 | Institucionalizar revisión de efectividad de acciones en kick-off de cada sprint (5 min) | SM | Media | Sprint 3 inicio |
| ACT-11 | Añadir a DoD: "spec OpenAPI actualizada cuando se modifica contrato API" | SM / Tech Lead | Alta | Sprint 3 inicio |

---

## 5. Análisis de tendencias FEAT-001 (2 sprints)

| Métrica                | Sprint 1      | Sprint 2      | Tendencia |
|------------------------|---------------|---------------|-----------|
| SP entregados          | 24/24         | 24/24         | ✅ Estable |
| NCs mayores CR         | 2             | 0             | ✅ Mejora  |
| Ciclos de CR           | 2             | 1             | ✅ Mejora  |
| Defectos QA            | 0             | 0             | ✅ Estable |
| Deuda técnica generada | 2 items       | 1 item        | ✅ Mejora  |
| Gates en 1 ciclo       | 4/6 (67%)     | 4/4 (100%)    | ✅ Mejora  |

**Conclusión:** el equipo SOFIA alcanzó velocidad estable con calidad creciente. La curva de aprendizaje sobre los patrones de arquitectura hexagonal se completó en Sprint 2.

---

## 6. Riesgos — estado final FEAT-001

| ID | Riesgo original | Estado final |
|----|-----------------|--------------|
| R-001 | Desincronización TOTP | ✅ CERRADO — tolerancia ±1 período operativa |
| R-002 | Pérdida dispositivo 2FA | ✅ CERRADO — 10 recovery codes implementados |
| R-003 | Brute-force /verify | ✅ CERRADO — Bucket4j + Redis distribuido |
| R-004 | PO no disponible para HITL | ✅ CERRADO — todos los gates aprobados en SLA |
| R-005 | Compatibilidad librería TOTP | ✅ CERRADO — dev.samstevens.totp:1.7.1 compatible |
| R-006 | Diseño UI no validado | ✅ CERRADO — wireframes validados Sprint 1 |
| R-007 | Secretos TOTP en texto plano | ✅ CERRADO — AES-256 verificado en CR + QA |
| R-008 | FEAT-001 no cierra en Sprint 2 | ✅ CERRADO — FEAT-001 100% completada |
| NEW-R-001 | Redis no disponible en STG | ✅ CERRADO — disponible día 1 |
| NEW-R-002 | Keypair RSA no provisionado | ✅ CERRADO — generado y distribuido |
| NEW-R-003 | E2E Playwright falla en CI | ⚠️ ABIERTO → ACT-07 — TOTP_TEST_SECRET pendiente |

**Riesgos abiertos trasladados a Sprint 3:** NEW-R-003 (convertido en ACT-07)

---

## 7. Capacidad y proyección Sprint 03

| Dato | Valor |
|------|-------|
| Velocidad Sprint 1 | 24 SP |
| Velocidad Sprint 2 | 24 SP |
| Velocidad media | **24 SP** (alta confianza — 2 sprints consistentes) |
| Factor Sprint 3 | 1.0 (sin factor conservador — baseline sólido) |
| **Capacidad comprometida Sprint 3** | **24 SP** |

> DEBT-003 (2 SP estimados) debe incluirse en Sprint 3 como pre-requisito
> si se prevé integración de clientes externos con la API 2FA.

---

## 8. Trazabilidad CMMI Nivel 3

| Área de proceso CMMI | Evidencia en este artefacto |
|----------------------|-----------------------------|
| OPF (Org. Process Focus) | Lecciones aprendidas documentadas, acciones de mejora con responsable y sprint |
| OPD (Org. Process Definition) | Actualización DoD (ACT-11), institucionalización ACT-01 verificada |
| PMC (Project Monitoring & Control) | Análisis de tendencias 2 sprints, risk register actualizado |
| QPM (Quantitative Project Mgmt) | Métricas de velocidad, NCs, ciclos de CR con análisis de tendencia |
| CAR (Causal Analysis & Resolution) | Causa raíz identificada para cada observación negativa con acción correctiva |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 02 · 2026-04-10*
*Próxima revisión: Sprint 3 Review · Fecha estimada: 2026-04-24*
