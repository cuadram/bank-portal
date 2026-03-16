# Code Review Report — Sprint 5 · DEBT-006 + FEAT-004

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 5 · 2026-05-12 |
| **Rama** | `feature/FEAT-004-notification-center` |
| **Reviewer** | SOFIA Code Reviewer Agent |
| **Fecha** | 2026-05-14 |
| **Archivos revisados** | 12 Java + 3 TypeScript + 1 SQL + 1 YAML |

---

## Veredicto

**✅ APPROVED CON 2 NCs MENORES — no bloquean el merge, deben resolverse antes de QA**

| Severidad | Count |
|---|---|
| Mayores | 0 |
| Menores | 2 |
| Sugerencias | 1 |

---

## DEBT-006 — ValidateTrustedDeviceUseCase ✅

### RV-S5-001 (NC MENOR) — `@Async` + `@Transactional` en el mismo método (NotificationService)

**Archivo:** `notification/application/NotificationService.java` · línea 47

```java
@Async
@Transactional
public void createNotification(UUID userId, SecurityEventType eventType, ...) {
```

**Problema:** Spring ejecuta `@Async` en un thread del executor separado. `@Transactional` en el
mismo método aplica solo al thread que lo llama — en el executor thread, Spring crea una nueva
transacción, pero si el `TaskExecutor` no está configurado como `TransactionAwareTaskExecutor`,
la transacción puede iniciarse fuera del contexto correcto. En la práctica funciona en la mayoría
de casos, pero hay un riesgo de que el `EntityManager` se cierre antes de que `save()` termine
en entornos con configuraciones estrictas de `OSIV` (Open Session In View).

**Corrección recomendada:** separar la persistencia del envío SSE extrayendo el `@Async` a
un método privado, o usar `TransactionalEventPublisher` de Spring:

```java
// Opción A — separar @Async del @Transactional
@Transactional
public void createNotification(UUID userId, SecurityEventType eventType,
                                Map<String, String> metadata, String actionUrl) {
    var notification = new UserNotification(...);
    notificationRepository.save(notification);
    if (eventType.isCritical()) {
        sendSseAsync(userId, notification);  // delegar @Async a método separado
    }
}

@Async
protected void sendSseAsync(UUID userId, UserNotification notification) {
    sseRegistry.sendToUser(userId, NotificationSseEvent.from(notification));
}
```

**Riesgo si no se corrige:** bajo en STG, medio en PROD con configuración OSIV desactivada.

---

### RV-S5-002 (NC MENOR) — `markOneAsRead` con `Integer.MAX_VALUE` como page size

**Archivo:** `notification/application/ManageNotificationsUseCase.java` · línea 54

```java
notificationRepository.findByUserId(userId, null, PageRequest.of(0, Integer.MAX_VALUE))
        .getContent().stream()
        .filter(n -> n.getId().equals(notificationId))
        .findFirst()
```

**Problema:** carga todas las notificaciones del usuario en memoria para filtrar por ID.
En 90 días de actividad un usuario puede acumular cientos de notificaciones. Esta llamada
escala O(n) en memoria y en query a BD cuando debería ser O(1).

**Corrección recomendada:** añadir método al puerto `UserNotificationRepository`:

```java
// En UserNotificationRepository.java — añadir:
Optional<UserNotification> findByIdAndUserId(UUID notificationId, UUID userId);

// En ManageNotificationsUseCase.markOneAsRead():
notificationRepository.findByIdAndUserId(notificationId, userId)
    .ifPresent(n -> {
        n.markAsRead();
        notificationRepository.save(n);
    });
```

**Riesgo si no se corrige:** bajo en STG (pocos datos), medio-alto en PROD tras 30+ días.

---

## DEBT-006 revisión ✅

| Aspecto | Verificación | Estado |
|---|---|---|
| Clave dual — orden correcto (current → previous) | `validWithCurrentKey` primero; `validWithPreviousKey` solo si falla | ✅ |
| Short-circuit evaluation | `!validWithCurrentKey && hmacKeyPrevious != null && !hmacKeyPrevious.isBlank()` | ✅ |
| `constantTimeEquals` en tiempo constante | XOR byte a byte sin early exit | ✅ |
| `TRUSTED_DEVICE_GRACE_VERIFY` auditado | `if (validWithPreviousKey)` → log separado | ✅ |
| Clave vacía no verifica | `verifyHmac()` retorna false si key es null o blank | ✅ |
| `@Value("${trusted-device.hmac-key-previous:}")` | Default vacío — no rompe instalaciones existentes | ✅ |
| Tests: 8 escenarios incluyendo GRACE_VERIFY | `ValidateTrustedDeviceUseCaseDualKeyTest` | ✅ |

---

## Módulo notification — revisión detallada ✅

### Dominio — UserNotification

| Aspecto | Estado |
|---|---|
| `markAsRead()` idempotente (sin excepción si ya leída) | ✅ |
| `expiresAt = createdAt + 90 días` inmutable | ✅ |
| Sin lógica de infraestructura en el dominio | ✅ |
| `isActive()` basado en `expiresAt` — no en `read` | ✅ correcto |

### SseEmitterRegistry

| Aspecto | Estado |
|---|---|
| `ConcurrentHashMap` — thread-safe | ✅ |
| `emitters.remove(userId, emitter)` — remove atómico (evita race conditions) | ✅ |
| Cleanup en `onCompletion` + `onTimeout` + `onError` | ✅ tres callbacks |
| Falla silenciosa si no hay conexión activa (R-F4-003) | ✅ |
| Límite 1 conexión por usuario — anterior completada antes de crear nueva | ✅ |

### NotificationController

| Aspecto | Estado |
|---|---|
| Sin lógica de negocio | ✅ |
| JWT extraído de `@AuthenticationPrincipal` | ✅ |
| DTOs como records inmutables internos | ✅ |
| `produces = MediaType.TEXT_EVENT_STREAM_VALUE` en `/stream` | ✅ |
| Parámetros con defaults (`page=0`, `size=20`) | ✅ |
| Todos los endpoints requieren JWT — `GET /stream` incluido | ✅ |

### Flyway V7

| Aspecto | Estado |
|---|---|
| `ON DELETE CASCADE` en FK a users | ✅ |
| Índice parcial badge: `WHERE is_read = false` — eficiente | ✅ |
| Índice limpieza: `WHERE expires_at < now()` — eficiente | ✅ |
| Índice paginado por `(user_id, created_at DESC)` — correcto para US-301 | ✅ |

### OpenAPI v1.3.0 (ACT-19/20)

| Endpoint | Documentado | Estado |
|---|---|---|
| `POST /api/v1/2fa/verify` + `trustDevice` | ✅ con `Set-Cookie` en response | ✅ |
| `GET /api/v1/trusted-devices` | ✅ | ✅ |
| `DELETE /api/v1/trusted-devices` | ✅ | ✅ |
| `DELETE /api/v1/trusted-devices/{deviceId}` | ✅ | ✅ |
| `DELETE /api/v1/2fa/deactivate` headers Deprecation | ✅ Deprecation + Sunset + Link | ✅ |
| `GET /api/v1/sessions/deny/{token}` errores TOKEN_EXPIRED | ✅ | ✅ |

---

## Sugerencia (no bloqueante)

**SUG-S5-001:** `NotificationService.buildBody()` solo tiene 3 casos en el switch — el resto cae
en `default` que devuelve el `displayTitle`. Cuando se integre `NotificationService` con los módulos
FEAT-001/002/003 (tarea de Sprint 6), añadir los casos restantes del enum para mensajes más
descriptivos. Registrar como tarea de refinamiento.

---

## Checklist ACT-20 (nuevo desde Sprint 5)

```
✅ openapi-2fa.yaml actualizada a v1.3.0 para TODOS los endpoints nuevos
✅ Version bump en OpenAPI refleja Sprint 5 correctamente
✅ Parámetro trustDevice documentado con Set-Cookie en response
```

---

## Correcciones requeridas antes de QA

### RV-S5-001 — separar @Async de @Transactional en NotificationService
### RV-S5-002 — añadir findByIdAndUserId al puerto + usar en markOneAsRead

Ambas NCs son menores y no requieren nuevo ciclo de CR completo — verificación rápida por el
Developer en el siguiente commit es suficiente.

---

*SOFIA Code Reviewer Agent · BankPortal · Sprint 5 · 2026-05-14*
