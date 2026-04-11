# FEAT-014 — Notificaciones Push & In-App

**BankPortal · Banco Meridian · Sprint 16**

| Campo | Valor |
|---|---|
| ID | FEAT-014 |
| Sprint | 16 |
| Jira Epic | SCRUM-57 (pendiente creación) |
| Prioridad | Alta |
| SP total | 22 (+ 2 deuda técnica = 24) |
| Estado | 🟡 PLANNING |

---

## Contexto

El sistema actual (FEAT-007) dispone de:
- `NotificationService` — envío email + persistencia `user_notifications`
- `SseEmitterRegistry` — broadcast in-app por `userId`
- Tabla `user_notifications` (id, userId, type, message, read, createdAt)

**FEAT-014** extiende esta infraestructura con:
1. **Web Push / FCM** — notificaciones fuera de sesión activa
2. **Centro de notificaciones** — historial completo con filtros y marcado de lectura
3. **Preferencias por canal** — el usuario configura qué recibe y por qué canal
4. **Alertas transaccionales** — transfer, payment, bill con importes
5. **Alertas de seguridad** — nuevo dispositivo, cambio contraseña, 2FA fallido
6. **SSE extendido** — suscripción filtrada por categoría de evento

---

## User Stories

### US-1401 — Modelo preferencias notificación + Flyway V16 (2 SP)

**Como** sistema BankPortal, **quiero** persistir las preferencias de canal de cada usuario, **para** enviar notificaciones solo por los canales que el usuario ha habilitado.

**Criterios de aceptación:**
```gherkin
Scenario: Migración V16 crea tabla notification_preferences
  Given entorno PostgreSQL con V15 aplicada
  When se ejecuta V16__notification_preferences.sql
  Then existe notification_preferences(userId, eventType, emailEnabled, pushEnabled, inAppEnabled)
  And tabla push_subscriptions(id, userId, endpoint, p256dh, auth, userAgent, createdAt)

Scenario: Preferencias por defecto al crear nuevo usuario
  Given usuario nuevo sin preferencias configuradas
  When consulta GET /api/v1/notifications/preferences
  Then todos los canales retornan enabled=true (opt-out por defecto)

Scenario: Usuario desactiva email para transferencias
  Given usuario autenticado con preferencias por defecto
  When PATCH /api/v1/notifications/preferences con { eventType: TRANSFER, emailEnabled: false }
  Then la preferencia se persiste y el siguiente evento TRANSFER no genera email
```

**DoD:** Flyway V16 · repositorios JPA · endpoint GET/PATCH preferences · test migración IT

---

### US-1402 — Centro de notificaciones backend (3 SP)

**Como** cliente de Banco Meridian, **quiero** consultar el historial completo de mis notificaciones con filtros, **para** revisar alertas anteriores que no pude ver en tiempo real.

**Criterios de aceptación:**
```gherkin
Scenario: Listar notificaciones paginadas
  Given usuario con 50 notificaciones históricas
  When GET /api/v1/notifications?page=0&size=20&category=SECURITY
  Then retorna 20 items ordenados por createdAt DESC
  And cada item incluye { id, type, title, body, read, createdAt, category }
  And response incluye { totalElements: 50, totalPages: 3 }

Scenario: Marcar notificación como leída
  Given notificación con id=notif-001 en estado read=false
  When PATCH /api/v1/notifications/notif-001/read
  Then read=true y readAt se registra
  And GET /api/v1/notifications/unread-count retorna contador decrementado

Scenario: Marcar todas como leídas
  When POST /api/v1/notifications/mark-all-read
  Then todas las notificaciones del usuario pasan a read=true
  And unread-count = 0

Scenario: Filtrar por categoría TRANSACTION
  When GET /api/v1/notifications?category=TRANSACTION
  Then solo retorna notificaciones de tipo TRANSFER_COMPLETED, PAYMENT_COMPLETED, BILL_PAID
```

**DoD:** `GetNotificationsUseCase` · `MarkReadUseCase` · endpoints REST · tests ≥ 5 escenarios

---

### US-1403 — Stream SSE extendido — suscripción por categoría (2 SP)

**Como** cliente con sesión activa, **quiero** recibir notificaciones en tiempo real filtradas por categoría, **para** no ser inundado con eventos irrelevantes.

**Criterios de aceptación:**
```gherkin
Scenario: Suscripción SSE con filtro de categorías
  Given usuario autenticado con sesión activa
  When conecta a GET /api/v1/notifications/stream?categories=SECURITY,KYC
  Then recibe solo eventos de categoría SECURITY y KYC
  And no recibe eventos TRANSACTION en ese stream

Scenario: Reconexión automática (Last-Event-ID)
  Given cliente SSE desconectado 30 segundos
  When reconecta con header Last-Event-ID: evt-450
  Then el servidor reenvía los eventos perdidos desde evt-451

Scenario: Heartbeat keepalive cada 30 segundos
  Given stream SSE activo sin eventos
  When pasan 30 segundos sin mensajes
  Then el servidor envía event: heartbeat\ndata: ping para mantener conexión viva
```

**DoD:** Extensión `SseEmitterRegistry` con filtro por categoría · `Last-Event-ID` replay desde Redis · tests

---

### US-1404 — Web Push / VAPID — suscripción y envío (5 SP)

**Como** cliente de Banco Meridian, **quiero** recibir notificaciones push en mi navegador aunque no tenga BankPortal abierto, **para** estar al tanto de movimientos importantes en mi cuenta.

**Criterios de aceptación:**
```gherkin
Scenario: Registro de suscripción Web Push
  Given usuario autenticado con navegador que soporta Push API
  When POST /api/v1/notifications/push/subscribe con { endpoint, p256dh, auth, userAgent }
  Then la suscripción queda registrada en push_subscriptions
  And retorna HTTP 201 con { subscriptionId }

Scenario: Envío de notificación push al completar transferencia
  Given usuario con push_subscription activa y preferencia pushEnabled=true para TRANSFER
  When se completa una transferencia de 500€
  Then el backend envía notificación push con payload { title: "Transferencia enviada", body: "500.00€ a ..." }
  And la notificación aparece en el sistema operativo del usuario

Scenario: Limpieza de suscripciones inválidas (410 Gone)
  Given backend intenta enviar push a suscripción expirada
  When el Push Service retorna HTTP 410 Gone
  Then la suscripción se elimina de push_subscriptions automáticamente

Scenario: Fallback in-app si push deshabilitado
  Given usuario sin push_subscription registrada
  When ocurre evento de notificación
  Then el sistema usa SSE in-app y email (si habilitado) como canales alternativos

Scenario: Usuario cancela suscripción push
  When DELETE /api/v1/notifications/push/subscribe/{subscriptionId}
  Then la suscripción se elimina y no se envían más pushes a ese endpoint
```

**DoD:** `WebPushService` con librería `web-push` (Java) o `nl.martijndwars:web-push` · VAPID keys configuradas por ENV · tests unitarios · test IT con mock Push Service

---

### US-1405 — Alertas transaccionales (transfer, payment, bill) (3 SP)

**Como** cliente de Banco Meridian, **quiero** recibir una alerta inmediata cada vez que se ejecuta una transferencia, pago o domiciliación en mi cuenta, **para** detectar rápidamente cualquier movimiento no autorizado.

**Criterios de aceptación:**
```gherkin
Scenario: Alerta push + in-app al completar transferencia saliente
  Given usuario con KYC APPROVED y suscripción push activa
  When POST /api/v1/transfers completa con status COMPLETED
  Then se genera evento TRANSFER_COMPLETED
  And se envía push notification: "Transferencia enviada: 250.00€ a IBAN ES76..."
  And se crea user_notification tipo TRANSFER_COMPLETED en historial
  And si transferencia.amount > threshold_alert (por defecto 1000€) → también email

Scenario: Alerta al recibir transferencia entrante
  Given usuario como destinatario de transferencia
  When la transferencia se acredita en su cuenta
  Then se genera evento TRANSFER_RECEIVED
  And notificación push: "Has recibido 300.00€ de Juan García"

Scenario: Alerta al completar pago de recibo
  When POST /api/v1/bills/{id}/pay completa
  Then notificación: "Pago realizado: Factura Luz 89.50€"

Scenario: Alertas respetan preferencias de usuario
  Given usuario con pushEnabled=false para TRANSFER
  When se completa transferencia
  Then NO se envía push notification
  And SÍ se crea user_notification in-app (inAppEnabled=true por defecto)
```

**DoD:** Event listeners en TransferCompletedEvent · PaymentCompletedEvent · BillPaidEvent · `TransactionAlertService` · integración con `WebPushService` · tests ≥ 5 escenarios

---

### US-1406 — Alertas de seguridad (3 SP)

**Como** cliente de Banco Meridian, **quiero** recibir alertas cuando ocurran eventos de seguridad en mi cuenta (nuevo dispositivo, cambio de contraseña, intentos 2FA fallidos), **para** detectar accesos no autorizados.

**Criterios de aceptación:**
```gherkin
Scenario: Alerta push + email al registrar nuevo dispositivo de confianza
  Given usuario con dispositivos de confianza registrados
  When POST /api/v1/devices registra nuevo dispositivo (Chrome · Windows · IP 91.x.x.x)
  Then email: "Nuevo dispositivo de confianza registrado desde Madrid (IP 91.x.x.x)"
  And push notification: "Nuevo acceso desde dispositivo desconocido"
  And user_notification tipo SECURITY_NEW_DEVICE en historial

Scenario: Alerta al cambiar contraseña
  When usuario completa cambio de contraseña exitosamente
  Then email: "Tu contraseña de BankPortal ha sido cambiada"
  And push notification: "Contraseña actualizada"
  And si el cambio NO fue iniciado por el propio usuario → alerta con prioridad ALTA

Scenario: Alerta tras 3 intentos 2FA fallidos
  Given usuario con 3 intentos 2FA fallidos consecutivos
  When se registra el tercer fallo
  Then email de alerta: "Se han detectado 3 intentos de autenticación fallidos en tu cuenta"
  And push notification: "Actividad sospechosa detectada"
  And nivel severity = HIGH en user_notification

Scenario: Alerta al cambiar número de teléfono 2FA
  When usuario actualiza su número de teléfono para SMS 2FA
  Then email de confirmación + alerta a dirección anterior si es diferente
```

**DoD:** `SecurityAlertService` · listeners para DeviceRegisteredEvent · PasswordChangedEvent · TwoFactorFailedEvent · tests ≥ 4 escenarios

---

### US-1407 — Frontend Angular — Notification Bell + Centro (4 SP)

**Como** cliente de Banco Meridian, **quiero** ver un icono de notificaciones en el header del dashboard con el contador de no leídas, y acceder a un panel lateral con el historial completo, **para** gestionar mis alertas desde cualquier sección del portal.

**Criterios de aceptación:**
```gherkin
Scenario: Badge con contador de no leídas actualizado en tiempo real
  Given usuario con 3 notificaciones no leídas
  When accede al dashboard
  Then el icono campana muestra badge rojo con "3"
  When llega nueva notificación vía SSE
  Then el badge se actualiza a "4" sin recargar página

Scenario: Panel lateral con historial y filtros
  When usuario hace clic en el icono campana
  Then se abre panel lateral (drawer) con lista de notificaciones
  And puede filtrar por: Todas | Transacciones | Seguridad | KYC
  And cada item muestra: ícono de categoría · título · cuerpo · tiempo relativo (hace 5min)
  And items no leídos tienen fondo diferenciado

Scenario: Marcar como leída al hacer clic
  Given notificación no leída en el panel
  When usuario hace clic en ella
  Then PATCH /api/v1/notifications/{id}/read se invoca
  And el estilo cambia a "leída" en tiempo real
  And el contador del badge se decrementa

Scenario: Solicitar permiso para Web Push
  Given usuario que aún no ha dado permisos de push
  When abre el panel de notificaciones por primera vez
  Then aparece banner: "¿Quieres recibir alertas aunque BankPortal esté cerrado?"
  And botón "Activar notificaciones" invoca Notification.requestPermission()
  And si acepta → POST /api/v1/notifications/push/subscribe

Scenario: Preferencias de notificación accesibles desde el panel
  When usuario hace clic en ⚙️ dentro del panel de notificaciones
  Then navega a /settings/notifications con toggle por tipo y canal (email / push / in-app)
```

**DoD:** `NotificationBellComponent` · `NotificationPanelComponent` · `NotificationSettingsComponent` · `NotificationService` Angular · SSE integrado · tests ≥ 5 escenarios · WCAG 2.1 AA

---

## Deuda técnica incluida

### DEBT-023 — KycAuthorizationFilter período de gracia (1 SP)

**Problema:** `KycAuthorizationFilter` bloquea a usuarios pre-existentes (registrados antes de FEAT-013) que nunca han iniciado el proceso KYC, presentándoles un 403 sin opción de resolverlo.

**Solución:** Si el usuario no tiene registro en `kyc_verifications` (usuario pre-existente), el filtro crea automáticamente una entrada `KycVerification` con status `PENDING` y redirige con 403 + `kycUrl` como ya existe — en lugar de bloquear sin contexto.

**Test:** `KycAuthorizationFilterTest` — escenario usuario pre-existente sin kyc_verifications

---

### DEBT-024 — KycReviewResponse tipado (1 SP)

**Problema:** `KycReviewResponse` se devuelve como `Map<String, Object>` (detectado en RV-026), sin contrato de tipo explícito.

**Solución:** Crear record `KycReviewResponse(UUID kycId, KycStatus status, Instant reviewedAt, UUID reviewerId)` con serialización Jackson correcta.

**Test:** `ReviewKycUseCaseTest` — verificar deserialización del DTO

---

## Normativa aplicable

| Normativa | Requisito | Implementación |
|---|---|---|
| RGPD Art.7 | Consentimiento opt-out notificaciones marketing | Preferencias granulares por tipo de evento |
| PSD2 RTS Art.97 | Alertas transacciones sospechosas | Alerta inmediata en TRANSFER > threshold + alerta seguridad |
| RGPD Art.32 | Seguridad de las notificaciones | Payload push cifrado (VAPID P-256 + AES-128-GCM) |

---

*SOFIA Requirements Analyst — Sprint 16 · FEAT-014*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1*
*BankPortal — Banco Meridian — 2026-03-24*
