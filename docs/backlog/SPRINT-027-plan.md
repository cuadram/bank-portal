# Sprint Plan — Sprint 27 — BankPortal / Banco Meridian

## Metadata
- Cliente: Banco Meridian | PO/TL/SM/QA (HITL unico): Angel de la Cuadra
- Sprint: 27 | Feature: S27 saneamiento + deudas (sin FEAT nueva)
- Duracion: 1 semana (5 dias laborables) | Capacity: 14 SP
- SOFIA: v2.8 | Pipeline: 15 steps | Generado en Step 1 (Scrum Master)
- Estado al planificar: NC-CMMI-001 CERRADA (develop @ e95ceae, tag audit/NC-CMMI-001-closed)

## Sprint Goal (aprobado PO)
Estabilizar el suite de integracion y la configuracion multi-perfil post-NC-CMMI-001
(deudas de test/CI bajo GR-QA-002), saldando deuda funcional priorizada, dejando el
pipeline listo para feature en S28.

## Capacidad
- Velocidad historica: ~23 SP / 2 semanas (593 SP / 25 sprints) ~= 11.5 SP/semana pro-rata.
- Capacity fijada por PO: 14 SP. Es ~+22% sobre el pro-rata semanal.
- Justificacion de la holgura: trabajo de saneamiento de bajo descubrimiento (deudas ya
  diagnosticadas con fix conocido). Riesgo R-S27-03 monitorea desviacion.

## Reconciliaciones previas (transparencia CMMI L3)
1. BUG-PO: la etiqueta "21 diferidos" es pre-reconciliacion NC. El universo real es
   35 bugs (001-035, no existe 036). Criticos 001-009 corregidos en S25/S26. El set
   DIFERIDO real = BUG-PO-012..035 = 24 items (11 mayores 012-022 + 13 menores 023-035).
   Decision "todos" se interpreta sobre estos 24.
2. DEBT-062 (Critica): su causa raiz (maven-failsafe-plugin ausente) fue corregida al
   cerrar NC-CMMI-001 (22/22 IT ejecutables). Se incluye en S27 como tarea de
   VERIFICACION + cierre formal con evidencia, NO como re-fix. Pendiente reconciliar
   session.json.open_debts (figura OPEN; deberia validarse a CLOSED tras evidencia).
3. DEBT-063 (TIN/TAE): FUERA de S27. Gate legal Banco Meridian sin resolver -> sin
   DR-S27-001. Entrara cuando el gate se cierre.
4. DEBT-060 (Spring Boot 3.3.6+): FUERA de S27. Requiere sprint de mantenimiento de
   framework dedicado (no cabe en 1 semana de saneamiento).

## Alcance del sprint

### COMPROMETIDO (14 SP)
| ID | Tipo | Item | SP | Prio |
|---|---|---|---|---|
| S27-T01 | Tech Debt | DEBT-062 verificar 22/22 IT via mvn -Pit verify + acta cierre | 1 | Critica |
| S27-T02 | Tech Debt | DEBT-064 migrar 4 IT Testcontainers -> integration-compose + fixtures SQL | 5 | Alta |
| S27-T03 | Tech Debt | DEBT-065 renombrar 5 *IT -> *Test (slices @WebMvcTest) + verificar surefire | 2 | Media |
| S27-T04 | Tech Debt | DEBT-054 GR-CONFIG-001 (application-shared.yml import + validate-yaml-profiles.js + bloqueo G-4b) | 3 | Media |
| S27-B01 | Bug Fix | BUG-PO menores 023-035 (13, batch por componente) | 3 | Menor |
| | | TOTAL COMPROMETIDO | 14 | |

### SPRINT BACKLOG / INTERNAL WORK (sin compromiso, spillover S28)
| ID | Tipo | Item | SP | Prio |
|---|---|---|---|---|
| S27-B02 | Bug Fix | BUG-PO mayores 012-022 (11, batch por componente) | 6 | Mayor |
| S27-T05 | Tech Debt | DEBT-053 paginacion AutoContributionScheduler | 2 | Media |
| S27-T06 | Tech Debt | DEBT-059 mensaje excepcion savings (CWE-209) | 1 | Baja |

### FUERA DE S27
| ID | Motivo |
|---|---|
| DEBT-063 | Gate legal Banco Meridian pendiente (sin DR-S27-001) |
| DEBT-060 | Requiere sprint dedicado de upgrade de framework |


## Issues a crear en Jira (SCRUM, board 1) — SOLO tras aprobacion G-1
Propuesta de estructura (minimiza ruido en el board, 24 BUG-PO agrupados):
| Jira (propuesto) | Tipo | Resumen | SP | Estado inicial |
|---|---|---|---|---|
| S27-T01 | Tech Debt | DEBT-062 cierre formal IT lifecycle (verificacion) | 1 | READY |
| S27-T02 | Tech Debt | DEBT-064 IT Testcontainers -> integration-compose | 5 | READY |
| S27-T03 | Tech Debt | DEBT-065 rename *IT -> *Test slices | 2 | READY |
| S27-T04 | Tech Debt | DEBT-054 GR-CONFIG-001 merge YAML profiles | 3 | READY |
| S27-B01 | Story (umbrella) | BUG-PO menores 023-035 (13 subtasks) | 3 | READY |
| S27-B02 | Story (umbrella) | BUG-PO mayores 012-022 (11 subtasks) | 6 | BACKLOG |
| S27-T05 | Tech Debt | DEBT-053 paginacion scheduler | 2 | BACKLOG |
| S27-T06 | Tech Debt | DEBT-059 mensaje excepcion savings | 1 | BACKLOG |

Alternativa si PO prefiere trazabilidad 1:1: crear 24 issues Bug individuales para los
BUG-PO en lugar de 2 umbrellas. Decision en G-1.

## Risk Register — delta Sprint 27
| ID | Riesgo | Cat | Prob | Imp | Exp | Plan |
|---|---|---|---|---|---|---|
| R-S27-01 | DEBT-064: Testcontainers 1.20.1 vs Docker 29.4.1 puede resistir migracion y exceder 5 SP | Tecnico | M | A | A | Timebox 5 SP; si excede, fallback upgrade Testcontainers y mover a S28 |
| R-S27-02 | DEBT-063 bloqueada por gate legal externo (Banco Meridian) | Externo | A | M | A | Fuera de scope; PO reportara al resolver; no compromete S27 |
| R-S27-03 | Sobre-compromiso: alcance total candidato ~23 SP vs capacity 14 SP | Recursos | A | M | A | Commit acotado a 14 SP; resto internal work sin compromiso |
| R-S27-04 | Primer enforcement GR-QA-002 en G-6: todo *Test/*IT PASS exige XML ejecutable | Tecnico | M | M | M | T02/T03 dejan los IT en estado evidenciable antes de G-6 |

## Recomendacion housekeeping — ramas obsoletas
13 ramas locales feature/* estan TODAS mergeadas a develop. Las 9 de S2-S14
(FEAT-001-sprint2, 004-sprint8-semana1, 006-sprint7-semana2, 007-sprint9, 008-sprint10,
009-sprint11, 010-sprint12, 011-sprint13, 012-sprint14) son local-only (no en remoto).
- Recomendacion: BORRAR las 9 ahora (git branch -d, borrado seguro: refuse si no mergeada;
  reflog retiene ~30 dias). Sin efecto remoto, sin impacto en GR-GIT-001 (no borra ficheros).
- Las 4 recientes (013-sprint15 local-only; 021-sprint23, 022-sprint24, 024-sprint26 con
  remoto): conservar 1-2 sprints, alinear con politica de la rama hotfix/qa-audit.
- Ejecucion sugerida: micro-tarea de housekeeping separada (no dentro de Step 1), con
  confirmacion explicita del PO antes del borrado.

## Definition of Done / Exit criteria Sprint 27
- T02/T03: los 22 IT recolectados por mvn -Pit verify, con XML por test (GR-QA-002).
- T04: validate-yaml-profiles.js en verde + integrado como bloqueo G-4b.
- T01: acta de cierre DEBT-062 con evidencia (conteo + SHA + timestamp + perfil).
- B01: BUG-PO menores verificados visualmente por PO vs PROTO-FEAT-023.
- Dashboard global regenerado en cada gate (GR-011). 0 ficheros borrados (GR-GIT-001).

## Gate G-1 — HITL PO (PENDIENTE DE APROBACION)
Aprobar: (a) Sprint Goal, (b) capacity 14 SP, (c) alcance comprometido, (d) estructura de
issues (umbrellas vs 1:1), (e) interpretacion BUG-PO=24, (f) DEBT-062 como verificacion,
(g) housekeeping de ramas. Tras aprobacion -> crear issues en Jira (Step 1 fase 1b).


---
## ADDENDUM — Gate G-1 APROBADO (PO Angel de la Cuadra)
Fecha: 2026-05-29. Decisiones:
- (1) BUG-PO=24 (012-035) confirmado.
- (2) Capacity ELEVADA 14 -> 23 SP. TODO el alcance pasa a COMPROMETIDO
  (T01-T06 + B01 + B02). Ya no hay seccion de no-compromiso.
- (3) DEBT-062 como verificacion + cierre formal (no re-fix).
- (4) BUG-PO via 2 umbrellas (Historia): B01 menores 023-035, B02 mayores 012-022.
- (g) Housekeeping de 9 ramas S2-S14: NO incluido en la lista aprobada -> queda
  pendiente de OK explicito del PO en micro-tarea aparte.

### Alcance final comprometido S27 (23 SP)
| ID | Jira tipo | Item | SP |
|---|---|---|---|
| T01 | Tarea | DEBT-062 verificacion/cierre IT lifecycle | 1 |
| T02 | Tarea | DEBT-064 IT Testcontainers -> integration-compose | 5 |
| T03 | Tarea | DEBT-065 rename *IT -> *Test | 2 |
| T04 | Tarea | DEBT-054 GR-CONFIG-001 YAML profiles | 3 |
| T05 | Tarea | DEBT-053 paginacion scheduler | 2 |
| T06 | Tarea | DEBT-059 mensaje excepcion savings | 1 |
| B01 | Historia | BUG-PO menores 023-035 (umbrella, 13) | 3 |
| B02 | Historia | BUG-PO mayores 012-022 (umbrella, 11) | 6 |
| | | TOTAL | 23 |

Nota Jira: issues creados en backlog SCRUM. Asignacion a Sprint 27 e inicio del
sprint via UI (LA-025-10 / GR-ATLASSIAN-001: MCP carece de endpoints de ciclo de
vida de sprint).
