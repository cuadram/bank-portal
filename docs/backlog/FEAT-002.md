# FEAT-002 — Gestión Avanzada de Sesiones

## Metadata

| Campo          | Valor                                           |
|----------------|-------------------------------------------------|
| Feature ID     | FEAT-002                                        |
| Proyecto       | BankPortal — Banco Meridian                     |
| Prioridad      | ALTA (P1)                                       |
| Estado         | READY FOR SPRINT                                |
| Epic           | Seguridad y Control de Acceso                   |
| Solicitante    | Seguridad TI — Banco Meridian                   |
| Fecha creación | 2026-04-14                                      |
| Stack          | Java/Spring Boot (backend) + Angular (frontend) |
| Rama git       | `feature/FEAT-002-session-management`           |

---

## Descripción de negocio

Tras la implantación de 2FA (FEAT-001), Banco Meridian necesita dar al usuario
control total sobre sus sesiones activas. El usuario debe poder ver en qué
dispositivos tiene sesión abierta, cerrarlas remotamente y recibir alertas
cuando se detecte un acceso desde un nuevo dispositivo o ubicación inusual.

Esta capacidad complementa el cumplimiento PCI-DSS 4.0 (req. 8.2, 8.3, 8.6)
y refuerza la detección temprana de accesos no autorizados, incluso cuando las
credenciales + OTP han sido comprometidos.

---

## Objetivo y valor de negocio

- **Visibilidad**: el usuario ve todas sus sesiones activas en tiempo real
- **Control**: puede cerrar remotamente cualquier sesión desde cualquier dispositivo
- **Alerta temprana**: notificación inmediata en nuevo login desde dispositivo/IP desconocido
- **Cumplimiento**: PCI-DSS 4.0 req. 8.2 (gestión de cuentas), req. 8.3 (autenticación), req. 8.6 (sesiones inactivas)
- **KPI**: tasa de uso de cierre remoto ≥ 5% en 30 días · tasa de falsos positivos en alertas < 2%

---

## Alcance funcional

### Incluido en FEAT-002

- Control de sesiones concurrentes (máximo configurable por política)
- Historial de sesiones activas con metadata (dispositivo, IP, última actividad)
- Cierre remoto de sesiones individuales o todas salvo la actual
- Timeout de inactividad configurable por el usuario
- Notificaciones de seguridad por login desde nuevo dispositivo o IP inusual

### Excluido (backlog futuro)

- Geolocalización física precisa (GDPR — requiere consentimiento explícito)
- Dispositivos de confianza / "recordar este dispositivo" — FEAT-003
- Autenticación sin contraseña (passkeys) — backlog largo plazo
- Análisis de comportamiento (ML fraud detection) — backlog largo plazo

---

## User Stories

| ID     | Título                                                   | SP | Prioridad   |
|--------|----------------------------------------------------------|----|-------------|
| US-101 | Ver sesiones activas con metadata de dispositivo         | 5  | Must Have   |
| US-102 | Cerrar sesión remota individual o todas                  | 5  | Must Have   |
| US-103 | Timeout de inactividad configurable por el usuario       | 3  | Should Have |
| US-104 | Control de sesiones concurrentes máximas                 | 5  | Must Have   |
| US-105 | Notificaciones de seguridad por login inusual            | 6  | Must Have   |

**Total estimado: 24 SP**

---

### US-101 — Ver sesiones activas

**Como** usuario autenticado,
**quiero** ver todas mis sesiones activas con información del dispositivo y última actividad,
**para** identificar accesos que no reconozco.

**Estimación:** 5 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Listar sesiones activas
  Dado que soy un usuario autenticado con ≥ 1 sesión activa
  Cuando accedo a "Seguridad → Sesiones activas"
  Entonces veo una lista con:
    - Dispositivo aproximado (tipo: móvil/escritorio/tablet, OS)
    - Dirección IP enmascarada (últimos 2 octetos visibles: 192.168.***.***) 
    - Fecha y hora del último acceso
    - Indicador "esta sesión" para la actual
  Y las sesiones están ordenadas por última actividad DESC

Escenario 2: Sesión actual siempre identificada
  Dado que tengo múltiples sesiones activas
  Cuando accedo al listado
  Entonces la sesión actual aparece destacada y no puede cerrarse remotamente
  (solo puede cerrarse haciendo logout normal)
```

**Componentes:**
- Backend: `GET /api/v1/sessions` — lista sesiones activas del usuario autenticado
- Backend: `SessionService` + tabla `user_sessions` (id, user_id, token_hash, device_info, ip_masked, last_activity, created_at)
- Frontend: componente `ActiveSessionsComponent` en panel de seguridad

---

### US-102 — Cerrar sesión remota

**Como** usuario autenticado,
**quiero** poder cerrar remotamente cualquier sesión activa distinta de la actual,
**para** revocar accesos no autorizados inmediatamente.

**Estimación:** 5 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Cerrar sesión individual
  Dado que tengo sesiones activas en múltiples dispositivos
  Cuando selecciono "Cerrar sesión" en una sesión específica
  Y confirmo con mi código OTP vigente
  Entonces esa sesión queda invalidada inmediatamente (token en blacklist)
  Y el dispositivo afectado recibe un 401 en su próxima request
  Y se registra evento SESSION_REVOKED en audit_log

Escenario 2: Cerrar todas las demás sesiones
  Dado que sospecho de acceso no autorizado
  Cuando selecciono "Cerrar todas las demás sesiones"
  Y confirmo con mi código OTP vigente
  Entonces todas las sesiones excepto la actual quedan invalidadas
  Y se registra evento SESSION_REVOKE_ALL en audit_log

Escenario 3: Revocación inmediata
  Dado que se ha cerrado una sesión remotamente
  Cuando el token revocado intenta acceder a cualquier endpoint protegido
  Entonces recibe HTTP 401 con código SESSION_REVOKED
  Y es redirigido al login
```

**Componentes:**
- Backend: `DELETE /api/v1/sessions/{sessionId}` — revocar sesión individual
- Backend: `DELETE /api/v1/sessions` — revocar todas excepto la actual
- Backend: Redis Set `revoked_tokens:{userId}` como token blacklist (TTL = max session lifetime)
- Frontend: botones de cierre por sesión + confirmación OTP modal

---

### US-103 — Timeout de inactividad configurable

**Como** usuario autenticado,
**quiero** configurar el tiempo de inactividad antes del cierre automático de sesión,
**para** equilibrar seguridad y comodidad según mi perfil de uso.

**Estimación:** 3 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Configurar timeout
  Dado que accedo a "Seguridad → Configuración de sesión"
  Cuando selecciono un tiempo de inactividad (15 / 30 / 60 minutos)
  Entonces el servidor actualiza mi preferencia en la BD
  Y el JWT de sesión respeta ese TTL desde el siguiente login

Escenario 2: Límite mínimo institucional
  Dado que el banco define un timeout máximo de 60 minutos (PCI-DSS)
  Cuando intento seleccionar una opción superior (si la UI la permitiera)
  Entonces el servidor rechaza el valor con HTTP 400 SESSION_TIMEOUT_EXCEEDS_POLICY
  Y aplica el máximo permitido (60 min)

Escenario 3: Sesión expirada por inactividad
  Dado que mi sesión lleva más tiempo inactivo que mi preferencia configurada
  Cuando intento hacer una request autenticada
  Entonces recibo HTTP 401 SESSION_EXPIRED
  Y soy redirigido al login con mensaje informativo
```

**Componentes:**
- Backend: `PUT /api/v1/sessions/timeout` — actualizar preferencia
- Backend: columna `session_timeout_minutes` en tabla `users` (default: 30, max: 60)
- Backend: lógica de validación en JWT filter (`last_activity + timeout < now`)
- Frontend: selector en `SecuritySettingsComponent`

---

### US-104 — Control de sesiones concurrentes

**Como** administrador de seguridad,
**quiero** que el sistema limite el número máximo de sesiones activas por usuario,
**para** prevenir el uso compartido de credenciales y detectar compromisos de cuenta.

**Estimación:** 5 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Límite de sesiones no superado
  Dado que tengo 2 sesiones activas y el límite es 3
  Cuando inicio sesión desde un tercer dispositivo
  Entonces la nueva sesión se crea normalmente
  Y tengo 3 sesiones activas

Escenario 2: Límite de sesiones alcanzado — política LRU
  Dado que tengo 3 sesiones activas (límite máximo)
  Cuando inicio sesión desde un cuarto dispositivo
  Entonces el sistema invalida automáticamente la sesión menos recientemente activa
  Y crea la nueva sesión
  Y envía notificación al usuario: "Tu sesión más antigua fue cerrada automáticamente"
  Y registra SESSION_EVICTED en audit_log

Escenario 3: Límite configurable por política de admin
  Dado que el administrador actualiza la política de límite de sesiones
  Cuando el nuevo límite es inferior al número de sesiones activas de un usuario
  Entonces las sesiones más antiguas son revocadas hasta ajustarse al nuevo límite
```

**Componentes:**
- Backend: `SessionConcurrencyService` — política LRU para evicción
- Backend: config `session.max-concurrent=3` en `application.yml` (configurable por perfil)
- Backend: check en el login flow antes de emitir nuevo JWT
- Frontend: banner informativo cuando una sesión fue eviccionada

---

### US-105 — Notificaciones de seguridad por login inusual

**Como** usuario autenticado,
**quiero** recibir una notificación cuando se detecte un login desde un dispositivo o IP que no reconozco,
**para** tomar acción inmediata si no fui yo.

**Estimación:** 6 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Login desde nuevo dispositivo
  Dado que inicio sesión desde un dispositivo nunca visto antes (User-Agent diferente)
  Cuando el login 2FA es exitoso
  Entonces el sistema envía una notificación al email del usuario con:
    - Fecha y hora del acceso
    - Dispositivo aproximado (OS + browser)
    - IP enmascarada
    - Enlace "No fui yo → cerrar esta sesión"
  Y el email se envía en menos de 30 segundos

Escenario 2: Usuario confirma que fue él
  Dado que recibí la notificación de seguridad
  Cuando no hago nada (o hago click en "Sí fui yo")
  Entonces la sesión permanece activa y ese User-Agent queda en historial conocido

Escenario 3: Usuario deniega el acceso
  Dado que recibí la notificación de seguridad
  Cuando hago click en "No fui yo"
  Entonces el token de esa sesión es revocado inmediatamente (incluso sin login adicional)
  Y se registra SESSION_DENIED_BY_USER en audit_log
  Y el sistema sugiere cambiar contraseña y revisar 2FA

Escenario 4: Login desde misma IP y User-Agent conocido
  Dado que inicio sesión desde el mismo dispositivo que uso habitualmente
  Cuando el login es exitoso
  Entonces NO se envía notificación de seguridad (evitar fatiga de alertas)
```

**Componentes:**
- Backend: `LoginAnomalyDetector` — compara User-Agent + IP hasheada con historial
- Backend: `SecurityNotificationService` — integración con proveedor email (SendGrid/SES)
- Backend: tabla `known_devices` (user_id, device_fingerprint_hash, first_seen, last_seen)
- Backend: endpoint público `GET /api/v1/sessions/deny/{token}` — sin auth requerida (link en email)
- Frontend: página de confirmación de denegación de sesión
- Email: plantilla HTML transaccional corporativa Banco Meridian

---

## Estimación total

| US     | SP | Tipo        |
|--------|----|-------------|
| US-101 | 5  | new-feature |
| US-102 | 5  | new-feature |
| US-103 | 3  | new-feature |
| US-104 | 5  | new-feature |
| US-105 | 6  | new-feature |
| **Total** | **24 SP** | |

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| Módulo 2FA + JWT RS256 (FEAT-001) | Técnica | ✅ Disponible |
| Redis (ya activo para rate limiter) | Infraestructura | ✅ Disponible |
| Proveedor email transaccional | Infraestructura | ⏳ Por configurar (Sprint 3) |
| Tabla `user_sessions` (nueva) | BD | ⏳ Por crear |
| Tabla `known_devices` (nueva) | BD | ⏳ Por crear |
| Spec OpenAPI actualizada | Documentación | ⏳ Por generar en Sprint 3 |

---

## Riesgos FEAT-002

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F2-001 | Proveedor email no disponible en STG antes de US-105 | M | M | 🟡 Media | Configurar mock SMTP en STG; usar Mailtrap para tests |
| R-F2-002 | Colisión de User-Agent strings — falsos positivos en detector de dispositivos | M | B | 🟢 Baja | Usar hash combinado UA + IP subnet; umbral ajustable |
| R-F2-003 | Token blacklist Redis crece sin bounds (revocaciones acumuladas) | B | M | 🟢 Baja | TTL automático en Redis igual a session max lifetime |
| R-F2-004 | Enlace "No fui yo" en email explotable como DoS (cierre de sesión ajena) | B | A | 🟡 Media | Token HMAC firmado en el link; TTL 24h; un solo uso |

---

## Definition of Ready (DoR) — FEAT-002

- [x] Feature descrita con valor de negocio y criterios a nivel feature
- [x] Todas las US con criterios Gherkin
- [x] Estimación en SP consensuada
- [x] Dependencias identificadas y disponibles
- [x] Riesgos documentados con mitigación
- [x] Stack confirmado (Java/Spring Boot + Angular + Redis)
- [x] Aprobado por Product Owner (pendiente gate formal)

---

## Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| REQM | US con criterios Gherkin + trazabilidad a FEAT-002 |
| PP | Estimación SP, dependencias, risks identificados |
| PMC | DoD checklist, métricas definidas |
| VER | Criterios de code review y cobertura de tests |
| VAL | Criterios de aceptación validados por PO (gate) |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 3 Planning · 2026-04-14*
