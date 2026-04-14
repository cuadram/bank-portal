# SRS — FEAT-022: Bizum P2P
**Sprint 24 · BankPortal · Banco Meridian · SOFIA v2.7**

---

## 1. Metadata

| Campo | Valor |
|---|---|
| ID Feature | FEAT-022 |
| Proyecto | BankPortal |
| Cliente | Banco Meridian |
| Stack | Java (backend) + Angular (frontend) |
| Tipo de trabajo | new-feature |
| Sprint objetivo | 24 |
| Período | 2026-04-21 → 2026-05-04 |
| Prioridad | Alta |
| Solicitado por | Product Owner |
| Versión | 1.0 |
| Estado | APPROVED |

---

## 2. Descripción del sistema / contexto

BankPortal es el portal de banca digital de Banco Meridian que permite a sus clientes gestionar sus productos financieros. Tras implementar transferencias (FEAT-008), transferencias programadas (FEAT-015) y pagos de recibos (FEAT-009), el portal carece de pagos P2P inmediatos, una funcionalidad que los clientes demandan con alta frecuencia en la banca retail española.

FEAT-022 integra Bizum, el sistema de pagos inmediatos entre particulares más extendido en España, permitiendo enviar y recibir dinero mediante número de teléfono en menos de 10 segundos. La autenticación SCA vía OTP (ya implementada en FEAT-001/FEAT-020/FEAT-021) garantiza el cumplimiento PSD2 sin añadir complejidad de usuario. El módulo reutiliza la infraestructura existente de notificaciones push (FEAT-014), autenticación 2FA (FEAT-001) y SEPA (FEAT-017).

---

## 3. Alcance

**Incluido:**
- Activación Bizum y vinculación número de teléfono a cuenta
- Envío de pagos P2P con SCA OTP
- Solicitud de dinero a contactos Bizum
- Aceptación y rechazo de solicitudes recibidas
- Historial paginado de operaciones Bizum
- Notificaciones push para todos los eventos Bizum
- Configuración de Bizum en perfil (activar/desactivar)
- Módulo Angular con 5 pantallas
- Límites regulatorios: €500/operación, €2.000/día

**Excluido:**
- Bizum con comercios (Bizum Pago en comercio)
- Pagos Bizum internacionales (fuera del ámbito SCT Inst España)
- Split de gastos (Bizum grupal)
- Integración con agenda de contactos del dispositivo

---

## 4. Épica

**EPIC-022:** Pagos P2P Bizum

Banco Meridian necesita incorporar Bizum para retener clientes que migran a entidades competidoras que ya ofrecen esta funcionalidad. El 78% de los usuarios de banca móvil en España utilizan Bizum mensualmente. La integración eleva el portal de banca digital a paridad competitiva en medios de pago.

---

## 5. User Stories

---

### US-F022-01: Activación Bizum y vinculación de número de teléfono

**Como** cliente de Banco Meridian con cuenta activa
**Quiero** activar Bizum vinculando mi número de móvil a mi cuenta
**Para** poder enviar y recibir pagos P2P de forma inmediata

**Story Points:** 2 | **Prioridad:** Alta | **Dependencias:** Ninguna

#### Criterios de Aceptación

```gherkin
Scenario: Activación exitosa de Bizum
  Given el usuario está autenticado en BankPortal
  And no tiene Bizum activado en ninguna cuenta
  When accede a Bizum > Activar y confirma su número de móvil
  Then el sistema vincula el número en formato E.164 a su cuenta principal
  And el estado Bizum pasa a ACTIVE
  And se registra el consentimiento GDPR con timestamp
  And el usuario ve confirmación "Bizum activado correctamente"

Scenario: Número de móvil ya vinculado a otra cuenta
  Given el usuario introduce un número de móvil
  When ese número ya está vinculado a otra cuenta activa del banco
  Then el sistema retorna error 409 PHONE_ALREADY_REGISTERED
  And muestra mensaje "Este número ya está asociado a otra cuenta Bizum"
  And no se completa la activación

Scenario: Formato de número inválido
  Given el usuario introduce un número de teléfono
  When el formato no cumple E.164 (no empieza por +34 o longitud incorrecta)
  Then el sistema retorna error 400 INVALID_PHONE_FORMAT
  And el campo se marca en rojo con indicación del formato correcto
```

---

### US-F022-02: Enviar pago Bizum con SCA OTP

**Como** cliente con Bizum activo
**Quiero** enviar dinero a un contacto mediante su número de teléfono
**Para** realizar pagos inmediatos sin necesidad de un IBAN

**Story Points:** 5 | **Prioridad:** Alta | **Dependencias:** US-F022-01

#### Criterios de Aceptación

```gherkin
Scenario: Envío de pago Bizum exitoso
  Given el usuario tiene Bizum activo y saldo suficiente
  And el importe es <= €500 y no supera el límite diario restante
  When introduce el teléfono del destinatario, importe y concepto y confirma con OTP válido
  Then el sistema ejecuta la transferencia vía SEPA Instant (ADR-038)
  And el pago queda en estado COMPLETED con referencia BIZUM-{uuid}
  And el saldo de la cuenta origen se actualiza
  And el destinatario recibe notificación push
  And el usuario ve comprobante con: importe, teléfono enmascarado, referencia, timestamp

Scenario: Límite por operación superado
  Given el usuario quiere enviar un importe > €500
  When intenta confirmar el pago
  Then el sistema retorna error 422 LIMIT_PER_OPERATION_EXCEEDED
  And muestra "El importe máximo por operación Bizum es €500"
  And no se ejecuta ningún cargo

Scenario: Límite diario agotado
  Given el usuario ha enviado €2.000 en el día en curso
  When intenta realizar un nuevo pago Bizum
  Then el sistema retorna error 422 DAILY_LIMIT_EXCEEDED
  And muestra "Has alcanzado el límite diario de €2.000. Disponible mañana"

Scenario: OTP inválido
  Given el usuario introduce el OTP
  When el OTP no es válido o ha expirado
  Then el sistema retorna error 401 OTP_INVALID (LA-TEST-003)
  And no se ejecuta el pago
  And permite reintentar hasta 3 veces

Scenario: Destinatario no registrado en Bizum
  Given el usuario introduce un número de teléfono
  When ese número no está vinculado a ninguna cuenta Bizum de la entidad
  Then el sistema retorna error 404 PHONE_NOT_REGISTERED
  And muestra "El número indicado no tiene Bizum activo"
```

---

### US-F022-03: Solicitar dinero a un contacto Bizum

**Como** cliente con Bizum activo
**Quiero** enviar una solicitud de cobro a otro usuario Bizum
**Para** pedirle que me transfiera un importe concreto

**Story Points:** 3 | **Prioridad:** Media | **Dependencias:** US-F022-01

#### Criterios de Aceptación

```gherkin
Scenario: Solicitud de cobro creada correctamente
  Given el usuario tiene Bizum activo
  When introduce teléfono del destinatario, importe y concepto y confirma
  Then el sistema crea la solicitud en estado PENDING
  And el destinatario recibe notificación push con el importe y concepto
  And el solicitante ve la solicitud en estado "Pendiente" en su historial

Scenario: Solicitud expirada sin respuesta
  Given existe una solicitud PENDING enviada hace más de 24 horas
  When el sistema evalúa el TTL
  Then la solicitud pasa a estado EXPIRED automáticamente
  And el solicitante recibe notificación push "Tu solicitud de €X ha expirado"

Scenario: Importe de solicitud fuera de límites
  Given el usuario quiere solicitar un importe > €500
  When intenta crear la solicitud
  Then el sistema retorna error 422 LIMIT_PER_OPERATION_EXCEEDED
  And no se crea la solicitud
```

---

### US-F022-04: Aceptar o rechazar solicitud de dinero Bizum

**Como** cliente que ha recibido una solicitud de cobro Bizum
**Quiero** aceptarla o rechazarla desde el portal
**Para** gestionar mis pagos P2P con control total

**Story Points:** 2 | **Prioridad:** Media | **Dependencias:** US-F022-03

#### Criterios de Aceptación

```gherkin
Scenario: Aceptar solicitud con SCA OTP
  Given el usuario tiene una solicitud Bizum en estado PENDING
  And el importe no supera sus límites diarios restantes
  When selecciona Aceptar y confirma con OTP válido
  Then el sistema ejecuta el pago vía SEPA Instant
  And la solicitud pasa a estado ACCEPTED
  And el solicitante recibe notificación push "Tu solicitud de €X ha sido aceptada"

Scenario: Rechazar solicitud
  Given el usuario tiene una solicitud Bizum en estado PENDING
  When selecciona Rechazar y confirma
  Then la solicitud pasa a estado REJECTED
  And no se ejecuta ningún cargo
  And el solicitante recibe notificación push "Tu solicitud de €X ha sido rechazada"

Scenario: Solicitud ya expirada al intentar aceptar
  Given la solicitud lleva más de 24h en estado PENDING
  When el usuario intenta aceptarla
  Then el sistema retorna error 422 REQUEST_EXPIRED
  And muestra "Esta solicitud ha expirado y ya no puede procesarse"
```

---

### US-F022-05: Historial de operaciones Bizum

**Como** cliente con Bizum activo
**Quiero** ver todas mis operaciones Bizum (pagos enviados, recibidos y solicitudes)
**Para** tener trazabilidad completa de mis movimientos P2P

**Story Points:** 3 | **Prioridad:** Media | **Dependencias:** US-F022-01

#### Criterios de Aceptación

```gherkin
Scenario: Consulta de historial con operaciones
  Given el usuario tiene operaciones Bizum registradas
  When accede a Bizum > Historial
  Then ve una lista paginada (20 items/página) ordenada de más reciente a más antigua
  And cada entrada muestra: tipo, importe, teléfono enmascarado, concepto, estado, timestamp
  And puede filtrar por tipo (SENT / RECEIVED / REQUEST_SENT / REQUEST_RECEIVED) y estado

Scenario: Historial vacío
  Given el usuario no tiene operaciones Bizum
  When accede al historial
  Then ve el estado vacío "Aún no tienes operaciones Bizum"
  And se muestra el botón "Enviar tu primer Bizum"

Scenario: Paginación de historial extenso
  Given el usuario tiene más de 20 operaciones
  When llega al final de la lista
  Then el sistema carga las siguientes 20 operaciones automáticamente (infinite scroll)
```

---

### US-F022-06: Notificaciones push Bizum

**Como** cliente con Bizum activo
**Quiero** recibir notificaciones push para todos los eventos Bizum relevantes
**Para** estar informado en tiempo real sin necesidad de abrir la app

**Story Points:** 2 | **Prioridad:** Media | **Dependencias:** US-F022-01, FEAT-014

#### Criterios de Aceptación

```gherkin
Scenario: Notificación push al recibir un pago
  Given el usuario tiene Bizum activo y notificaciones push habilitadas
  When otro usuario le envía un pago Bizum
  Then recibe push VAPID con: "Has recibido €X de +34***XXXX — [concepto]"
  And la notificación tiene actionUrl: /bizum/historial (ruta registrada en router — LA-023-01)

Scenario: Notificación push al recibir solicitud de cobro
  Given un contacto le envía una solicitud de cobro
  When el sistema procesa la solicitud
  Then recibe push VAPID con: "[Nombre/teléfono] te solicita €X — [concepto]"
  And la notificación tiene actionUrl: /bizum/solicitudes

Scenario: Notificación cuando su solicitud es respondida
  Given el usuario tiene una solicitud PENDING enviada
  When el destinatario la acepta o rechaza
  Then recibe push VAPID indicando el resultado
  And la notificación se persiste en user_notifications con tipo BIZUM_REQUEST_ACCEPTED o BIZUM_REQUEST_REJECTED
```

---

### US-F022-07: Interfaz Angular módulo Bizum

**Como** cliente de Banco Meridian
**Quiero** acceder a todas las funcionalidades Bizum desde el portal web
**Para** gestionar mis pagos P2P desde una interfaz coherente con el resto del portal

**Story Points:** 2 | **Prioridad:** Alta | **Dependencias:** US-F022-01..06

#### Criterios de Aceptación

```gherkin
Scenario: Navegación al módulo Bizum desde el shell
  Given el usuario está en el portal con Bizum activo
  When hace clic en "Bizum" en el menú de navegación lateral
  Then se carga el módulo lazy /bizum sin recarga completa de página
  And el sidebar mantiene el item activo con estilo seleccionado

Scenario: Pantalla de inicio Bizum
  Given el usuario accede a /bizum
  Then ve: saldo disponible, acciones rápidas (Enviar / Solicitar), últimas 3 operaciones

Scenario: Diseño coherente con sistema de producción
  Given cualquier pantalla del módulo Bizum
  Then el sidebar es navy #1e3a5f, fondo #F5F7FA, cards blancas, botones primarios navy
  And cada componente está verificado contra el prototipo HITL aprobado (LA-023-02)

Scenario: Módulo no accesible si Bizum no está activado
  Given el usuario no ha activado Bizum
  When navega a /bizum
  Then ve la pantalla de activación (BizumHome en estado no-activo)
  And no se muestran las funcionalidades de pago
```

---

## 6. Requerimientos No Funcionales (Delta)

> Base: SRS Baseline BankPortal (RNF-001..008) — vigente desde FEAT-001

| ID | Categoría | Descripción | Criterio medible |
|---|---|---|---|
| RNF-D022-01 | Rendimiento | Tiempo de ejecución pago Bizum | Liquidación confirmada en < 10s (SEPA Instant) |
| RNF-D022-02 | Seguridad | SCA en toda operación de débito | OTP obligatorio en envío y aceptación de solicitudes (PSD2 Art.97) |
| RNF-D022-03 | Seguridad | Enmascaramiento de teléfonos | Mostrar solo últimos 4 dígitos en todas las vistas (ej: +34 *** 1234) |
| RNF-D022-04 | Disponibilidad | Bizum disponible 24/7 | Sin ventanas de mantenimiento planificadas — SEPA Instant es 24/7/365 |
| RNF-D022-05 | Límites regulatorios | Límites operativos | €500/operación, €2.000/día — configurables vía application.properties |

---

## 7. Restricciones

| ID | Tipo | Descripción |
|---|---|---|
| RR-F022-01 | Normativa | PSD2 Art.97 — SCA obligatorio en todo pago iniciado por el pagador |
| RR-F022-02 | Normativa | SEPA Instant Credit Transfer (SCT Inst) — liquidación ≤ 10 segundos |
| RR-F022-03 | Normativa | Circular BdE 4/2019 — información previa y comprobante de operación obligatorios |
| RR-F022-04 | Normativa | GDPR Art.6 — consentimiento explícito para vinculación número de teléfono |
| RR-F022-05 | Tecnología | Reutilizar infraestructura OTP existente (TwoFactorService) sin duplicar código |
| RR-F022-06 | Tecnología | Módulo hexagonal independiente bajo paquete `com.experis.sofia.bankportal.bizum` |
| RR-F022-07 | Negocio | Límites configurables en application.properties (no hardcodeados — DEBT-044 precedente) |

---

## 8. Supuestos y dependencias

**Supuestos:**
- El CoreBanking mock simula SEPA Instant de forma síncrona en STG (ADR-038)
- El número de teléfono del usuario ya consta en su perfil (FEAT-012) o se solicita en la activación
- Solo se soporta Bizum entre clientes de Banco Meridian en esta fase (sin interoperabilidad externa)

**Dependencias con features existentes:**
| Feature | Uso en FEAT-022 |
|---|---|
| FEAT-001 — 2FA TOTP | TwoFactorService para SCA OTP en pagos |
| FEAT-014 — Push VAPID | NotificationService para eventos Bizum |
| FEAT-007 — Cuentas | Consulta saldo disponible y débito cuenta origen |
| FEAT-012 — Perfil | Recuperación número de teléfono del usuario |

---

## 9. Matriz de Trazabilidad (RTM)

| ID US | Proceso negocio | RF/RNF vinculados | Componente Arq. | Caso de Prueba | Estado |
|---|---|---|---|---|---|
| US-F022-01 | Alta Bizum | RR-F022-04, RNF-D022-03 | BizumController, PhoneRegistrationService | TC-F022-001..003 | APPROVED |
| US-F022-02 | Envío pago P2P | RR-F022-01, RNF-D022-01, RNF-D022-02, RNF-D022-05 | SendPaymentUseCase, BizumLimitService, SepaInstantPort | TC-F022-004..009 | APPROVED |
| US-F022-03 | Solicitud cobro | RR-F022-01, RNF-D022-05 | RequestMoneyUseCase | TC-F022-010..012 | APPROVED |
| US-F022-04 | Aceptar/rechazar solicitud | RR-F022-01, RNF-D022-02 | AcceptRequestUseCase, RejectRequestUseCase | TC-F022-013..015 | APPROVED |
| US-F022-05 | Historial operaciones | RNF-D022-03 | ListTransactionsUseCase | TC-F022-016..018 | APPROVED |
| US-F022-06 | Notificaciones push | FEAT-014 | NotificationService (Bizum events) | TC-F022-019..021 | APPROVED |
| US-F022-07 | Módulo Angular | RNF-002, RNF-008 | BizumModule (5 componentes) | TC-F022-022..025 | APPROVED |

---

## 10. DoD aplicable

**Base SOFIA (new-feature):**
- [ ] Código implementado y revisado por Code Reviewer
- [ ] Tests unitarios ≥ 80% cobertura (IrpfRetentionCalculator precedente: 89%)
- [ ] SpringContextIT pasando (LA-020-11)
- [ ] Verificación fidelidad prototipo HITL (LA-023-02) — componente a componente
- [ ] Guardrail G-4b 10/10 OK
- [ ] Aprobado por QA Lead + Product Owner
- [ ] Pipeline CI/CD verde — rama feature/FEAT-022-sprint24

**Reglas negocio críticas verificadas en QA:**
- [ ] Límite €500/op bloqueante (no bypass)
- [ ] Límite €2.000/día reset a medianoche UTC
- [ ] OTP inválido → 401, nunca procesa pago
- [ ] actionUrl notificaciones → rutas registradas en app-routing (LA-023-01)

---

*SRS generado por Requirements Analyst Agent — SOFIA v2.7 — Step 2 — Sprint 24*
