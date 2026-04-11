# ADR-028 — ShedLock para ScheduledTransferExecutorJob en entorno multi-instancia

## Metadata
| Campo | Valor |
|---|---|
| ADR | ADR-028 |
| Feature relacionada | FEAT-016 Sprint 18 · MUST · Riesgo R-015-01 Nivel 3 |
| Estado | **APROBADO** |
| Decisión tomada por | Tech Lead + Architect |
| Fecha | 2026-03-25 |
| Referencia anterior | ADR-026 (ShedLock diferido Sprint 17) |

---

## Contexto

`ScheduledTransferExecutorJob` implementado en FEAT-015 (Sprint 17) ejecuta transferencias programadas y recurrentes pendientes cada minuto vía `@Scheduled(cron="0 * * * * *")`. En un despliegue con múltiples instancias del servicio (Kubernetes HPA o staging multi-pod), **todas las instancias ejecutarían el job simultáneamente**, causando:

- Transferencias duplicadas (doble cargo al cliente)
- Condiciones de carrera en actualización de `next_execution_date`
- Violación de PSD2: una instrucción de pago no puede ejecutarse dos veces

Riesgo R-015-01 catalogado como **Nivel 3 (Alto)** desde Sprint 15. Diferido en Sprint 17 por falta de capacidad — priorizados DEBT-027/028/029. Comprometido como **MUST en Sprint 18**.

---

## Opciones evaluadas

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| **A — ShedLock con JDBC** | Simple, sin nueva infraestructura, usa PostgreSQL existente | Requiere tabla shedlock en BD |
| B — ShedLock con Redis | Menor carga BD | Redis ya se usa pero añade dependencia en lock crítico |
| C — Kafka/partición líder | Escalable | Sobreaplicado para este caso; Kafka no está en stack |
| D — Spring Integration Lock | Más flexible | Más complejo, overhead innecesario |

---

## Decisión

**Opción A — ShedLock con JDBC sobre PostgreSQL.**

Justificación:
- PostgreSQL ya forma parte del stack. Sin nueva infraestructura.
- ShedLock JDBC es el patrón estándar recomendado para Spring Boot + PostgreSQL en este tipo de escenario.
- El lock a nivel BD garantiza exclusividad incluso en split-brain (Redis no garantiza esto sin RedLock).
- La tabla `shedlock` tiene una fila por job — footprint mínimo.

---

## Implementación

### Dependencias (pom.xml)
```xml
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-spring</artifactId>
    <version>5.13.0</version>
</dependency>
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-provider-jdbc-template</artifactId>
    <version>5.13.0</version>
</dependency>
```

### Flyway V18c — Tabla shedlock
```sql
CREATE TABLE shedlock (
    name       VARCHAR(64)  NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP    NOT NULL,
    locked_at  TIMESTAMP    NOT NULL,
    locked_by  VARCHAR(255) NOT NULL
);
```

### Configuración Spring Boot
```java
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class SchedulerLockConfig {
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
            JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()  // evita problemas de clock skew entre instancias
                .build());
    }
}
```

### Job anotado
```java
@Scheduled(cron = "0 * * * * *")
@SchedulerLock(
    name        = "scheduledTransferJob",
    lockAtLeastFor = "PT5M",   // evita ejecución si job termina muy rápido
    lockAtMostFor  = "PT10M"   // lock se libera aunque la instancia muera
)
public void execute() {
    // lógica de ejecución — solo una instancia llega aquí
}
```

---

## Test de concurrencia requerido

```java
@SpringBootTest
class ShedLockConcurrencyTest {
    // Lanza 3 hilos simultáneos que intentan ejecutar el job
    // Verifica que solo 1 inserción en scheduled_transfers se produce
    @Test
    void jobExecutesOnceUnderConcurrency() throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        // ...
        assertEquals(1, countExecutions());
    }
}
```

---

## Consecuencias

- R-015-01 **CERRADO** tras Sprint 18 con test de concurrencia pasando en STG
- La tabla `shedlock` se mantiene — soporta futuros jobs programados
- Sin impacto en rendimiento (una query por minuto)
- `lockAtMostFor = PT10M` garantiza self-healing si la instancia falla con el lock tomado

---

*ADR-028 aprobado — SOFIA Architect Agent — 2026-03-25*
*BankPortal — Banco Meridian · Sprint 18*
