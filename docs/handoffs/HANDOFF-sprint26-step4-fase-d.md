# HANDOFF — Sprint 26 · FEAT-024 · Step 4 · Fase D

**Generado:** 2026-04-27T14:09Z
**Origen:** chat anterior (Fases A+B+C completadas y verificadas)
**Destino:** chat nuevo (continuar desde Fase D)
**Sprint:** 26 · **Feature:** FEAT-024 Objetivos de Ahorro · **Release:** v1.26.0

---

## 1. Contexto inmediato

Estás continuando **Step 4 (Developer)** del pipeline SOFIA tras completar **Fases A+B+C**. El pipeline está pausado por handoff (límite de contexto del chat anterior). Tu trabajo: arrancar **Fase D (Infrastructure)** y continuar hasta **Fase H (G-4b)**.

**Lo que NO has hecho aún:** ningún `mvn compile`, ningún test, ningún Docker. Eso es esperado: hasta Fase D no hay JPA entities, así que el código no compila aún.

---

## 2. Estado del pipeline

```
Sprint 26 · FEAT-024
├─ Step 1 ✅ G-1 PO 2026-04-21
├─ Step 2 ✅ G-2 PO 2026-04-22
├─ Step 2b ✅ G-2b AUTO 2026-04-26
├─ Step 2c ✅ HITL PO+TL 2026-04-27
├─ Step 3 ✅ G-3 TL 2026-04-27
├─ Step 3b ✅ G-3b AUTO 2026-04-27
├─ Step 4 🟡 EN PROGRESO
│  ├─ Fase A ✅ Domain layer + DDL (19 Java + V29 SQL)
│  ├─ Fase B ✅ Domain services (3 services + SavingsGoal extendido)
│  ├─ Fase C ✅ Application (10 UCs + 13 records)
│  ├─ Fase D ⏳ Infrastructure (~14 archivos)
│  ├─ Fase E ⏳ API (Controller + ExceptionHandler + application.yml)
│  ├─ Fase F ⏳ Tests (~15 unit + 5-7 IT)
│  ├─ Fase G ⏳ Frontend (18 componentes Angular)
│  └─ Fase H ⏳ G-4b guardrail (mvn compile + tests + Docker + checklist fidelidad prototipo)
└─ Steps 5-9 ⏳ pendientes
```

**Decisión PO chat anterior:**
- Modo: fase por fase con confirmación entre cada una
- Tests: completos según LLD §12 (~15 unit + 5-7 IT)
- Frontend: 18 componentes completos según LLD §5

---

## 3. Lo que hay PERSISTIDO en disco

### Backend Java (32 archivos savings/ + 1 account/AccountReservePort = 33 · ~1,925 líneas)

```
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/savings/
├── domain/
│   ├── model/        (8 archivos: 4 entities + 4 enums)
│   │   ├── SavingsGoal.java          (113 líneas — incluye reserve/release/canBeClosed/progressPercent §2.2)
│   │   ├── GoalAllocation.java
│   │   ├── GoalMilestone.java
│   │   ├── GoalAutoRule.java
│   │   ├── GoalStatus.java           (ACTIVE/PAUSED/CLOSED/COMPLETED)
│   │   ├── AllocationType.java       (MANUAL/AUTO)
│   │   ├── AllocationStatus.java     (PENDING/SUCCESS/FAILED)
│   │   └── GoalCategory.java         (VIAJE/HOGAR/VEHICULO/EMERGENCIA/EDUCACION/OTROS)
│   ├── exception/    (6 archivos)
│   │   ├── GoalNotFoundException.java
│   │   ├── InsufficientFundsException.java
│   │   ├── MaxGoalsReachedException.java
│   │   ├── MilestoneAlreadyEmittedException.java
│   │   ├── ReservedExceedsTargetException.java
│   │   └── GoalAccessDeniedException.java
│   ├── service/      (3 archivos)
│   │   ├── GoalProjectionService.java   (84 líneas · projectedCompletionDate, suggestedMonthlyContribution, isAtRisk)
│   │   ├── MilestoneEvaluator.java      (92 líneas · idempotencia doble · THRESHOLDS={25,50,75,100})
│   │   └── GoalClosureService.java      (98 líneas · requiresSca configurable · close idempotente)
│   └── repository/   (4 archivos · puertos)
│       ├── SavingsGoalRepositoryPort.java     (6 métodos)
│       ├── GoalAllocationRepositoryPort.java  (4 métodos)
│       ├── GoalMilestoneRepositoryPort.java   (4 métodos)
│       └── GoalAutoRuleRepositoryPort.java    (5 métodos)
├── application/
│   ├── dto/SavingsDtos.java          (143 líneas · 13 records · 15 jakarta.validation)
│   └── usecase/      (10 archivos · 925 líneas total)
│       ├── CreateGoalUseCase.java         (@Transactional)
│       ├── ListGoalsUseCase.java
│       ├── GetGoalDetailUseCase.java
│       ├── UpdateGoalUseCase.java         (@Transactional)
│       ├── CloseGoalUseCase.java          (@Transactional + OTP)
│       ├── ContributeManualUseCase.java   (@Transactional)
│       ├── ConfigureAutoRuleUseCase.java  (@Transactional)
│       ├── PauseAutoRuleUseCase.java      (@Transactional)
│       ├── GetDashboardWidgetUseCase.java
│       └── ProcessAutoRuleUseCase.java    (@Transactional REQUIRES_NEW)
└── infrastructure/   (carpetas creadas vacías: persistence/{entity,jpa,adapter}, scheduler, corebanking)
    └── api/          (carpetas creadas vacías: controller, exception)
```

### Otros archivos

```
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account/domain/
└── AccountReservePort.java  (NUEVO · puerto ADR-040 · 5 métodos: reserve/release/transferReserved/availableBalance/retainedBalance)

apps/backend-2fa/src/main/resources/db/migration/
└── V29__savings_goals.sql   (3.4 KB · 4 tablas + UKs DEFERRABLE + UK parcial WHERE active=TRUE)

docs/architecture/sprint-26/
├── HLD-FEAT-024-sprint26.md         (10 KB)
├── LLD-backend-FEAT-024-sprint26.md (28.3 KB · §3.2 soft-delete + §3.3 GDPR + §14 trazabilidad 15/15 RNs)
└── LLD-frontend-FEAT-024-sprint26.md (15 KB)

docs/architecture/adr/
├── ADR-040-savings-segregacion-virtual-alpha.md
├── ADR-041-savings-scheduled-shedlock.md
└── ADR-042-openapi-springdoc-2.3.md

docs/functional-analysis/
└── FA-FEAT-024-sprint26.md  (17.8 KB · status READY_FOR_REVIEW)

docs/ux-ui/prototypes/
└── PROTO-FEAT-024-sprint26.html  (143.5 KB · 5 pantallas envueltas en shell completo · LA-CORE-050 inheritance)
```

### Confluence
- **Page 19464193** — Sprint 26 — HLD FEAT-024 Objetivos de Ahorro (parent 229379, space SOFIA/393220)

---

## 4. PASO 0 OBLIGATORIO al arrancar el nuevo chat

Aplica regla **LA-018-01** (CLAUDE.md):

```bash
# 1. Lee estado del pipeline
cat .sofia/session.json | head -100

# 2. Verifica integridad working tree (GR-GIT-001 / LA-CORE-061)
git status --porcelain | grep "^ D" | wc -l   # debe ser 0

# 3. Confirma branch
git branch --show-current   # debe ser feature/FEAT-024-sprint26

# 4. Lee este handoff completo
cat docs/handoffs/HANDOFF-sprint26-step4-fase-d.md

# 5. Lee el LLD-backend (sección 4 mapa tipos + §6 diagramas + §11 scheduler)
cat docs/architecture/sprint-26/LLD-backend-FEAT-024-sprint26.md
```

---

## 5. Fase D — Infrastructure (siguiente trabajo)

### Inventario esperado: ~14 archivos

#### D.1 — JPA Entities (4 archivos)
Ubicación: `apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/savings/infrastructure/persistence/entity/`

- `SavingsGoalEntity.java` → tabla `savings_goals`
- `GoalAllocationEntity.java` → tabla `goal_allocations`
- `GoalMilestoneEntity.java` → tabla `goal_milestones`
- `GoalAutoRuleEntity.java` → tabla `goal_auto_rules`

**Mapa de tipos crítico (LLD §4 / LA-019-13):** las 4 secciones §4.1–§4.4 detallan tipo-a-tipo el binding BD ↔ Java. Por ejemplo:
- `UUID` (BD) ↔ `UUID` (Java) · `@Column(columnDefinition="UUID")`
- `TIMESTAMPTZ` ↔ `Instant`
- `NUMERIC(12,2)` ↔ `BigDecimal`
- `DATE` ↔ `LocalDate`
- `VARCHAR(15)` con CHECK enum ↔ `@Enumerated(EnumType.STRING)`
- `SMALLINT` ↔ `short`
- `CHAR(7)` (allocation_month) ↔ `String`

**Patrón:** mira `pfm/infrastructure/persistence/entity/` o `bizum/infrastructure/persistence/` como referencia. Lombok permitido aquí (`@Entity`, `@Data` o `@Getter/@Setter`).

#### D.2 — Spring Data JpaRepository (4 archivos)
Ubicación: `.../infrastructure/persistence/jpa/`

- `JpaSavingsGoalRepository extends JpaRepository<SavingsGoalEntity, UUID>`
- `JpaGoalAllocationRepository extends JpaRepository<GoalAllocationEntity, UUID>`
- `JpaGoalMilestoneRepository extends JpaRepository<GoalMilestoneEntity, UUID>`
- `JpaGoalAutoRuleRepository extends JpaRepository<GoalAutoRuleEntity, UUID>`

Métodos derivados (Spring Data) según firmas de los puertos `domain/repository/`:
- `findByUserIdAndStatus`, `countByUserIdAndStatus`, `findByUserId`
- `findByGoalIdOrderByExecutedAtDesc`
- `findByGoalIdAndAllocationMonth`
- `existsByGoalIdAndPercent`
- `findByGoalIdAndActiveTrue`
- `findByActiveTrueAndNextExecutionAtBefore` (para scheduler — NOTA: el puerto declara `findDueForExecution(Instant)`; en el adapter mapearás a este derivado)

#### D.3 — Adapters @Primary (4 archivos)
Ubicación: `.../infrastructure/persistence/adapter/`

- `JpaSavingsGoalAdapter` implements `SavingsGoalRepositoryPort` `@Primary`
- `JpaGoalAllocationAdapter` implements `GoalAllocationRepositoryPort` `@Primary`
- `JpaGoalMilestoneAdapter` implements `GoalMilestoneRepositoryPort` `@Primary`
- `JpaGoalAutoRuleAdapter` implements `GoalAutoRuleRepositoryPort` `@Primary`

**Patrón crítico — LLD §4.5 + LA-019-13:**
- `Instant ↔ Timestamp.from(instant)` cuando se hace SQL nativo (LA-CORE-054)
- En este caso usamos JPA puro, así que `Instant` se mapea automáticamente con `@Column(columnDefinition="TIMESTAMPTZ")`
- Cada adapter mapea `Entity ↔ Domain` con métodos privados `toDomain()` / `toEntity()`

**Anotaciones:** `@Component` + `@Primary` (LLD §1 — mira `JpaPfmUserRuleAdapter` en `pfm/` como referencia).

#### D.4 — Scheduler (1 archivo · ADR-041)
Ubicación: `.../infrastructure/scheduler/`

- `AutoContributionScheduler.java` — esqueleto en LLD §11

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoContributionScheduler {
  private final GoalAutoRuleRepositoryPort ruleRepo;
  private final ProcessAutoRuleUseCase processRule;

  @Scheduled(cron = "${bank.savings.auto.cron}")
  @SchedulerLock(
      name = "savings-auto-contribution",
      lockAtMostFor = "${bank.savings.auto.lock-max}",
      lockAtLeastFor = "${bank.savings.auto.lock-min}"
  )
  public void runDueAutoContributions() { ... }
}
```

**NOTA:** el puerto `GoalAutoRuleRepositoryPort.findDueForExecution(Instant now)` devuelve `List<GoalAutoRule>`. El esqueleto LLD usa paginación con `PageRequest`; pero como el puerto no devuelve `Page<>`, mantén la firma simple (List<>) y lee todos los due en una llamada. Si más adelante llegas a >1000 reglas activas, refactorizas a paginación.

**Lombok:** SÍ permitido aquí (`@RequiredArgsConstructor`, `@Slf4j`) — igual que el patrón LLD.

#### D.5 — SavingsReserveAdapter (1 archivo · ADR-040)
Ubicación: `.../infrastructure/corebanking/`

Adapter delgado que delega en `AccountReservePort` del bounded `account/`. Su rol es exponer la operación bajo el namespace `savings/` para que el código savings no acople directamente con `account.domain.AccountReservePort`. Es **opcional según el LLD** — puedes omitirlo si los UCs ya inyectan `AccountReservePort` directamente (lo hacen actualmente). **Mi recomendación: SKIP este archivo** (los UCs Fase C ya inyectan `AccountReservePort` directamente). Si lo skippeas, documenta la decisión en el HANDOFF de salida.

#### D.6 — JpaAccountReserveAdapter (1 archivo · ADR-040)
Ubicación: `apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account/infrastructure/`

**CRÍTICO** — implementa `AccountReservePort` con SQL nativo o JPA sobre `account_balances` (V10). Operaciones:

```sql
-- reserve(accountId, amount):
UPDATE account_balances
SET available_balance = available_balance - :amount,
    retained_balance = retained_balance + :amount
WHERE account_id = :accountId
  AND available_balance >= :amount;
-- Si affectedRows = 0 → throw InsufficientFundsException

-- release(accountId, amount):
UPDATE account_balances
SET available_balance = available_balance + :amount,
    retained_balance = retained_balance - :amount
WHERE account_id = :accountId;

-- transferReserved(accountId, amount):
UPDATE account_balances
SET retained_balance = retained_balance - :amount
WHERE account_id = :accountId;
-- (el saldo disponible NO cambia: ya estaba descontado)
```

**Patrón:** `JdbcClient` (Spring 6.1+) o `JdbcTemplate`. Mira `pfm/infrastructure/persistence/JdbcPfmTransactionReadAdapter.java` como referencia. Anotaciones: `@Component @Primary`.

**Si usas `JdbcClient` con `Instant` parameters → usa `Timestamp.from(instant)` (LA-CORE-054).**

---

## 6. Decisiones que ya están tomadas (NO re-preguntes al PO)

| Decisión | Resolución |
|---|---|
| Modo de ejecución | Fase por fase con confirmación entre cada una |
| Tests Fase F | Completos según LLD §12 (~15 unit + 5-7 IT) |
| Frontend Fase G | 18 componentes completos según LLD §5 |
| `@Transactional` en Create/Update | Aplicado en Fase C (FIX) |
| Lombok en domain/services | NO (consistente con bizum/pfm) |
| Lombok en infrastructure | SÍ permitido (entities + scheduler) |
| Allocation MANUAL allocationMonth | NULL (UK aplica solo a AUTO) |
| OtpValidationUseCase reutilizado | SÍ (ya existe en twofa/) |
| SavingsReserveAdapter | RECOMENDACIÓN: SKIP (UCs ya inyectan AccountReservePort) |

---

## 7. Reglas/lecciones aplicables a partir de aquí

- **LA-CORE-053** — schema-drift-sql-native: verificar columnas de `account_balances` con `\d account_balances` antes de SQL nativo
- **LA-CORE-054** — instant-timestamptz-binding: `Timestamp.from(instant)` en JdbcClient/Template
- **LA-CORE-055** — sign-contract-backend: si BD devuelve CARGO con signo negativo, frontend aplica `Math.abs()` (no aplica en savings — solo lectura de retained_balance)
- **LA-CORE-056** — prototype-fidelity-visual-review: BLOQUEANTE en G-4 (Fase G)
- **LA-CORE-057** — select-twoway-binding: `[(ngModel)] + FormsModule` en selects con reset
- **LA-CORE-061** — git-divergence-undetected: PASO 0 obligatorio al arrancar
- **LA-CORE-067** — mcp-shell-stdio-buffer-limit: artefactos > 8KB → fragmentar con `appendFileSync` o `cat << 'EOF'` heredoc
- **LA-CORE-068** — angular-no-href-internal: nunca `[href]` para rutas internas (Fase G)

---

## 8. Comandos útiles

```bash
# Inspeccionar estado
cat .sofia/session.json | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=JSON.parse(d);console.log('current_step:',s.current_step);console.log('phase4_progress:',s.step4_progress);})"

# Verificar archivos savings/
find apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/savings -name "*.java" | wc -l   # ahora 32

# Ver migrations existentes
ls apps/backend-2fa/src/main/resources/db/migration/ | grep -E "V2[5-9]|V3"

# Ver estructura V10 account_balances (referencia ADR-040)
grep -A 10 "CREATE TABLE account_balances" apps/backend-2fa/src/main/resources/db/migration/V10__account_transactions.sql

# Patrón adapter referencia pfm
cat apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/pfm/infrastructure/persistence/*.java
```

---

## 9. Prompt sugerido para el nuevo chat

```
Continúa Sprint 26 BankPortal · Step 4 Developer · Fase D Infrastructure.

PASO 0 obligatorio (LA-018-01 + GR-GIT-001):
1. Lee .sofia/session.json (ver step4_progress)
2. Verifica `git status --porcelain | grep "^ D" | wc -l` = 0
3. Lee docs/handoffs/HANDOFF-sprint26-step4-fase-d.md

Las Fases A+B+C están completadas y persistidas (33 archivos Java + V29 SQL en disco). 
Las decisiones del PO ya están tomadas (ver §6 del handoff).

Arranca Fase D: 4 entities JPA + 4 JpaRepositories + 4 Adapters + AutoContributionScheduler + JpaAccountReserveAdapter (skip SavingsReserveAdapter por simplicidad).

Mantén el patrón "verifica" al final de cada fase como hicimos en A+B+C.
```

---

## 10. Salida esperada al cerrar Step 4

Cuando termines Fase H (G-4b):
- `mvn compile` → BUILD SUCCESS
- Tests unit + IT pass
- `docker compose up` → contenedores healthy
- Flyway V29 aplicada
- Checklist fidelidad prototipo (LA-CORE-056) firmado
- Persistencia en `session.json.artifacts['4_s26']` consolidada
- Branch lista para `git commit -m "FEAT-024 Sprint 26 Step 4 Developer"`
- Pipeline avanza a Step 5 (Code Reviewer)

---

*HANDOFF generado por Claude (Opus 4.7) · 2026-04-27 · sesión 1 (chat anterior)*
