# SPRINT-026 — Planning

**Proyecto:** BankPortal
**Cliente:** Banco Meridian
**Sprint:** 26 · `FEAT-024` · `v1.26.0` (target)
**Duración:** 2 semanas
**Capacity:** 24 SP
**Branch:** `feature/FEAT-024-sprint26` (desde `develop`)
**Scrum Master:** Ángel de la Cuadra
**Product Owner:** Ángel de la Cuadra
**Tech Lead:** Ángel de la Cuadra
**Fecha planning:** 2026-04-21

---

## 1. Sprint Goal

> Extender la experiencia de **banca inteligente** iniciada con PFM (FEAT-023) mediante un gestor de **Objetivos de Ahorro** que permita al cliente de Banco Meridian transformar su ahorro pasivo en metas con propósito (viajes, hogar, emergencia, educación), con aportaciones manuales y automáticas, seguimiento de hitos y proyección de cumplimiento. Paralelamente consolidar el contrato API del backend mediante **OpenAPI 3.1** como fuente de verdad, habilitando la ejecución efectiva del guardrail GR-SMOKE-001 (LA-CORE-064).

---

## 2. Alcance · 24 SP

### 2.1 FEAT-024 · Objetivos de Ahorro (18 SP)

| US | Título | SP | Prioridad |
|---|---|---|---|
| **US-024-01** | Crear objetivo de ahorro (nombre, importe, fecha, categoría, color/icono) | 3 | MUST |
| **US-024-02** | Listar objetivos activos con progreso y proyección | 2 | MUST |
| **US-024-03** | Detalle de objetivo con histórico de aportaciones y hitos | 2 | MUST |
| **US-024-04** | Aportación manual puntual (desde cuenta corriente/ahorro) | 3 | MUST |
| **US-024-05** | Aportación automática recurrente mensual | 3 | MUST |
| **US-024-06** | Editar / pausar / cerrar objetivo (con devolución a cuenta origen) | 2 | MUST |
| **US-024-07** | Alertas push de hitos 25/50/75/100 % | 2 | SHOULD |
| **US-024-08** | Widget 'Mi ahorro del mes' en dashboard | 1 | SHOULD |

**Subtotal FEAT-024: 18 SP**

### 2.2 DEUDA · OpenAPI como fuente de verdad + GR-SMOKE-001 (6 SP)

| Tarea | Descripción | SP |
|---|---|---|
| **DEBT-048** | Generar OpenAPI 3.1 completo del backend (springdoc-openapi). Publicar en `/v3/api-docs` y `/swagger-ui.html`. Versionar `docs/api/openapi-v1.26.0.yaml`. | 3 |
| **DEBT-049** | Script `.sofia/scripts/validate-smoke-vs-openapi.js` que implementa GR-SMOKE-001 (LA-CORE-064): extrae URLs absolutas del smoke, valida contra paths del OpenAPI, bloquea G-7 si hay mismatch. | 2 |
| **DEBT-050** | Actualizar `.sofia/skills/devops/SKILL.md` con checklist pre-G-7 que invoca el script anterior. | 1 |

**Subtotal Deuda: 6 SP**

### 2.3 Bugs PFM diferidos (0 SP asignado, best-effort como internal work)

Los **21 bugs BUG-PO-012..036** del review visual de S25 quedan como backlog técnico de menor prioridad. Se atacarán como *internal work* durante tiempos muertos del sprint, sin compromiso de resolución. Planificados para absorción completa en Sprint 27.

---

## 3. User Stories detalladas

### US-024-01 · Crear objetivo de ahorro (3 SP)
**Como** cliente BankPortal
**Quiero** crear una meta de ahorro con importe, fecha límite y categoría
**Para** canalizar mi ahorro hacia un propósito concreto

**Criterios de aceptación (Gherkin):**
```gherkin
Escenario: Creación básica de objetivo
  Dado un usuario autenticado con 2FA
  Cuando crea un objetivo con nombre 'Viaje Japón', importe 3000€, fecha 2027-06-30, categoría VIAJE
  Entonces el sistema devuelve 201 con el goalId
  Y el objetivo aparece en GET /api/v1/savings/goals con status ACTIVE, reservedAmount 0

Escenario: Validación importe fuera de rango
  Dado un usuario autenticado
  Cuando intenta crear un objetivo con importe 50€
  Entonces el sistema devuelve 400 con código BUDGET_OUT_OF_RANGE

Escenario: Límite de objetivos activos
  Dado un usuario con 10 objetivos ACTIVE
  Cuando intenta crear el objetivo número 11
  Entonces el sistema devuelve 422 con código MAX_GOALS_REACHED
```

### US-024-04 · Aportación manual (3 SP)
**Criterios de aceptación (Gherkin):**
```gherkin
Escenario: Aportación con saldo suficiente
  Dado un usuario con objetivo 'Viaje' y saldo 2000€ en cuenta origen
  Cuando aporta 500€ al objetivo
  Entonces reservedAmount del objetivo = 500€
  Y availableBalance de cuenta origen disminuye en 500€
  Y se genera un GoalAllocation con status SUCCESS

Escenario: Aportación con saldo insuficiente
  Dado un usuario con saldo disponible 100€
  Cuando intenta aportar 500€
  Entonces el sistema devuelve 422 con código INSUFFICIENT_FUNDS
  Y reservedAmount del objetivo no cambia
```

### US-024-05 · Aportación automática (3 SP)
**Criterios de aceptación:**
- Configuración: importe, día del mes (1-28), cuenta origen
- Motor de ejecución reutiliza patrón de FEAT-015 (transferencias programadas)
- Si saldo insuficiente en fecha de ejecución → status FAILED, notificación, NO bloquea siguientes ejecuciones (RN-F024-04)
- Idempotencia: una sola ejecución por (goalId, mes) incluso si el scheduler reintenta (patrón LA-023-02)

### US-024-06 · Cerrar objetivo con devolución
**Criterios de aceptación:**
- Al cerrar, reservedAmount se devuelve a la cuenta origen configurada en la última aportación
- Devolución > 30€ requiere SCA (PSD2) — reutilizar 2FA FEAT-001
- Status pasa a CLOSED (soft-delete) — histórico se preserva para GDPR Art.15

### US-024-07 · Alertas de hitos (2 SP)
**Criterios de aceptación:**
- Cada hito (25/50/75/100%) genera **una única** notificación (UK idempotencia RN-F024-09)
- Canal: push VAPID (FEAT-014) + entrada en historial FEAT-004
- 100% → notificación especial con CTA 'Cerrar objetivo'

---

## 4. Reglas de negocio consolidadas

| ID | Regla |
|---|---|
| RN-F024-01 | targetAmount ∈ [100€ .. 500.000€]; targetDate ∈ [hoy+30d .. hoy+30a] |
| RN-F024-02 | Máximo 10 objetivos ACTIVE simultáneos por usuario |
| RN-F024-03 | Aportación individual ∈ [10€ .. 5.000€] (coherente con límites Bizum/transf) |
| RN-F024-04 | Aportación automática con saldo insuficiente → FAILED + notif, NO bloquea ciclo |
| RN-F024-05 | Fondos virtualmente segregados (ADR-040): reservedAmount afecta availableBalance, NO ledgerBalance |
| RN-F024-06 | Cierre con devolución en t+0 a cuenta origen última aportación |
| RN-F024-07 | Categorías: VIAJE, HOGAR, VEHICULO, EMERGENCIA, EDUCACION, OTROS + custom (max 50 chars) |
| RN-F024-08 | Proyección: si ritmo actual insuficiente → sugerencia UI de incremento mensual |
| RN-F024-09 | Hitos: 1 notificación única por (goalId, milestone) — UK idempotencia |
| RN-F024-10 | GDPR Art.15/17: objetivos y aportaciones incluidos en export datos personales (FEAT-019) |
| RN-F024-11 | Cierre con devolución > 30€ → SCA PSD2 obligatoria |
| RN-F024-12 | Objetivos CLOSED preservados 7 años (obligación contable) |
| RN-F024-13 | Aportación automática ejecuta entre 00:00-06:00 UTC (horario batch) |
| RN-F024-14 | Motor reintenta 3 veces con backoff exponencial antes de marcar FAILED |
| RN-F024-15 | availableBalance cuenta origen considera reservedAmount de todos los objetivos activos |

---

## 5. Requisitos no funcionales (delta)

| ID | Requisito |
|---|---|
| RNF-F024-01 | Endpoints savings latencia p95 < 400ms con hasta 10 objetivos activos |
| RNF-F024-02 | Scheduler aportaciones automáticas: 1000 reglas procesadas < 60s |
| RNF-F024-03 | Dashboard widget: carga < 200ms |
| RNF-F024-04 | WCAG 2.1 AA (herencia FEAT-021) |
| RNF-F024-05 | Auditoría: toda operación CRUD sobre goal y allocation en audit_log |
| RNF-F024-06 | OpenAPI 3.1 auto-generado por springdoc, versionado en repo |
| RNF-F024-07 | Contrato API debe incluir todos los endpoints pre-existentes (retro-cobertura) |

---

## 6. Arquitectura preliminar

**Módulo hexagonal nuevo:** `savings`

```
savings/
  domain/
    model: SavingsGoal, GoalAllocation, GoalMilestone, GoalAutoRule
    exception: GoalNotFound, InsufficientFunds, MaxGoalsReached, MilestoneAlreadyEmitted
    service: GoalProjectionService, MilestoneEvaluator, GoalClosureService
    repository: SavingsGoalRepository, GoalAllocationRepository, GoalMilestoneRepository, GoalAutoRuleRepository
  application/
    usecase: CreateGoal, ListGoals, GetGoalDetail, UpdateGoal, CloseGoal, ContributeManual, ConfigureAutoRule, GetDashboardWidget
    dto: 12 DTOs (records)
  infrastructure/
    persistence: JpaSavingsGoalAdapter, JpaGoalAllocationAdapter, JpaGoalMilestoneAdapter, JpaGoalAutoRuleAdapter
    scheduler: AutoContributionScheduler (Spring @Scheduled)
    corebanking: SavingsReserveAdapter (extiende CoreBankingMockClient)
  api:
    controller: SavingsController (10 endpoints)
    exception: SavingsExceptionHandler
```

**Migración Flyway:** `V29__savings_goals.sql` — 4 tablas + índices + UK milestones

**ADR pendientes:**
- ADR-040: Estrategia de segregación de fondos (α virtual vs β contable) → elegimos α
- ADR-041: Motor de aportaciones automáticas (Spring @Scheduled vs Quartz)
- ADR-042: Contrato API OpenAPI 3.1 como fuente de verdad

---

## 7. Jira — Issues a crear (paso Atlassian tras G-1)

| Key (target) | Tipo | Resumen | SP |
|---|---|---|---|
| SCRUM-163 | Story | US-024-01 Crear objetivo de ahorro | 3 |
| SCRUM-164 | Story | US-024-02 Listar objetivos con progreso | 2 |
| SCRUM-165 | Story | US-024-03 Detalle con histórico | 2 |
| SCRUM-166 | Story | US-024-04 Aportación manual | 3 |
| SCRUM-167 | Story | US-024-05 Aportación automática mensual | 3 |
| SCRUM-168 | Story | US-024-06 Editar/pausar/cerrar objetivo | 2 |
| SCRUM-169 | Story | US-024-07 Alertas push de hitos | 2 |
| SCRUM-170 | Story | US-024-08 Widget ahorro dashboard | 1 |
| SCRUM-171 | Task | DEBT-048 Generar OpenAPI 3.1 backend | 3 |
| SCRUM-172 | Task | DEBT-049 Script validate-smoke-vs-openapi | 2 |
| SCRUM-173 | Task | DEBT-050 SKILL.md devops pre-G-7 checklist | 1 |

Total: **11 issues · 24 SP**

> Nota: los numeros SCRUM-163..173 son tentativos. Confirmar con API response tras creación (LA-023-xx: nunca asumir numeración secuencial).

---

## 8. Guardrails aplicables al sprint

| Guardrail | Gate | Descripción |
|---|---|---|
| **GR-GIT-001** (LA-CORE-061) | Arranque | Verificación working-tree vs HEAD. ✅ Ejecutada |
| **GR-DASH-002** (LA-CORE-059) | Cada gate | gen-global-dashboard.js tolerante ambos schemas |
| **GR-SCHEMA-001** (v2.7.0) | Cada gate | Consumidores session.json patrón defensivo |
| **LA-CORE-050** | G-2c | PASO 0: cp PROTO-FEAT-023-sprint25.html → PROTO-FEAT-024-sprint26.html |
| **LA-CORE-051** | Cada gate | current_step + pipeline_step atómicos |
| **LA-CORE-055** | G-4 | Backend normaliza signos antes de serializar |
| **LA-CORE-056** | G-4/G-5 | Checklist fidelidad prototipo BLOQUEANTE pantalla por pantalla |
| **LA-CORE-057** | G-4 | FormsModule + [(ngModel)] en selects con reset |
| **GR-SMOKE-001** (LA-CORE-064) | G-7 | Grep URLs smoke vs @RequestMapping — **se implementa en DEBT-049** |
| **GR-ATLASSIAN-001** (LA-CORE-060) | G-9 | Registrar acción manual UI Jira para cerrar sprint |

---

## 9. Definition of Done (DoD)

- [ ] Código compila (mvn clean verify + ng build) sin warnings nuevos
- [ ] Cobertura backend ≥ 88 % sobre módulo savings (mantiene baseline 89 %)
- [ ] 0 CVE críticos/altos; SAST ≤ baseline
- [ ] OpenAPI publicado y descargable en `/v3/api-docs`
- [ ] Script validate-smoke-vs-openapi pasa sin errores
- [ ] QA: ≥ 90 % TCs PASS, 0 críticos, todas las RNs verificadas
- [ ] Fidelidad prototipo: screenshot comparison por pantalla aprobada por PO antes de G-4b
- [ ] Flyway V29 aplicada en staging con éxito
- [ ] Documentación: 17 DOCX + 3 XLSX + release notes + runbook
- [ ] FA v0.11 consolidada con S1-S26
- [ ] Dashboard global regenerado en cada gate

---

## 10. Riesgos identificados

| ID | Riesgo | Mitigación |
|---|---|---|
| R-S26-01 | Segregación virtual α genera confusión contable en auditoría | ADR-040 documenta decisión y futura evolución a β |
| R-S26-02 | Scheduler aportaciones requiere configuración staging coherente | Test de integración con @SpringBootTest + timeshift |
| R-S26-03 | OpenAPI expone contratos de features antiguas con drift | DEBT-048 incluye auditoría 'pre-24' y corrección puntual |
| R-S26-04 | Bugs PFM diferidos (21) compiten por tiempo de developer | Explícitamente NO comprometidos; best-effort sin SP asignado |

---

## 11. Cadencia pipeline SOFIA v2.7

| Día | Steps |
|---|---|
| D1 | Step 1 (planning) · G-1 · Step 2 (SRS) · G-2 |
| D2 | Step 2b (FA) · G-2b · Step 2c (UX+prototype heredado) · G-2c |
| D3-D4 | Step 3 (HLD+LLD+ADRs) · G-3 · Step 3b (FA enriquecido) · G-3b |
| D5-D9 | Step 4 (Developer) + Step 4b (guardrail G-4b) · G-4 |
| D10 | Step 5 (Code Review) · G-5 · Step 5b (Security) · G-5b |
| D11-D12 | Step 6 (QA) · G-6 |
| D13 | Step 7 (DevOps + smoke validate-vs-openapi) · G-7 |
| D14 | Step 8 (Docs) · G-8 · Step 8b (FA) · G-8b · Step 9 (Workflow Manager) · G-9 |

---

**PLANNING APROBADO PENDIENTE DE HITL G-1**
