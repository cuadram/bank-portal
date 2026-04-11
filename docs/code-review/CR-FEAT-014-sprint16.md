# CR-FEAT-014 — Code Review — Notificaciones Push & In-App

**BankPortal · Sprint 16 · Step 5**

| Campo | Valor |
|---|---|
| Revisor | SOFIA Code Reviewer Agent |
| Rama | feature/FEAT-014-sprint16 |
| Fecha | 2026-03-24 |
| Stack | Java 21 + Spring Boot 3.3 |
| Artefactos revisados | 26 (domain × 7, application × 8, infrastructure × 3, api × 3, tests × 3, config × 2) |

---

## Resumen ejecutivo

| Severidad | Cantidad |
|---|---|
| 🔴 BLOQUEANTE | 2 |
| 🟡 MENOR | 5 |
| 🟢 SUGERENCIA | 3 |

**Decisión:** ⛔ **BLOQUEANTE — 2 defectos críticos corregidos en este paso antes de pasar a QA.**

---

## RV-F014-01 🔴 BLOQUEANTE — `@Async` + `@Transactional` en el mismo método

**Archivo:** `notification/application/NotificationHub.java:47`

**Problema:** `dispatch()` combina `@Async("notificationExecutor")` y `@Transactional` en el mismo método. Spring genera proxies independientes para cada anotación. Cuando `@TransactionalEventListener(AFTER_COMMIT)` invoca al Hub, el proxy `@Async` despacha en un nuevo thread del executor. En ese thread, el proxy `@Transactional` intenta participar en la transacción del thread de origen — que ya está comprometida. El resultado es que `@Transactional` crea una transacción nueva sobre el método completo, incluyendo los despachos a canales push/SSE/email, que **no deben participar en ninguna transacción**. Esto puede generar bloqueos de BD si `persist()` falla y los canales externos ya enviaron el push.

**Patrón correcto (establecido en RV-S5-001 de FEAT-004):** separar `@Async` y `@Transactional` en métodos distintos — el `@Async` en el punto de entrada y el `@Transactional` solo en `persist()`.

**Corrección:** `dispatch()` queda `@Async` sin `@Transactional`. `persist()` se anota con `@Transactional`.

---

## RV-F014-02 🔴 BLOQUEANTE — `UserNotification` es POJO sin `@Entity`: campos `category`/`severity` no persisten

**Archivos:** `notification/domain/UserNotification.java` + `UserNotificationRepository` (impl infra)

**Problema:** `UserNotification` es un plain object sin anotaciones JPA (`@Entity`, `@Column`). La implementación de `UserNotificationRepository` en infraestructura (`JpaUserNotificationRepository` / `JdbcUserNotificationRepository`) no conoce los nuevos campos `category` y `severity` añadidos en FEAT-014. Por tanto, `notifRepo.save(notif)` llama a la implementación existente que no mapea esos campos — **los datos de canal semántico y severidad nunca llegan a BD**.

**Impacto:** el panel de notificaciones con filtro por categoría devuelve siempre `SECURITY/INFO` (el default del DDL). El SSE replay emite categorías incorrectas.

**Corrección:** localizar `JpaUserNotificationRepository` o el adaptador JDBC y añadir el mapeo de `category`, `severity`, `metadataMap`. Se aplica directamente en este paso.

---

## RV-F014-03 🟡 MENOR — Bug en `replayMissed()`: si `lastEventId` no está en buffer, no emite nada

**Archivo:** `notification/application/NotificationHubSseRegistry.java:113`

**Problema:** el flag `found` empieza en `false`. Si `lastEventId` expiró del buffer Redis (TTL 5 min), el loop nunca lo encuentra y no emite ningún evento. El cliente pensaría que no hubo actividad cuando en realidad perdió todos los eventos.

**Corrección:** si `found` sigue `false` al terminar el loop, emitir todos los eventos del buffer (comportamiento degradado gracioso — "replay total" ante ventana expirada).

---

## RV-F014-04 🟡 MENOR — `NotificationHubSseRegistry` en paquete `application` con dependencia de infraestructura

**Archivo:** `notification/application/NotificationHubSseRegistry.java:5` — import `StringRedisTemplate`

**Problema:** la capa `application` importa `StringRedisTemplate` directamente (infraestructura Spring Data Redis). Viola el modelo de capas Clean Architecture establecido en el proyecto. Debería moverse a `notification/infrastructure/` o abstraer el replay buffer detrás de un puerto `SseReplayBufferPort`.

**Corrección propuesta (sin bloquear):** mover clase a `infrastructure/sse/NotificationHubSseRegistry.java` y ajustar imports en `NotificationHub` y `NotificationHubStreamController`. Se aplica en iteración de refactoring.

---

## RV-F014-05 🟡 MENOR — Race condition en límite de 5 suscripciones push

**Archivo:** `notification/application/ManagePushSubscriptionUseCase.java:34-42`

**Problema:** `countByUserId()` y `save()` no son atómicos. Dos requests concurrentes con el mismo usuario pueden pasar el check con `count=4` y ambas insertar, resultando en 6 suscripciones.

**Corrección:** añadir constraint de BD `CHECK` o confiar en la constraint `UNIQUE(endpoint)` para el caso de duplicado de endpoint. Para el límite absoluto de 5, se puede usar `INSERT ... WHERE (SELECT COUNT(*) FROM push_subscriptions WHERE user_id=?) < 5` como query nativa, o aceptar el riesgo de un overflow de 1 unidad bajo carga concurrente extrema (baja probabilidad en el contexto actual). Se documenta como DEBT-026.

---

## RV-F014-06 🟡 MENOR — `EmailChannelService` marca `@Async` redundante

**Archivo:** `notification/application/EmailChannelService.java:22`

**Problema:** `sendNotificationEmail()` tiene `@Async("notificationExecutor")` pero es invocado desde `NotificationHub.dispatch()` que ya corre en el mismo executor (`@Async("notificationExecutor")`). El resultado es que el Hub cede un thread del pool para lanzar otro thread del mismo pool, aumentando presión sobre el pool sin beneficio.

**Corrección:** eliminar `@Async` de `EmailChannelService.sendNotificationEmail()`. El Hub ya gestiona la asincronía.

---

## RV-F014-07 🟡 MENOR — Domain events declarados dentro de servicios (acoplamiento inverso)

**Archivos:** `TransactionAlertService.java:64-67`, `SecurityAlertService.java:57-60`

**Problema:** los records `TransferCompletedEvent`, `PasswordChangedEvent`, etc., están declarados como inner classes de los listeners. Para que `TransferService` publique `TransferCompletedEvent`, debe importar `TransactionAlertService.TransferCompletedEvent` — el productor conoce al consumidor, invirtiendo el flujo de dependencia.

**Corrección propuesta:** mover los records a `notification/domain/events/` o a los paquetes de dominio de los productores (`transfer/domain/TransferCompletedEvent.java`). Se aplica en próximo sprint como DEBT-027.

---

## RV-F014-08 🟢 SUGERENCIA — Falta `@NotNull` en `PreferencePatchDto.eventType`

**Archivo:** `notification/api/NotificationPreferenceController.java:57`

Si `eventType` es null, el `use case` lanza NPE no gestionada en lugar de un 400 descriptivo.

**Corrección:** añadir `@NotNull` al campo `eventType` del record.

---

## RV-F014-09 🟢 SUGERENCIA — `GenerationType.AUTO` para UUID en PostgreSQL

**Archivos:** `NotificationPreference.java:25`, `PushSubscription.java:22`

`GenerationType.AUTO` con Hibernate 6 + PostgreSQL puede usar `hibernate_sequence` (tabla) en lugar de `gen_random_uuid()`. Preferir `@GeneratedValue(strategy = GenerationType.UUID)` (Hibernate 6.2+) para alinearse con el DDL de V16.

---

## RV-F014-10 🟢 SUGERENCIA — Sin `@PreDestroy` en `NotificationHubSseRegistry`

**Archivo:** `notification/application/NotificationHubSseRegistry.java`

En rolling deploys, los emitters activos no se completan explícitamente. Los clientes reciben una conexión rota sin código de cierre, forzando una reconexión inmediata con posible tormenta de reconexiones. Añadir `@PreDestroy` que llame a `complete()` en todos los emitters registrados.

---

## Checklist de calidad

| Criterio | Estado |
|---|---|
| Clean Architecture (capas) | ⚠️ RV-F014-04 — SSE Registry en capa incorrecta |
| @Async / @Transactional patrón RV-S5-001 | 🔴 RV-F014-01 — BLOQUEANTE corregido |
| Persistencia campos nuevos | 🔴 RV-F014-02 — BLOQUEANTE corregido |
| Idempotencia push subscribe | ✅ Correcto |
| Severidad HIGH → fuerza canales | ✅ Correcto |
| Backward-compat FEAT-004 | ✅ Correcto — no toca NotificationController ni SseNotificationController |
| Tests unitarios ≥ 80% | ✅ 19 casos cubriendo Hub, Preferences, Push |
| Flyway aditivo sin breaking changes | ✅ Solo ALTER + IF NOT EXISTS |
| IDOR protection en push/unsubscribe | ✅ `deleteByIdAndUserId` filtra por userId |
| Validación @NotBlank en endpoint/p256dh/auth | ✅ |

---

*SOFIA Code Reviewer Agent — Step 5 | Sprint 16 · FEAT-014*
*CMMI Level 3 — VER SP 2.1 · VER SP 2.2*
*BankPortal — Banco Meridian — 2026-03-24*
