# ADR-040 · Segregacion virtual alpha de fondos para Objetivos de Ahorro

| Campo | Valor |
|---|---|
| **ID** | ADR-040 |
| **Status** | ACCEPTED |
| **Date** | 2026-04-27 |
| **Sprint** | 26 |
| **Feature** | FEAT-024 - Objetivos de Ahorro |
| **Author** | Architect Agent · SOFIA v2.7 |
| **Approvers** | Tech Lead (G-3) |
| **Supersedes** | - |
| **Related** | RN-F024-05, RN-F024-15, V10__account_transactions.sql |

## Contexto

FEAT-024 introduce el concepto de objetivo de ahorro: el usuario reserva fondos
de una cuenta corriente hacia una hucha virtual con objetivo (importe + fecha limite).
RN-F024-05 exige que el dinero reservado **deje de ser gastable** desde la cuenta
origen pero **siga siendo del usuario** (no se transfiere a otra cuenta real).
RN-F024-15 exige que availableBalance de la cuenta refleje la reserva.

El sistema BankPortal ya distingue dos saldos por cuenta en la tabla
account_balances (V10__account_transactions.sql, Sprint 12):

```sql
account_balances (
  account_id        UUID PK,
  available_balance DECIMAL(15,2),  -- saldo disponible para gastar
  retained_balance  DECIMAL(15,2),  -- saldo retenido (no disponible)
  updated_at        TIMESTAMP
)
```

retained_balance se diseno originalmente para retenciones bancarias clasicas
(autorizaciones de tarjeta pendientes de captura, embargos, etc.) pero su
semantica encaja exactamente con la reserva de objetivos de ahorro.

## Decision

**Implementar la segregacion virtual alpha reutilizando account_balances.retained_balance**:

- Cada INSERT en goal_allocations (manual o auto) ejecuta atomicamente:

```sql
UPDATE account_balances
   SET available_balance = available_balance - :amount,
       retained_balance  = retained_balance  + :amount,
       updated_at        = now()
 WHERE account_id = :sourceAccountId
   AND available_balance >= :amount;
```

  Verificar affectedRows == 1; si 0 -> InsufficientFundsException.

- Cada cierre de objetivo con devolucion (DELETE /goals/{id}) ejecuta la
  operacion inversa con reservedAmount total del objetivo.

- savings_goals.reserved_amount mantiene la suma agregada por objetivo
  (denormalizacion justificada: lectura O(1) en widget y dashboard).

- Identidades invariantes:
  - SUM(goal_allocations.amount WHERE status=SUCCESS por goal) == savings_goals.reserved_amount
  - SUM(savings_goals.reserved_amount WHERE status=ACTIVE AND source_account_id=A) <= account_balances.retained_balance(A)

## Alcance - alpha vs beta

| Variante | Mecanismo | Coste impl. | Estado |
|---|---|---|---|
| **alpha (esta ADR)** | Segregacion virtual sobre retained_balance | Bajo | **ACCEPTED** |
| beta contable | Sub-cuenta hija (account_id) por objetivo, ledger paralelo | Alto | Diferida |

alpha resuelve el caso de uso del Sprint 26 sin coste de refactor.
beta se reevaluara si surge regulacion que exija segregacion contable real
(p.ej. cuentas remuneradas con fiscalidad propia).

## Consecuencias

### Positivas
- **Sin cambios en consumidores existentes.** Bizum, Deposit, PFM siguen leyendo
  availableBalance y obtienen automaticamente el saldo correcto post-reserva.
- **Sin nueva migracion Flyway** sobre accounts o account_balances.
  La V29 solo anade tablas savings_goals, goal_allocations, goal_milestones, goal_auto_rules.
- **Atomicidad simple**: una sola transaccion JDBC por aportacion.
- **Trazabilidad regulatoria**: retained_balance ya esta en el modelo contable.
- **Reversibilidad**: si en el futuro se adopta beta, las allocations actuales se
  pueden migrar a sub-cuentas sin perdida historica.

### Negativas / mitigaciones
- **Acoplamiento entre modulos savings y account.** El modulo savings escribe
  en una tabla del BC account.
  -> Mitigacion: introducir puerto de dominio AccountReservePort en
     account.domain.repository con dos operaciones (reserve, release);
     el adaptador JPA lo implementa. El modulo savings depende del puerto,
     no de la tabla.
- **Fragmentacion semantica de retained_balance**: ahora mezcla retenciones
  bancarias clasicas y reservas de ahorro.
  -> Mitigacion: anadir columna reservation_breakdown JSONB **diferida** a
     DEBT-051 (no bloqueante, solo si auditoria lo exige).
- **Saldo negativo si validacion falla**: una aportacion con saldo insuficiente
  podria generar available_balance < 0 si no se valida antes del UPDATE.
  -> Mitigacion: WHERE available_balance >= :amount y verificar affectedRows==1.
     Test obligatorio TC-F024-013 con saldo justo en frontera.

### Neutrales
- ShedLock ya integrado (ADR-028) cubre la concurrencia del scheduler de
  aportaciones automaticas (ver ADR-041).

## Alternativas rechazadas

### Alt-1: Campo nuevo reserved_balance en account_balances
Anadir tercera columna especifica para objetivos de ahorro.
- **Rechazada**: duplica semantica con retained_balance. Obliga a actualizar
  todos los consumidores existentes para restar reserved_balance del computo
  de saldo gastable. Coste de refactor desproporcionado.

### Alt-2: Sub-cuenta real por objetivo (beta contable)
Cada objetivo es una nueva fila en accounts con parent_account_id.
- **Rechazada para Sprint 26**: requiere refactor de Account aggregate, IBAN
  generation policy, GDPR export de cuentas, y politicas de cierre.
  Estimacion 13-21 SP solo para infraestructura. No proporcionado al MVP.
  Reevaluable en sprint dedicado si surge driver regulatorio.

### Alt-3: Calculo on-the-fly de availableBalance
availableBalance = ledgerBalance - SUM(reservedAmount) calculado en cada lectura.
- **Rechazada**: rompe contrato de Account aggregate (campo persistido pasaria
  a ser derivado), obliga a join con savings_goals en cada lectura, degrada
  RNF de latencia, y genera deriva con retained_balance clasico.

## Implementacion - handoff Step 4

- Crear AccountReservePort en account.domain.repository.
- Crear JpaAccountReserveAdapter en account.infrastructure.persistence.
- Use cases ContributeManual, AutoContributionScheduler, CloseGoal invocan
  accountReservePort.reserve(...) / .release(...) dentro de su @Transactional.
- Test invariante en SavingsGoalIntegrationTest:
  SUM(allocations) == reserved_amount y SUM(reserved_amount) <= retained_balance.

## Referencias
- V10__account_transactions.sql - origen de retained_balance.
- ADR-028 - ShedLock distributed locking (relacionado, ADR-041 hereda).
- LLD-backend-FEAT-024-sprint26.md seccion 3.4 - atomicidad transaccional.
