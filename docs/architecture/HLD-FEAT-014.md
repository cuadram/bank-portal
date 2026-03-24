# HLD — FEAT-014: Notificaciones Push & In-App

**BankPortal · Banco Meridian · Sprint 16**

| Campo | Valor |
|---|---|
| Feature | FEAT-014 |
| Sprint | 16 · 2026-03-25 → 2026-04-08 |
| Versión | 1.0 |
| Estado | DRAFT — Gate 3 pendiente Tech Lead |
| ADRs | ADR-025 (VAPID vs FCM) |
| SRS | docs/requirements/SRS-FEAT-014.md |
| Normativa | RGPD Art.7 · RGPD Art.32 · PSD2 RTS Art.97 |

---

## Análisis de impacto en monorepo

| Servicio/Módulo | Tipo de impacto | Cambios |
|---|---|---|
| `NotificationService` (FEAT-007) | Extensión | Nuevo `NotificationHub` orquesta todos los canales; `NotificationService` legacy reutilizado como canal email |
| `SseEmitterRegistry` (FEAT-007) | Extensión | Filtro por categoría + soporte `Last-Event-ID` con replay Redis |
| `user_notifications` (FEAT-007) | Extensión | Flyway V16 añade columnas `category`, `severity`, `metadata`, `read_at` (aditivo, sin breaking change) |
| `SecurityConfig` | Modificación mínima | Whitelist `/api/v1/notifications/stream` (SSE no compatible con CSRF token) |
| `TransferService` (FEAT-008) | Reutilización | Escucha `TransferCompletedEvent` vía `@TransactionalEventListener` |
| `AuditLogService` | Reutilización | Nuevos eventos `PUSH_SENT` · `PUSH_SUBSCRIPTION_CREATED` |
| `Redis` | Extensión | Nuevo bucket `sse:replay:{userId}` para eventos pendientes (TTL 5 min) |
| Frontend `DashboardModule` | Extensión | `NotificationBellComponent` en header + lazy `NotificationModule` |
| Flyway | Extensión | V16__notification_preferences.sql (nuevas tablas, columnas aditivas) |

**Contratos existentes no rotos:** ninguno. Todos los cambios son aditivos o extensiones backward-compatible.

---

## C4 Nivel 1 — Contexto del sistema

```mermaid
C4Context
  title BankPortal — Contexto Notificaciones Push & In-App (FEAT-014)

  Person(cliente, "Cliente BankPortal", "Usuario final con sesión activa o inactiva")
  System(bankportal, "BankPortal", "Portal bancario — Spring Boot 3.x + Angular 17")
  System_Ext(webpush, "Web Push Service", "Push Service del navegador (Chrome/Firefox/Safari) — estándar W3C")
  System_Ext(smtp, "SMTP / SendGrid", "Canal email para alertas transaccionales y de seguridad")
  System_Ext(redis_ext, "Redis", "Broker SSE replay + rate limiting existente")

  Rel(cliente, bankportal, "Consulta historial, gestiona preferencias, recibe SSE", "HTTPS / SSE")
  Rel(bankportal, webpush, "Envía notificaciones push cifradas VAPID P-256", "HTTPS RFC 8292")
  Rel(webpush, cliente, "Entrega push notification", "W3C Push API")
  Rel(bankportal, smtp, "Alertas email (seguridad + transaccional > threshold)", "SMTP TLS")
  Rel(bankportal, redis_ext, "Replay de eventos SSE perdidos (TTL 5 min)", "Lettuce")
```

---

## C4 Nivel 2 — Contenedores

```mermaid
C4Container
  title BankPortal — Contenedores FEAT-014

  Person(cliente, "Cliente BankPortal")

  Container(frontend, "Angular 17 SPA", "TypeScript · Angular 17 · Service Worker", "NotificationModule: Bell + Panel + Settings + SW push handler")
  Container(backend, "Spring Boot 3.3 API", "Java 21 · Spring Security", "NotificationHub: preferencias · historial · SSE · push · alertas")
  ContainerDb(pg, "PostgreSQL 16", "Relacional", "notification_preferences · push_subscriptions · user_notifications extendida")
  ContainerDb(redis, "Redis 7", "Cache / Replay buffer", "sse:replay:{userId} TTL 5min · rate limiting")
  System_Ext(webpush, "Web Push Service (browser)", "Chrome Push / Firefox Push / Safari Web Push")
  System_Ext(smtp, "SMTP / SendGrid")

  Rel(cliente, frontend, "Browser", "HTTPS")
  Rel(frontend, backend, "REST + SSE", "HTTPS · Bearer JWT")
  Rel(backend, pg, "JPA / Flyway V16", "JDBC")
  Rel(backend, redis, "SSE replay buffer", "Lettuce")
  Rel(backend, webpush, "VAPID RFC 8292 + AES-128-GCM", "HTTPS")
  Rel(webpush, cliente, "Push Notification", "W3C Push API")
  Rel(backend, smtp, "Alertas email", "SMTP TLS")
```

---

## C4 Nivel 3 — Componentes del backend (módulo Notifications)

```mermaid
C4Component
  title Backend — Módulo Notifications Hub (Clean Architecture)

  Container_Boundary(notif, "notifications module") {
    Component(prefCtrl, "NotificationPreferenceController", "REST", "GET/PATCH /preferences")
    Component(histCtrl, "NotificationHistoryController", "REST", "GET /notifications · PATCH read · POST mark-all-read")
    Component(streamCtrl, "NotificationStreamController", "REST/SSE", "GET /stream?categories=")
    Component(pushCtrl, "PushSubscriptionController", "REST", "POST/DELETE /push/subscribe")

    Component(hub, "NotificationHub", "Application — Orchestrator", "@Async despacha a cada canal según preferencias y severidad")
    Component(prefUC, "ManagePreferencesUseCase", "Application", "CRUD preferencias usuario")
    Component(histUC, "GetNotificationsUseCase", "Application", "Historial paginado con filtros + unread-count")
    Component(markUC, "MarkReadUseCase", "Application", "Marcar leída / mark-all-read")
    Component(pushUC, "ManagePushSubscriptionUseCase", "Application", "Register · Unregister · cleanup 410 Gone")

    Component(webpushSvc, "WebPushService", "Infrastructure", "nl.martijndwars:web-push · VAPID · limpieza 410")
    Component(sseReg, "SseEmitterRegistry", "Infrastructure EXTENDIDO", "filtro categorías + Last-Event-ID + heartbeat 30s")
    Component(txAlert, "TransactionAlertService", "Application", "@TransactionalEventListener AFTER_COMMIT")
    Component(secAlert, "SecurityAlertService", "Application", "DeviceRegisteredEvent · PasswordChangedEvent · TwoFactorFailedEvent")
    Component(prefRepo, "NotificationPreferenceRepository", "Infrastructure", "JPA notification_preferences")
    Component(pushRepo, "PushSubscriptionRepository", "Infrastructure", "JPA push_subscriptions")
    Component(notifRepo, "NotificationRepository", "Infrastructure", "JPA user_notifications extendida")
  }

  Container(pg, "PostgreSQL")
  Container(redis, "Redis")
  Component(legacyNS, "NotificationService", "existente FEAT-007 — canal email")

  Rel(prefCtrl, prefUC, "delega")
  Rel(histCtrl, histUC, "delega")
  Rel(histCtrl, markUC, "delega")
  Rel(streamCtrl, sseReg, "suscribe emitter filtrado")
  Rel(pushCtrl, pushUC, "delega")
  Rel(txAlert, hub, "dispatch(NotificationEvent)")
  Rel(secAlert, hub, "dispatch(NotificationEvent severity=HIGH)")
  Rel(hub, prefRepo, "consulta preferencias")
  Rel(hub, webpushSvc, "canal PUSH si pushEnabled")
  Rel(hub, sseReg, "canal IN_APP si inAppEnabled")
  Rel(hub, legacyNS, "canal EMAIL si emailEnabled")
  Rel(hub, notifRepo, "persiste en user_notifications")
  Rel(webpushSvc, pushRepo, "lee suscripciones activas · elimina 410")
  Rel(sseReg, redis, "replay buffer Last-Event-ID")
  Rel(prefRepo, pg, "JDBC")
  Rel(pushRepo, pg, "JDBC")
  Rel(notifRepo, pg, "JDBC")
```

---

## Diagrama de secuencia — Flujo alerta transaccional (transfer COMPLETED)

```mermaid
sequenceDiagram
  participant TS as TransferService
  participant EA as Spring ApplicationEventPublisher
  participant TAS as TransactionAlertService
  participant HUB as NotificationHub
  participant PREF as NotificationPreferenceRepo
  participant WP as WebPushService
  participant SSE as SseEmitterRegistry
  participant NS as NotificationService (email)
  participant NR as NotificationRepository

  TS->>EA: publish(TransferCompletedEvent{userId, amount, iban})
  Note over TAS: @TransactionalEventListener(AFTER_COMMIT)
  EA-->>TAS: TransferCompletedEvent
  TAS->>HUB: dispatch(NotificationEvent{userId, TRANSFER_COMPLETED, severity=INFO, payload})
  HUB->>PREF: findByUserIdAndEventType(userId, TRANSFER_COMPLETED)
  PREF-->>HUB: prefs{pushEnabled=true, inAppEnabled=true, emailEnabled=true}
  par Canal PUSH
    HUB->>WP: send(userId, title, body, data)
    WP->>WP: cargar push_subscriptions activas del usuario
    WP-->>HUB: OK | 410 Gone → delete subscription
  and Canal IN_APP (SSE)
    HUB->>SSE: broadcast(userId, TRANSACTION, event)
    SSE-->>HUB: emitted | no active emitter
  and Canal EMAIL (si amount > threshold ó emailEnabled)
    HUB->>NS: sendNotificationEmail(userId, subject, body)
    NS-->>HUB: OK
  end
  HUB->>NR: save(UserNotification{userId, TRANSFER_COMPLETED, TRANSACTION, INFO})
  NR-->>HUB: saved
```

---

## Diagrama de secuencia — Suscripción Web Push (Angular → Backend)

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as NotificationPanelComponent
  participant SW as Service Worker
  participant BE as PushSubscriptionController
  participant UC as ManagePushSubscriptionUseCase
  participant DB as push_subscriptions

  U->>FE: Clic "Activar notificaciones"
  FE->>FE: Notification.requestPermission()
  alt Permiso concedido
    FE->>SW: registration.pushManager.subscribe({userVisibleOnly:true, applicationServerKey: VAPID_PUBLIC})
    SW-->>FE: PushSubscription {endpoint, p256dh, auth}
    FE->>BE: POST /api/v1/notifications/push/subscribe {endpoint, p256dh, auth, userAgent}
    BE->>UC: execute(userId, subscriptionDto)
    UC->>DB: save(PushSubscription)
    DB-->>UC: saved {subscriptionId}
    UC-->>BE: subscriptionId
    BE-->>FE: HTTP 201 {subscriptionId}
    FE-->>U: Banner "Notificaciones activadas ✓"
  else Permiso denegado
    FE-->>U: Banner informativo — solo recibirá in-app
  end
```

---

## Diagrama de secuencia — Reconexión SSE con Last-Event-ID

```mermaid
sequenceDiagram
  participant FE as Angular NotificationService
  participant BE as NotificationStreamController
  participant SSE as SseEmitterRegistry
  participant Redis as Redis (replay buffer)

  FE->>BE: GET /api/v1/notifications/stream?categories=SECURITY,TRANSACTION\nLast-Event-ID: evt-450
  BE->>SSE: subscribe(userId, categories=[SECURITY,TRANSACTION], lastEventId=evt-450)
  SSE->>Redis: LRANGE sse:replay:{userId} — filtrar > evt-450
  Redis-->>SSE: [evt-451{...}, evt-452{...}]
  loop Replay eventos perdidos
    SSE-->>FE: id: evt-451\nevent: SECURITY_NEW_DEVICE\ndata: {...}
    SSE-->>FE: id: evt-452\nevent: TRANSFER_COMPLETED\ndata: {...}
  end
  Note over SSE,FE: Conexión activa — heartbeat cada 30s
  loop Heartbeat keepalive
    SSE-->>FE: : heartbeat
  end
```

---

## Contrato de integración Backend ↔ Frontend

**Base URL:** `/api/v1/notifications`
**Auth:** Bearer JWT (header `Authorization`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/preferences` | Obtiene preferencias por canal del usuario autenticado |
| `PATCH` | `/preferences` | Actualiza preferencia para un tipo de evento |
| `GET` | `/` | Historial paginado con filtro por categoría |
| `GET` | `/unread-count` | Contador de no leídas |
| `PATCH` | `/{id}/read` | Marca notificación individual como leída |
| `POST` | `/mark-all-read` | Marca todas como leídas |
| `DELETE` | `/{id}` | Elimina notificación del historial |
| `GET` | `/stream` | SSE — query param `categories` (opcional), header `Last-Event-ID` |
| `POST` | `/push/subscribe` | Registra suscripción Web Push |
| `DELETE` | `/push/subscribe/{id}` | Cancela suscripción Web Push |

**Eventos SSE (formato `text/event-stream`):**
```
id: {eventId}
event: {TRANSFER_COMPLETED|SECURITY_NEW_DEVICE|KYC_APPROVED|...}
data: {"notificationId":"uuid","title":"...","body":"...","severity":"INFO|HIGH","category":"TRANSACTION|SECURITY|KYC|SYSTEM"}
```

---

## Decisiones técnicas — ver ADRs

- **ADR-025:** VAPID puro vs Firebase Cloud Messaging (FCM)

---

*SOFIA Architect Agent — Step 3 | Sprint 16 · FEAT-014*
*CMMI Level 3 — TS SP 1.1 · TS SP 2.1 · TS SP 2.2*
*BankPortal — Banco Meridian — 2026-03-24*
