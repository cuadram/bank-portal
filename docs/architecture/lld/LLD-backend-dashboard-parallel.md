# LLD — Backend: Dashboard Paralelo y Historial de Configuración

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-backend-dashboard-parallel |
| **Features** | DEBT-008 + FEAT-006 US-604 |
| **Sprint** | 7 |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-06-09 |
| **ADRs** | ADR-004 (audit_log inmutable) |

---

## 1. DEBT-008 — SecurityDashboardUseCase paralelo

### Problema actual (secuencial)

```java
// Sprint 6 — 5 queries secuenciales, latencia acumulada 25–50ms STG
Map<String,Long> counts  = auditRepo.countEventsByTypeAndPeriod(userId, 30);   // ~8ms
int sessions             = sessionRepo.countActiveByUserId(userId);             // ~6ms
int devices              = deviceRepo.countActiveByUserId(userId);              // ~6ms
long notifs              = notifRepo.countUnreadByUserId(userId);               // ~5ms
List<..> recent          = auditRepo.findRecentByUserId(userId, 10);            // ~8ms
List<..> chart           = auditRepo.findDailyActivityByUserId(userId, 30);    // ~12ms
// Total: ~45ms secuencial → PROD con carga: potencialmente 150–300ms
```

### Solución — CompletableFuture.allOf()

```java
@Transactional(readOnly = true)
public SecurityDashboardResponse execute(UUID userId, boolean twoFaActive) {
    // Lanzar las 6 consultas en paralelo sobre el thread pool configurado
    var fCounts  = CompletableFuture.supplyAsync(
        () -> auditRepo.countEventsByTypeAndPeriod(userId, DASHBOARD_DAYS), executor);
    var fSession = CompletableFuture.supplyAsync(
        () -> sessionRepo.countActiveByUserId(userId), executor);
    var fDevices = CompletableFuture.supplyAsync(
        () -> deviceRepo.countActiveByUserId(userId), executor);
    var fNotifs  = CompletableFuture.supplyAsync(
        () -> notifRepo.countUnreadByUserId(userId), executor);
    var fRecent  = CompletableFuture.supplyAsync(
        () -> auditRepo.findRecentByUserId(userId, RECENT_LIMIT), executor);
    var fChart   = CompletableFuture.supplyAsync(
        () -> auditRepo.findDailyActivityByUserId(userId, DASHBOARD_DAYS), executor);

    // Esperar a todos — timeout de seguridad para evitar bloqueos indefinidos
    try {
        CompletableFuture.allOf(fCounts, fSession, fDevices, fNotifs, fRecent, fChart)
            .get(5, TimeUnit.SECONDS);
    } catch (TimeoutException e) {
        log.warn("Dashboard query timeout for userId={}", userId);
        throw new DashboardTimeoutException();
    }

    // Ensamblar resultado
    var counts = fCounts.join();
    // ...
}
// Latencia total ≈ max(query individual) ≈ 12ms — mejora ~4× respecto a secuencial
```

### Configuración del executor

```java
@Bean("dashboardExecutor")
public Executor dashboardExecutor() {
    ThreadPoolTaskExecutor exec = new ThreadPoolTaskExecutor();
    exec.setCorePoolSize(6);         // 6 queries por invocación
    exec.setMaxPoolSize(30);         // máximo de 5 invocaciones concurrentes
    exec.setQueueCapacity(50);
    exec.setThreadNamePrefix("dashboard-");
    exec.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
    exec.initialize();
    return exec;
}
```

### @Transactional y CompletableFuture

**Importante:** cada `CompletableFuture.supplyAsync()` ejecuta en un thread diferente
al thread original. Spring `@Transactional` en `execute()` NO cubre los threads del
executor. Cada repositorio abre su propia conexión del pool — este comportamiento es
correcto para lecturas (`@Transactional(readOnly=true)`) dado que no hay coordinación
transaccional necesaria entre las queries independientes.

---

## 2. US-604 — Historial de cambios de configuración

### Fuente de datos

`audit_log` ya registra todos los eventos de configuración relevantes (ADR-004).
US-604 es un filtro de `AuditLogQueryRepository` que selecciona solo eventos de
tipo configuración — sin nueva tabla en BD.

### Eventos de configuración filtrados

```java
// Tipos de evento que constituyen "cambios de configuración":
public static final Set<String> CONFIG_EVENT_TYPES = Set.of(
    "2FA_ACTIVATED", "2FA_DEACTIVATED",
    "SESSION_TIMEOUT_UPDATED",
    "TRUSTED_DEVICE_CREATED", "TRUSTED_DEVICE_REVOKED", "TRUSTED_DEVICE_REVOKE_ALL",
    "ACCOUNT_LOCKED", "ACCOUNT_UNLOCKED",
    "NOTIFICATION_PREFERENCES_UPDATED"  // nuevo Sprint 7
);
```

### Nuevo método en AuditLogQueryRepository

```java
/**
 * US-604: eventos de cambio de configuración del usuario.
 * Filtra audit_log por CONFIG_EVENT_TYPES.
 */
List<AuditEventSummary> findConfigChangesByUserId(UUID userId, int days);
```

### Indicador "Desde ubicación nueva" (US-604 Escenario 2)

Para cada evento de configuración, comparar la IP del evento con las subnets habituales
del usuario (known_subnets.confirmed=true). Si la subnet del evento no está en la lista,
añadir flag `unusualLocation=true` en el `AuditEventSummary`.

```java
public record AuditEventSummary(
    String    eventType,
    String    description,
    String    ipMasked,
    LocalDateTime occurredAt,
    boolean   unusualLocation   // true si subnet no está en known_subnets del usuario
) {}
```

### Integración en SecurityAuditController

```java
// Nuevo endpoint en SecurityAuditController (US-604):
@GetMapping("/config-history")
public ResponseEntity<List<AuditEventSummary>> getConfigHistory(
        @RequestParam(defaultValue = "90") int days,
        @AuthenticationPrincipal Jwt jwt) {
    UUID userId = UUID.fromString(jwt.getSubject());
    return ResponseEntity.ok(dashboardUseCase.getConfigHistory(userId, days));
}
```

---

## 3. Tests requeridos (DoD Sprint 7)

| Test | Tipo | Escenarios |
|---|---|---|
| `SecurityDashboardUseCaseParallelTest` | Unit | 6 futures paralelas · timeout 5s → DashboardTimeoutException · resultado correcto ensamblado |
| `AuditLogQueryRepositoryConfigTest` | Integration (Testcontainers) | findConfigChangesByUserId filtra solo CONFIG_EVENT_TYPES · unusualLocation flag correcto |
| Benchmark STG | Manual | Latencia < 30ms con 6 queries en paralelo (objetivo: mejora 4× vs 45ms secuencial) |

---

*SOFIA Architect Agent · BankPortal · DEBT-008 + FEAT-006 US-604 · LLD Backend · 2026-06-09*
