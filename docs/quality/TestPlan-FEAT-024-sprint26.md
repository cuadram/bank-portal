# Test Plan — FEAT-024 Objetivos de Ahorro · Sprint 26

## Metadata
- Proyecto: BankPortal | Cliente: Banco Meridian
- Stack: Java 21 / Spring Boot 3.3.4 (hexagonal) + Angular 17
- Tipo de trabajo: new-feature
- Sprint: 26 | Fecha: 2026-05-08
- Referencia Jira: SCRUM-163 (FEAT-024)
- Branch: feature/FEAT-024-sprint26 | HEAD: c0f6ab5
- Versión objetivo: v1.26.0
- Autor: SOFIA QA Tester (skill v2.6) bajo gobernanza HITL Angel de la Cuadra

## Inputs (referencias auditables)
- SRS aprobado G-2: docs/deliverables/sprint-26-FEAT-024/SRS-FEAT-024-sprint26.md
- FA aprobado G-2b: docs/functional-analysis/fa-index.json (108 func · 246 RN · S1-S26)
- LLD-backend / LLD-frontend aprobados G-3
- Code Review APPROVED G-5: docs/deliverables/sprint-26-FEAT-024/STEP5-code-review-report.md
- Security Report G-5b semáforo VERDE: docs/security/SecurityReport-Sprint26-FEAT-024.md
- Handoff entrada Step 6: docs/handoffs/HANDOFF-sprint26-step6-qa-tester.md

## Objetivo
Verificar (VER) y validar (VAL) FEAT-024 (9 US · 15 RN) cumpliendo:
- Cobertura funcional Gherkin >= 95%
- 0 defectos críticos abiertos al cierre
- Pirámide de testing CMMI L3 (unit + integration + E2E)
- WCAG 2.1 AA verificado con axe-core
- Pruebas reales contra entorno compose (NO mock)

## Alcance funcional

### User Stories (9)
| US | Título | Endpoint | Test Cases asignados |
|---|---|---|---|
| US-024-01 | Crear objetivo | POST /goals | TC-API-CREATE-{1..3} · TC-E2E-001 |
| US-024-02 | Listar objetivos | GET /goals | TC-API-LIST-{1..2} |
| US-024-03 | Detalle objetivo | GET /goals/{id} | TC-API-DETAIL-{1..3} · TC-E2E-001 |
| US-024-04 | Editar objetivo | PUT /goals/{id} | TC-API-UPDATE-{1..2} |
| US-024-05 | Cerrar objetivo | DELETE /goals/{id} | TC-API-CLOSE-{1..3} · TC-E2E-003 |
| US-024-06 | Aportación manual | POST /goals/{id}/contributions | TC-API-CONTRIB-{1..3} · TC-E2E-001 |
| US-024-07 | Configurar regla automática | PUT /auto-rule | TC-API-AR-{1..3} · TC-E2E-004 |
| US-024-08 | Pausar regla automática | DELETE /auto-rule | TC-API-AR-PAUSE · TC-E2E-004 |
| US-024-09 | Widget dashboard | GET /dashboard-widget | TC-API-WIDGET-{1..2} · TC-E2E-006 |

### Reglas de negocio (15)
| RN | Test Case | Tipo | Resultado |
|---|---|---|---|
| RN-F024-01 (max 10 ACTIVE) | TC-API-CREATE-LIMIT | API | PASS |
| RN-F024-02 (409 MaxGoalsReached) | TC-API-CREATE-LIMIT | API | PASS |
| RN-F024-03 (target >= reservado) | TC-API-UPDATE-RN03 | API | PASS (con observación SEC) |
| RN-F024-04 (idempotencia auto-rule mensual) | AutoContributionSchedulerIT | IT existente | PASS |
| RN-F024-05 (saldo suficiente) | TC-API-CONTRIB-INSUFF | API | NO probable (cap @Max 5000) |
| RN-F024-06 (reserva atómica) | TC-API-CONCURRENCY | API concurrencia | **FAIL** (BUG-Q-008) |
| RN-F024-07 (libera reserva al cerrar) | TC-E2E-001 final | E2E | PASS |
| RN-F024-08 (hitos 25/50/75/100) | TC-API-MILESTONES | API | PASS |
| RN-F024-09 (idempotencia hitos) | TC-API-MS-IDEMP | API | PASS |
| RN-F024-10 (categorías predefinidas) | TC-API-CREATE-CAT | API | PASS |
| RN-F024-11 (ACTIVE -> CLOSED) | TC-E2E-001 close | E2E | PASS |
| RN-F024-12 (SCA OTP si reserved>30€) | TC-E2E-003 | E2E | PASS |
| RN-F024-13 (días [1,5,10,15,20,25,28]) | TC-API-AR-DAYS | API | **FAIL** (BUG-Q-004) |
| RN-F024-14 (ShedLock multi-replica) | ShedLockEnabledIT | IT existente | PASS |
| RN-F024-15 (widget tolerante a fallos) | TC-API-WIDGET-DEGRADED | API | PASS parcial (BUG-Q-007) |

## Niveles de prueba

### Nivel 1 — Unitarias (auditoría)
- 145 tests · cobertura JaCoCo savings: INSTR 84.3% · LINE 87.2% · BRANCH 88.1% · METHOD 72.6%
- Umbral SOFIA >= 80% en líneas/instrucciones/branches → PASA
- Detalle por package en QA-Report §3

### Nivel 2 — Funcionales / Aceptación
- 9 US × (happy + error path) = 18 escenarios
- API-driven contra http://localhost:8081 (perfil staging real)

### Nivel 3 — Seguridad
- Endpoint sin token → 401 ✓
- Token mal formado → 401 ✓
- SQL injection en path id → 400 sin stack ✓
- Stack traces en respuestas: detectado en BUG-Q-003 (500 → revisar handler)
- Hallazgo SAST DEBT-059 confirmado (RESERVED_EXCEEDS_TARGET expone amounts)

### Nivel 4 — Accesibilidad WCAG 2.1 AA
- Herramienta: @axe-core/playwright v4.10.0
- Páginas auditadas: /auth/login (única pública)
- Resultado: 2 violaciones serias → BUG-Q-009
- Limitación: páginas autenticadas no auditadas en este sprint (deuda S27)

### Nivel 5 — Integration Tests con BD real
- 19 clases IT ejecutadas (lista canónica del handoff §7) · 145 tests · 145 PASS
- IntegrationTestBase ✓ · application-test.yml ✓ · SpringContextIT ✓
- ITs específicos savings (5): SavingsControllerIT, SavingsFlywayIT, AutoContributionSchedulerIT, MilestoneEmissionIT, ShedLockEnabledIT, JpaAccountReserveAdapterIT
- GAP: SavingsControllerIT cubre 3/11 endpoints (cobertura controller = 28.3%)

### Nivel 6 — E2E Playwright
- Spec: apps/frontend-portal/e2e-savings/savings.spec.ts
- Modo: API-driven (request fixture) — UI E2E diferido a S27 por BUG-Q-001
- 6 TC-E2E ejecutados → 6/6 PASS

### Nivel 7 — Performance
- DIFERIDO Sprint 27 (no bloqueante en G-6 según skill)

## Repositorio activo (LA-019-16)
- Perfil Spring activo: staging (verificado en docker logs)
- Repositorio: JPA-REAL (JpaSavingsGoalAdapter @Primary)
- Datos: SEED-BD (V30__seed_test_dataset_complete.sql)
- Estado: JPA-REAL + SEED-BD → gate G-6 elegible

## Smoke pre-condiciones (LA-019-07/08)
- /actuator/health → 200 UP (db, redis, liveness, readiness, ping)
- /v3/api-docs → 98 paths · 6 paths savings · 11 endpoints lógicos
- DEBT-048 (OpenAPI 3.1 sin JWT) cerrada y verificada
- Smoke script smoke-test-v1.26.sh: **NO EXISTE** → GAP DevOps (DEBT-049)

## Datos de prueba
- Usuarios: angel.delacuadra (uid 0001), maria.garcia (uid 0002)
- Cuenta origen STG: acc00000-0000-0000-0000-000000000001
- OTP bypass: 123456 (header X-OTP — discrepancia con docs §5.5)

## Cronograma ejecutado
1. Auditoría IT lista canónica 19 ITs · 145 tests → 145/145 PASS
2. Smoke real contra compose limpio (down -v + build)
3. TCs API-driven (8 baterías Node http)
4. Concurrencia + reproducción bugs
5. ng test (10 errores TS preexistentes no savings) + ng build:prod PASS
6. Playwright E2E (6 TCs) + axe a11y (1 TC)
7. Redacción entregables

## Criterios de salida (Exit criteria — new-feature)
| Criterio | Umbral | Estado | OK |
|---|---|---|---|
| TCs alta prioridad ejecutados | 100% | 100% | OK |
| Defectos Críticos abiertos | 0 | **2** (BUG-Q-001, BUG-Q-008) | **KO** |
| Defectos Altos abiertos | 0 | 1 (BUG-Q-003) | **KO** |
| Cobertura funcional Gherkin | >= 95% | 100% (9/9 US testeadas) | OK |
| Seguridad checks | 100% | 100% (con DEBT-059 ya en deuda) | OK |
| Accesibilidad checks | 100% | 0% (2 violaciones serias) | **KO** |
| Integration tests | obligatorio | 19 ITs PASS · 1 GAP cobertura controller | OK con observación |
| SpringContextIT | PASS | PASS | OK |
| DatabaseSchemaIT (vía SavingsFlywayIT) | PASS | PASS | OK |
| RTM actualizada | obligatorio | sí — ver QA-Report §RTM | OK |
| QA Lead + Product Owner | aprobación | pending HITL | — |