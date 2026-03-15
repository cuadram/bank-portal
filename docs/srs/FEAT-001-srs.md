# SRS — Autenticación de Doble Factor (2FA)

> **Artefacto:** Software Requirements Specification (SRS)
> **Proceso CMMI:** RD — Requirements Development
> **Generado por:** SOFIA — Requirements Analyst Agent
> **Fecha:** 2026-03-11
> **Versión:** 1.0 | **Estado:** IN_REVIEW

---

## 1. Metadata

| Campo              | Valor                                              |
|--------------------|----------------------------------------------------|
| Feature ID         | FEAT-001                                           |
| Proyecto           | BankPortal                                         |
| Cliente            | Banco Meridian                                     |
| Stack              | Java 21 / Spring Boot 3.x (backend) · Angular 17+ (frontend) |
| Tipo de trabajo    | new-feature                                        |
| Sprint objetivo    | Sprint 01 (2026-03-11 → 2026-03-25)               |
| Prioridad          | CRÍTICA (P1)                                       |
| Solicitado por     | Seguridad TI — Banco Meridian (vía Product Owner)  |
| Rama git           | `feature/FEAT-001-autenticacion-2fa`               |
| Versión            | 1.0                                                |
| Estado             | IN_REVIEW                                          |

---

## 2. Descripción del sistema / contexto

BankPortal es el portal bancario digital de Banco Meridian que permite a los clientes
realizar operaciones financieras en línea. El sistema actualmente implementa autenticación
basada en usuario/contraseña con JWT, pero carece de un segundo factor de verificación,
lo que representa un vector de riesgo ante el robo de credenciales.

Esta feature introduce autenticación de doble factor (2FA) basada en TOTP
(Time-based One-Time Password, RFC 6238), permitiendo a los usuarios vincular una
aplicación autenticadora (Google Authenticator, Authy) para generar códigos de un solo
uso con validez temporal de 30 segundos. El módulo también provee códigos de recuperación
para escenarios de pérdida de dispositivo y un registro de auditoría inmutable de todos
los eventos de autenticación.

Los actores principales del sistema son: **Usuario bancario** (cliente del banco que
accede al portal), **Administrador de seguridad** (consume los registros de auditoría)
y el **Sistema de autenticación JWT existente** (actor técnico con el que se integra).

---

## 3. Alcance

### Incluido en FEAT-001
- Enrolamiento 2FA: generación de secreto TOTP + código QR (RFC 6238)
- Verificación de OTP en flujo de login (pre-auth token → JWT completo)
- Generación de 10 códigos de recuperación de un solo uso (one-time)
- Regeneración de códigos de recuperación bajo demanda
- Desactivación de 2FA con confirmación de contraseña + OTP vigente
- Registro de auditoría inmutable de eventos 2FA (activación, login, fallo, bloqueo, desactivación)
- Bloqueo temporal tras 5 intentos OTP fallidos en 10 minutos

### Excluido explícitamente
- 2FA por SMS (OTP via mensaje de texto) — backlog futuro
- 2FA por biometría (FIDO2/WebAuthn) — backlog futuro
- Gestión de dispositivos de confianza ("recordar este dispositivo") — backlog futuro
- Panel de administración para consulta de auditoría — backlog futuro
- Notificaciones push / email al activar/desactivar 2FA — backlog futuro

---

## 4. Épica

**EPIC-001: Seguridad y Control de Acceso**

Garantizar que el acceso al portal bancario de Banco Meridian cumple con los estándares
de seguridad PCI-DSS 4.0 (req. 8.4) e ISO 27001 A.9.4, incorporando mecanismos de
autenticación multifactor que reduzcan el riesgo de acceso no autorizado por robo de
credenciales y aumenten la confianza del cliente en la plataforma digital.

**KPI de la épica:** tasa de adopción 2FA ≥ 60% en 90 días post-lanzamiento.

---

## 5. Requerimientos Funcionales

### RF-001 — Generación de secreto TOTP y QR de enrolamiento
El sistema debe generar un secreto TOTP único por usuario, derivar un URI `otpauth://`
compatible con RFC 6238, y renderizarlo como código QR presentable en el frontend.
El QR debe incluir `issuer=BankMeridian` y `account=<email_usuario>`.

### RF-002 — Activación de 2FA mediante confirmación OTP
El sistema debe validar el primer OTP ingresado por el usuario durante el enrolamiento.
Si el OTP es correcto (ventana ±30 s, tolerancia ±1 período), debe persistir el secreto
TOTP cifrado (AES-256) en la tabla `users` y marcar `two_factor_enabled = true`.

### RF-003 — Flujo de login con 2FA activo (pre-auth token)
Cuando un usuario con 2FA activo se autentica con usuario/contraseña correctos, el
sistema no debe emitir el JWT de acceso completo. En su lugar debe emitir un token
provisional (`pre-auth token`) con TTL de 5 minutos y redirigir al formulario OTP.

### RF-004 — Verificación OTP y emisión de JWT completo
El sistema debe validar el OTP presentado contra el secreto TOTP almacenado. Si es
válido, emitir el JWT de acceso completo (Bearer token) con los claims estándar del
usuario. Si es inválido, incrementar el contador de intentos fallidos.

### RF-005 — Bloqueo por intentos fallidos
Tras 5 intentos OTP fallidos consecutivos en un período de 10 minutos, el sistema
debe bloquear temporalmente el acceso 2FA de ese usuario durante 15 minutos y
registrar el evento de bloqueo en la tabla de auditoría.

### RF-006 — Generación de códigos de recuperación
Al completar el enrolamiento, el sistema debe generar automáticamente 10 códigos de
recuperación únicos en formato `XXXX-XXXX-XXXX`, almacenarlos como hashes bcrypt en
la tabla `recovery_codes`, mostrarlos una única vez en pantalla y ofrecer descarga
en texto plano + copia al portapapeles.

### RF-007 — Uso de código de recuperación en login
El sistema debe aceptar un código de recuperación como alternativa al OTP en el
flujo de verificación. Al ser usado, el código debe marcarse como `used=true` y no
volver a ser aceptado.

### RF-008 — Regeneración de códigos de recuperación
El usuario con 2FA activo debe poder solicitar nuevos códigos de recuperación,
confirmando con su contraseña actual. El sistema invalida los códigos anteriores
y genera 10 nuevos.

### RF-009 — Desactivación de 2FA
El usuario con 2FA activo debe poder desactivarlo ingresando su contraseña actual y
un OTP vigente. Al desactivar, el sistema debe eliminar el secreto TOTP, invalidar
todos los códigos de recuperación y registrar el evento en auditoría.

### RF-010 — Registro de auditoría inmutable
El sistema debe registrar en la tabla `audit_log` cada evento 2FA con los campos:
`user_id`, `event_type`, `ip_address`, `user_agent`, `timestamp`, `result`
(SUCCESS / FAILURE). Los registros no deben poder modificarse ni eliminarse via API.

---

## 6. User Stories

---

### US-001 — Activar 2FA con TOTP (enrolamiento)

**Como** usuario autenticado en el portal bancario,
**quiero** activar la autenticación de doble factor vinculando mi aplicación autenticadora,
**para** proteger mi cuenta contra accesos no autorizados en caso de robo de contraseña.

**Story Points:** 8 | **Prioridad:** Must Have | **Dependencias:** US-006

#### Criterios de Aceptación

```gherkin
Scenario: Generación de QR de enrolamiento
  Given que soy un usuario autenticado con sesión JWT válida
  And tengo 2FA desactivado en mi cuenta
  When navego a "Mi Perfil > Seguridad" y selecciono "Activar 2FA"
  Then el sistema genera un secreto TOTP único para mi cuenta
  And presenta un código QR compatible con RFC 6238
  And el QR contiene issuer="BankMeridian" y account=mi_email_registrado
  And el QR es legible por Google Authenticator y Authy

Scenario: Activación exitosa con OTP válido
  Given que visualizo el QR de enrolamiento
  And escaneo el QR con mi app autenticadora
  When ingreso el código OTP generado por la app
  And el código es temporalmente válido (ventana ±30s con tolerancia ±1 período)
  Then el sistema activa 2FA en mi cuenta
  And almacena el secreto TOTP cifrado con AES-256 en la base de datos
  And me redirige automáticamente a la pantalla de códigos de recuperación
  And el estado 2FA en mi perfil cambia a "Activo"

Scenario: Rechazo de OTP inválido en enrolamiento
  Given que visualizo el QR de enrolamiento
  When ingreso un código OTP incorrecto o expirado
  Then el sistema rechaza la activación con mensaje "Código inválido. Verifica la hora de tu dispositivo."
  And el 2FA permanece inactivo
  And el secreto TOTP no se persiste en base de datos

Scenario: Intento de activar 2FA ya activo
  Given que ya tengo 2FA activado en mi cuenta
  When intento iniciar el flujo de enrolamiento
  Then el sistema muestra el estado actual "2FA ya está activo"
  And no genera un nuevo secreto TOTP
```

#### Componentes técnicos
- `POST /api/v1/2fa/enroll` — genera secreto + URI QR
- `POST /api/v1/2fa/enroll/confirm` — valida primer OTP y activa
- Cifrado AES-256 del secreto antes de persistir
- Angular: `TwoFactorSetupComponent` (panel de perfil)
- BD: columnas `totp_secret_enc`, `two_factor_enabled`, `two_factor_enrolled_at` en `users`

#### DoD
- [ ] Endpoints implementados con validación JWT
- [ ] Secreto TOTP cifrado AES-256 en BD (nunca en texto plano)
- [ ] Tests unitarios TotpService ≥ 80% cobertura
- [ ] Code review aprobado
- [ ] Componente Angular con tests unitarios (Karma/Jasmine)
- [ ] QA verifica criterios Gherkin
- [ ] Aprobado por PO en demo

---

### US-002 — Verificar OTP en flujo de login

**Como** usuario con 2FA activo,
**quiero** que el portal me solicite mi código OTP después de ingresar mis credenciales,
**para** completar la autenticación de dos factores y acceder de forma segura.

**Story Points:** 8 | **Prioridad:** Must Have | **Dependencias:** US-006, US-001

#### Criterios de Aceptación

```gherkin
Scenario: Login con 2FA activo — emisión de pre-auth token
  Given que tengo 2FA activado en mi cuenta
  When ingreso mi usuario y contraseña correctos en el formulario de login
  Then el sistema NO emite el JWT de acceso completo
  And responde con un pre-auth token provisional (TTL = 5 minutos)
  And el frontend me redirige al formulario de ingreso de OTP

Scenario: Verificación OTP exitosa — emisión de JWT completo
  Given que tengo un pre-auth token válido y no expirado
  When ingreso el código OTP correcto de mi app autenticadora
  Then el sistema valida el código contra el secreto TOTP almacenado
  And emite el JWT de acceso completo con los claims del usuario
  And registra el evento "LOGIN_SUCCESS" en la tabla audit_log
  And el frontend me redirige al dashboard principal

Scenario: Pre-auth token expirado
  Given que tengo un pre-auth token pero han pasado más de 5 minutos
  When intento verificar el OTP
  Then el sistema rechaza la solicitud con HTTP 401
  And devuelve mensaje "Sesión expirada. Por favor inicia sesión nuevamente."
  And el frontend redirige al formulario de login

Scenario: Bloqueo tras 5 intentos OTP fallidos
  Given que tengo un pre-auth token válido
  When ingreso 5 códigos OTP incorrectos consecutivos en menos de 10 minutos
  Then el sistema bloquea mi acceso 2FA durante 15 minutos
  And devuelve HTTP 429 con mensaje "Demasiados intentos. Cuenta bloqueada por 15 minutos."
  And registra el evento "ACCOUNT_BLOCKED" en audit_log con mi IP y user-agent

Scenario: Login usando código de recuperación como alternativa al OTP
  Given que tengo un pre-auth token válido
  And no tengo acceso a mi app autenticadora
  When selecciono "Usar código de recuperación" e ingreso un código válido no utilizado
  Then el sistema autentica la sesión y emite el JWT completo
  And marca ese código de recuperación como used=true en base de datos
  And registra el evento "LOGIN_RECOVERY_CODE" en audit_log
```

#### Componentes técnicos
- `POST /api/v1/auth/login` — modificar para flujo condicional 2FA
- `POST /api/v1/2fa/verify` — valida OTP, emite JWT completo
- Rate limiter: máx 5 intentos / 10 min por usuario en `/api/v1/2fa/verify`
- Angular: `OtpVerificationComponent` en flujo de login

#### DoD
- [ ] Flujo login no emite JWT completo si 2FA activo
- [ ] Rate limiter implementado y testeado
- [ ] Bloqueo temporal registrado en audit_log
- [ ] Pre-auth token con TTL 5 min correctamente invalidado al expirar
- [ ] Tests de integración SpringBootTest ≥ 80%
- [ ] QA verifica criterios Gherkin
- [ ] Aprobado por PO en demo

---

### US-003 — Generar y gestionar códigos de recuperación

**Como** usuario que activa 2FA en el portal,
**quiero** recibir códigos de recuperación de un solo uso al activar el segundo factor,
**para** poder recuperar el acceso a mi cuenta si pierdo o cambio mi dispositivo autenticador.

**Story Points:** 5 | **Prioridad:** Must Have | **Dependencias:** US-001

#### Criterios de Aceptación

```gherkin
Scenario: Generación automática de códigos al completar enrolamiento
  Given que acabo de confirmar exitosamente el enrolamiento 2FA
  When el sistema activa el segundo factor
  Then se generan automáticamente 10 códigos de recuperación únicos
  And cada código tiene formato XXXX-XXXX-XXXX
  And los códigos se almacenan como hashes bcrypt en la tabla recovery_codes
  And se muestran una única vez en pantalla con opción de descarga (.txt) y copia
  And se indica claramente "Guárdalos en un lugar seguro. No volverán a mostrarse."

Scenario: Intento de reutilizar un código de recuperación ya usado
  Given que ya utilicé un código de recuperación para autenticarme
  When intento usar el mismo código nuevamente
  Then el sistema lo rechaza con mensaje "Este código ya fue utilizado."
  And no se autentica la sesión

Scenario: Regenerar códigos de recuperación desde perfil
  Given que soy un usuario con 2FA activo
  When solicito regenerar mis códigos de recuperación desde "Mi Perfil > Seguridad"
  And confirmo mi contraseña actual correctamente
  Then el sistema invalida todos los códigos de recuperación anteriores
  And genera 10 nuevos códigos en formato XXXX-XXXX-XXXX
  And los muestra una única vez con opción de descarga y copia
  And registra el evento "RECOVERY_CODES_REGENERATED" en audit_log

Scenario: Contraseña incorrecta al regenerar códigos
  Given que intento regenerar mis códigos de recuperación
  When confirmo con una contraseña incorrecta
  Then el sistema rechaza la operación con mensaje "Contraseña incorrecta."
  And no invalida ni genera nuevos códigos
```

#### Componentes técnicos
- `POST /api/v1/2fa/recovery-codes/generate` — genera y almacena nuevos códigos
- `GET /api/v1/2fa/recovery-codes/status` — retorna cantidad de códigos disponibles
- BD: tabla `recovery_codes` (id, user_id, code_hash, used, created_at)
- Angular: `RecoveryCodesComponent`

#### DoD
- [ ] Códigos almacenados como hash bcrypt (nunca texto plano en BD)
- [ ] Presentados una única vez en pantalla
- [ ] Opción de descarga .txt funcional
- [ ] Invalidación correcta al regenerar
- [ ] Tests unitarios backend ≥ 80%
- [ ] QA verifica criterios Gherkin
- [ ] Aprobado por PO en demo

---

### US-004 — Desactivar 2FA con confirmación

**Como** usuario con 2FA activo en el portal,
**quiero** poder desactivar el doble factor autenticando con contraseña y OTP vigente,
**para** gestionar mi configuración de seguridad cuando cambie de dispositivo o decida no usarlo.

**Story Points:** 5 | **Prioridad:** Should Have | **Dependencias:** US-001, US-003

#### Criterios de Aceptación

```gherkin
Scenario: Desactivación exitosa con contraseña y OTP correctos
  Given que soy un usuario con 2FA activo
  When solicito desactivar 2FA desde "Mi Perfil > Seguridad"
  And proporciono mi contraseña actual correcta
  And proporciono un código OTP vigente de mi app autenticadora
  Then el sistema desactiva 2FA en mi cuenta
  And elimina el secreto TOTP cifrado de la base de datos
  And invalida todos los códigos de recuperación existentes
  And registra el evento "TWO_FACTOR_DISABLED" en audit_log
  And el estado 2FA en mi perfil cambia a "Inactivo"

Scenario: Rechazo por contraseña incorrecta
  Given que intento desactivar 2FA
  When proporciono una contraseña incorrecta
  Then el sistema rechaza la operación con "Contraseña incorrecta."
  And el 2FA permanece activo
  And no se elimina ningún dato de seguridad

Scenario: Rechazo por OTP inválido
  Given que proporciono contraseña correcta pero OTP incorrecto
  Then el sistema rechaza la operación con "Código OTP inválido."
  And el 2FA permanece activo

Scenario: Intento de desactivar 2FA cuando ya está inactivo
  Given que tengo 2FA desactivado
  When intento acceder a la opción de desactivación
  Then el sistema muestra "2FA no está activo en tu cuenta."
  And no permite continuar el flujo de desactivación
```

#### Componentes técnicos
- `DELETE /api/v1/2fa/disable` — requiere contraseña + OTP en body
- Angular: sección de desactivación en `TwoFactorSetupComponent`
- Limpieza: `totp_secret_enc = null`, `two_factor_enabled = false`, `recovery_codes` invalidados

#### DoD
- [ ] Secreto TOTP eliminado de BD al desactivar (no solo flag)
- [ ] Recovery codes invalidados correctamente
- [ ] Evento registrado en audit_log
- [ ] Tests unitarios ≥ 80%
- [ ] QA verifica criterios Gherkin
- [ ] Aprobado por PO en demo

---

### US-005 — Auditoría de eventos 2FA

**Como** administrador de seguridad de Banco Meridian,
**quiero** que todos los eventos relevantes del módulo 2FA queden registrados de forma
inmutable con IP, timestamp y resultado,
**para** detectar patrones de acceso sospechosos, cumplir auditorías normativas PCI-DSS
y disponer de trazabilidad forense ante incidentes.

**Story Points:** 5 | **Prioridad:** Should Have | **Dependencias:** US-001, US-002

#### Criterios de Aceptación

```gherkin
Scenario: Registro de evento de activación 2FA
  Given que un usuario completa el enrolamiento 2FA
  When el sistema activa el segundo factor
  Then se registra en audit_log: user_id, event_type="TWO_FACTOR_ENROLLED",
       ip_address, user_agent, timestamp (UTC), result="SUCCESS"
  And el registro no puede modificarse ni eliminarse via ningún endpoint API

Scenario: Registro de intento de login OTP fallido
  Given que un usuario ingresa un OTP incorrecto
  When el sistema rechaza la verificación
  Then se registra en audit_log: event_type="OTP_VERIFICATION_FAILED",
       ip_address, user_agent, timestamp (UTC), result="FAILURE"

Scenario: Registro de bloqueo de cuenta
  Given que un usuario acumula 5 intentos OTP fallidos en 10 minutos
  When el sistema ejecuta el bloqueo temporal
  Then se registra en audit_log: event_type="ACCOUNT_BLOCKED",
       ip_address, user_agent, timestamp (UTC), result="BLOCKED"

Scenario: Inmutabilidad de registros de auditoría
  Given que existen registros en audit_log
  When cualquier componente del sistema intenta actualizar o eliminar un registro
  Then la operación es rechazada por la capa de acceso a datos
  And el registro permanece inalterado

Scenario: Cobertura completa de eventos auditables
  Then los siguientes event_types están implementados y testeados:
    | TWO_FACTOR_ENROLLED         |
    | TWO_FACTOR_DISABLED         |
    | OTP_VERIFICATION_SUCCESS    |
    | OTP_VERIFICATION_FAILED     |
    | ACCOUNT_BLOCKED             |
    | LOGIN_RECOVERY_CODE         |
    | RECOVERY_CODES_REGENERATED  |
```

#### Componentes técnicos
- `AuditLogService` — servicio de escritura de eventos
- AOP Aspect `@TwoFactorAudit` — intercepta automáticamente los métodos de servicio relevantes
- BD: tabla `audit_log` (id, user_id, event_type, ip_address, user_agent, timestamp, result)
- Restricción DDL: sin UPDATE ni DELETE en `audit_log` desde la aplicación

#### DoD
- [ ] Los 7 event_types implementados y testeados
- [ ] Inmutabilidad verificada con test de integración
- [ ] AOP aspect intercepta correctamente todos los métodos target
- [ ] Tests unitarios AuditLogService ≥ 80%
- [ ] QA verifica criterios Gherkin
- [ ] Aprobado por PO en demo

---

### US-006 — Setup de infraestructura TOTP (pre-requisito técnico)

**Como** equipo de desarrollo de BankPortal,
**queremos** tener la infraestructura base de TOTP configurada y operativa en el proyecto,
**para** que los desarrolladores puedan implementar las funcionalidades 2FA sin bloqueos técnicos.

**Story Points:** 3 | **Prioridad:** Must Have (prerequisito) | **Dependencias:** Ninguna

#### Criterios de Aceptación

```gherkin
Scenario: Librería TOTP disponible en el proyecto
  Given que el proyecto Spring Boot está configurado
  When se compila el proyecto
  Then la dependencia dev.samstevens.totp:totp-spring-boot-starter está presente
  And TotpService es inyectable vía Spring DI

Scenario: Spring Security configurado para flujo 2FA
  Given que un usuario con 2FA activo intenta autenticarse
  When el pre-auth filter procesa la solicitud
  Then el filtro detecta correctamente el estado 2FA del usuario
  And enruta al flujo de verificación OTP en lugar de emitir JWT directamente

Scenario: Variables de entorno configuradas
  Given que el entorno de desarrollo está activo
  Then application.yml expone las propiedades:
    - totp.issuer (nombre de la app en el autenticador)
    - totp.aes-key (clave AES-256 para cifrado, leída de variable de entorno)
  And la clave AES no está hardcodeada en código fuente ni en el repositorio
```

#### DoD
- [ ] Dependencia TOTP en `pom.xml` y compilación verde
- [ ] Pre-auth filter en Spring Security configurado
- [ ] AES key configurada como variable de entorno (no en código)
- [ ] Tests de smoke del contexto Spring pasan

---

### US-007 — Tests de integración end-to-end 2FA

**Como** equipo de calidad de SOFIA,
**queremos** validar el flujo completo de 2FA con tests automatizados de integración y E2E,
**para** garantizar que frontend y backend funcionan correctamente juntos y detectar
regresiones en futuras iteraciones.

**Story Points:** 6 | **Prioridad:** Must Have | **Dependencias:** US-001, US-002, US-003, US-004

#### Criterios de Aceptación

```gherkin
Scenario: Tests unitarios backend cubren TotpService y controladores
  Given que los tests unitarios se ejecutan con JUnit 5 + Mockito
  Then la cobertura de TotpService, TwoFactorController y AuditLogService es ≥ 80%
  And todos los tests pasan en CI/CD

Scenario: Tests de integración backend con base de datos real
  Given que los tests de integración se ejecutan con SpringBootTest + Testcontainers
  Then los flujos de enrolamiento, verificación OTP, bloqueo y desactivación
       están cubiertos end-to-end contra una BD PostgreSQL real en contenedor
  And todos los tests pasan en CI/CD con tiempo total < 3 minutos

Scenario: Tests E2E Angular cubren flujo completo de 2FA
  Given que los tests E2E se ejecutan con Cypress
  Then están implementados los siguientes flujos:
    - Activar 2FA: navegación → QR → ingreso OTP → pantalla recovery codes
    - Login con 2FA: credenciales → pantalla OTP → dashboard
    - Login con código de recuperación como alternativa a OTP
  And todos los tests pasan con la API de backend real (entorno de pruebas)
```

#### DoD
- [ ] Cobertura backend ≥ 80% medida por JaCoCo
- [ ] Tests Testcontainers no dependen de BD externa
- [ ] Tests Cypress ejecutan en pipeline CI/CD sin intervención manual
- [ ] Todos los tests en verde antes del Sprint Review

---

## 7. Requerimientos No Funcionales (RNF)

> **Nota:** Este es el **SRS baseline** del proyecto BankPortal para la épica de seguridad.
> Features posteriores deben referenciar este documento y documentar solo los **deltas**.

### Baseline BankPortal — Seguridad (EPIC-001)

| ID      | Categoría       | Descripción                                              | Criterio medible                              | Stack aplicable       |
|---------|-----------------|----------------------------------------------------------|-----------------------------------------------|-----------------------|
| RNF-001 | Rendimiento     | Latencia endpoints API REST bajo carga normal            | p95 < 200 ms con 100 usuarios concurrentes    | Spring Boot           |
| RNF-002 | Rendimiento     | Tiempo de carga inicial del portal                       | < 3 s en conexión 3G (6 Mbps)                 | Angular               |
| RNF-003 | Seguridad       | Autenticación de todos los endpoints protegidos          | JWT Bearer token obligatorio, sin excepciones | Spring Boot           |
| RNF-004 | Seguridad       | Cifrado en tránsito                                      | TLS 1.3 en todos los endpoints                | Infra / Spring Boot   |
| RNF-005 | Seguridad       | Almacenamiento de secretos sensibles                     | Sin credenciales ni secretos en código fuente | Todos                 |
| RNF-006 | Disponibilidad  | Uptime del servicio de autenticación                     | 99.5% mensual (SLA Banco Meridian)            | Spring Boot / Infra   |
| RNF-007 | Escalabilidad   | Usuarios concurrentes en el portal                       | ≥ 500 usuarios concurrentes sin degradación   | Spring Boot / Infra   |
| RNF-008 | Accesibilidad   | Estándar de accesibilidad del frontend                   | WCAG 2.1 nivel AA                             | Angular               |

### RNF Delta — FEAT-001 (2FA)

| ID       | Categoría   | Descripción                                                   | Criterio medible                                    | Tipo    |
|----------|-------------|---------------------------------------------------------------|-----------------------------------------------------|---------|
| RNF-D01  | Seguridad   | Cifrado de secretos TOTP en base de datos                     | AES-256 obligatorio; secreto nunca en texto plano   | Nuevo   |
| RNF-D02  | Seguridad   | Almacenamiento de códigos de recuperación                     | Hash bcrypt (coste ≥ 10); nunca texto plano en BD   | Nuevo   |
| RNF-D03  | Seguridad   | Protección brute-force en endpoint de verificación OTP        | Rate limit: máx 5 intentos / 10 min / usuario       | Nuevo   |
| RNF-D04  | Seguridad   | Ventana de validez del OTP                                    | TOTP período 30 s, tolerancia ±1 período (±60 s)    | Nuevo   |
| RNF-D05  | Rendimiento | Latencia específica del endpoint `/api/v1/2fa/verify`         | p95 < 300 ms (incluye validación criptográfica)      | Delta RNF-001 |
| RNF-D06  | Auditoría   | Retención de registros de auditoría 2FA                       | Mínimo 12 meses (PCI-DSS req. 10.7)                 | Nuevo   |
| RNF-D07  | Usabilidad  | Tiempo máximo para completar el flujo de enrolamiento 2FA     | Usuario promedio completa enrolamiento en < 3 min   | Nuevo   |

---

## 8. Restricciones

| ID     | Tipo        | Descripción                                                                  |
|--------|-------------|------------------------------------------------------------------------------|
| RR-001 | Normativa   | PCI-DSS 4.0 requisito 8.4 — MFA obligatorio para acceso a datos de tarjetas  |
| RR-002 | Normativa   | ISO 27001 A.9.4 — Control de acceso a sistemas de información                |
| RR-003 | Tecnología  | Stack mandatorio: Java 21 / Spring Boot 3.x + Angular 17+                    |
| RR-004 | Tecnología  | Librería TOTP: `dev.samstevens.totp:totp-spring-boot-starter` (RFC 6238)     |
| RR-005 | Tecnología  | Algoritmo de cifrado: AES-256 para secretos TOTP en reposo                   |
| RR-006 | Tecnología  | Hashing de recovery codes: bcrypt con coste mínimo de 10                     |
| RR-007 | Contrato    | SLA de disponibilidad acordado con Banco Meridian: 99.5% mensual             |
| RR-008 | Auditoría   | Registros audit_log: retención mínima 12 meses, inmutables (PCI-DSS 10.7)   |

---

## 9. Supuestos y dependencias

### Supuestos documentados

| ID   | Supuesto                                                                                          |
|------|---------------------------------------------------------------------------------------------------|
| S-01 | El módulo de autenticación JWT está operativo y los endpoints existentes no se modificarán        |
| S-02 | La tabla `users` tiene columna `email` como identificador único para el URI `otpauth://`          |
| S-03 | La base de datos es PostgreSQL y soporta las migraciones Flyway planificadas                      |
| S-04 | El entorno de producción expone TLS 1.3 en todos los endpoints (certificado SSL disponible)       |
| S-05 | El usuario final tiene acceso a una app autenticadora TOTP compatible (Google Auth, Authy, etc.)  |
| S-06 | No existe un RNF baseline previo documentado — este SRS actúa como baseline inicial              |

### Dependencias técnicas

| Dependencia                              | Tipo       | Estado          | Fecha límite crítica | Responsable   |
|------------------------------------------|------------|-----------------|----------------------|---------------|
| Módulo autenticación JWT activo          | Técnica    | ✅ Disponible    | —                    | —             |
| Tabla `users` en BD                      | Técnica    | ✅ Disponible    | —                    | —             |
| Certificado SSL/TLS endpoint             | Infra      | ✅ Disponible    | —                    | —             |
| Librería `dev.samstevens.totp`           | Técnica    | ⏳ Por configurar | 2026-03-12 (día 1)  | Backend Dev   |
| Diseño UI pantallas 2FA (mockups)        | UX/UI      | ⏳ Por validar   | 2026-03-12 (día 2)  | PO + FE Dev   |

> ⚠️ **Bloqueante crítico:** la librería TOTP y los mockups deben estar resueltos antes del EOD del día 2 del sprint. Sin ellos, US-001 y US-002 no pueden iniciarse.

### Dependencias entre User Stories

```
US-006 (infra TOTP)     → prerequisito de todas las demás US
US-001 (enrolamiento)   → prerequisito de US-002, US-003, US-004, US-005
US-003 (recovery codes) → prerequisito de US-004 (desactivación invalida códigos)
US-001 + US-002         → prerequisito de US-007 (tests E2E)
```

---

## 10. Matriz de Trazabilidad (RTM)

| ID US  | Proceso de negocio              | RF vinculados             | RNF/RR vinculados              | Componente Arq.              | Caso de prueba    | Estado  |
|--------|---------------------------------|---------------------------|--------------------------------|------------------------------|-------------------|---------|
| US-001 | Enrolamiento 2FA                | RF-001, RF-002            | RNF-D01, RNF-D07, RR-004, RR-005 | backend-2fa, frontend-portal | [→ QA Tester]     | DRAFT   |
| US-002 | Verificación OTP en login       | RF-003, RF-004, RF-005    | RNF-D03, RNF-D04, RNF-D05, RR-001 | backend-2fa, frontend-portal | [→ QA Tester]  | DRAFT   |
| US-003 | Gestión códigos recuperación    | RF-006, RF-007, RF-008    | RNF-D02, RR-006               | backend-2fa, frontend-portal | [→ QA Tester]     | DRAFT   |
| US-004 | Desactivación 2FA               | RF-009                    | RNF-D01, RNF-D02              | backend-2fa, frontend-portal | [→ QA Tester]     | DRAFT   |
| US-005 | Auditoría normativa 2FA         | RF-010                    | RNF-D06, RR-001, RR-008       | backend-2fa                  | [→ QA Tester]     | DRAFT   |
| US-006 | Infraestructura TOTP            | RF-001, RF-002            | RNF-D01, RR-004               | backend-2fa                  | [→ QA Tester]     | DRAFT   |
| US-007 | Cobertura de calidad automatizada | (todos los RF)          | RNF-001, RNF-D05              | backend-2fa, frontend-portal | [→ QA Tester]     | DRAFT   |

> 📌 Las columnas **Componente Arq.** serán completadas por el **Architect Agent** (HLD/LLD).
> Las columnas **Caso de prueba** serán completadas por el **QA Tester Agent** (Test Plan).

---

## 11. DoD aplicable — FEAT-001

### DoD base SOFIA (aplica a todas las US de esta feature)

- [ ] Código implementado y revisado por Code Reviewer (mínimo 1 aprobación)
- [ ] Tests unitarios escritos con cobertura ≥ 80% (JaCoCo backend / Karma frontend)
- [ ] Tests de integración pasando (SpringBootTest + Testcontainers)
- [ ] Sin issues críticos ni altos en SonarQube
- [ ] Documentación OpenAPI/Swagger actualizada para cada endpoint nuevo
- [ ] Pipeline CI/CD verde (Jenkins)
- [ ] Criterios de aceptación Gherkin verificados por QA Lead
- [ ] Aprobado por Product Owner en Sprint Review

### Customización Banco Meridian (adicional al base SOFIA)

- [ ] Secretos TOTP y recovery codes almacenados con cifrado/hash conforme RR-005 y RR-006
- [ ] Registro de auditoría inmutable verificado para todos los event_types (PCI-DSS req. 10.7)
- [ ] Rate limiting en endpoint de verificación OTP operativo en todos los entornos (RNF-D03)
- [ ] Sin credenciales ni claves AES en código fuente ni historial git (RR-005)

---

## 12. Trazabilidad CMMI Nivel 3

| Área de proceso CMMI            | Evidencia en este artefacto                                           |
|---------------------------------|-----------------------------------------------------------------------|
| RD — Requirements Development   | RF clasificados, US INVEST con Gherkin, alcance explícito incluido/excluido |
| REQM — Requirements Management  | RTM con estado DRAFT, dependencias documentadas, supuestos registrados |
| PP — Project Planning           | Estimaciones SP, dependencias técnicas con fechas límite              |
| RSKM — Risk Management          | RNF-D con criterios medibles, restricciones normativas PCI-DSS        |
| VER — Verification              | DoD con criterios de code review, cobertura y SonarQube               |
| VAL — Validation                | Criterios de aceptación Gherkin verificables por PO y QA              |
| CM — Configuration Management   | Artefacto versionado (v1.0), rama git definida, conv. commits         |

---

*Generado por SOFIA Requirements Analyst Agent · BankPortal · Sprint 01 · 2026-03-11*
