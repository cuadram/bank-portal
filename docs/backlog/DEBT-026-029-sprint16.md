
---

## Deuda técnica generada en Sprint 16 (post Code Review + Security Agent)

### DEBT-025 — (reservado Sprint 15)

---

### DEBT-026 — Race condition límite 5 push subscriptions concurrentes (2 SP)

**Origen:** RV-F014-05 (Code Review Sprint 16)
**Archivo:** `notification/application/ManagePushSubscriptionUseCase.java:34-42`

**Problema:** `countByUserId()` y `save()` no son atómicos. Bajo carga concurrente extrema, dos requests simultáneas con `count=4` pueden ambas pasar el check e insertar, resultando en 6 subscripciones activas.

**Solución propuesta:** Query nativa `INSERT ... WHERE (SELECT COUNT(*) FROM push_subscriptions WHERE user_id=?) < 5` para atomicidad a nivel BD, o aceptar overflow de 1 unidad documentado (riesgo bajo en producción real).

**Sprint sugerido:** Sprint 18 | **Prioridad:** Media

---

### DEBT-027 — Domain events como inner classes de listeners (2 SP)

**Origen:** RV-F014-07 (Code Review Sprint 16)
**Archivos:** `TransactionAlertService.java` · `SecurityAlertService.java`

**Problema:** Records `TransferCompletedEvent`, `PasswordChangedEvent`, etc., declarados como inner classes de los listeners. `TransferService` debe importar `TransactionAlertService.TransferCompletedEvent` — el productor conoce al consumidor, invirtiendo el flujo de dependencia correcto.

**Solución:** Mover records a `notification/domain/events/` o a los paquetes de dominio de los productores (`transfer/domain/TransferCompletedEvent.java`). Patrón Clean Architecture — domain events en el dominio del emisor.

**Sprint sugerido:** Sprint 17 | **Prioridad:** Media

---

### DEBT-028 — Cifrar `push_subscriptions.auth` + `p256dh` en reposo (3 SP)

**Origen:** SAST-003 (Security Agent Sprint 16) | **CVSS:** 4.1 Medium
**Archivo:** `notification/infrastructure/jpa/PushSubscriptionJpaAdapter.java`

**Problema:** Las claves de autenticación y clave pública del browser para Web Push se almacenan en claro en BD. Combinadas con el endpoint, permiten enviar pushes arbitrarios si la BD se compromete.

**Solución:** Cifrar `auth` + `p256dh` con AES-256-GCM usando derivación de la VAPID private key. Patrón establecido en ADR-003 para TOTP secrets — aplicar misma estrategia.

**Sprint sugerido:** Sprint 17 | **Prioridad:** Media-Alta (datos sensibles)

---

### DEBT-029 — Footer emails notificación con enlace preferencias RGPD Art.7 (1 SP)

**Origen:** SAST-004 (Security Agent Sprint 16)
**Archivo:** `notification/application/service/EmailChannelService.java`

**Problema:** Emails de alerta transaccional sin enlace de gestión de preferencias. Cumplimiento RGPD Art.7 y LSSI-CE.

**Solución:** Añadir footer en templates de email con enlace directo a `/profile/notification-settings`.

**Sprint sugerido:** Sprint 17 | **Prioridad:** Media (compliance)

---

*SOFIA Documentation Agent — Step 5b — Sprint 16 FEAT-014 — 2026-03-24*
*CMMI Level 3 — CM SP 1.2 · RD SP 3.1*
