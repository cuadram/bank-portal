# ADR-041 · Motor de aportaciones automaticas: @Scheduled + ShedLock

| Campo | Valor |
|---|---|
| **ID** | ADR-041 |
| **Status** | ACCEPTED |
| **Date** | 2026-04-27 |
| **Sprint** | 26 |
| **Feature** | FEAT-024 - Objetivos de Ahorro |
| **Author** | Architect Agent · SOFIA v2.7 |
| **Approvers** | Tech Lead (G-3) |
| **Related** | ADR-026, ADR-028, RN-F024-13, RN-F024-14, RNF-F024-02 |

## Contexto

US-024-05 (aportacion automatica mensual) requiere un job recurrente que cada
mes ejecute las reglas activas de aportacion automatica:

- Ventana de ejecucion: 00:00-06:00 UTC, dia configurado por el usuario (1..28).
- Throughput minimo: 1.000 reglas procesadas en menos de 60 s (RNF-F024-02).
- Reintentos: 3 intentos con backoff exponencial 1m / 5m / 15m (RN-F024-14).
- Multi-instancia: BankPortal corre en >=2 replicas; un job no debe ejecutarse
  dos veces para la misma regla.

El proyecto ya tiene infraestructura de scheduling consolidada:

| Componente | ADR | Uso actual |
|---|---|---|
| Spring @Scheduled | - | SimulaCobroJob, ScheduledTransferJobService |
| @SchedulerLock (ShedLock JDBC) | ADR-028 | Locking distribuido entre replicas |
| Cron Spring (6 campos) | - | Configuracion via application.yml |
| Reintento programado (Spring Retry) | ADR-026 | Diferido en directdebit |

## Decision

**Reutilizar el patron @Scheduled + @SchedulerLock ya validado en el proyecto**
para el motor de aportaciones automaticas.

Componente nuevo:
- AutoContributionScheduler (clase nueva en savings.infrastructure.scheduler).
- Anotaciones: @Scheduled(cron="0 0 2 * * *") + @SchedulerLock(name="savings-auto-contribution", lockAtMostFor="30m", lockAtLeastFor="1m").
- Logica: lee goal_auto_rules WHERE active=TRUE AND next_execution_at <= now(),
  procesa cada una en transaccion propia (REQUIRES_NEW), actualiza next_execution_at.

Componentes reutilizados sin cambios:
- ShedLock JDBC backend (tabla shedlock ya existente, ADR-028).
- Spring Boot autoconfiguration de @EnableScheduling (ya activa).
- Datasource y connection pool comunes.

## Reintentos (RN-F024-14)

Estrategia hibrida:
1. **Reintento inmediato dentro del scheduler**: si el adaptador core-banking
   devuelve error transitorio (timeout, 503), el use case re-intenta hasta 3
   veces con espera 1m / 5m / 15m **dentro de la misma ejecucion del job**
   usando Spring Retry @Retryable(maxAttempts=3, backoff=...).
2. **Reintento diferido**: si tras 3 intentos sigue fallando, se persiste en
   goal_allocations con status=FAILED y failure_reason; el siguiente ciclo
   mensual NO reintenta (la regla sigue activa, falla solo este mes).

Esta decision evita acumular ejecuciones diferidas en una tabla de jobs
pendientes (overhead de schema y monitoring) y mantiene la semantica simple:
"si falla el mes X, el dinero no se aparta este mes; el mes siguiente se
intenta normalmente".

## Consecuencias

### Positivas
- **Cero infraestructura nueva**: ShedLock, @Scheduled y Spring Retry ya
  estan en classpath y configurados.
- **Coherencia operativa**: ops y SRE ya conocen la mecanica de monitorizar
  jobs ShedLock-protegidos.
- **Test simplicidad**: AutoContributionSchedulerTest puede inyectar el
  use case y disparar la ejecucion sin mover el reloj.
- **Throughput suficiente**: 1.000 reglas en <60s con UPDATE batch + JDBC
  pooling estandar; ShedLock no introduce contencion porque solo bloquea el
  scheduler entero, no cada regla.

### Negativas / mitigaciones
- **Acoplamiento al ciclo de despliegue de la aplicacion**: si la app esta
  caida durante 00:00-06:00 UTC del dia X, las reglas con day_of_month=X no
  se ejecutan ese mes.
  -> Mitigacion: dashboard ops alerta si el ultimo lockedAt de
     savings-auto-contribution es >25h (el job es diario, debio correr).
- **Sin observabilidad de jobs individuales**: a diferencia de Quartz, no
  hay tabla de instancias de job ejecutadas.
  -> Mitigacion: cada ejecucion de regla escribe goal_allocations con
     timestamp y status, lo que cubre la auditoria. Logs estructurados
     en INFO con goalId/ruleId/status para grep.

### Neutrales
- El scheduler es stateless: si se anaden replicas, ShedLock garantiza
  que solo una ejecuta el cron.

## Alternativas rechazadas

### Alt-1: Quartz Scheduler
Framework dedicado con persistencia JDBC, listeners, triggers complejos.
- **Rechazada**: introduce 3 tablas nuevas (qrtz_*), aumenta superficie
  operativa, no aporta capacidades necesarias para el caso de uso (cron
  fijo + lock distribuido). ShedLock ya cubre el lock.

### Alt-2: AWS EventBridge + Lambda externa
Trigger externo que llama a un endpoint protegido del backend.
- **Rechazada**: BankPortal no esta en AWS, tiraria de stack ajeno al
  proyecto. Ademas, el endpoint protegido seria un nuevo vector de
  superficie (IAM, allowlist IP, secret rotation).

### Alt-3: Spring Batch
Framework de procesamiento batch con commit interval, skip policy, etc.
- **Rechazada**: overkill para 1.000 reglas. Justificable solo si el
  volumen escalara a 100k+ y el tiempo de ejecucion superara la ventana.

## Implementacion - handoff Step 4

- Anadir AutoContributionScheduler en savings.infrastructure.scheduler.
- Configurar cron via property bank.savings.auto.cron (default 0 0 2 * * *).
- Configurar lockAtMostFor via property bank.savings.auto.lock-max (default 30m).
- Test integracion: AutoContributionSchedulerIT con @SpringBootTest +
  override de cron a fast-trigger para validar end-to-end.
- Test unitario: ProcessAutoRuleUseCaseTest cubre los 4 escenarios
  (success, insufficient funds, retry exhaustion, idempotencia mes ya pagado).

## Referencias
- ADR-026 - Spring Retry diferido en directdebit.
- ADR-028 - ShedLock distributed locking.
- ScheduledTransferJobService - referencia de implementacion.
- RN-F024-13 / RN-F024-14 - SLA del scheduler.
