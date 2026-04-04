# Security Report — Sprint 16 — FEAT-014
## Sistema de Notificaciones Push & In-App — BankPortal / Banco Meridian

**Fecha:** 2026-03-24 | **Agente:** SOFIA Security Agent — Step 5b
**CMMI:** VER SP 2.2 | **Estándares:** OWASP Top 10, CWE Top 25, CVSSv3.1, PCI-DSS v4.0, RGPD Art.7/32, RFC 8292 (VAPID)

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| CVEs críticos (CVSS ≥ 9.0) | **0** |
| CVEs altos (CVSS 7.0–8.9) | **0** |
| CVEs medios (CVSS 4.0–6.9) | **0** |
| Secrets hardcodeados | **0** |
| Hallazgos SAST | **3** (2 medios diferidos · 1 informativo) |
| **Semáforo** | 🟢 **VERDE** |
| **Gate result** | ✅ **APROBADO — Pipeline avanza a Step 6 (QA Tester)** |

---

## 1. Análisis de dependencias — CVE Scan

### Stack Java — nuevas dependencias FEAT-014

| Dependencia | Versión | CVEs conocidos | Estado |
|---|---|---|---|
| `nl.martijndwars:web-push` | 5.1.1 | 0 críticos / 0 altos conocidos | ✅ |
| `org.bouncycastle:bcprov-jdk18on` | 1.78.1 | 0 críticos — actualizado a última versión | ✅ |
| `spring-boot-starter-oauth2-resource-server` | 3.3.4 | 0 CVEs | ✅ |
| `spring-boot-starter-data-redis` (Lettuce) | 3.3.4 → 6.x | 0 CVEs conocidos | ✅ |
| `spring-boot-starter-mail` (JavaMail/Jakarta) | 3.3.4 managed | 0 CVEs conocidos | ✅ |
| `io.hypersistence:hypersistence-utils-hibernate-63` | 3.8.1 | 0 CVEs (JsonType JSONB) | ✅ |

### Stack Angular — nuevas dependencias frontend

| Dependencia | Versión | CVEs conocidos | Estado |
|---|---|---|---|
| `@angular/service-worker` | 17.x | 0 críticos | ✅ |
| `rxjs` | 7.8.1 | 0 CVEs de seguridad | ✅ |

**Resultado CVE scan total: 0 críticos / 0 altos / 0 medios** ✅

---

## 2. SAST — Análisis estático — Código nuevo FEAT-014

### 2.1 CWE-89 — SQL Injection

| Fichero | Evaluación |
|---|---|
| `NotificationPreferenceJpaAdapter.java` | ✅ Spring Data JPA — queries JPQL parametrizadas |
| `NotificationHistoryJpaAdapter.java` | ✅ `@Query("SELECT n FROM UserNotification n WHERE n.userId=:userId AND n.category IN :categories ORDER BY n.createdAt DESC")` — sin concatenación |
| `PushSubscriptionJpaAdapter.java` | ✅ `findByIdAndUserId()` — parámetros ligados |
| `V16__notification_preferences.sql` | ✅ DDL estático — sin inputs de usuario |

**Resultado: 0 hallazgos SQL Injection** ✅

---

### 2.2 CWE-79 — XSS

| Fichero | Evaluación |
|---|---|
| `NotificationHistoryController.java` | ✅ `@RestController` — serializa JSON, sin renderizado HTML |
| `NotificationPreferenceController.java` | ✅ Igual |
| `notification-bell.component.html` | ✅ Angular escapa por defecto — `{{ notif.title }}` — sin `[innerHTML]` |
| `notification-panel.component.html` | ✅ Sin `[innerHTML]` — sin bypassSecurityTrust* |
| `notification-settings.component.html` | ✅ |
| `NotificationStreamController.java` (SSE) | ✅ Datos serializados como JSON string en `SseEmitter.send()` — sin HTML raw |

**Web Push payload (VAPID cifrado):**
El payload push va cifrado con AES-128-GCM (RFC 8291). El content del push notification es renderizado por el SO/browser en su propio contexto — fuera del DOM Angular. El `data` del Service Worker (`event.data.json()`) se parsea y la notification se muestra como `self.registration.showNotification(title, { body })` — sin manipulación DOM.

**Resultado: 0 hallazgos XSS** ✅

---

### 2.3 CWE-798 — Hard-coded Credentials

Búsqueda de `VAPID_PRIVATE`, `VAPID_PUBLIC`, `vapid.key`, `private_key`, `server.key`, `FCM_KEY` en código fuente:

| Fichero | Resultado |
|---|---|
| `VapidConfig.java` | ✅ `@Value("${vapid.public-key}")` + `@Value("${vapid.private-key}")` — env vars |
| `application.yml` | ✅ `vapid.public-key: ${VAPID_PUBLIC_KEY}` — sin defaults inseguros |
| `WebPushService.java` | ✅ Recibe keys via `VapidConfig` — sin literales |
| `notification-sw.js` (Service Worker) | ✅ `VAPID_PUBLIC_KEY` inyectado en build via `angular.json` env replacement — no hardcodeado |
| Resto de archivos FEAT-014 | ✅ Sin secrets hardcodeados |

**Resultado: 0 hard-coded credentials** ✅

---

### 2.4 CWE-295 — Validación VAPID / RFC 8292

| Control | Evaluación |
|---|---|
| Clave VAPID tipo `applicationServerKey` en frontend | ✅ URL-safe Base64 — `urlBase64ToUint8Array()` en `NotificationService` |
| `web-push` library — validación firma ECDSA P-256 | ✅ `nl.martijndwars:web-push` valida automáticamente la curva |
| Limpieza de suscripciones 410 Gone | ✅ `WebPushService` llama `pushRepo.deleteById()` cuando el Push Service retorna 410 — impide acumulación de endpoints fantasma |
| TTL del payload VAPID | ✅ `TTL: 86400` (24h) en headers de push — dentro del máximo permitido RFC 8292 §5 |
| `userVisibleOnly: true` en subscribe | ✅ Requisito W3C Push API obligatorio — ya presente en `NotificationService.ts` |

**Resultado: Push implementation conforme a RFC 8292** ✅

---

### 2.5 OWASP A01 — Broken Access Control

| Control | Evaluación |
|---|---|
| `GET /notifications` — historial | ✅ `userId` extraído del JWT en `JwtAuthFacade` — sin parámetro externo |
| `PATCH /notifications/{id}/read` | ✅ `markReadUseCase.execute(notificationId, userId)` — verifica ownership antes de actualizar |
| `DELETE /notifications/{id}` | ✅ `deleteByIdAndUserId(notificationId, userId)` — IDOR protegido |
| `DELETE /push/subscribe/{id}` | ✅ `deleteByIdAndUserId()` — solo el propietario puede cancelar su subscripción |
| `GET /notifications/stream` (SSE) | ✅ JWT validado antes de upgrade a SSE — `SseEmitterRegistry.subscribe()` recibe `userId` del contexto de seguridad |
| `POST /mark-all-read` | ✅ Actúa sobre `userId` del JWT — no acepta userId externo |

**IDOR audit completo: 6/6 endpoints protegidos** ✅

---

### 2.6 OWASP A02 — Cryptographic Failures

| Control | Evaluación |
|---|---|
| VAPID private key en JVM | ✅ `VapidConfig` carga desde env var — no expuesta en logs |
| Payload push cifrado AES-128-GCM | ✅ Manejado por `web-push` library (RFC 8291) |
| Claves ECDH P-256 generadas por browser | ✅ `p256dh` y `auth` almacenados como Base64URL en `push_subscriptions` |
| `push_subscriptions.auth` en BD | ⚠️ Ver SAST-001 — dato sensible almacenado en claro |
| JWT Bearer en `/stream` SSE | ✅ Validado por `JwtAuthenticationFilter` antes del upgrade |
| Redis `sse:replay:{userId}` | ✅ Solo guarda payload JSON de notificación — sin PII sensible beyond userId |

---

### 2.7 OWASP A07 — Identification & Authentication Failures

| Control | Evaluación |
|---|---|
| JWT requerido en todos los endpoints `/notifications/**` | ✅ SecurityConfig — `authenticated()` |
| SSE stream — JWT en header Authorization | ✅ EventSource nativo no soporta headers; Angular usa `@microsoft/fetch-event-source` con `Authorization: Bearer` inyectado |
| Push subscription — `endpoint` UNIQUE constraint | ✅ Evita duplicados por mismo browser |
| Límite 5 suscripciones push/usuario | ⚠️ Race condition documentada como DEBT-026 — riesgo bajo bajo carga real |
| Preference updates — `userId` propietario | ✅ Enforced en application layer |
| `@PreDestroy` en SseEmitterRegistry | ✅ FIX-10 aplicado (CR fix) — evita thundering herd en rolling deploys |

---

### 2.8 OWASP A04 — Insecure Design — Canal EMAIL

| Control | Evaluación |
|---|---|
| Email enviado solo si `emailEnabled=true` en preferencias | ✅ Verificado en `NotificationHub.dispatch()` |
| Sin datos de cuenta bancaria en body email | ✅ Templates solo incluyen tipo de evento + enlace login al portal — sin importes ni IBANs |
| Emails de alerta de seguridad siempre enviados (override preferencias) | ✅ `severity=HIGH` → fuerza todos los canales activos ignorando `emailEnabled` — PSD2 Art.97 SCA notification |
| Unsubscribe compliant RGPD | ⚠️ Ver SAST-002 — emails transaccionales sin enlace de cancelación RGPD Art.7 |

---

### 2.9 OWASP A09 — Security Logging & Monitoring

| Control | Evaluación |
|---|---|
| `AuditLogService.log("PUSH_SENT", userId, ...)` | ✅ Trazabilidad PCI-DSS Req 10.2 |
| `AuditLogService.log("PUSH_SUBSCRIPTION_CREATED", userId, ...)` | ✅ |
| `AuditLogService.log("PUSH_SUBSCRIPTION_DELETED", userId, ...)` | ✅ |
| Logs de `WebPushService` — excepciones 410 | ✅ `log.warn("Push subscription {} expired, removing", subId)` — sin datos de payload |
| Logs de `NotificationHub` sin PII del payload | ✅ Solo `eventType` + `userId` — sin importes ni mensajes de error completos |
| `server.error.include-stacktrace: never` | ✅ Heredado de application.yml base |

**Resultado: Logging conforme PCI-DSS Req 10.2 / 10.3** ✅

---

## 3. Hallazgos SAST (no bloqueantes)

### ⚠️ SAST-003 [MEDIO — DIFERIDO] — `push_subscriptions.auth` almacenado en claro

**Archivo:** `notification/infrastructure/jpa/PushSubscriptionJpaAdapter.java`

El campo `auth` (clave de autenticación P-256 ECDH del browser, 16 bytes Base64URL) se almacena en claro en la columna `push_subscriptions.auth`. Este valor es necesario para enviar notificaciones pero no tiene protección en reposo.

**Análisis de riesgo:** El `auth` por sí solo no permite al atacante acceder a la cuenta del usuario ni descifrar notificaciones pasadas (forward secrecy ECDH). Sin embargo, combinado con el `endpoint` y `p256dh`, permite enviar pushes arbitrarios en nombre del servidor comprometido.

**Mitigación recomendada:** cifrar `auth` + `p256dh` con AES-256-GCM usando la VAPID private key como derivación de clave. Patrón establecido en ADR-003 para TOTP secrets.

**Acción:** DEBT-028 — Sprint 17. No bloquea este sprint.

---

### ⚠️ SAST-004 [MEDIO — DIFERIDO] — Emails transaccionales sin enlace de cancelación (RGPD Art.7)

**Archivo:** `notification/application/service/EmailChannelService.java`

Los correos de alerta transaccional (`TRANSFER_COMPLETED`, `BILL_PAYMENT`, etc.) no incluyen enlace de cancelación de comunicaciones comerciales. Aunque las alertas transaccionales están exentas del consentimiento explícito RGPD (son comunicaciones de servicio), el canal email debe incluir opción de gestión de preferencias según RGPD Art.7 y LSSI-CE.

**Mitigación recomendada:** footer de email con enlace directo a `/profile/notification-settings`.

**Acción:** DEBT-029 — Sprint 17. No bloquea este sprint.

---

### ⚠️ SAST-005 [INFORMATIVO] — Sin Content-Security-Policy específico para SSE endpoint

**Contexto:** El endpoint `GET /api/v1/notifications/stream` sirve `Content-Type: text/event-stream`. El `SecurityConfig` aplica las cabeceras CSP globales del proyecto. No hay política específica que impida que un `<script>` externo intente hacer `fetch()` al stream de otro origen.

**Análisis:** El endpoint requiere `Authorization: Bearer` — un fetch cross-origin sin credenciales recibiría 401. El riesgo real es muy bajo dado que CORS del backend solo permite el origen del portal.

**Acción:** Documentado. Sin acción requerida.

---

## 4. Verificaciones PCI-DSS v4.0 (sector bancario)

| Req | Control | Estado |
|---|---|---|
| 6.3 | `nl.martijndwars:web-push` 5.1.1 sin CVEs | ✅ |
| 6.4 | Actuator deshabilitado en producción | ✅ |
| 8.2 | Alertas de seguridad auditadas (PUSH_SENT, SUBSCRIPTION_CREATED) | ✅ |
| 8.4 | Web Push no sustituye SCA — solo notifica DESPUÉS del factor | ✅ |
| 10.2 | Audit trail: PUSH_SENT · SUBSCRIPTION_CREATED · SUBSCRIPTION_DELETED | ✅ |
| 10.3 | Logs sin datos de tarjeta ni PAN en payload push | ✅ |

---

## 5. Verificaciones RGPD

| Art. | Control | Estado |
|---|---|---|
| Art.5 (minimización) | Payload push sin importes exactos — solo categoría + enlace al portal | ✅ |
| Art.7 (consentimiento) | Preferencias por canal explícitas en BD — opt-in/opt-out | ✅ |
| Art.7 (revocación) | `DELETE /push/subscribe/{id}` + `PATCH /preferences` | ✅ |
| Art.7 (email sin cancelación) | ⚠️ SAST-004 diferido — DEBT-029 Sprint 17 | ⚠️ |
| Art.25 (privacy by design) | `sse:replay:{userId}` TTL 5 min — datos de notificación no persisten indefinidamente en Redis | ✅ |
| Art.32 (seguridad) | VAPID AES-128-GCM + TLS + JWT + BCrypt12 | ✅ |

---

## 6. Angular — Seguridad frontend FEAT-014

| Control | Evaluación |
|---|---|
| Service Worker registrado solo en `isPlatformBrowser` | ✅ Sin SSR conflicts |
| `notification-sw.js` servido con `Service-Worker-Allowed: /` header | ✅ Scope correcto |
| Push permission solicitada solo tras acción explícita del usuario | ✅ Triggered por clic en botón — no en init automático |
| Sin `DomSanitizer.bypassSecurityTrustHtml` en templates de notificación | ✅ |
| `notificationId` como idempotency key en historial frontend | ✅ Evita duplicados en replay SSE |
| `takeUntilDestroyed` en todos los observables SSE | ✅ Sin memory leaks |

---

## 7. Secrets scan — resultado

```
RESULT: 0 secrets detected in new code (FEAT-014 Sprint 16)
All sensitive values read from environment variables:
  VAPID_PUBLIC_KEY    → ${vapid.public-key}
  VAPID_PRIVATE_KEY   → ${vapid.private-key}
  SPRING_MAIL_*       → ${spring.mail.host/port/username/password}
  DB_URL              → ${spring.datasource.url}
  REDIS_URL           → ${spring.data.redis.url}
  JWT_SECRET          → ${jwt.secret} (herencia FEAT-001)
```

---

## 8. DEBT técnica registrada por Security Agent

| ID | Origen | Descripción | CVSS estimado | Sprint sugerido |
|---|---|---|---|---|
| DEBT-028 | SAST-003 | Cifrar `push_subscriptions.auth` + `p256dh` en reposo (AES-256-GCM) | 4.1 Medium | Sprint 17 |
| DEBT-029 | SAST-004 | Footer emails con enlace gestión preferencias — RGPD Art.7 compliance | Low | Sprint 17 |

---

## 9. Criterio de salida del Security Gate

```
[x] cve_critical = 0           → Gate NO bloqueado
[x] cve_high     = 0           → Sin dependencias de alta severidad
[x] secrets_found = 0          → Sin credenciales en código fuente
[x] CWE-89 (SQLi):   0 hallazgos
[x] CWE-79 (XSS):    0 hallazgos
[x] CWE-798 (HC):    0 hallazgos
[x] CWE-295 (VAPID): RFC 8292 conforme
[x] OWASP A01 IDOR:  6/6 endpoints protegidos
[x] OWASP A09:       Audit trail PCI-DSS Req 10.2/10.3 presente
[x] PCI-DSS push:    No sustituye SCA — solo notificación post-factor
[x] SAST-003/004:    Medios diferidos Sprint 17 (DEBT-028/029)
[x] SAST-005:        Informativo — sin acción
```

**Semáforo: 🟢 VERDE**
**Gate result: ✅ APROBADO — Pipeline puede avanzar a Step 6 (QA Tester)**

---

*SOFIA Security Agent — Step 5b — BankPortal Sprint 16 — FEAT-014 — 2026-03-24*
*CMMI Level 3 — VER SP 2.2 | OWASP Top 10 | PCI-DSS v4.0 | RGPD | RFC 8292 VAPID*
