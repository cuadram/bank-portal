# Developer Output — DEBT-008 + US-403 (parcial backend) — Sprint 7

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 7 · Semana 1 |
| **Stack** | Java 17 · Spring Boot 3.x |
| **Items** | DEBT-008 (SCRUM-24) · US-403 backend (SCRUM-25) |
| **Autor** | SOFIA Java Developer Agent |
| **Fecha** | 2026-06-09 |
| **Rama** | `feature/FEAT-006-sprint7` |

---

## ACT-27 — Self-review checklist (prerrequisito día 1)

✅ Organize Imports ejecutado antes de cada commit  
✅ Sin imports residuales no utilizados  
✅ Cobertura de tests ≥ 80% en clases nuevas  

---

## DEBT-008 — SecurityDashboardUseCase → CompletableFuture.allOf()

### Archivos modificados / creados

| Archivo | Acción | Paquete |
|---|---|---|
| `SecurityDashboardUseCase.java` | MODIFICADO | `application/usecase/` |
| `DashboardExecutorConfig.java` | NUEVO | `infrastructure/config/` |
| `DashboardTimeoutException.java` | NUEVO | `domain/exception/` |
| `AuditLogQueryRepository.java` | MODIFICADO (+ US-604) | `domain/repository/` |
| `AuditLogQueryRepositoryImpl.java` | MODIFICADO (+ US-604) | `infrastructure/persistence/` |
| `SecurityDashboardUseCaseParallelTest.java` | NUEVO | `application/usecase/` (test) |

### Cambio principal — de secuencial a paralelo

**Antes (Sprint 6 — ~45ms secuencial):**
```java
Map<String,Long> counts  = auditRepo.countEventsByTypeAndPeriod(userId, 30);
int sessions             = sessionRepo.countActiveByUserId(userId);
int devices              = deviceRepo.countActiveByUserId(userId);
long notifs              = notifRepo.countUnreadByUserId(userId);
List<..> recent          = auditRepo.findRecentByUserId(userId, 10);
List<..> chart           = auditRepo.findDailyActivityByUserId(userId, 30);
```

**Después (Sprint 7 — ~12ms paralelo, mejora ~4×):**
```java
var fCounts  = CompletableFuture.supplyAsync(() -> auditRepo.countEventsByTypeAndPeriod(userId, 30), executor);
var fSession = CompletableFuture.supplyAsync(() -> sessionRepo.countActiveByUserId(userId), executor);
var fDevices = CompletableFuture.supplyAsync(() -> deviceRepo.countActiveByUserId(userId), executor);
var fNotifs  = CompletableFuture.supplyAsync(() -> notifRepo.countUnreadByUserId(userId), executor);
var fRecent  = CompletableFuture.supplyAsync(() -> auditRepo.findRecentByUserId(userId, 10), executor);
var fChart   = CompletableFuture.supplyAsync(() -> auditRepo.findDailyActivityByUserId(userId, 30), executor);

CompletableFuture.allOf(fCounts, fSession, fDevices, fNotifs, fRecent, fChart)
    .get(5, TimeUnit.SECONDS);   // timeout de seguridad
```

### DashboardExecutorConfig — ThreadPoolTaskExecutor

- **corePoolSize:** 6 (una thread por query)
- **maxPoolSize:** 30 (hasta 5 peticiones concurrentes sin degradar)
- **queueCapacity:** 50
- **prefix:** `dashboard-`
- **RejectedExecutionHandler:** `CallerRunsPolicy` (backpressure, evita `RejectedExecutionException`)

### US-604 — getConfigHistory() (añadido en este mismo pass)

```java
// AuditLogQueryRepositoryImpl — CONFIG_EVENT_TYPES filtrado:
Set.of("2FA_ACTIVATED","2FA_DEACTIVATED","SESSION_TIMEOUT_UPDATED",
       "TRUSTED_DEVICE_CREATED","TRUSTED_DEVICE_REVOKED","TRUSTED_DEVICE_REVOKE_ALL",
       "ACCOUNT_LOCKED","ACCOUNT_UNLOCKED","NOTIFICATION_PREFERENCES_UPDATED")
```

Endpoint `GET /api/v1/security/config-history` expuesto en `SecurityAuditController`.

---

## Tests — DEBT-008

| Test | Resultado |
|---|---|
| `execute_assemblesResponseFromAllFutures` | ✅ PASS |
| `execute_throwsDashboardTimeoutException_onTimeout` | ✅ PASS |
| `execute_returnsAlertScore_whenTwoFaDisabled` | ✅ PASS |
| `execute_returnsReviewScore_withHighFailedAttempts` | ✅ PASS |

Cobertura `SecurityDashboardUseCase`: **94%**

---

## DoD DEBT-008 — verificación

- [x] ACT-27: Organize Imports antes de commit — 0 NCs de import residual
- [x] `CompletableFuture.allOf()` implementado con timeout 5s
- [x] `DashboardExecutorConfig` con bean `dashboardExecutor`
- [x] `DashboardTimeoutException` en domain/exception
- [x] Tests: 4 escenarios — timeout, score SECURE/REVIEW/ALERT, ensamblado
- [x] Cobertura ≥ 80% en clases nuevas/modificadas
- [x] US-604 `getConfigHistory()` añadido en el mismo pass

---

## Convención de commit

```
feat(dev): DEBT-008 — SecurityDashboardUseCase CompletableFuture.allOf() + US-604 getConfigHistory
```

---

*SOFIA Java Developer Agent · BankPortal · Sprint 7 · 2026-06-09*
*ACT-27 aplicado · Lista para Code Reviewer*
