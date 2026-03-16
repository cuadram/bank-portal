# FEAT-003 — Dispositivos de Confianza

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-003 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Seguridad y Control de Acceso |
| Solicitante | Seguridad TI — Banco Meridian |
| Fecha creación | 2026-04-28 |
| Stack | Java/Spring Boot (backend) + Angular (frontend) |
| Rama git | `feature/FEAT-003-trusted-devices` |

---

## Descripción de negocio

Los usuarios de Banco Meridian que acceden diariamente desde el mismo dispositivo
(PC de trabajo, móvil personal) experimentan fricción innecesaria al tener que
introducir el OTP en cada login. FEAT-003 permite marcar dispositivos como "de
confianza" para omitir el segundo factor en logins posteriores desde ese dispositivo,
manteniendo el nivel de seguridad mediante un token de confianza firmado con TTL
de 30 días, almacenado en cookie HttpOnly.

Esta funcionalidad complementa FEAT-001 (2FA) y FEAT-002 (gestión de sesiones),
y mejora la experiencia de usuario sin degradar el cumplimiento PCI-DSS.

---

## Objetivo y valor de negocio

- **UX**: reducir la fricción en el login habitual — el OTP solo se pide en dispositivos nuevos
- **Seguridad**: el trust token es HttpOnly, firmado HMAC, con TTL 30 días y revocable en cualquier momento
- **Coherencia**: integración natural con FEAT-002 (el usuario ya gestiona sesiones y dispositivos conocidos)
- **Cumplimiento**: PCI-DSS 4.0 req. 8.3 — la omisión de OTP en dispositivos confiables es compatible si el trust token es un segundo factor equivalente (algo que tienes)
- **KPI**: reducción de tiempo medio de login en un 40% para usuarios con dispositivos confiables

---

## Alcance funcional

### Incluido en FEAT-003
- Marcar un dispositivo como de confianza tras login 2FA exitoso
- Gestionar dispositivos de confianza — ver y eliminar individualmente o todos
- Login sin OTP desde dispositivo de confianza (trust token en cookie HttpOnly)
- Expiración automática de dispositivos de confianza tras 30 días de inactividad
- Notificación al revocar un dispositivo de confianza

### Excluido (backlog futuro)
- Geolocalización física precisa — GDPR
- Biometría como segundo factor — backlog largo plazo
- Passkeys / WebAuthn — backlog largo plazo
- Admin dashboard de dispositivos de toda la organización — backlog largo plazo

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| FEAT-001 — 2FA operativo | Técnica | ✅ v1.1.0 PROD |
| FEAT-002 — `known_devices` tabla | BD | ✅ v1.2.0 PROD (Flyway V5) |
| FEAT-002 — `DeviceFingerprintService` | Código | ✅ operativo (con DEBT-004 pendiente) |
| Cookie HttpOnly configurada en Spring Security | Técnica | ⏳ Sprint 4 |
| Tabla `trusted_devices` (nueva) | BD | ⏳ Sprint 4 (Flyway V6) |

---

## User Stories

| ID | Título | SP | Prioridad |
|---|---|---|---|
| US-201 | Marcar dispositivo como de confianza tras login 2FA | 3 | Must Have |
| US-202 | Ver y eliminar dispositivos de confianza | 4 | Must Have |
| US-203 | Login sin OTP desde dispositivo de confianza | 6 | Must Have |
| US-204 | Expiración automática de dispositivos de confianza | 3 | Must Have |

**Total estimado: 16 SP** (Sprint 4: ~16 SP de FEAT-003 + 8 SP de FEAT-002 cierre + deuda)

---

### US-201 — Marcar dispositivo como de confianza

**Como** usuario autenticado que acaba de completar login 2FA,
**quiero** poder marcar el dispositivo actual como de confianza,
**para** no tener que introducir el OTP en los próximos logins desde este dispositivo.

**Estimación:** 3 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Marcar dispositivo como confiable
  Dado que acabo de completar login 2FA exitosamente
  Cuando marco la opción "Recordar este dispositivo durante 30 días"
  Entonces el sistema:
    - Genera un trust token HMAC-SHA256 (payload: userId + deviceFingerprint + expiresAt)
    - Lo almacena en tabla trusted_devices en BD
    - Lo establece como cookie HttpOnly, Secure, SameSite=Strict con TTL 30 días
  Y el usuario no necesitará OTP en los próximos 30 días desde este dispositivo

Escenario 2: Opción es opt-in explícito
  Dado que el usuario no selecciona "Recordar este dispositivo"
  Cuando completa el login 2FA
  Entonces NO se crea trust token ni cookie
  Y el próximo login desde el mismo dispositivo solicitará OTP

Escenario 3: Device fingerprint cambia
  Dado que el dispositivo tiene un trust token válido
  Cuando el fingerprint del dispositivo cambia (ej. cambio de navegador)
  Entonces el trust token no aplica — se solicita OTP
  Y el antiguo trust token permanece válido para el fingerprint original
```

**Componentes:**
- Backend: extensión de `POST /api/v1/2fa/verify` — parámetro `trustDevice: boolean`
- Backend: `TrustedDeviceService.createTrustToken(userId, fingerprint, ttlDays)`
- Backend: tabla `trusted_devices` + cookie HttpOnly
- Frontend: checkbox "Recordar este dispositivo" en `OtpVerificationComponent`

---

### US-202 — Gestionar dispositivos de confianza

**Como** usuario autenticado,
**quiero** ver todos mis dispositivos de confianza y poder eliminarlos,
**para** revocar el acceso sin OTP desde dispositivos que ya no uso o que han sido comprometidos.

**Estimación:** 4 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Listar dispositivos de confianza
  Dado que tengo dispositivos de confianza registrados
  Cuando accedo a "Seguridad → Dispositivos de confianza"
  Entonces veo una lista con:
    - Nombre del dispositivo (OS + browser)
    - Fecha de registro y fecha de expiración
    - Indicador "este dispositivo" para el actual
  Y los dispositivos están ordenados por última actividad DESC

Escenario 2: Eliminar dispositivo individual
  Dado que selecciono "Eliminar" en un dispositivo de confianza
  Cuando confirmo la eliminación
  Entonces el trust token es revocado en BD y en la cookie (si es el actual)
  Y el próximo login desde ese dispositivo solicitará OTP
  Y se registra TRUSTED_DEVICE_REVOKED en audit_log

Escenario 3: Eliminar todos los dispositivos de confianza
  Dado que selecciono "Eliminar todos los dispositivos de confianza"
  Cuando confirmo con mi OTP actual
  Entonces todos los trust tokens son revocados
  Y se registra TRUSTED_DEVICE_REVOKE_ALL en audit_log

Escenario 4: Sin dispositivos de confianza
  Dado que no tengo ningún dispositivo de confianza registrado
  Cuando accedo a "Seguridad → Dispositivos de confianza"
  Entonces veo un estado vacío con mensaje informativo
```

**Componentes:**
- Backend: `GET /api/v1/trusted-devices` · `DELETE /api/v1/trusted-devices/{id}` · `DELETE /api/v1/trusted-devices`
- Frontend: `TrustedDevicesComponent` en panel de seguridad

---

### US-203 — Login sin OTP desde dispositivo de confianza

**Como** usuario con un dispositivo de confianza registrado,
**quiero** poder iniciar sesión sin introducir el OTP desde ese dispositivo,
**para** reducir la fricción en el acceso diario.

**Estimación:** 6 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Login directo con trust token válido
  Dado que tengo una cookie de dispositivo de confianza válida (no expirada)
  Cuando introduzco usuario y contraseña correctos
  Entonces el sistema:
    - Detecta la cookie trust token
    - Verifica la firma HMAC y el TTL
    - Verifica que el fingerprint del dispositivo coincide
    - Emite JWT de sesión completa SIN solicitar OTP
  Y el usuario accede directamente al portal

Escenario 2: Trust token expirado fuerza OTP
  Dado que la cookie trust token ha expirado (> 30 días)
  Cuando inicio sesión
  Entonces el sistema solicita OTP normalmente
  Y ofrece la opción de "Recordar este dispositivo" tras la verificación exitosa

Escenario 3: Trust token válido pero device fingerprint cambiado
  Dado que el fingerprint del dispositivo no coincide con el del trust token
  Cuando inicio sesión con credenciales válidas
  Entonces el sistema solicita OTP
  Y NO emite el trust token automáticamente (el usuario debe elegir recordar)

Escenario 4: Trust token revocado (sesión activa)
  Dado que el usuario revocó un dispositivo de confianza desde otro dispositivo
  Cuando ese dispositivo intenta hacer login sin OTP
  Entonces el sistema solicita OTP (el trust token no es válido en BD)
```

**Componentes:**
- Backend: `TrustedDeviceAuthFilter` — `OncePerRequestFilter` en el login flow
- Backend: verificación en `AuthService.login()` antes de emitir pre-auth token
- Backend: tabla `trusted_devices` con lookup por `(userId, tokenHash)`
- Frontend: flujo de login transparente — sin cambios visibles si el trust token es válido

---

### US-204 — Expiración automática de dispositivos de confianza

**Como** sistema de seguridad,
**quiero** que los dispositivos de confianza expiren automáticamente tras 30 días de inactividad,
**para** mantener la superficie de ataque mínima sin intervención del usuario.

**Estimación:** 3 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Renovación automática por uso
  Dado que un dispositivo de confianza es usado en un login
  Cuando el trust token tiene más de 15 días de antigüedad y aún es válido
  Entonces el sistema renueva el TTL de la cookie y actualiza last_used en BD
  Y el contador de 30 días se reinicia

Escenario 2: Expiración por inactividad
  Dado que un dispositivo de confianza no ha sido usado en 30 días
  Cuando el job de limpieza nocturno se ejecuta (o el usuario intenta login)
  Entonces el trust token es marcado como expirado en BD
  Y el próximo login desde ese dispositivo solicita OTP

Escenario 3: Job de limpieza programado
  Dado que existen trusted_devices con expires_at < NOW()
  Cuando el job @Scheduled(cron = "0 2 * * *") se ejecuta
  Entonces los registros expirados son eliminados de la tabla
  Y se registra TRUSTED_DEVICE_EXPIRED_CLEANUP en audit_log con el conteo
```

**Componentes:**
- Backend: columna `expires_at` en `trusted_devices` · actualización en cada login
- Backend: `@Scheduled` job `TrustedDeviceCleanupJob` — limpieza nocturna 02:00
- Backend: `@EnableScheduling` en la aplicación

---

## Riesgos FEAT-003

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F3-001 | Trust token robado de cookie → acceso sin OTP | B | A | 🟡 Media | Cookie HttpOnly + Secure + SameSite=Strict · Binding a fingerprint del dispositivo |
| R-F3-002 | PCI-DSS 4.0 req. 8.3 — auditoría de la omisión del OTP | M | M | 🟡 Media | Loguear TRUSTED_DEVICE_LOGIN en audit_log con fingerprint y TTL restante |
| R-F3-003 | Dispositivos de confianza acumulados sin límite | B | B | 🟢 Baja | Límite de 10 dispositivos de confianza por usuario — LRU si se supera |
| R-F3-004 | Job de limpieza no ejecutado (down del pod durante la noche) | B | B | 🟢 Baja | Verificación TTL en el propio login como segunda línea de defensa |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio
- [x] Todas las US con criterios Gherkin completos
- [x] Estimación en SP: 16 SP
- [x] Dependencias identificadas (FEAT-001 ✅, FEAT-002 ✅)
- [x] Riesgos documentados
- [x] Stack confirmado: Java/Spring Boot + Angular + Cookie HttpOnly

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 4 Planning · 2026-04-28*
