# SRS — Autenticación de Doble Factor (2FA) con TOTP

## 1. Metadata

| Campo | Valor |
|---|---|
| **ID Feature** | FEAT-001 |
| **Proyecto** | BankPortal — Portal Bancario Digital |
| **Cliente** | Banco Meridian |
| **Stack** | Java/Spring Boot (backend) + Angular (frontend) |
| **Tipo de trabajo** | new-feature |
| **Sprint objetivo** | Sprint 1 (US-006, US-001, US-002, US-003) · Sprint 2 (US-004, US-005, US-007) |
| **Prioridad** | CRÍTICA |
| **Solicitado por** | PO — Seguridad TI, Banco Meridian |
| **Versión** | 1.0 |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Product Owner |
| **Fecha** | 2026-03-14 |

---

## 2. Descripción del sistema / contexto

BankPortal es el portal bancario digital de Banco Meridian, orientado a clientes
particulares y empresariales. El sistema gestiona operaciones bancarias críticas
y está expuesto a internet, lo que lo convierte en objetivo potencial de ataques
de robo de credenciales.

La autenticación de Doble Factor (2FA) basada en TOTP (Time-based One-Time Password,
RFC 6238) añade una segunda capa de seguridad al proceso de login. Tras introducir
usuario y contraseña, el sistema solicita un código OTP generado por una aplicación
autenticadora vinculada previamente (Google Authenticator, Authy, etc.).

El módulo 2FA de FEAT-001 cubre el ciclo completo: enrolamiento del dispositivo,
verificación en el login, gestión de códigos de recuperación ante pérdida de
dispositivo, y desactivación controlada de 2FA. Todos los eventos quedan registrados
en un log de auditoría inmutable que satisface los requerimientos de PCI-DSS 4.0
y la regulación bancaria vigente.

---

## 3. Alcance

### Incluido en FEAT-001
- Enrolamiento 2FA: generación de secreto TOTP, QR URI y activación con primer OTP
- Verificación OTP en el flujo de login con tolerancia temporal ±1 período (±30 s)
- Generación de 10 códigos de recuperación one-time al activar 2FA
- Desactivación de 2FA con re-autenticación de contraseña actual
- Log de auditoría de todos los eventos 2FA (activar, verificar, recuperar, desactivar)
- Almacenamiento cifrado (AES-256) de secretos TOTP
- Rate limiting en endpoint de verificación (5 intentos → bloqueo 15 min)
- UI Angular: pantalla de configuración en perfil + paso 2FA en login

### Excluido explícitamente
- 2FA por SMS (OTP vía mensaje de texto) — backlog futuro
- 2FA por biometría — backlog futuro
- Gestión de dispositivos de confianza ("recordar este dispositivo") — backlog futuro
- Notificaciones push de seguridad — backlog futuro

---

## 4. Épica

**EPIC-001:** Seguridad y Control de Acceso

Establecer las capacidades de seguridad de acceso requeridas por PCI-DSS 4.0
(req. 8.4) e ISO 27001 A.9.4 para el portal bancario de Banco Meridian.
La implementación de 2FA TOTP es el componente núcleo de esta épica y habilita
los requisitos de autenticación multifactor exigidos por las regulaciones vigentes.

---

## 5. User Stories

---

### US-006: Setup de infraestructura TOTP

**Como** desarrollador del equipo técnico de BankPortal
**Quiero** tener la librería TOTP integrada y configurada en el proyecto Spring Boot
**Para** que el resto de User Stories de FEAT-001 dispongan de una base técnica
funcional y validada antes de comenzar el desarrollo

> ⚠️ Esta US es de tipo infraestructura técnica, necesaria para habilitar US-001 a US-005.
> Excepcionalmente se documenta como US técnica por ser prerequisito bloqueante del pipeline.

**Story Points:** 3
**Prioridad:** Alta
**Dependencias:** Ninguna
**Sprint:** 1

#### Criterios de Aceptación

```gherkin
Scenario: La librería TOTP está disponible y el servicio genera secretos válidos
  Given el proyecto Spring Boot tiene la dependencia TOTP añadida en pom.xml
  When el desarrollador invoca TotpService.generateSecret()
  Then se genera una cadena Base32 de 32 caracteres válida como secreto TOTP
  And el secreto cumple con la especificación RFC 6238

Scenario: La librería no es compatible con la versión de Spring Boot del proyecto
  Given se añade la dependencia TOTP en pom.xml
  When se ejecuta mvn compile
  Then el build falla con error de incompatibilidad
  And el desarrollador documenta la alternativa (google-auth-java-client) y notifica al Tech Lead

Scenario: El servicio genera una URL QR válida para Google Authenticator
  Given existe un secreto TOTP generado para el usuario con email "usuario@banco.com"
  When se invoca TotpService.generateQRUrl("usuario@banco.com", secreto)
  Then se retorna una URI con formato "otpauth://totp/BankPortal:usuario@banco.com?secret=...&issuer=BankPortal"
  And la URI es escaneable por Google Authenticator y Authy
```

#### DoD
- [ ] Dependencia TOTP añadida y funcional en pom.xml
- [ ] `TotpService` implementado con: `generateSecret()`, `generateQRUrl()`, `verifyCode(secret, code, tolerance)`
- [ ] Tests unitarios de `TotpService` con cobertura ≥ 80%
- [ ] Tolerancia ±1 período implementada en `verifyCode()`
- [ ] Code review aprobado
- [ ] Pipeline CI verde

---

### US-001: Activar 2FA con TOTP (enrolamiento)

**Como** usuario autenticado del portal bancario
**Quiero** poder activar la autenticación de doble factor vinculando mi aplicación autenticadora
**Para** proteger mi cuenta ante posibles robos de contraseña

**Story Points:** 8
**Prioridad:** Alta
**Dependencias:** US-006 (TotpService disponible)
**Sprint:** 1

#### Criterios de Aceptación

```gherkin
Scenario: El usuario inicia el enrolamiento 2FA correctamente
  Given el usuario está autenticado en BankPortal con JWT válido
  And el usuario tiene 2FA desactivado en su perfil
  When el usuario accede a "Configuración > Seguridad" y pulsa "Activar autenticación de doble factor"
  Then el sistema genera un secreto TOTP único para el usuario
  And el sistema devuelve un código QR con la URI otpauth://totp/BankPortal:[email]?secret=[secreto]&issuer=BankPortal
  And el QR es visible en pantalla con instrucciones para escanearlo con Google Authenticator o Authy

Scenario: El usuario confirma el enrolamiento con un OTP válido
  Given el usuario ha escaneado el QR con su aplicación autenticadora
  When el usuario introduce un código OTP de 6 dígitos válido en el campo de confirmación
  Then el sistema valida el código con tolerancia ±1 período (±30 s)
  And el sistema almacena el secreto TOTP cifrado con AES-256 en el campo users.totp_secret
  And el sistema activa el flag 2FA en la cuenta del usuario (users.totp_enabled = true)
  And el sistema redirige al usuario al flujo de generación de códigos de recuperación (US-003)
  And el sistema registra el evento "2FA_ACTIVATED" en la tabla de auditoría

Scenario: El usuario introduce un OTP incorrecto al confirmar el enrolamiento
  Given el usuario ha escaneado el QR con su aplicación autenticadora
  When el usuario introduce un código OTP de 6 dígitos inválido o expirado
  Then el sistema rechaza la activación con mensaje "Código incorrecto. Verifica la hora de tu dispositivo."
  And el secreto no se almacena en la base de datos
  And el flag 2FA permanece en false

Scenario: El usuario intenta activar 2FA sin sesión JWT activa
  Given el usuario no tiene una sesión JWT válida
  When se realiza una petición POST a /api/2fa/enroll
  Then el sistema responde con HTTP 401 Unauthorized
  And el body contiene {"error": "UNAUTHORIZED", "message": "Sesión no activa"}

Scenario: El usuario ya tiene 2FA activo e intenta enrolarse de nuevo
  Given el usuario tiene 2FA activado (totp_enabled = true)
  When el usuario accede al flujo de enrolamiento
  Then el sistema muestra el estado actual "2FA ya está activo en tu cuenta"
  And el sistema ofrece la opción de desactivar (redirige a US-004)
```

#### DoD
- [ ] `POST /api/2fa/enroll` implementado — devuelve QR URI + secret cifrado temporalmente
- [ ] `POST /api/2fa/activate` implementado — valida OTP, persiste secreto AES-256
- [ ] Campo `totp_secret` (VARCHAR cifrado) y `totp_enabled` (BOOLEAN) en tabla `users`
- [ ] UI Angular: pantalla "Seguridad" en perfil con componente QR (qrcode.js o similar)
- [ ] UI Angular: input de confirmación OTP con validación de 6 dígitos numéricos
- [ ] Tests unitarios backend ≥ 80% cobertura del módulo 2FA
- [ ] Tests de integración: flujo completo enrolamiento
- [ ] Code review aprobado — verificación explícita de cifrado AES-256
- [ ] Pipeline CI verde

---

### US-002: Verificar OTP en flujo de login

**Como** usuario con 2FA activado
**Quiero** que el portal solicite mi código OTP después de introducir mi contraseña
**Para** que ningún tercero pueda acceder a mi cuenta aunque conozca mis credenciales

**Story Points:** 8
**Prioridad:** Alta
**Dependencias:** US-001 (usuario con 2FA activado y secreto almacenado)
**Sprint:** 1

#### Criterios de Aceptación

```gherkin
Scenario: El usuario con 2FA activo completa el login correctamente
  Given el usuario tiene 2FA activado en su cuenta
  And el usuario ha introducido usuario y contraseña correctos en el paso 1
  When el sistema detecta que totp_enabled = true
  Then el sistema redirige al usuario a la pantalla de verificación OTP
  And no se emite JWT hasta completar el paso 2FA

Scenario: El usuario introduce un OTP válido y accede al portal
  Given el usuario está en la pantalla de verificación OTP del login
  When el usuario introduce un código OTP de 6 dígitos válido generado por su app autenticadora
  Then el sistema valida el código con tolerancia ±1 período (RFC 6238)
  And el sistema emite un JWT válido con claim "2fa_verified: true"
  And el usuario accede al portal bancario
  And el sistema registra el evento "2FA_LOGIN_SUCCESS" en auditoría con IP y timestamp

Scenario: El usuario introduce un OTP incorrecto
  Given el usuario está en la pantalla de verificación OTP del login
  When el usuario introduce un código OTP inválido o expirado
  Then el sistema rechaza el acceso con mensaje "Código incorrecto. Inténtalo de nuevo."
  And no se emite JWT
  And el sistema incrementa el contador de intentos fallidos para este usuario

Scenario: El usuario supera el límite de intentos fallidos (brute-force)
  Given el usuario ha fallado 5 veces consecutivas en la verificación OTP
  When el usuario intenta verificar el OTP por sexta vez
  Then el sistema bloquea el endpoint /api/2fa/verify para ese usuario durante 15 minutos
  And el sistema responde con HTTP 429 Too Many Requests
  And el body contiene {"error": "TOO_MANY_ATTEMPTS", "retry_after": 900}
  And el sistema registra el evento "2FA_BLOCKED" en auditoría con IP y timestamp

Scenario: El usuario usa un código de recuperación en lugar de OTP
  Given el usuario está en la pantalla de verificación OTP del login
  When el usuario pulsa "Usar código de recuperación" e introduce un código válido
  Then el sistema valida el código contra los hashes almacenados
  And el código de recuperación queda marcado como usado (one-time)
  And el usuario accede al portal bancario
  And el sistema registra el evento "2FA_RECOVERY_LOGIN" en auditoría

Scenario: El usuario sin 2FA activo no ve la pantalla de verificación OTP
  Given el usuario tiene totp_enabled = false
  When el usuario introduce usuario y contraseña correctos
  Then el sistema emite JWT directamente sin paso 2FA
  And el usuario accede al portal bancario
```

#### DoD
- [ ] `POST /api/2fa/verify` implementado con tolerancia ±1 período
- [ ] Rate limiting implementado: 5 intentos → bloqueo 15 min (Redis o in-memory)
- [ ] JWT con claim `2fa_verified: true` solo cuando 2FA se completa
- [ ] UI Angular: pantalla de verificación OTP en flujo de login (paso 2)
- [ ] UI Angular: enlace "Usar código de recuperación" funcional
- [ ] Tests unitarios backend ≥ 80% cobertura
- [ ] Test de seguridad: verificar que brute-force activa el bloqueo
- [ ] Code review aprobado
- [ ] Pipeline CI verde

---

### US-003: Generar y gestionar códigos de recuperación

**Como** usuario que activa 2FA
**Quiero** recibir códigos de recuperación de un solo uso
**Para** poder acceder a mi cuenta si pierdo o no tengo disponible mi dispositivo autenticador

**Story Points:** 5
**Prioridad:** Alta
**Dependencias:** US-001 (2FA activado, flujo de enrolamiento completado)
**Sprint:** 1

#### Criterios de Aceptación

```gherkin
Scenario: El sistema genera 10 códigos de recuperación al activar 2FA
  Given el usuario ha completado el enrolamiento 2FA (US-001 completada)
  When el sistema activa el 2FA del usuario
  Then el sistema genera automáticamente 10 códigos de recuperación alfanuméricos de 8 caracteres
  And los códigos se almacenan como hashes (bcrypt) en la tabla recovery_codes
  And el sistema muestra los 10 códigos en texto plano una única vez al usuario
  And el modal de descarga es bloqueante — el usuario debe confirmar que los ha guardado

Scenario: El usuario descarga los códigos de recuperación
  Given el modal de códigos de recuperación está visible
  When el usuario pulsa "Descargar códigos"
  Then el sistema ofrece un archivo .txt con los 10 códigos
  And el nombre del archivo es "bankportal-recovery-codes-[fecha].txt"
  And el modal muestra el estado "Descargados ✓"

Scenario: El usuario confirma haber guardado los códigos (obligatorio para continuar)
  Given el modal de códigos de recuperación está visible
  When el usuario marca el checkbox "He guardado mis códigos de recuperación en un lugar seguro"
  And pulsa "Continuar"
  Then el sistema cierra el modal y completa el flujo de activación 2FA
  And los códigos en texto plano ya no son accesibles desde la aplicación

Scenario: El usuario intenta continuar sin confirmar que guardó los códigos
  Given el modal de códigos de recuperación está visible
  And el checkbox NO está marcado
  When el usuario pulsa "Continuar"
  Then el botón permanece deshabilitado
  And el sistema muestra el mensaje "Debes confirmar que has guardado tus códigos antes de continuar"

Scenario: El usuario regenera sus códigos de recuperación desde el perfil
  Given el usuario tiene 2FA activo y al menos 1 código de recuperación restante
  When el usuario accede a "Configuración > Seguridad" y pulsa "Regenerar códigos de recuperación"
  And confirma la acción con su contraseña actual
  Then el sistema invalida todos los códigos de recuperación anteriores
  And genera 10 nuevos códigos de recuperación
  And muestra el modal bloqueante de descarga nuevamente

Scenario: El usuario intenta usar un código de recuperación ya utilizado
  Given el usuario tiene un código de recuperación marcado como usado
  When introduce ese código en el flujo de login de recuperación
  Then el sistema lo rechaza con mensaje "Este código ya fue utilizado"
  And no se emite JWT
```

#### DoD
- [ ] `POST /api/2fa/recovery-codes/generate` — genera 10 códigos, almacena hashes bcrypt
- [ ] `POST /api/2fa/verify-recovery` — valida y marca código como usado (one-time)
- [ ] `POST /api/2fa/recovery-codes/regenerate` — invalida anteriores, genera nuevos (requiere password)
- [ ] Tabla `recovery_codes(id, user_id, code_hash, used, created_at, used_at)`
- [ ] UI Angular: modal bloqueante de descarga con checkbox obligatorio
- [ ] UI Angular: botón "Regenerar" en sección de seguridad del perfil
- [ ] Tests unitarios ≥ 80%
- [ ] Code review aprobado
- [ ] Pipeline CI verde

---

### US-004: Desactivar 2FA con confirmación

**Como** usuario con 2FA activado
**Quiero** poder desactivar la autenticación de doble factor
**Para** tener control sobre la configuración de seguridad de mi cuenta, con las salvaguardas necesarias

**Story Points:** 5
**Prioridad:** Media
**Dependencias:** US-001 (2FA activado)
**Sprint:** 2

#### Criterios de Aceptación

```gherkin
Scenario: El usuario desactiva 2FA correctamente
  Given el usuario tiene 2FA activo (totp_enabled = true)
  And el usuario está en "Configuración > Seguridad"
  When el usuario pulsa "Desactivar autenticación de doble factor"
  And introduce su contraseña actual en el campo de confirmación
  And pulsa "Confirmar desactivación"
  Then el sistema valida la contraseña
  And el sistema pone totp_enabled = false y borra totp_secret de la BD
  And el sistema invalida todos los códigos de recuperación del usuario
  And el sistema muestra confirmación "2FA desactivado correctamente"
  And el sistema registra el evento "2FA_DEACTIVATED" en auditoría

Scenario: El usuario introduce una contraseña incorrecta al intentar desactivar
  Given el usuario está en el flujo de desactivación 2FA
  When el usuario introduce una contraseña incorrecta
  Then el sistema rechaza la operación con mensaje "Contraseña incorrecta"
  And el 2FA permanece activo
  And el sistema registra el intento fallido en auditoría

Scenario: El usuario cancela la desactivación
  Given el usuario está en el diálogo de confirmación de desactivación
  When el usuario pulsa "Cancelar"
  Then el sistema cierra el diálogo sin realizar ningún cambio
  And el 2FA permanece activo

Scenario: El usuario intenta desactivar 2FA sin sesión JWT válida
  Given el usuario no tiene sesión activa
  When se realiza PUT /api/2fa/deactivate
  Then el sistema responde con HTTP 401 Unauthorized
```

#### DoD
- [ ] `PUT /api/2fa/deactivate` — requiere JWT + contraseña en body; limpia totp_secret + códigos recuperación
- [ ] UI Angular: sección "Seguridad" muestra botón "Desactivar" solo si 2FA está activo
- [ ] UI Angular: diálogo modal con input de contraseña y confirmación explícita
- [ ] Tests unitarios ≥ 80%
- [ ] Code review aprobado
- [ ] Pipeline CI verde

---

### US-005: Auditoría de eventos 2FA

**Como** administrador de seguridad de Banco Meridian
**Quiero** que todos los eventos relacionados con 2FA queden registrados en un log de auditoría
**Para** cumplir con los requerimientos de trazabilidad de PCI-DSS 4.0 y poder investigar incidentes

**Story Points:** 5
**Prioridad:** Media
**Dependencias:** US-001, US-002, US-003, US-004 (todos los eventos a registrar deben existir)
**Sprint:** 2

#### Criterios de Aceptación

```gherkin
Scenario: El evento de activación 2FA queda registrado
  Given el usuario completa el enrolamiento 2FA
  When el sistema activa 2FA en la cuenta
  Then se inserta un registro en audit_log con: user_id, event_type="2FA_ACTIVATED", ip_address, timestamp, result="SUCCESS"

Scenario: El evento de login exitoso con 2FA queda registrado
  Given el usuario completa el login con 2FA
  Then se inserta en audit_log: user_id, event="2FA_LOGIN_SUCCESS", ip_address, timestamp, result="SUCCESS"

Scenario: El evento de intento fallido queda registrado
  Given el usuario introduce un OTP incorrecto
  Then se inserta en audit_log: user_id, event="2FA_LOGIN_FAILED", ip_address, timestamp, result="FAILED"
  And el campo attempt_count refleja el número de intentos del usuario en los últimos 15 min

Scenario: El evento de bloqueo por brute-force queda registrado
  Given el usuario ha superado el límite de intentos fallidos
  Then se inserta en audit_log: user_id, event="2FA_BLOCKED", ip_address, timestamp, result="BLOCKED", attempt_count=5

Scenario: El evento de uso de código de recuperación queda registrado
  Given el usuario usa un código de recuperación para acceder
  Then se inserta en audit_log: user_id, event="2FA_RECOVERY_LOGIN", ip_address, timestamp, result="SUCCESS"

Scenario: El evento de desactivación 2FA queda registrado
  Given el usuario desactiva 2FA
  Then se inserta en audit_log: user_id, event="2FA_DEACTIVATED", ip_address, timestamp, result="SUCCESS"

Scenario: El log de auditoría es inmutable — no se puede borrar ni modificar
  Given existen registros en audit_log
  When se intenta ejecutar DELETE o UPDATE sobre la tabla audit_log desde la aplicación
  Then la operación es rechazada por permisos de BD
  And el intento queda registrado en el log de seguridad del SGBD
```

#### DoD
- [ ] Tabla `audit_log(id, user_id, event_type, ip_address, timestamp, result, attempt_count, metadata jsonb)`
- [ ] Trigger o permisos de BD para hacer la tabla inmutable desde la capa de aplicación
- [ ] `AuditService` con método `logEvent(userId, eventType, ip, result, metadata)`
- [ ] Llamadas a `AuditService` integradas en: US-001, US-002, US-003, US-004
- [ ] Tests unitarios de AuditService ≥ 80%
- [ ] Code review aprobado
- [ ] Pipeline CI verde

---

### US-007: Tests de integración end-to-end 2FA

**Como** QA Lead del proyecto BankPortal
**Quiero** una suite completa de tests E2E que cubra todos los flujos de FEAT-001
**Para** garantizar la calidad del módulo 2FA antes del release a producción

**Story Points:** 6
**Prioridad:** Alta
**Dependencias:** US-001, US-002, US-003, US-004, US-005 (todos los flujos deben estar implementados)
**Sprint:** 2

#### Criterios de Aceptación

```gherkin
Scenario: Los tests E2E del flujo de enrolamiento pasan en pipeline CI
  Given el entorno de testing E2E está configurado con Playwright
  When se ejecuta la suite e2e:2fa:enrollment
  Then todos los tests de enrolamiento pasan (activar 2FA, QR visible, confirmar OTP, modal de recovery codes)
  And el reporte muestra 0 fallos

Scenario: Los tests E2E del flujo de login con 2FA pasan en pipeline CI
  Given un usuario de prueba con 2FA activo en el entorno de testing
  When se ejecuta la suite e2e:2fa:login
  Then todos los tests de login pasan (OTP válido, OTP inválido, brute-force, código recuperación)
  And el reporte muestra 0 fallos

Scenario: Los tests de seguridad del módulo 2FA pasan
  Given el entorno de testing con acceso a endpoints backend
  When se ejecuta la suite security:2fa
  Then los tests de rate limiting, bloqueo brute-force, y JWT validation pasan
  And los secretos TOTP en BD están cifrados (verificado en test de integración)

Scenario: La cobertura de tests unitarios supera el 80%
  Given la suite de tests unitarios del módulo 2FA
  When se ejecuta mvn test con JaCoCo
  Then el reporte de cobertura muestra ≥ 80% en líneas y ramas del módulo 2fa
```

#### DoD
- [ ] Suite Playwright E2E configurada para Angular frontend (flujos: enrolamiento, login, recuperación, desactivación)
- [ ] Suite de tests de integración Spring Boot (MockMvc o Testcontainers) para todos los endpoints
- [ ] Suite de tests de seguridad: rate limiting, brute-force, JWT claims
- [ ] Cobertura JaCoCo ≥ 80% en módulo 2FA
- [ ] Tests ejecutables en pipeline Jenkins (stage: test)
- [ ] Reporte de resultados publicado en Confluence
- [ ] Code review de la suite de tests aprobado
- [ ] Pipeline CI verde

---

## 6. Requerimientos No Funcionales

> **Nota:** Este es el **baseline inicial de BankPortal**. FEAT-001 añade deltas
> de seguridad específicos que se documentan a continuación.

### 6.1 Baseline del proyecto BankPortal

| ID | Categoría | Descripción | Criterio medible | Stack |
|---|---|---|---|---|
| RNF-001 | Rendimiento | Latencia API REST en condiciones normales | p95 < 200 ms | Java/Spring Boot |
| RNF-002 | Rendimiento | Tiempo de carga inicial del portal | < 3 s en conexión 3G | Angular |
| RNF-003 | Rendimiento | Tamaño del bundle frontend | < 500 KB gzipped | Angular |
| RNF-004 | Seguridad | Autenticación de endpoints | JWT Bearer + validación expiry | Todos |
| RNF-005 | Seguridad | Cifrado en tránsito | TLS 1.3 obligatorio | Todos |
| RNF-006 | Disponibilidad | Uptime servicios críticos | ≥ 99.5% mensual | Backend |
| RNF-007 | Escalabilidad | Usuarios concurrentes soportados | ≥ 500 sesiones concurrentes | Backend |
| RNF-008 | Accesibilidad | Estándar WCAG para el portal | WCAG 2.1 AA | Angular |

### 6.2 RNF Delta — FEAT-001 (2FA)

| ID | Categoría | Descripción | Criterio medible | Modifica baseline |
|---|---|---|---|---|
| RNF-D01 | Seguridad | Almacenamiento de secretos TOTP | Cifrado AES-256; clave en Vault/env variable | Nuevo |
| RNF-D02 | Seguridad | Protección ante brute-force en /verify | Bloqueo tras 5 intentos fallidos durante 15 min | Nuevo |
| RNF-D03 | Seguridad | Inmutabilidad del log de auditoría | Tabla audit_log sin permisos DELETE/UPDATE desde app | Nuevo |
| RNF-D04 | Rendimiento | Latencia endpoint /verify OTP | p95 < 150 ms (crítico para UX de login) | Refina RNF-001 |
| RNF-D05 | Cumplimiento | Trazabilidad de eventos 2FA | 100% de eventos 2FA registrados en audit_log con IP + timestamp | Nuevo |
| RNF-D06 | Seguridad | Tolerancia temporal TOTP | Ventana de validación: código actual ±1 período (±30 s) según RFC 6238 | Nuevo |

---

## 7. Restricciones

| ID | Tipo | Descripción |
|---|---|---|
| RR-001 | Normativa | PCI-DSS 4.0, req. 8.4 — autenticación multifactor obligatoria en accesos a sistemas críticos |
| RR-002 | Normativa | ISO 27001 A.9.4 — control de acceso a sistemas y aplicaciones |
| RR-003 | Tecnología | Stack backend: Java 17+ con Spring Boot 3.x |
| RR-004 | Tecnología | Stack frontend: Angular 17+ |
| RR-005 | Tecnología | CI/CD: Jenkins (pipeline existente del proyecto) |
| RR-006 | Tecnología | Protocolo TOTP según RFC 6238 — no HOTP ni propietario |
| RR-007 | Seguridad | Los secretos TOTP NUNCA pueden transmitirse en texto plano después del enrolamiento |
| RR-008 | Seguridad | Los endpoints 2FA requieren sesión JWT activa (excepto /verify en flujo de login) |

---

## 8. Supuestos y dependencias

### Supuestos documentados
1. El módulo de autenticación JWT está operativo y funcional en el proyecto (confirmado en FEAT-001 metadata)
2. La tabla `users` existe y contiene al menos `id`, `email`, `password_hash` — se añadirán columnas `totp_secret` y `totp_enabled`
3. El certificado SSL/TLS del endpoint está disponible (confirmado en FEAT-001 metadata)
4. La base de datos es PostgreSQL o MySQL — compatible con `BYTEA`/`VARBINARY` para campos cifrados
5. Los diseños UI de las pantallas 2FA serán validados por el PO antes de comenzar US-001 frontend (riesgo R-006)

### Dependencias con sistemas externos
| Dependencia | Tipo | Estado | Propietario |
|---|---|---|---|
| Módulo JWT existente | Técnica — interna | ✅ Disponible | Tech Lead |
| Tabla `users` en BD | Técnica — interna | ✅ Disponible | Java Dev |
| Librería `java-totp` o `google-auth-java-client` | Técnica — externa | ⏳ Por validar (US-006) | Java Dev |
| Diseño UI pantallas 2FA (wireframes) | UX/UI | ⏳ Por validar con PO | PO / Angular Dev |
| Certificado SSL/TLS | Infra | ✅ Disponible | DevOps |

---

## 9. Matriz de Trazabilidad (RTM)

| ID US | Proceso de Negocio | RF/RNF vinculados | Componente Arq. | Caso de Prueba QA | Estado |
|---|---|---|---|---|---|
| US-006 | Setup infraestructura TOTP | RR-003, RNF-D01 | TotpService, pom.xml | TC-006 (a definir — Architect) | DRAFT |
| US-001 | Enrolamiento 2FA | RF-001, RF-002, RNF-D01, RR-007 | POST /api/2fa/enroll, POST /api/2fa/activate, Angular SecurityComponent | TC-001a, TC-001b | DRAFT |
| US-002 | Verificación OTP en login | RF-003, RF-004, RNF-D02, RNF-D04, RNF-D06 | POST /api/2fa/verify, Angular LoginComponent | TC-002a, TC-002b, TC-002c (security) | DRAFT |
| US-003 | Códigos de recuperación | RF-005, RF-006, RNF-D01 | POST /api/2fa/recovery-codes/generate, POST /api/2fa/verify-recovery, Angular RecoveryModal | TC-003a, TC-003b | DRAFT |
| US-004 | Desactivación 2FA | RF-007, RF-008, RR-008 | PUT /api/2fa/deactivate, Angular SecurityComponent | TC-004a, TC-004b | DRAFT |
| US-005 | Auditoría eventos 2FA | RNF-D03, RNF-D05, RR-001, RR-002 | AuditService, audit_log table | TC-005a, TC-005b (compliance) | DRAFT |
| US-007 | Tests E2E | Todas las US anteriores | Playwright suite, Jenkins stage:test | Cubre TC-001 a TC-005 E2E | DRAFT |

> Las columnas "Componente Arq." y "Caso de Prueba QA" se completarán
> por el Architect Agent y el QA Agent en sus respectivos pasos del pipeline.

---

## 10. DoD aplicable

### DoD base SOFIA — New Feature

- [ ] Código implementado y revisado por Code Reviewer (sin NCs BLOQUEANTES abiertas)
- [ ] Tests unitarios escritos con cobertura ≥ 80% del módulo
- [ ] Tests de integración pasando en verde
- [ ] Documentación técnica actualizada (OpenAPI para endpoints)
- [ ] Aprobado por QA Lead
- [ ] Pipeline CI/CD Jenkins en verde
- [ ] Aprobación del Product Owner

### DoD customizado — Banco Meridian (FEAT-001)

Criterios adicionales para cumplimiento PCI-DSS 4.0:
- [ ] Verificación explícita en code review: secretos TOTP almacenados cifrados (AES-256)
- [ ] Audit log operativo con 100% de eventos 2FA registrados
- [ ] Test de seguridad de brute-force superado (rate limiting funcional)
- [ ] Tabla `audit_log` inmutable verificada en test de integración

---

*Generado por SOFIA Requirements Analyst Agent — 2026-03-14*
*Estado: DRAFT — 🔒 Pendiente aprobación Product Owner*
