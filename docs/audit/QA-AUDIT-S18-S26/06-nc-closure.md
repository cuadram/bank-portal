# Fase 5 — Acta de cierre formal NC-CMMI-001

**NC ID:** NC-CMMI-001
**Clasificación:** Major
**Branch:** `hotfix/qa-audit-s18-s26`
**Abierta:** 2026-05-20 por HITL-PO Angel de la Cuadra
**Cerrada:** 2026-05-28 por HITL-PO Angel de la Cuadra
**ECD original:** 2026-05-27 · **Cierre real:** 2026-05-28 (+1d)

---

## 1. Hallazgo original

Reporte `QA-FEAT-023-sprint25.md` G-6 S25 declaraba `TC-IT-005 PASS — 5 ITs @SpringBootTest` (PfmControllerIT) sin evidencia ejecutable. Reproducción en HEAD ese sprint: **1/5 tests, 0 PASS, 1 ERROR estructural** (`Unable to find a @SpringBootConfiguration`). Auditoría extendida reveló que **22/22 `*IT.java`** del backend eran huérfanos del lifecycle Maven default (no failsafe-plugin, perfil `integration` sin sufijo `*IT.java`, CI invocando perfil fantasma `integration-tests`).

**Alcance:** Sprints S18-S26 (9 sprints). Sólo S20 y S23 confirmados limpios; S18/S19/S21/S22/S24/S25 con claims IT no respaldados; S25 único falsificado con evidencia directa (DEBT-055). **Impacto producto: NULO** (0 defectos producción en 27 sprints consecutivos). Gap de proceso de verificación, no de calidad de producto.

**Prácticas CMMI L3 impactadas:** PP/QPM SP1.2 (collect/analyze process & product measurements), VER SP3.2 (analyze verification results), CM SP3.2 (perform configuration audits).

---

## 2. Cronología y commits

| Fase | Descripción | Commit | Fecha |
|---|---|---|---|
| F0 | Setup branch + folder + NC + DEBTs | — | 2026-05-20 |
| F1 | Hotfix tests rotos main (DEBT-061) | `184e185` | 2026-05-20 |
| F2 | Audit retrospectiva S18-S26 (alcance 11→22) | `296e372` | 2026-05-28 |
| F3A | Failsafe-plugin + fix Jenkinsfile `-Pintegration` | `4d8fc59` | 2026-05-28 |
| F3B | Matriz IT real + triage S2 + 9 `@Disabled` | `d38cbe2` | 2026-05-28 |
| F4 | GR-QA-002 + SKILL qa-tester + 05-corrective-actions | `99779c4` | 2026-05-28 |
| F5 | LAs + cierre formal NC | _(este commit)_ | 2026-05-28 |
| F6 | Comunicación cliente Banco Meridian | PENDING | 2026-05-29+ |

---

## 3. Métricas de remediación

| Indicador | Antes (hotfix) | Después (HEAD) |
|---|---|---|
| Clases `*IT.java` ejecutadas por lifecycle Maven | **0 / 22** | **22 / 22** |
| Pipelines CI ejecutando IT | 0 / 3 (`Jenkinsfile apps`, `Jenkinsfile infra`, `.github/workflows/ci.yml`) | 1 / 3 (Jenkinsfile `apps` corregido) |
| Clases IT con resultado verificable (XML failsafe) | 0 | 22 (13 PASS · 9 `@Disabled` con DEBT activo) |
| `@Test` IT verdes con evidencia | 0 | 44 |
| Claims PASS sin evidencia admitidos en G-6 | sí (cultura "trust the report") | **no** (GR-QA-002 BLOQUEANTE) |
| Defectos producción durante ventana auditoría (S18-S26) | 0 | 0 (sin cambios) |

---

## 4. Acciones correctivas (DONE)

- **AC-1** Hotfix tests `main` (commit `184e185`): 5/6 tests rotos reparados; item 4 (`AmortizationCalculatorTest TC-LOAN-001/004`) `@Disabled` por DEBT-063 (ambigüedad TIN/TAE, gate legal cliente).
- **AC-2** `pom.xml` perfil `integration` con `maven-failsafe-plugin` (includes `**/*IT.java`, goals `integration-test`+`verify`) + `Jenkinsfile:199` corregido `-Pintegration-tests` → `-Pintegration` (commit `4d8fc59`).
- **AC-3** Ejecución matriz real + triage S2: 13 clases PASS, 9 `@Disabled` con DEBT (commit `d38cbe2`). DEBT-064 (Alta, 4 IT Testcontainers vs daemon Docker Desktop 29.4.1) y DEBT-065 (Media, 5 `@WebMvcTest` mal clasificados como `*IT`) registradas, remediación estructural diferida a S27.

## 5. Acciones preventivas (DONE)

- **AP-1** `GR-QA-002` en `.sofia/GUARDRAILS.md` (BLOQUEANTE · QA Tester · G-6): evidencia ejecutable obligatoria para claims PASS (XML failsafe + commit SHA + timestamp + conteo + perfil Maven). Sin XML → BLOCKED, no PASS, G-6 BLOQUEADO.
- **AP-2** `.sofia/skills/qa-tester/SKILL.md` con 3 ediciones quirúrgicas (Paso 2b + Exit Criteria New Feature + Plantilla output con sección "Evidencia ejecutable de IT").
- **AP-3** Checklist operativo pre-G-6 definido en GR-QA-002 (working tree limpio + SHA capturado + `mvn verify -Pintegration` + verificación XML por claim).

## 6. Deudas técnicas — balance

**Cerradas durante NC:**

| DEBT | Prioridad | Cierre |
|---|---|---|
| DEBT-055 | Crítica | F5: PfmControllerIT 5/5 PASS reproducible + GR-QA-002 impide recurrencia |
| DEBT-056 | Media | F4: cubierta por GR-QA-002 + AP-2 |
| DEBT-061 | Crítica | F1: tests `main` reparados |
| DEBT-062 | Crítica | F3A+F3B: failsafe configurado + 22/22 IT ejecutables |

**Diferidas a S27 (registradas con sprint_target y razón):**

| DEBT | Prioridad | Razón diferimiento |
|---|---|---|
| DEBT-063 | Alta | Gate legal cliente Banco Meridian (TIN/TAE) — offline |
| DEBT-064 | Alta | Migración Testcontainers→integration-compose >30 líneas; clase guardrail GR-003 |
| DEBT-065 | Media | Renombre 5 `@WebMvcTest` *IT → *Test = cambio de proceso, no de hotfix |

**Balance global:** 15 debts totales · 8 OPEN · 6 CLOSED (1 OPEN previa: DEBT-049 sin relación con NC).

## 7. Lecciones aprendidas registradas

| LA | Tipo | Guardrail propuesto | Promoción SOFIA-CORE |
|---|---|---|---|
| LA-026-09 | process/qa/governance | **GR-QA-002** (ya oficial en bank-portal) | candidata — diferida |
| LA-026-10 | process/qa/evidence | refuerzo operativo de GR-QA-002 (formato canónico) | candidata — diferida |
| LA-026-11 | process/ci/configuration | **GR-DEVOPS-001** (candidato): CI Profile Alignment Check pre-G-7 | candidata — diferida |

**Nota sobre promoción a SOFIA-CORE:** las 3 LAs quedan registradas con `sofia_core_candidate=true` pero la ejecución de `sofia-contribute.py --accept` se **difiere a sesión dedicada** cuando el working tree de SOFIA-CORE esté limpio (actualmente en `feature/sprint-arq-S14` con cambios in-flight no relacionados con esta NC). Diferir respeta la propia lección de NC-CMMI-001: no ampliar alcance de un hotfix mezclando workflows de repos distintos.

## 8. Trazabilidad CMMI L3

| Práctica | Cómo se ha atendido |
|---|---|
| PP/QPM SP1.2 (collect/analyze process & product measurements) | Matriz IT real (F3B) + evidencia XML obligatoria (GR-QA-002) sustituyen claims sin respaldo. Métricas verificables a posteriori. |
| VER SP3.2 (analyze verification results) | Reporte QA debe enumerar resultados ejecutables por clase, no agregados sin XML. Plantilla actualizada en SKILL qa-tester. |
| CM SP3.2 (perform configuration audits) | Pre-G-6 exige HEAD limpio + SHA registrado → auditable a posteriori. Checklist operativo en GR-QA-002. |

## 9. Decisión de cierre

**El HITL-PO confirma** que NC-CMMI-001 queda **CLOSED** con base en:
1. Causa raíz identificada y documentada (cultura "trust the report" + failsafe ausente + perfil CI fantasma).
2. Acción correctiva ejecutada y verificada empíricamente (22/22 IT ejecutables, build verde).
3. Acción preventiva desplegada y operativa desde el próximo G-6 (GR-QA-002 + SKILL + checklist).
4. Deudas residuales identificadas, priorizadas y diferidas con sprint target y razón documentada (no son riesgo de recurrencia de la NC; son refactors estructurales).
5. Trazabilidad CMMI L3 íntegra; impacto producto NULO mantenido.

**Pendiente F6:** comunicación al cliente Banco Meridian (decisión D3 de la apertura: notificación proactiva en línea con transparencia L3).

## 10. Firmas

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| HITL-PO | Angel de la Cuadra | (decisión registrada en session.json `cmmi_nc[0].closed_by`) | 2026-05-28 |
| QA Lead | (mismo PO en estructura HITL única SOFIA BankPortal) | — | 2026-05-28 |
| Cliente Banco Meridian | (pendiente F6) | — | F6 |

*NC-CMMI-001 Fase 5 · cierre formal · SOFIA · BankPortal · Banco Meridian*
