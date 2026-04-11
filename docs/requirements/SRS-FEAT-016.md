# SRS-FEAT-016 — Gestión de Tarjetas
## BankPortal · Banco Meridian · Sprint 18

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-016 v1.0 |
| Feature | FEAT-016 — Gestión de Tarjetas |
| Sprint | 18 · Período 2026-04-23 → 2026-05-07 |
| Release objetivo | v1.18.0 |
| Estado | APROBADO — Gate 2 pendiente Product Owner |
| Autor | SOFIA Requirements Analyst Agent |
| Fecha | 2026-03-25 |
| CMMI | REQM SP 1.1 · REQM SP 1.3 · PP SP 1.2 |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos funcionales y no funcionales de FEAT-016 — Gestión de Tarjetas para BankPortal (Banco Meridian). Define el comportamiento esperado del sistema para el ciclo completo de operaciones sobre tarjetas bancarias: consulta, bloqueo/desbloqueo, gestión de límites, cambio de PIN e historial de transacciones, con aplicación de SCA (PSD2) y cumplimiento PCI-DSS 4.0.

### 1.2 Alcance

FEAT-016 cubre:
- Modelo de datos `cards` vinculado a cuentas del usuario (Flyway V18)
- Consulta y detalle de tarjetas (PAN enmascarado, estado, tipo, caducidad)
- Bloqueo / desbloqueo temporal con confirmación 2FA (OTP)
- Modificación de límites de gasto diario y mensual dentro de rangos del banco
- Cambio de PIN con verificación 2FA
- Historial de transacciones por tarjeta (paginado, exportable PDF)
- Módulo Angular completo (componentes, servicios, routing)
- Auditoría íntegra en `audit_log`

**Fuera de alcance:** solicitud de nueva tarjeta, activación tarjeta emitida, Apple Pay / Google Pay, disputas y contracargos.

### 1.3 Documentos relacionados

| Documento | Relación |
|---|---|
| FEAT-016.md | Product backlog — descripción de negocio |
| SRS-FEAT-015.md v1.0 | Feature predecesora (Transferencias Programadas) |
| ADR-021 — JWT RS256 | Seguridad de tokens |
| ADR-028 (pendiente) | ShedLock scheduler multi-instancia |
| openapi-v1.17.0.yaml | Contratos API anteriores |
| Flyway V17b | Cifrado AES-256-GCM push subscriptions (DEBT-028 cerrada) |

---

## 2. Descripción general

### 2.1 Perspectiva del producto

Con FEAT-001 a FEAT-015 completados, BankPortal dispone de autenticación 2FA robusta, gestión de sesiones, auditoría inmutable, cuentas, transferencias, transferencias programadas y notificaciones push. FEAT-016 completa el producto mínimo viable bancario añadiendo control pleno sobre tarjetas — elemento central del day-to-day financiero del cliente.

### 2.2 Funciones principales

| F-ID | Función |
|---|---|
| F-001 | Consultar tarjetas vinculadas al usuario con PAN enmascarado y estado |
| F-002 | Ver detalle completo de tarjeta (tipo, límites actuales, fecha expiración) |
| F-003 | Bloquear tarjeta con SCA (OTP) — registro en audit_log |
| F-004 | Desbloquear tarjeta con SCA (OTP) — registro en audit_log |
| F-005 | Modificar límite diario dentro del rango permitido por el banco |
| F-006 | Modificar límite mensual dentro del rango permitido por el banco |
| F-007 | Cambiar PIN con SCA (OTP) + validación reglas de complejidad |
| F-008 | Consultar historial de transacciones por tarjeta (paginado) |
| F-009 | Exportar historial de tarjeta en PDF (OpenPDF, Experis branding) |
| F-010 | Notificación push tras bloqueo, desbloqueo y cambio de límites |

### 2.3 Actores del sistema

| Actor | Descripción |
|---|---|
| Usuario autenticado | Cliente con cuenta activa en Banco Meridian — JWT RS256 |
| Core bancario (mock) | Adaptador de integración — responde a operaciones sobre tarjetas |
| Motor OTP (2FA) | Servicio TOTP / SMS ya operativo desde FEAT-001 |
| Sistema de push | VAPID operativo desde FEAT-014 |

---

## 3. Requisitos funcionales

### RF-1601 — Modelo de datos cards + Flyway V18 (US-1601)

**ID:** RF-1601 | **SP:** 2 | **Prioridad:** Must Have | **Semana:** S1 día 1

El sistema debe crear la tabla `cards` mediante migración Flyway V18 con los siguientes campos:
- `id` UUID PK
- `account_id` FK a `accounts`
- `user_id` FK a `users`
- `pan_masked` VARCHAR(19) — formato `XXXX XXXX XXXX 1234`
- `card_type` ENUM(DEBIT, CREDIT)
- `status` ENUM(ACTIVE, BLOCKED, EXPIRED, CANCELLED)
- `expiration_date` DATE
- `daily_limit` / `monthly_limit` NUMERIC(15,2)
- `daily_limit_min` / `daily_limit_max` NUMERIC(15,2) — readonly, fijado por banco
- `monthly_limit_min` / `monthly_limit_max` NUMERIC(15,2)
- `created_at` / `updated_at` TIMESTAMP

Restricciones: PAN nunca almacenado en claro. Índices en (user_id), (account_id), (status).

---

### RF-1602 — Consulta de tarjetas y detalle (US-1602)

**ID:** RF-1602 | **SP:** 3 | **Prioridad:** Must Have | **Semana:** S1

**RF-1602.1:** `GET /api/v1/cards` devuelve lista de tarjetas del usuario autenticado con id, pan_masked, card_type, status, expiration_date, account_id, límites actuales.
**RF-1602.2:** `GET /api/v1/cards/{cardId}` devuelve detalle completo incluyendo daily_limit_min/max y monthly_limit_min/max.
**RF-1602.3:** PAN siempre enmascarado. El PAN completo nunca viaja en ninguna respuesta API.
**RF-1602.4:** Responde 403 si el cardId no pertenece al usuario autenticado (IDOR check).
**RF-1602.5:** Tarjetas EXPIRED o CANCELLED se devuelven en lista con indicador visual diferenciado.

---

### RF-1603 — Bloqueo / Desbloqueo con 2FA (US-1603)

**ID:** RF-1603 | **SP:** 3 | **Prioridad:** Must Have | **Semana:** S1–S2

**RF-1603.1:** `POST /api/v1/cards/{cardId}/block` inicia bloqueo. Requiere JWT RS256 válido.
**RF-1603.2:** `POST /api/v1/cards/{cardId}/unblock` inicia desbloqueo.
**RF-1603.3:** Ambas operaciones requieren OTP en body `{ otp_code }`. OTP incorrecto → 400 INVALID_OTP.
**RF-1603.4:** Bloqueo exitoso: status=BLOCKED, audit_log evento CARD_BLOCKED con card_id enmascarado.
**RF-1603.5:** Desbloqueo exitoso: status=ACTIVE, audit_log evento CARD_UNBLOCKED.
**RF-1603.6:** Desbloquear tarjeta EXPIRED o CANCELLED → 409.
**RF-1603.7:** Notificación push al usuario tras bloqueo y desbloqueo exitosos.

---

### RF-1604 — Gestión de límites de tarjeta (US-1604)

**ID:** RF-1604 | **SP:** 3 | **Prioridad:** Must Have | **Semana:** S2

**RF-1604.1:** `PUT /api/v1/cards/{cardId}/limits` recibe `{ daily_limit, monthly_limit, otp_code }`.
**RF-1604.2:** daily_limit en [daily_limit_min, daily_limit_max]. monthly_limit en [monthly_limit_min, monthly_limit_max]. Validación en use-case.
**RF-1604.3:** monthly_limit debe ser >= daily_limit. Violación → 400 MONTHLY_LIMIT_BELOW_DAILY.
**RF-1604.4:** OTP obligatorio (SCA PSD2).
**RF-1604.5:** audit_log evento CARD_LIMITS_UPDATED con valores anteriores y nuevos.
**RF-1604.6:** Notificación push tras cambio de límites.

---

### RF-1605 — Cambio de PIN con 2FA (US-1605)

**ID:** RF-1605 | **SP:** 3 | **Prioridad:** Must Have | **Semana:** S2

**RF-1605.1:** `POST /api/v1/cards/{cardId}/pin` recibe `{ new_pin, otp_code }`.
**RF-1605.2:** PIN: 4 dígitos numéricos. No puede ser secuencia trivial (1234, 0000, 1111, etc.).
**RF-1605.3:** PIN nunca almacenado en BankPortal — delegado al core bancario mock.
**RF-1605.4:** OTP obligatorio (SCA PSD2). Mismo comportamiento que RF-1603.3 en fallo.
**RF-1605.5:** audit_log evento CARD_PIN_CHANGED. Nuevo PIN nunca en el log.
**RF-1605.6:** Respuesta 200 sin datos sensibles.

---

### RF-1606 — Frontend Angular — Módulo completo de tarjetas (US-1606)

**ID:** RF-1606 | **SP:** 3 | **Prioridad:** Must Have | **Semana:** S2

**RF-1606.1:** Módulo lazy-loaded CardsModule con rutas: /cards, /cards/:id.
**RF-1606.2:** CardListComponent — lista en formato card UI. Badge estado: ACTIVE=verde, BLOCKED=rojo, EXPIRED=gris.
**RF-1606.3:** CardDetailComponent — detalle + acciones (bloquear/desbloquear, límites, PIN) con guards de estado.
**RF-1606.4:** OtpConfirmComponent reutilizado de FEAT-001 para SCA.
**RF-1606.5:** Formulario límites con sliders y validación reactiva (Angular Reactive Forms).
**RF-1606.6:** Formulario cambio PIN: input type=password, sin autocomplete, validación inline.
**RF-1606.7:** SSE: eventos CARD_BLOCKED / CARD_UNBLOCKED actualizan estado en lista sin recarga.
**RF-1606.8:** WCAG 2.1 AA: contraste, focus visible, aria-labels en todos los controles.
**RF-1606.9:** Responsive: cards adaptadas a mobile (375px).

---

### RF-DT-028 — ShedLock scheduler multi-instancia (ADR-028)

**ID:** RF-DT-028 | **SP:** 3 | **Prioridad:** MUST — R-015-01 Nivel 3 | **Semana:** S1 día 1

Implementar ShedLock para garantizar ejecución única del job ScheduledTransferExecutorJob en multi-instancia.
Dependencias: net.javacrumbs.shedlock:shedlock-spring:5.x + shedlock-provider-jdbc-template.
Flyway V18c: tabla `shedlock`.
Anotación requerida: @SchedulerLock(name='scheduledTransferJob', lockAtLeastFor='PT5M', lockAtMostFor='PT10M').

---

### RF-DT-030 — Paginación findDueTransfers (DEBT-030)

**ID:** RF-DT-030 | **SP:** 2 | **Prioridad:** Media | **Semana:** S1

Refactorizar ScheduledTransferRepository.findDueTransfers() para paginar en batches de 500 con Pageable. Evitar carga completa en memoria para volúmenes > 10k registros.

---

### RF-DT-026 — Race condition push subscription limit (DEBT-026)

**ID:** RF-DT-026 | **SP:** 1 | **Prioridad:** Baja | **Semana:** S1

Lock optimista en PushSubscriptionService.registerSubscription() para garantizar máximo 5 slots por usuario bajo concurrencia alta.

---

### RF-DT-V17c — Drop columnas auth_plain / p256dh_plain

**ID:** RF-DT-V17C | **SP:** 1 | **Prioridad:** Media | **Semana:** S2

Flyway V18b: ALTER TABLE push_subscriptions DROP COLUMN auth_plain, p256dh_plain.
Prerequisito: verificar que ninguna query activa referencia estas columnas antes del DROP.

---

## 4. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-001 | Rendimiento | GET /cards < 300ms p95 |
| RNF-002 | Rendimiento | POST /block, /unblock, /pin < 500ms p95 |
| RNF-003 | Seguridad | PAN nunca en logs ni audit_log (PCI-DSS req.3) |
| RNF-004 | Seguridad | Operaciones de mutación requieren OTP válido (PSD2 SCA) |
| RNF-005 | Seguridad | IDOR: validar owner de card en cada endpoint |
| RNF-006 | Disponibilidad | SLA 99.9% |
| RNF-007 | Cobertura | Capa application: >= 80% (objetivo 85%) |
| RNF-008 | Trazabilidad | Toda operación sobre tarjeta en audit_log |
| RNF-009 | Accesibilidad | WCAG 2.1 AA |
| RNF-010 | PCI-DSS | req.3 PAN enmascarado · req.8 MFA PIN · req.10 audit trail |

---

## 5. Contratos API — Resumen OpenAPI 3.1

| Método | Endpoint | Auth | SCA | Descripción |
|---|---|---|---|---|
| GET | /api/v1/cards | JWT | No | Listar tarjetas del usuario |
| GET | /api/v1/cards/{id} | JWT | No | Detalle de tarjeta |
| POST | /api/v1/cards/{id}/block | JWT | OTP | Bloquear tarjeta |
| POST | /api/v1/cards/{id}/unblock | JWT | OTP | Desbloquear tarjeta |
| PUT | /api/v1/cards/{id}/limits | JWT | OTP | Actualizar límites |
| POST | /api/v1/cards/{id}/pin | JWT | OTP | Cambiar PIN |

---

## 6. Criterios de aceptación por US

### US-1601 — Flyway V18
- [ ] V18 ejecuta sin error en STG
- [ ] Tabla cards con todos los campos (RF-1601)
- [ ] Índices creados: (user_id), (account_id), (status)
- [ ] Script undo disponible
- [ ] SeedData: 2+ tarjetas de prueba por usuario test

### US-1602 — Consulta
- [ ] GET /cards lista correcta para usuario autenticado
- [ ] PAN siempre enmascarado
- [ ] GET /cards/{id} ajeno → 403
- [ ] GET /cards/{id} inexistente → 404
- [ ] Test integración: lista + detalle + IDOR check

### US-1603 — Bloqueo/Desbloqueo
- [ ] POST /block OTP correcto → BLOCKED + audit_log CARD_BLOCKED
- [ ] POST /block OTP incorrecto → 400 INVALID_OTP
- [ ] POST /unblock tarjeta ACTIVE → 409
- [ ] POST /unblock tarjeta BLOCKED + OTP correcto → ACTIVE
- [ ] Push enviado en ambas operaciones
- [ ] Test integración: flujo bloqueo→desbloqueo completo

### US-1604 — Límites
- [ ] daily=200 en rango → 200
- [ ] daily=fuera de rango → 400
- [ ] monthly < daily → 400 MONTHLY_LIMIT_BELOW_DAILY
- [ ] audit_log con valores anteriores y nuevos
- [ ] Push enviado

### US-1605 — Cambio PIN
- [ ] PIN trivial (1234) → 400 PIN_TRIVIAL
- [ ] PIN válido + OTP correcto → 200
- [ ] PIN nunca en audit_log ni respuesta
- [ ] Core bancario mock invocado correctamente

### US-1606 — Frontend Angular
- [ ] CardListComponent: badges de estado correctos
- [ ] Bloqueo desde UI: modal OTP + actualización sin recarga
- [ ] Sliders límites: bloqueados fuera de rango
- [ ] PIN: input type=password, sin autocomplete
- [ ] SSE: CARD_BLOCKED actualiza badge en tiempo real
- [ ] WCAG: Axe sin violaciones críticas
- [ ] Responsive: OK en 375px

### ADR-028 — ShedLock
- [ ] Job no ejecuta dos veces en paralelo con 3 instancias
- [ ] Tabla shedlock creada por Flyway V18c
- [ ] Test concurrencia: @SpringBootTest 2 instancias

---

## 7. Trazabilidad de requisitos

| RF | US / Deuda | Jira |
|---|---|---|
| RF-1601 | US-1601 | SCRUM-82 |
| RF-1602 | US-1602 | SCRUM-83 |
| RF-1603 | US-1603 | SCRUM-84 |
| RF-1604 | US-1604 | SCRUM-85 |
| RF-1605 | US-1605 | SCRUM-86 |
| RF-1606 | US-1606 | SCRUM-87 |
| RF-DT-028 | ADR-028 | SCRUM-78 |
| RF-DT-030 | DEBT-030 | SCRUM-79 |
| RF-DT-026 | DEBT-026 | SCRUM-80 |
| RF-DT-V17C | V17c | SCRUM-81 |

---

*Generado por SOFIA Requirements Analyst Agent — Sprint 18 — 2026-03-25*
*CMMI Level 3 — REQM SP 1.1 · REQM SP 1.3 · PP SP 1.2*
*BankPortal — Banco Meridian*