# Backlog Item — FEAT-001: Autenticación de Doble Factor (2FA)

> **Artefacto:** Backlog Item detallado
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-03-11
> **Sprint target:** Sprint 01

---

## 1. Información general

| Campo            | Valor                                            |
|------------------|--------------------------------------------------|
| Feature ID       | FEAT-001                                         |
| Tipo             | Feature / Épica de Seguridad                     |
| Proyecto         | BankPortal — Banco Meridian                      |
| Prioridad        | CRÍTICA (P1)                                     |
| Puntos totales   | 40 SP                                            |
| Sprint asignado  | Sprint 01 (2026-03-11 → 2026-03-25)              |
| Rama git         | `feature/FEAT-001-autenticacion-2fa`             |
| Servicios        | `apps/backend-2fa` · `apps/frontend-portal`      |

---

## 2. Descripción de la feature

**Como** usuario del portal bancario de Banco Meridian,
**quiero** poder activar y utilizar autenticación de doble factor (TOTP)
**para** proteger mi cuenta contra accesos no autorizados en caso de robo de credenciales.

**Contexto de negocio:** cumplimiento PCI-DSS 4.0 req. 8.4 e ISO 27001 A.9.4.

---

## 3. User Stories

---

### US-001 — Activar 2FA con TOTP (enrolamiento)

**Como** usuario autenticado,
**quiero** activar la autenticación de doble factor en mi cuenta vinculando mi app autenticadora,
**para** añadir una capa adicional de seguridad a mis accesos bancarios.

**Estimación:** 8 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Generación de QR de enrolamiento
  Dado que soy un usuario autenticado sin 2FA activo
  Cuando solicito activar 2FA en mi perfil
  Entonces el sistema genera un secreto TOTP único
  Y me presenta un código QR compatible con RFC 6238
  Y el QR incluye: issuer="BankMeridian", account=mi_email

Escenario 2: Confirmación de enrolamiento exitosa
  Dado que escaneo el QR con mi app autenticadora
  Cuando ingreso el código OTP generado por la app
  Y el código es válido (ventana ±30s, tolerancia ±1 período)
  Entonces el sistema activa 2FA en mi cuenta
  Y almacena el secreto TOTP cifrado (AES-256) en base de datos
  Y me redirige a la pantalla de códigos de recuperación

Escenario 3: Código OTP inválido en enrolamiento
  Dado que escaneo el QR con mi app autenticadora
  Cuando ingreso un código OTP incorrecto
  Entonces el sistema rechaza la activación
  Y muestra mensaje de error descriptivo
  Y el 2FA permanece inactivo
```

**Componentes afectados:**
- Backend: `POST /api/v1/2fa/enroll` — genera secreto + QR (librería `dev.samstevens.totp`)
- Backend: `POST /api/v1/2fa/enroll/confirm` — valida primer OTP y activa
- Frontend: componente `TwoFactorSetupComponent` en panel de perfil
- BD: columnas `totp_secret_enc`, `two_factor_enabled`, `two_factor_enrolled_at` en tabla `users`

**Tasks técnicas:**

| Task | Componente | Responsable | SP |
|------|-----------|-------------|-----|
| T-001 | Endpoint POST /api/v1/2fa/enroll | Backend Dev | 2 |
| T-002 | Endpoint POST /api/v1/2fa/enroll/confirm | Backend Dev | 2 |
| T-003 | Cifrado AES-256 del secreto TOTP | Backend Dev | 2 |
| T-004 | Componente Angular TwoFactorSetupComponent | Frontend Dev | 2 |

---

### US-002 — Verificar OTP en flujo de login

**Como** usuario con 2FA activo,
**quiero** que el sistema me solicite mi código OTP después de ingresar mis credenciales,
**para** completar el proceso de autenticación de dos factores.

**Estimación:** 8 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Login con 2FA activo solicita OTP
  Dado que tengo 2FA activado en mi cuenta
  Cuando ingreso usuario y contraseña correctos
  Entonces el sistema no emite el JWT de acceso completo
  Y responde con un token provisional (pre-auth token, TTL=5min)
  Y redirige al frontend al formulario de ingreso de OTP

Escenario 2: Verificación OTP exitosa
  Dado que tengo un token provisional válido
  Cuando ingreso el código OTP correcto de mi app autenticadora
  Entonces el sistema valida el código contra el secreto TOTP almacenado
  Y emite el JWT de acceso completo (Bearer token)
  Y registra el evento de login exitoso en auditoría

Escenario 3: Bloqueo por intentos fallidos
  Dado que ingreso códigos OTP incorrectos
  Cuando acumulo 5 intentos fallidos en un período de 10 minutos
  Entonces el sistema bloquea temporalmente mi acceso 2FA por 15 minutos
  Y registra el evento de bloqueo en auditoría

Escenario 4: Uso de código de recuperación
  Dado que no tengo acceso a mi app autenticadora
  Cuando ingreso un código de recuperación válido
  Entonces el sistema autentica la sesión
  Y marca ese código de recuperación como utilizado (no reutilizable)
```

**Componentes afectados:**
- Backend: modificar `POST /api/v1/auth/login` — flujo condicional 2FA
- Backend: `POST /api/v1/2fa/verify` — valida OTP y emite JWT completo
- Backend: Rate limiter en `/api/v1/2fa/verify` (máx 5 intentos / 10 min)
- Frontend: componente `OtpVerificationComponent` en flujo de login

**Tasks técnicas:**

| Task | Componente | Responsable | SP |
|------|-----------|-------------|-----|
| T-005 | Modificar flujo auth/login para 2FA | Backend Dev | 3 |
| T-006 | Endpoint POST /api/v1/2fa/verify + rate limit | Backend Dev | 3 |
| T-007 | Componente Angular OtpVerificationComponent | Frontend Dev | 2 |

---

### US-003 — Generar y gestionar códigos de recuperación

**Como** usuario que activa 2FA,
**quiero** obtener códigos de recuperación de un solo uso,
**para** poder acceder a mi cuenta si pierdo acceso a mi app autenticadora.

**Estimación:** 5 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Generación de códigos al activar 2FA
  Dado que acabo de confirmar el enrolamiento 2FA
  Cuando se completa la activación
  Entonces el sistema genera 10 códigos de recuperación únicos (formato: XXXX-XXXX-XXXX)
  Y los almacena en BD como hashes bcrypt
  Y los muestra una única vez en pantalla
  Y ofrece opción de descarga en texto plano y copia al portapapeles

Escenario 2: Uso de código de recuperación
  Dado que uso un código de recuperación para autenticarme
  Cuando el código es válido y no ha sido utilizado previamente
  Entonces el sistema autentica la sesión
  Y marca el código como `used=true` (no reutilizable)

Escenario 3: Regenerar códigos de recuperación
  Dado que soy un usuario con 2FA activo
  Cuando solicito regenerar mis códigos de recuperación
  Y confirmo con mi contraseña actual
  Entonces el sistema invalida los códigos anteriores
  Y genera 10 nuevos códigos
```

**Componentes afectados:**
- Backend: `POST /api/v1/2fa/recovery-codes/generate`
- Backend: `GET /api/v1/2fa/recovery-codes/status` (cuántos quedan sin usar)
- BD: tabla `recovery_codes` (id, user_id, code_hash, used, created_at)
- Frontend: componente `RecoveryCodesComponent`

**Tasks técnicas:**

| Task | Componente | Responsable | SP |
|------|-----------|-------------|-----|
| T-008 | Generación y almacenamiento de recovery codes | Backend Dev | 2 |
| T-009 | Componente Angular RecoveryCodesComponent | Frontend Dev | 2 |
| T-010 | Migración BD: tabla recovery_codes | Backend Dev | 1 |

---

### US-004 — Desactivar 2FA con confirmación

**Como** usuario con 2FA activo,
**quiero** poder desactivar el doble factor con confirmación de contraseña,
**para** gestionar mi configuración de seguridad.

**Estimación:** 5 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Desactivación exitosa
  Dado que soy un usuario con 2FA activo
  Cuando solicito desactivar 2FA
  Y proporciono mi contraseña actual correcta
  Y confirmo el código OTP actual de mi app
  Entonces el sistema desactiva 2FA en mi cuenta
  Y elimina el secreto TOTP de la base de datos
  Y invalida todos los códigos de recuperación
  Y registra el evento en auditoría

Escenario 2: Desactivación rechazada por contraseña incorrecta
  Cuando proporciono una contraseña incorrecta
  Entonces el sistema rechaza la desactivación
  Y muestra mensaje de error
```

**Componentes afectados:**
- Backend: `DELETE /api/v1/2fa/disable`
- Frontend: sección de desactivación en `TwoFactorSetupComponent`

**Tasks técnicas:**

| Task | Componente | Responsable | SP |
|------|-----------|-------------|-----|
| T-011 | Endpoint DELETE /api/v1/2fa/disable | Backend Dev | 2 |
| T-012 | UI desactivación en Angular | Frontend Dev | 2 |
| T-013 | Limpieza de secreto TOTP + recovery codes | Backend Dev | 1 |

---

### US-005 — Auditoría de eventos 2FA

**Como** administrador del sistema,
**quiero** que todos los eventos relevantes de 2FA queden registrados con detalle,
**para** detectar patrones de acceso sospechosos y cumplir con requisitos de auditoría normativa.

**Estimación:** 5 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Registro de eventos
  Dado cualquier acción 2FA del usuario
  Cuando se produce un evento (activación, login OTP, fallo, bloqueo, desactivación)
  Entonces el sistema registra en tabla audit_log:
    - user_id, event_type, ip_address, user_agent, timestamp, result (SUCCESS/FAILURE)
  Y el registro es inmutable (no se puede modificar ni eliminar via API)
```

**Componentes afectados:**
- Backend: servicio `AuditLogService` + tabla `audit_log`
- Backend: AOP aspect `@TwoFactorAudit` para interceptar eventos

**Tasks técnicas:**

| Task | Componente | Responsable | SP |
|------|-----------|-------------|-----|
| T-014 | AuditLogService + tabla audit_log | Backend Dev | 2 |
| T-015 | AOP aspect @TwoFactorAudit | Backend Dev | 2 |
| T-016 | Migración BD: tabla audit_log | Backend Dev | 1 |

---

### US-006 — Setup de infraestructura TOTP

**Como** equipo de desarrollo,
**queremos** configurar la infraestructura base para TOTP en el proyecto Spring Boot,
**para** que los desarrolladores tengan la base técnica necesaria para implementar las US anteriores.

**Estimación:** 3 SP | **Prioridad:** Must Have (pre-requisito)

#### Tasks técnicas

| Task | Descripción | Responsable | SP |
|------|-------------|-------------|-----|
| T-017 | Añadir dependencia `dev.samstevens.totp:totp-spring-boot-starter` | Backend Dev | 1 |
| T-018 | Configurar Spring Security para flujo 2FA (pre-auth filter) | Backend Dev | 1 |
| T-019 | Variables de entorno y secretos (AES key, app name) en application.yml | DevOps/Dev | 1 |

---

### US-007 — Tests de integración end-to-end 2FA

**Como** equipo de calidad,
**queremos** validar el flujo completo de 2FA mediante tests automatizados,
**para** garantizar la correcta integración entre frontend y backend.

**Estimación:** 6 SP | **Prioridad:** Must Have

#### Tasks técnicas

| Task | Descripción | Responsable | SP |
|------|-------------|-------------|-----|
| T-020 | Tests unitarios backend (TotpService, 2FA controllers) — JUnit 5 + Mockito | QA/Backend | 2 |
| T-021 | Tests de integración backend (SpringBootTest + Testcontainers) | QA/Backend | 2 |
| T-022 | Tests E2E Angular (Cypress) — flujo login + 2FA | QA/Frontend | 2 |

---

## 4. Resumen de estimación

| US      | Descripción                          | SP  |
|---------|--------------------------------------|-----|
| US-006  | Setup infraestructura TOTP           | 3   |
| US-001  | Activar 2FA (enrolamiento)           | 8   |
| US-002  | Verificar OTP en login               | 8   |
| US-003  | Códigos de recuperación              | 5   |
| US-004  | Desactivar 2FA                       | 5   |
| US-005  | Auditoría de eventos 2FA             | 5   |
| US-007  | Tests E2E e integración              | 6   |
| **TOTAL** |                                    | **40 SP** |

---

## 5. Definition of Ready (DoR) — Checklist

- [x] Feature descrita con valor de negocio claro
- [x] Todas las US tienen criterios de aceptación en formato Gherkin
- [x] Estimación en Story Points consensuada por el equipo
- [x] Dependencias técnicas identificadas y disponibles
- [x] Riesgos documentados con mitigación
- [x] Stack técnico confirmado
- [x] Rama git definida: `feature/FEAT-001-autenticacion-2fa`
- [x] Capacidad del sprint suficiente (40 SP disponibles = 40 SP requeridos)

---

## 6. Definition of Done (DoD) — Checklist por US

Cada User Story se considera **DONE** cuando:

- [ ] Código implementado y mergeado en rama feature
- [ ] Cobertura de tests ≥ 80% (unitarios + integración)
- [ ] Code review aprobado por al menos 1 par
- [ ] Sin errores críticos ni altos en SonarQube
- [ ] Documentación de API actualizada (OpenAPI/Swagger)
- [ ] Criterios de aceptación verificados por QA
- [ ] Aprobado en demo por Product Owner

---

## 7. Trazabilidad CMMI Nivel 3

| Área de proceso CMMI | Evidencia en este artefacto                    |
|----------------------|------------------------------------------------|
| REQM (Requirements Management) | US con criterios Gherkin + trazabilidad a FEAT |
| PP (Project Planning)           | Estimación SP, dependencies, risks            |
| PMC (Project Monitoring)        | DoD checklist, métricas definidas              |
| VER (Verification)              | Criterios de code review y cobertura tests     |
| VAL (Validation)                | Criterios de aceptación validados por PO       |
| CM (Config Management)          | Rama git, conv. commits, artefactos versionados |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 01 · 2026-03-11*
