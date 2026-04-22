# SRS — FEAT-024 · Objetivos de Ahorro

## 1. Metadata

| Campo | Valor |
|---|---|
| **ID Feature** | FEAT-024 |
| **Nombre** | Objetivos de Ahorro ("Mis Metas") |
| **Proyecto** | BankPortal · **Cliente:** Banco Meridian |
| **Stack** | Java (Spring Boot 3) + Angular + PostgreSQL + Redis |
| **Tipo** | new-feature · **Sprint:** 26 · **Release:** v1.26.0 (target) |
| **Versión** | 1.0 · **Estado:** IN_REVIEW · **Fecha:** 2026-04-21 |
| **Autor** | Requirements Analyst (SOFIA v2.7) |
| **Aprobador** | Product Owner (pending G-2) |

## 2. Contexto

BankPortal cerró Sprint 25 con el módulo PFM "Mi Dinero" (FEAT-023), que permite al cliente **entender** sus gastos. FEAT-024 da el siguiente paso: le permite **actuar** sobre su ahorro, transformándolo de un residuo pasivo en dinero con propósito. La feature introduce el concepto de **metas de ahorro** con reserva virtual sobre la cuenta ahorro, aportaciones manuales y automáticas, seguimiento de hitos (25/50/75/100%) y proyección de cumplimiento.

La feature cierra la narrativa "banca inteligente" del sprint goal S25 y refuerza el posicionamiento competitivo de BankPortal frente a N26, Revolut y Monzo (quienes ofrecen pockets/spaces/goals como feature emblemática).

## 3. Alcance

**Incluido:**
- CRUD de objetivos con importe, fecha límite, categoría e icono
- Aportación manual puntual desde cuentas del cliente
- Aportación automática recurrente mensual (reutiliza motor FEAT-015)
- Cierre con devolución de fondos a cuenta origen (SCA si > 30€)
- Alertas push de hitos 25/50/75/100 % (reutiliza FEAT-014 VAPID + FEAT-004 historial)
- Proyección de fecha real vs fecha límite
- Widget "Mi ahorro del mes" en dashboard
- Segregación virtual de fondos (ADR-040) — reservedAmount afecta availableBalance, NO ledgerBalance
- Auditoría GDPR: objetivos y aportaciones incluidos en export FEAT-019
- OpenAPI 3.1 como fuente de verdad del contrato API (DEBT-048..050 habilitan GR-SMOKE-001)

**Excluido (backlog futuro):**
- Sub-cuentas contables reales (decisión ADR-040 → β futuro)
- Aportaciones con frecuencia distinta a mensual
- Objetivos compartidos entre múltiples usuarios
- Inversión automática del ahorro en fondos
- Rentabilidad sobre saldo reservado
- Gamificación extendida (ranking, logros visuales)

## 4. Épica

**EPIC-024: Ahorro con Propósito** — Dotar a los clientes de BankPortal de herramientas nativas para estructurar su ahorro en metas concretas, automatizar aportaciones y celebrar hitos, eliminando la necesidad de apps de terceros como Monefy, Fintonic o Goals (Revolut).

**Métricas de éxito (3 meses post-release):**
- ≥ 15% de clientes activos crean al menos un objetivo
- ≥ 40% de objetivos creados configuran aportación automática
- ≥ 60% de objetivos creados alcanzan el hito 25%
- 0 incidencias críticas de segregación de fondos

## 5. User Stories (18 SP)

### US-024-01 · Crear objetivo de ahorro (3 SP · MUST)

**Como** cliente BankPortal autenticado
**Quiero** crear una meta de ahorro con nombre, importe objetivo, fecha límite, categoría e icono/color
**Para** canalizar mi ahorro hacia un propósito concreto.

**Jira:** SCRUM-163

```gherkin
Scenario: Creación básica de objetivo
  Given un usuario autenticado con 2FA
  And tiene menos de 10 objetivos ACTIVE
  When invoca POST /api/v1/savings/goals con {name:"Viaje Japón", targetAmount:3000.00, targetDate:"2027-06-30", category:"VIAJE", icon:"plane", color:"#378ADD"}
  Then el sistema responde 201 con {goalId, status:"ACTIVE", reservedAmount:0, createdAt}
  And GET /api/v1/savings/goals incluye el objetivo

Scenario: Validación importe fuera de rango (RN-F024-01)
  When intenta crear un objetivo con targetAmount=50.00 (<100€)
  Then recibe 400 con {error:"BUDGET_OUT_OF_RANGE", field:"targetAmount", min:100, max:500000}

Scenario: Validación fecha límite fuera de rango (RN-F024-01)
  When intenta crear objetivo con targetDate dentro de 10 días
  Then recibe 400 con {error:"TARGET_DATE_OUT_OF_RANGE", minDays:30, maxYears:30}

Scenario: Límite de objetivos activos alcanzado (RN-F024-02)
  Given usuario con 10 objetivos en status ACTIVE
  When intenta crear el objetivo número 11
  Then recibe 422 con {error:"MAX_GOALS_REACHED", limit:10}

Scenario: Categoría custom válida (RN-F024-07)
  When crea objetivo con category="OTROS", customCategory="Boda de mi hermana"
  Then recibe 201 y customCategory se almacena tal cual (max 50 chars)
```

### US-024-02 · Listar objetivos con progreso y proyección (2 SP · MUST)

**Como** cliente BankPortal
**Quiero** ver todos mis objetivos activos con porcentaje de progreso y proyección de fecha de cumplimiento
**Para** saber de un vistazo cómo voy con cada meta.

**Jira:** SCRUM-164

```gherkin
Scenario: Listado básico con progreso
  Given usuario con 3 objetivos ACTIVE (reservedAmount 300/1500/0 sobre target 1000/3000/5000)
  When invoca GET /api/v1/savings/goals
  Then recibe 200 con array [{id, name, targetAmount, reservedAmount, percentProgress:30/50/0, projectedCompletionDate, status:"ACTIVE", category, icon, color, projectionRisk:boolean}]

Scenario: Proyección insuficiente (RN-F024-08)
  Given objetivo "Coche" con target 15000€, fecha límite 2026-12-31, ritmo mensual 200€
  When invoca GET /api/v1/savings/goals
  Then el objetivo tiene projectedCompletionDate > targetDate y projectionRisk=true
  And la respuesta incluye suggestedMonthlyContribution recalculado

Scenario: Orden y filtrado
  Then los objetivos vienen ordenados DESC por createdAt
  When invoca GET /api/v1/savings/goals?status=CLOSED → solo cerrados (GDPR Art.15)
```

### US-024-03 · Detalle de objetivo con histórico (2 SP · MUST)

**Como** cliente BankPortal **Quiero** ver el detalle completo de un objetivo con histórico de aportaciones y hitos **Para** hacer seguimiento del progreso.

**Jira:** SCRUM-165

```gherkin
Scenario: Detalle completo
  Given objetivo con 5 aportaciones (3 manuales, 2 auto) y 2 hitos (25%, 50%)
  When invoca GET /api/v1/savings/goals/{id}
  Then recibe goal + allocations[] (DESC executedAt) + milestones[] + autoRule (si existe)

Scenario: Ownership enforcement
  Given usuario A intenta acceder al objetivo de usuario B
  Then recibe 403 ACCESS_DENIED (sin revelar existencia)

Scenario: Paginación del histórico
  Given objetivo con 47 aportaciones
  When GET /api/v1/savings/goals/{id}/contributions?page=0&size=20
  Then page con 20 items y totalElements=47

Scenario: Objetivo inexistente
  Then 404 GOAL_NOT_FOUND
```

### US-024-04 · Aportación manual a objetivo (3 SP · MUST)

**Como** cliente BankPortal **Quiero** transferir un importe puntual desde mi cuenta a un objetivo **Para** acelerar el cumplimiento.

**Jira:** SCRUM-166

```gherkin
Scenario: Aportación con saldo suficiente (RN-F024-05)
  Given objetivo "Viaje" (reservedAmount=500€) y cuenta con availableBalance=2000€
  When POST /api/v1/savings/goals/{id}/contributions con {amount:500.00, sourceAccountId:"acc-001"}
  Then 201 {allocationId, status:"SUCCESS"}
  And reservedAmount objetivo = 1000€; availableBalance cuenta = 1500€
  And ledgerBalance cuenta NO cambia (segregación virtual)

Scenario: Saldo insuficiente
  Then 422 {error:"INSUFFICIENT_FUNDS", available:100, requested:500}

Scenario: Importe fuera de rango (RN-F024-03)
  When aporta 5€ o 6000€ → 400 AMOUNT_OUT_OF_RANGE [10..5000]

Scenario: Aportación que supera target
  Given target=3000€, reservedAmount=2900€, aporta 150€
  Then 422 TARGET_WOULD_BE_EXCEEDED, remainingToTarget:100

Scenario: Alcance de hito (RN-F024-09)
  Given reservedAmount=700€ / target=3000€ (23%)
  When aporta 80€ (pasa a 26%)
  Then se emite 1 notif hito 25% y se crea GoalMilestone(percent=25) con UK idempotente

Scenario: Backend normaliza signo (LA-CORE-055)
  Then amount en response es siempre positivo (Math.abs server-side antes de serializar)
```

### US-024-05 · Aportación automática mensual (3 SP · MUST)

**Como** cliente BankPortal **Quiero** configurar una aportación automática mensual **Para** ahorrar sin esfuerzo.

**Jira:** SCRUM-167

```gherkin
Scenario: Configuración inicial de regla
  Given objetivo ACTIVE sin autoRule
  When PUT /api/v1/savings/goals/{id}/auto-rule con {amount:200, dayOfMonth:5, sourceAccountId:"acc-001"}
  Then 200 {ruleId, active:true, nextExecutionAt:"2026-05-05T02:00:00Z"}

Scenario: Ejecución exitosa scheduler (RN-F024-13)
  Given regla activa, saldo suficiente
  When scheduler despierta día 5 a las 02:00 UTC
  Then GoalAllocation allocationType=AUTO, status=SUCCESS
  And reservedAmount aumenta 200€
  And nextExecutionAt recalculado al mes siguiente

Scenario: Saldo insuficiente en ejecución (RN-F024-04)
  Given availableBalance=50€, regla amount=200€
  Then GoalAllocation status=FAILED, reason=INSUFFICIENT_FUNDS
  And notif push enviada
  And NO reintento inmediato; nextExecutionAt al mes siguiente
  And regla sigue active=true

Scenario: Idempotencia scheduler (LA-023-02)
  Given scheduler ejecuta 2 veces el mismo día
  Then UNA SOLA GoalAllocation por (goalId, YYYY-MM) — UK (goal_id, allocation_month)

Scenario: Reintentos por fallo técnico (RN-F024-14)
  Given corebanking timeout
  Then 3 reintentos backoff 1m/5m/15m
  And si los 3 fallan → status=FAILED, reason=TECHNICAL_ERROR

Scenario: Pausar regla
  When DELETE /auto-rule → active=false; no ejecuta próximo ciclo
```

### US-024-06 · Editar / pausar / cerrar objetivo con devolución (2 SP · MUST)

**Jira:** SCRUM-168

```gherkin
Scenario: Edición simple
  When PUT /goals/{id} {name, targetAmount, targetDate} → 200

Scenario: Rebaja target < reservedAmount
  Given reservedAmount=800€, intenta target=500€
  Then 422 RESERVED_EXCEEDS_TARGET

Scenario: Cierre con devolución ≤ 30€ (RN-F024-06, sin SCA)
  Given reservedAmount=20€
  When DELETE /goals/{id}
  Then 200 {status:"CLOSED", refundedAmount:20, refundTargetAccountId:"acc-001"}

Scenario: Cierre con devolución > 30€ requiere SCA (RN-F024-11)
  Given reservedAmount=500€
  When DELETE sin X-OTP → 401 OTP_REQUIRED scaReason:REFUND_OVER_THRESHOLD
  When DELETE con X-OTP válido → 200, devolución, status=CLOSED

Scenario: Preservación GDPR (RN-F024-12)
  Given objetivo CLOSED hace 3 años
  When usuario ejerce GDPR Art.15 vía FEAT-019
  Then aparece en export con status CLOSED y todas sus allocations

Scenario: Cierre con autoRule activa
  Then autoRule eliminada cascade; no ejecuta próximo ciclo
```

### US-024-07 · Alertas push de hitos (2 SP · SHOULD)

**Jira:** SCRUM-169

```gherkin
Scenario: Hito 25% emisión
  Given progreso 23% pasa a 26% por aportación
  Then GoalMilestone(percent=25, emittedAt=now) creado
  And notif push VAPID título "¡25% alcanzado!" body "{goalName}: {reservedAmount}€ de {targetAmount}€"
  And entrada FEAT-004 type=GOAL_MILESTONE

Scenario: Idempotencia (RN-F024-09)
  Given GoalMilestone(goal_id, percent=25) ya emitido
  When progreso vuelve a cruzar 25% por reapertura/re-aportación
  Then NO nueva notif (UK BD)

Scenario: Hito 100% con CTA
  Then notif incluye {action:"CLOSE_GOAL", deeplink:"/savings/goals/{id}/close"}

Scenario: Sin suscripción push
  Given usuario sin VAPID activa
  Then GoalMilestone se crea (audit) y entrada FEAT-004; sin push (evita ruido logs)

Scenario: Sin retroactividad
  Given hito alcanzado hace 2 días sin push; se suscribe hoy
  Then NO se le envían hitos pasados
```

### US-024-08 · Widget Mi ahorro en dashboard (1 SP · SHOULD)

**Jira:** SCRUM-170

```gherkin
Scenario: Widget con objetivos activos
  When carga /dashboard
  Then GET /api/v1/savings/dashboard-widget
  And recibe {totalReserved, monthlyContributions, activeGoalsCount:3, nextMilestone:{goalId, goalName, percent}}

Scenario: Sin objetivos
  Then widget muestra CTA "Crea tu primer objetivo" → /savings/new
  And response {activeGoalsCount:0, cta:true}

Scenario: Performance (RNF-F024-03)
  Then p95 < 200ms

Scenario: Ocultación opcional
  Given settings.widgets.savings=false
  Then dashboard NO renderiza <app-savings-widget>
```

## 6. Reglas de negocio (15 RNs)

| ID | Regla |
|---|---|
| **RN-F024-01** | targetAmount ∈ [100€..500.000€]; targetDate ∈ [hoy+30d..hoy+30a] |
| **RN-F024-02** | Máximo 10 objetivos ACTIVE simultáneos por usuario |
| **RN-F024-03** | Aportación manual: importe ∈ [10€..5.000€] |
| **RN-F024-04** | Aportación auto saldo insuficiente → FAILED + notif; NO bloquea ciclo |
| **RN-F024-05** | Fondos virtualmente segregados (ADR-040): reservedAmount afecta availableBalance, NO ledgerBalance |
| **RN-F024-06** | Cierre con devolución t+0 a cuenta origen última aportación; si no hay, cuenta primaria |
| **RN-F024-07** | Categorías: VIAJE, HOGAR, VEHICULO, EMERGENCIA, EDUCACION, OTROS + customCategory (max 50 chars) |
| **RN-F024-08** | Proyección: ritmo insuficiente → projectionRisk=true; suggestedMonthlyContribution = (target-reserved)/mesesHastaTarget |
| **RN-F024-09** | Hitos: una notif por (goalId, percent) — UK idempotente pfm_goal_milestones |
| **RN-F024-10** | GDPR Art.15/17: objetivos+aportaciones en export FEAT-019; soft-delete preserva 7 años |
| **RN-F024-11** | Cierre con devolución > 30€ requiere SCA PSD2 (FEAT-001 2FA) |
| **RN-F024-12** | Objetivos CLOSED preservados 7 años (obligación contable/fiscal) |
| **RN-F024-13** | Scheduler ejecuta 00:00-06:00 UTC; dayOfMonth ∈ [1..28] (evitar meses cortos) |
| **RN-F024-14** | Reintentos 3x backoff exponencial (1m/5m/15m) antes de FAILED por fallo técnico |
| **RN-F024-15** | availableBalance cuenta considera SUM(reservedAmount) de objetivos ACTIVE que la usan como origen |

## 7. Requisitos no funcionales (7 RNFs)

| ID | Requisito | Métrica |
|---|---|---|
| **RNF-F024-01** | Latencia endpoints savings/* | p95 < 400 ms con hasta 10 objetivos activos |
| **RNF-F024-02** | Throughput scheduler aportaciones automáticas | 1.000 reglas procesadas en < 60 s |
| **RNF-F024-03** | Dashboard widget | Respuesta p95 < 200 ms |
| **RNF-F024-04** | Accesibilidad | WCAG 2.1 AA (herencia FEAT-021) |
| **RNF-F024-05** | Auditoría | Toda CRUD sobre goal y allocation en audit_log con actor/acción/timestamp |
| **RNF-F024-06** | Contrato API | OpenAPI 3.1 auto-generado por springdoc-openapi 2.3, versionado en docs/api/openapi-v1.26.0.yaml |
| **RNF-F024-07** | Cobertura retroactiva OpenAPI | Todos los endpoints pre-FEAT-024 documentados (auditoría drift) |

## 8. Regulación aplicable

| Marco | Aplicación |
|---|---|
| **GDPR Art.15** | Derecho de acceso: objetivos y aportaciones en export FEAT-019 |
| **GDPR Art.17** | Derecho al olvido: cierre soft-delete, preservación contable 7 años |
| **PSD2-SCA** | Devoluciones > 30€ requieren doble factor (FEAT-001 2FA) |
| **PCI-DSS** | No aplica directo (sin datos tarjeta); reutiliza infra PCI-compliant |
| **Ley 10/2014** | Saldos reservados NO son depósitos a plazo; sin Fondo de Garantía específico — comunicado claro en UI |

## 9. Matriz de trazabilidad (RTM)

| US | RN | RNF | Endpoint | Component Angular | Test (TC) | FA-id |
|---|---|---|---|---|---|---|
| US-024-01 | 01, 02, 07 | 01, 04 | POST /api/v1/savings/goals | goal-create-form | TC-F024-001..004 | FA-024-A |
| US-024-02 | 08 | 01, 04 | GET /api/v1/savings/goals | goals-list | TC-F024-005..007 | FA-024-B |
| US-024-03 | — | 01, 04 | GET /goals/{id} (+children) | goal-detail | TC-F024-008..011 | FA-024-C |
| US-024-04 | 03, 05, 09, 15 | 01, 05 | POST /goals/{id}/contributions | contribution-modal | TC-F024-012..017 | FA-024-D |
| US-024-05 | 04, 13, 14 | 02, 05 | PUT/DELETE /goals/{id}/auto-rule | auto-rule-form, AutoContributionScheduler | TC-F024-018..023 | FA-024-E |
| US-024-06 | 06, 11, 12 | 01, 05 | PUT/DELETE /goals/{id} | goal-edit-form, goal-close-modal | TC-F024-024..030 | FA-024-F |
| US-024-07 | 09 | 05 | (sin endpoint público; GoalMilestone backend + push VAPID) | milestone-toast | TC-F024-031..035 | FA-024-G |
| US-024-08 | — | 03, 04 | GET /api/v1/savings/dashboard-widget | savings-widget | TC-F024-036..038 | FA-024-H |
| DEBT-048 | — | 06, 07 | /v3/api-docs, /swagger-ui.html | — | TC-F024-039 | — |
| DEBT-049 | — | 06 | (script SOFIA) | — | TC-F024-040..042 | — |
| DEBT-050 | — | — | (skill update) | — | — | — |

## 10. Modelo de datos preliminar

**Flyway migration:** `V29__savings_goals.sql`

**Tabla `savings_goals`**
```sql
CREATE TABLE savings_goals (
  id                 UUID PRIMARY KEY,
  user_id            UUID NOT NULL,
  name               VARCHAR(100) NOT NULL,
  target_amount      NUMERIC(12,2) NOT NULL CHECK (target_amount BETWEEN 100 AND 500000),
  reserved_amount    NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (reserved_amount >= 0),
  target_date        DATE NOT NULL,
  category           VARCHAR(20) NOT NULL,
  custom_category    VARCHAR(50),
  icon               VARCHAR(30),
  color              VARCHAR(10),
  status             VARCHAR(15) NOT NULL CHECK (status IN ("ACTIVE","PAUSED","CLOSED","COMPLETED")),
  source_account_id  UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at          TIMESTAMPTZ,
  CONSTRAINT uk_user_goal_name UNIQUE (user_id, name) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX idx_savings_goals_user_status ON savings_goals(user_id, status);
```

**Tabla `goal_allocations`**
```sql
CREATE TABLE goal_allocations (
  id                 UUID PRIMARY KEY,
  goal_id            UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount             NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  allocation_type    VARCHAR(10) NOT NULL CHECK (allocation_type IN ("MANUAL","AUTO")),
  source_account_id  UUID NOT NULL,
  rule_id            UUID,
  allocation_month   CHAR(7),
  status             VARCHAR(10) NOT NULL CHECK (status IN ("PENDING","SUCCESS","FAILED")),
  failure_reason     VARCHAR(50),
  executed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uk_goal_month UNIQUE (goal_id, allocation_month) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX idx_goal_allocations_goal_time ON goal_allocations(goal_id, executed_at DESC);
```

**Tabla `goal_milestones`** (idempotencia RN-F024-09)
```sql
CREATE TABLE goal_milestones (
  id              UUID PRIMARY KEY,
  goal_id         UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  percent         SMALLINT NOT NULL CHECK (percent IN (25,50,75,100)),
  reached_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_id UUID,
  CONSTRAINT uk_goal_milestone UNIQUE (goal_id, percent)
);
```

**Tabla `goal_auto_rules`**
```sql
CREATE TABLE goal_auto_rules (
  id                UUID PRIMARY KEY,
  goal_id           UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount            NUMERIC(10,2) NOT NULL CHECK (amount BETWEEN 10 AND 5000),
  day_of_month      SMALLINT NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  source_account_id UUID NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  next_execution_at TIMESTAMPTZ NOT NULL,
  last_execution_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_goal_active_rule ON goal_auto_rules(goal_id) WHERE active = TRUE;
```

## 11. Endpoints REST (10 + 2 auxiliares)

| Método | Path | Summary | Request | Response |
|---|---|---|---|---|
| GET | /api/v1/savings/goals | Listar objetivos | query: status? | 200 SavingsGoalDto[] |
| POST | /api/v1/savings/goals | Crear objetivo | CreateGoalRequest | 201 SavingsGoalDto |
| GET | /api/v1/savings/goals/{id} | Detalle objetivo | — | 200 GoalDetailDto |
| PUT | /api/v1/savings/goals/{id} | Editar objetivo | UpdateGoalRequest | 200 SavingsGoalDto |
| DELETE | /api/v1/savings/goals/{id} | Cerrar con devolución | X-OTP si > 30€ | 200 CloseResultDto |
| POST | /api/v1/savings/goals/{id}/contributions | Aportación manual | ContributeRequest | 201 AllocationDto |
| GET | /api/v1/savings/goals/{id}/contributions | Histórico aportaciones | page, size | 200 Page<AllocationDto> |
| PUT | /api/v1/savings/goals/{id}/auto-rule | Configurar regla auto | AutoRuleRequest | 200 AutoRuleDto |
| DELETE | /api/v1/savings/goals/{id}/auto-rule | Pausar regla auto | — | 204 |
| GET | /api/v1/savings/goals/{id}/milestones | Hitos alcanzados | — | 200 MilestoneDto[] |
| GET | /api/v1/savings/dashboard-widget | Widget dashboard | — | 200 WidgetDto |
| GET | /v3/api-docs | OpenAPI 3.1 contract | — | 200 OpenAPI JSON |

## 12. Arquitectura hexagonal preliminar

Módulo nuevo `savings` (paralelo a pfm, bizum, deposit):

```
com.experis.sofia.bankportal.savings/
├─ domain/
│  ├─ model/         SavingsGoal, GoalAllocation, GoalMilestone, GoalAutoRule, GoalStatus, AllocationType
│  ├─ exception/     GoalNotFoundException, InsufficientFundsException, MaxGoalsReachedException,
│  │                 MilestoneAlreadyEmittedException, ReservedExceedsTargetException
│  ├─ service/       GoalProjectionService, MilestoneEvaluator, GoalClosureService
│  └─ repository/    SavingsGoalRepository, GoalAllocationRepository,
│                    GoalMilestoneRepository, GoalAutoRuleRepository
├─ application/
│  ├─ usecase/       CreateGoal, ListGoals, GetGoalDetail, UpdateGoal, CloseGoal,
│  │                 ContributeManual, ConfigureAutoRule, PauseAutoRule, GetDashboardWidget
│  └─ dto/           (12 records — request/response DTOs)
├─ infrastructure/
│  ├─ persistence/   JpaSavingsGoalAdapter, JpaGoalAllocationAdapter,
│  │                 JpaGoalMilestoneAdapter, JpaGoalAutoRuleAdapter
│  ├─ scheduler/     AutoContributionScheduler (@Scheduled cron="0 0 2 * * *")
│  └─ corebanking/   SavingsReserveAdapter (extiende CoreBankingMockClient)
└─ api/
   ├─ controller/    SavingsController (10 endpoints)
   └─ exception/     SavingsExceptionHandler (@ControllerAdvice, LA-TEST-003)
```

**ADRs previstos:**
- **ADR-040** — Segregación virtual (α) vs contable (β) → decisión α
- **ADR-041** — Motor aportaciones automáticas: Spring @Scheduled vs Quartz → decisión @Scheduled
- **ADR-042** — OpenAPI como fuente de verdad del contrato API → springdoc-openapi 2.3.0

## 13. Lecciones aprendidas aplicables

| LA | Aplicación en FEAT-024 |
|---|---|
| **LA-CORE-050** | G-2c PASO 0: copiar PROTO-FEAT-023-sprint25.html como base del prototipo FEAT-024 |
| **LA-CORE-051** | Atomicidad current_step + pipeline_step + gate_pending en cada gate |
| **LA-CORE-053** | Backend: verificar nombres columna con \d antes de SQL nativa |
| **LA-CORE-054** | JdbcClient: Timestamp.from(instant) para TIMESTAMPTZ |
| **LA-CORE-055** | Backend normaliza signos antes de serializar (Math.abs server-side) |
| **LA-CORE-056** | Developer compara cada pantalla Angular contra prototipo HTML antes de G-4b — BLOQUEANTE |
| **LA-CORE-057** | FormsModule + [(ngModel)] en selects con reset programático |
| **LA-023-01** | Rutas Angular: router.navigateByUrl(); nunca [href] nativo |
| **LA-023-02** | Idempotencia scheduler — UK (goal_id, allocation_month) |
| **LA-TEST-003** | SavingsExceptionHandler con @ControllerAdvice; códigos error en response body |
| **LA-FRONT-001** | /savings lazy route en app-routing; nav item en shell |
| **GR-SMOKE-001** | (LA-CORE-064) Implementación en DEBT-049; pre-G-7 valida smoke vs OpenAPI |

## 14. Riesgos y mitigaciones

| ID | Riesgo | P | Imp | Mitigación |
|---|---|---|---|---|
| R-S26-01 | Segregación virtual α genera confusión contable | Med | Alto | ADR-040 documenta α + evolución futura β. Banner UI "Saldo reservado no devenga intereses". |
| R-S26-02 | Scheduler requiere config staging UTC coherente | Baja | Med | Test @SpringBootTest timeshift. Cron en application.yml documentado. |
| R-S26-03 | OpenAPI expone drift de features antiguas sin anotar | Med | Med | DEBT-048 incluye auditoría pre-24 con corrección puntual. |
| R-S26-04 | 21 bugs PFM diferidos compiten por tiempo developer | Alta | Bajo | Explícitamente NO comprometidos; best-effort. Absorción S27. |
| R-S26-05 | Aportación auto 02:00 UTC durante mantenimiento CoreBanking | Baja | Med | Reintentos backoff RN-F024-14. Ventana mantenimiento documentada. |
| R-S26-06 | UK (goal_id, allocation_month) bloquea re-aportaciones manuales | Baja | Med | allocation_month NULL para MANUAL; UK solo aplica a AUTO. |

## 15. Definition of Ready (pre-Step 3)

- [x] Sprint Goal aprobado en G-1
- [x] 8 US + 3 DEBT con SP asignados (24 SP total)
- [x] 15 RNs con criterios Gherkin
- [x] 7 RNFs con métricas medibles
- [x] RTM completa (US ↔ RN ↔ Endpoint ↔ Component ↔ Test ↔ FA)
- [x] Modelo de datos preliminar (4 tablas, FK, UKs, CHECKs)
- [x] 10 endpoints REST identificados
- [x] 3 ADRs identificados (040, 041, 042)
- [x] 12 LAs/GRs aplicables mapeadas
- [x] 6 riesgos identificados con mitigación
- [x] Issues Jira creados (SCRUM-163..173) con links Blocks

## 16. Definition of Done (sprint-level)

- [ ] Código compila sin warnings nuevos (mvn + ng build)
- [ ] Cobertura módulo savings ≥ 88 %
- [ ] 0 CVE críticos/altos
- [ ] OpenAPI 3.1 publicado y versionado (DEBT-048)
- [ ] Script validate-smoke-vs-openapi pasa (DEBT-049)
- [ ] Skill devops actualizada (DEBT-050)
- [ ] QA ≥ 90 % TCs PASS, 0 críticos
- [ ] Fidelidad prototipo: screenshot comparison por pantalla aprobada PO
- [ ] Flyway V29 aplicada en staging con éxito
- [ ] 17 DOCX + 3 XLSX + release notes + runbook
- [ ] FA v0.11 consolidada con S1-S26
- [ ] Dashboard global regenerado en cada gate
- [ ] v1.26.0 taggeada y pusheada
- [ ] 11 issues SCRUM-163..173 → Finalizada
- [ ] Sprint 26 cerrado vía UI Jira (GR-ATLASSIAN-001)

---

**Gate pendiente:** G-2 (HITL PO)
**Aprobador:** Product Owner
**Comentario sugerido G-2:** "SRS FEAT-024 aprobado · 8 US + 3 DEBT · 15 RNs + 7 RNFs · RTM completa · ADR-040/041/042 identificados · riesgos mitigados"
