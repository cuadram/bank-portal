# FEAT-006 — Autenticación Contextual y Bloqueo de Cuenta

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-006 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Seguridad y Control de Acceso |
| Solicitante | Seguridad TI — Banco Meridian |
| Fecha creación | 2026-06-06 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Rama git | `feature/FEAT-006-contextual-auth` |

---

## Descripción de negocio

Con FEAT-001→005 operativos, el portal detecta y notifica eventos de seguridad pero
aún no actúa de forma proactiva ante patrones de ataque. Si un atacante intenta fuerza
bruta contra la cuenta de un usuario, el sistema aplica rate limiting por IP (ADR-006)
pero la cuenta del usuario no se bloquea a nivel de autenticación.

FEAT-006 añade dos capas de protección proactiva:

1. **Bloqueo automático de cuenta** tras N intentos fallidos consecutivos de 2FA,
   con desbloqueo por email verificado (similar al flujo "No fui yo" de FEAT-002).

2. **Login contextual** — detección de accesos desde contextos inusuales (nuevo país,
   nueva ciudad estimada por subnet IP, horario fuera del patrón habitual del usuario)
   con solicitud de confirmación adicional por email antes de emitir el JWT completo.

3. **Historial de cambios de configuración de seguridad** — registro auditado y visible
   al usuario de todos los cambios de configuración: activación/desactivación 2FA,
   cambios de timeout, cambios de preferencias de notificaciones.

---

## Objetivo y valor de negocio

- **Protección proactiva**: el sistema bloquea cuentas bajo ataque sin intervención manual
- **Detección de fraude**: el login contextual detecta accesos desde ubicaciones inusuales
- **Transparencia total**: el usuario ve cuándo y qué configuración cambió en su cuenta
- **Cumplimiento PCI-DSS 4.0 req. 8.3.4**: bloqueo de cuenta tras N intentos fallidos
- **Cumplimiento PCI-DSS 4.0 req. 10.2**: registro de cambios de configuración de seguridad
- **KPI**: reducción del 30% en cuentas comprometidas por fuerza bruta

---

## Alcance funcional

### Incluido en FEAT-006
- Bloqueo automático de cuenta tras 10 intentos fallidos de OTP en 24h
- Desbloqueo por enlace de email (TTL 1h, one-time use — patrón ADR-007)
- Notificación de bloqueo al usuario (FEAT-004 SecurityEventType nuevo: `ACCOUNT_LOCKED`)
- Login contextual: detección de subnet IP nueva + alerta + confirmación email
- Historial de cambios de configuración (audit_log filtrado por eventos de configuración)

### Excluido (backlog futuro)
- Geolocalización GPS precisa — GDPR pendiente
- Machine learning para detección de comportamiento — backlog largo plazo
- Bloqueo administrativo desde panel del banco — FEAT-007+
- Biometría — fuera de alcance v1.x

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| `audit_log` inmutable (V4) | BD | ✅ Disponible |
| `LoginFailedAttemptsService` (rate limiting) | Código | ✅ Disponible — ampliar |
| SecurityEventType enum | Código | ✅ Extensible con ACCOUNT_LOCKED |
| ADR-007 patrón token HMAC (deny link) | ADR | ✅ Reutilizar para unlock link |
| FEAT-004 NotificationService | Código | ✅ Operativo |
| Flyway V8 (account_lock_status) | BD | ⏳ Sprint 7 |

---

## User Stories

| ID | Título | SP | Prioridad |
|---|---|---|---|
| US-601 | Bloqueo automático de cuenta tras intentos fallidos | 5 | Must Have |
| US-602 | Desbloqueo de cuenta por enlace de email | 3 | Must Have |
| US-603 | Login contextual — alerta por acceso desde contexto inusual | 5 | Should Have |
| US-604 | Historial de cambios de configuración de seguridad | 4 | Should Have |

**Total estimado: 17 SP**

---

### US-601 — Bloqueo automático de cuenta

**Como** sistema de seguridad,
**quiero** bloquear automáticamente una cuenta tras 10 intentos fallidos de OTP en 24h,
**para** proteger al usuario ante ataques de fuerza bruta contra su 2FA.

**Estimación:** 5 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Bloqueo automático al superar el umbral
  Dado que un usuario tiene 10 intentos fallidos de OTP en las últimas 24h
  Cuando intenta verificar el OTP por undécima vez
  Entonces la cuenta queda bloqueada (account_status=LOCKED en BD)
  Y recibe HTTP 423 con código ACCOUNT_LOCKED
  Y se envía email de notificación de bloqueo al usuario
  Y audit_log registra ACCOUNT_LOCKED con IP y timestamp

Escenario 2: Login bloqueado mientras la cuenta está bloqueada
  Dado que la cuenta está bloqueada
  Cuando el usuario intenta iniciar sesión (incluso con credenciales correctas)
  Entonces recibe HTTP 423 con mensaje "Cuenta bloqueada. Revisa tu email para desbloquearla."
  Y NO se emite JWT parcial ni completo

Escenario 3: Bloqueo no afecta a códigos de recuperación
  Dado que la cuenta está bloqueada por intentos fallidos de OTP
  Cuando el usuario intenta usar un código de recuperación válido
  Entonces el código de recuperación funciona y desbloquea el flujo
  Y audit_log registra ACCOUNT_UNLOCKED_VIA_RECOVERY
```

---

### US-602 — Desbloqueo de cuenta por email

**Como** usuario con la cuenta bloqueada,
**quiero** desbloquear mi cuenta mediante un enlace enviado a mi email,
**para** recuperar el acceso sin necesidad de contactar con soporte del banco.

**Estimación:** 3 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Solicitar enlace de desbloqueo
  Dado que mi cuenta está bloqueada
  Cuando accedo a la pantalla de login y hago clic en "Desbloquear cuenta"
  Entonces recibo un email con enlace HMAC-SHA256 (TTL 1h, one-time use)
  Y el enlace incluye el identificador de la cuenta (sin PII en la URL)

Escenario 2: Desbloqueo exitoso
  Dado que tengo el enlace de desbloqueo válido
  Cuando accedo al enlace antes de que expire
  Entonces la cuenta se desbloquea (account_status=ACTIVE)
  Y el contador de intentos fallidos se reinicia a 0
  Y audit_log registra ACCOUNT_UNLOCKED con IP del desbloqueo
  Y se redirige al login con mensaje "Cuenta desbloqueada. Puedes iniciar sesión."

Escenario 3: Enlace expirado o ya usado
  Dado que el enlace de desbloqueo ha expirado (> 1h) o ya fue usado
  Cuando accedo al enlace
  Entonces recibo mensaje "Este enlace ha expirado. Solicita uno nuevo desde el login."
  Y puede solicitar un nuevo enlace
```

---

### US-603 — Login contextual

**Como** sistema de seguridad,
**quiero** detectar logins desde contextos inusuales (nueva subnet IP, horario atípico),
**para** solicitar confirmación adicional antes de emitir el JWT completo.

**Estimación:** 5 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Login desde nueva subnet IP
  Dado que el usuario habitualmente accede desde la subnet 192.168.x.x
  Cuando intenta login desde la subnet 10.20.x.x (nunca vista antes)
  Entonces el sistema emite un JWT de "contexto pendiente" (scope: context-pending)
  Y envía email con enlace de confirmación (TTL 15min)
  Y muestra pantalla "Hemos detectado acceso desde una ubicación nueva. Revisa tu email."

Escenario 2: Confirmación de contexto nuevo
  Dado que el usuario tiene un JWT context-pending
  Cuando hace clic en el enlace de confirmación del email
  Entonces el sistema marca la subnet como conocida para ese usuario
  Y emite JWT completo (scope: full-session)
  Y audit_log registra LOGIN_NEW_CONTEXT_CONFIRMED

Escenario 3: Subnets conocidas omiten el flujo contextual
  Dado que el usuario ya confirmó la subnet 10.20.x.x previamente
  Cuando inicia sesión desde esa subnet
  Entonces el flujo contextual NO se activa
  Y el login procede normalmente con el 2FA habitual
```

---

### US-604 — Historial de cambios de configuración

**Como** usuario autenticado,
**quiero** ver el historial de todos los cambios de configuración de seguridad de mi cuenta,
**para** detectar modificaciones no autorizadas en mi configuración.

**Estimación:** 4 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Ver historial de cambios de configuración
  Dado que accedo a "Seguridad → Panel de auditoría → Cambios de configuración"
  Cuando cargo el historial
  Entonces veo todos los eventos de tipo configuración en audit_log:
    2FA activado/desactivado, timeout de sesión modificado,
    preferencias de notificaciones cambiadas, dispositivos añadidos/eliminados
  Ordenados por fecha DESC

Escenario 2: Distinguir cambios propios de cambios sospechosos
  Dado que veo un cambio de configuración
  Cuando el cambio fue realizado desde una IP diferente a la habitual
  Entonces el evento se muestra con indicador visual "⚠️ Desde ubicación nueva"

Escenario 3: Exportación incluye historial de configuración
  Dado que selecciono exportar el historial de seguridad (US-402)
  Cuando incluyo los últimos 90 días
  Entonces el PDF/CSV incluye los eventos de configuración junto al resto
```

---

## Riesgos FEAT-006

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F6-001 | Bloqueo automático puede bloquear usuarios legítimos por error de tipeo | M | M | 🟡 | Umbral conservador (10 intentos), aviso progresivo a partir de 7 |
| R-F6-002 | Login contextual genera falsos positivos con VPNs corporativas | M | M | 🟡 | Whitelist de subnets corporativas configurable; el usuario puede confirmar contexto |
| R-F6-003 | US-603 requiere nuevo scope JWT (context-pending) — impacto en SecurityFilterChain | M | M | 🟡 | ADR-011 requerido antes del desarrollo; spike técnico día 1 |
| R-F6-004 | Flyway V8 con alter de tabla users (añadir account_status) — riesgo de migración en PROD | B | M | 🟢 | Testar en STG con datos de volumen antes del deploy |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio
- [x] 4 US con criterios Gherkin completos
- [x] Estimación en SP: 17 SP
- [x] Dependencias identificadas (ADR-007 patrón ✅, FEAT-004 NotificationService ✅)
- [x] Riesgos documentados — R-F6-003 requiere ADR-011 + spike día 1
- [x] Stack confirmado: Java/Spring Boot + Angular

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 7 Planning · 2026-06-09*
