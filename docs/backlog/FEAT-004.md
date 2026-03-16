# FEAT-004 — Centro de Notificaciones de Seguridad

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-004 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Seguridad y Control de Acceso |
| Solicitante | Seguridad TI + UX — Banco Meridian |
| Fecha creación | 2026-05-09 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Rama git | `feature/FEAT-004-notification-center` |

---

## Descripción de negocio

Con FEAT-001 (2FA), FEAT-002 (sesiones) y FEAT-003 (dispositivos de confianza) en producción,
el portal genera múltiples eventos de seguridad relevantes para el usuario: logins desde nuevos
dispositivos, sesiones revocadas, dispositivos de confianza añadidos/eliminados, intentos fallidos
de autenticación, etc.

Actualmente estos eventos se envían por email de forma individual (US-105) pero el usuario no tiene
un panel centralizado donde verlos, filtrarlos o marcarlos como leídos. FEAT-004 crea ese Centro de
Notificaciones: un historial de seguridad persistente, consultable y accionable desde el portal.

---

## Objetivo y valor de negocio

- **Visibilidad completa**: el usuario ve toda la actividad de seguridad de su cuenta en un solo lugar
- **Reducción de fatiga de alertas**: en lugar de emails individuales, el usuario consulta el centro cuando quiere
- **Accionabilidad**: desde cada notificación el usuario puede ir directamente a la acción correctiva (revocar sesión, eliminar dispositivo, cambiar contraseña)
- **Cumplimiento PCI-DSS 4.0 req. 10.7**: registro consultable de eventos de seguridad por el titular de la cuenta
- **KPI**: tasa de apertura del centro de notificaciones ≥ 30% en 30 días · tasa de acciones correctivas desde notificaciones ≥ 10%

---

## Alcance funcional

### Incluido en FEAT-004
- Historial de eventos de seguridad paginado (últimos 90 días)
- Filtrado por tipo de evento y estado (leído/no leído)
- Marcado individual y masivo como leído
- Badge de notificaciones no leídas en el header del portal
- Acción directa desde notificación (deep-link a sesión, dispositivo, etc.)
- Notificaciones en tiempo real vía Server-Sent Events (SSE) para eventos críticos

### Excluido (backlog futuro)
- Notificaciones push móvil (requiere app nativa — backlog largo plazo)
- Configuración granular de preferencias de notificación por canal — backlog futuro
- Notificaciones transaccionales bancarias (movimientos, transferencias) — fuera del scope de seguridad

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| `audit_log` tabla inmutable (V4) | BD | ✅ Disponible |
| FEAT-001/002/003 eventos generados | Código | ✅ Operativos |
| `SecurityNotificationAdapter` (FEAT-002) | Código | ✅ Extensible |
| Tabla `user_notifications` (nueva) | BD | ⏳ Flyway V7 — Sprint 5 |
| SSE endpoint Spring (nuevo) | Código | ⏳ Sprint 5 |

---

## User Stories

| ID | Título | SP | Prioridad |
|---|---|---|---|
| US-301 | Ver historial de notificaciones de seguridad | 4 | Must Have |
| US-302 | Marcar notificaciones como leídas | 2 | Must Have |
| US-303 | Badge de notificaciones no leídas en header | 3 | Must Have |
| US-304 | Acciones directas desde notificación | 4 | Should Have |
| US-305 | Notificaciones en tiempo real vía SSE | 3 | Should Have |

**Total estimado: 16 SP**

---

### US-301 — Ver historial de notificaciones

**Como** usuario autenticado,
**quiero** ver el historial de eventos de seguridad de mi cuenta,
**para** tener visibilidad completa de la actividad y detectar accesos no autorizados.

**Estimación:** 4 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Listar notificaciones paginadas
  Dado que tengo eventos de seguridad registrados en los últimos 90 días
  Cuando accedo a "Seguridad → Notificaciones"
  Entonces veo una lista paginada (20 por página) con:
    - Tipo de evento (icono + etiqueta: "Nuevo login", "Sesión cerrada", etc.)
    - Fecha y hora del evento
    - Dispositivo y IP enmascarada (cuando aplica)
    - Estado: leído / no leído (punto azul)
  Y las notificaciones están ordenadas por fecha DESC

Escenario 2: Filtrar por tipo de evento
  Dado que tengo múltiples tipos de notificaciones
  Cuando selecciono el filtro "Solo logins"
  Entonces veo solo eventos de tipo LOGIN y TRUSTED_DEVICE_LOGIN
  Y el contador refleja el total filtrado

Escenario 3: Sin notificaciones
  Dado que no hay eventos en los últimos 90 días
  Cuando accedo a "Seguridad → Notificaciones"
  Entonces veo un estado vacío con mensaje informativo
```

---

### US-302 — Marcar notificaciones como leídas

**Como** usuario autenticado,
**quiero** marcar notificaciones como leídas individualmente o todas a la vez,
**para** distinguir qué eventos ya he revisado.

**Estimación:** 2 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Marcar individual como leída
  Dado que tengo notificaciones no leídas
  Cuando hago clic en una notificación
  Entonces se marca como leída automáticamente (punto azul desaparece)
  Y el badge del header se decrementa en 1

Escenario 2: Marcar todas como leídas
  Dado que tengo múltiples notificaciones no leídas
  Cuando selecciono "Marcar todas como leídas"
  Entonces todas las notificaciones quedan en estado leído
  Y el badge del header muestra 0

Escenario 3: Estado persiste entre sesiones
  Dado que marqué notificaciones como leídas en una sesión
  Cuando inicio sesión desde otro dispositivo
  Entonces las mismas notificaciones siguen marcadas como leídas
```

---

### US-303 — Badge de notificaciones en header

**Como** usuario autenticado,
**quiero** ver un badge con el número de notificaciones no leídas en el header del portal,
**para** saber en todo momento si hay alertas pendientes de revisar.

**Estimación:** 3 SP | **Prioridad:** Must Have

#### Criterios de aceptación

```gherkin
Escenario 1: Badge visible con notificaciones pendientes
  Dado que tengo 3 notificaciones no leídas
  Cuando navego por cualquier página del portal
  Entonces el icono de notificaciones en el header muestra el badge "3"
  Y el badge es visible en contraste con el fondo del header (WCAG 2.1 AA)

Escenario 2: Badge desaparece cuando todo está leído
  Dado que marco todas las notificaciones como leídas
  Entonces el badge desaparece del header

Escenario 3: Badge se actualiza en tiempo real
  Dado que llega un nuevo evento de seguridad (SSE)
  Cuando el usuario está navegando el portal
  Entonces el badge se incrementa automáticamente sin recargar la página
```

---

### US-304 — Acciones directas desde notificación

**Como** usuario autenticado,
**quiero** poder actuar directamente desde una notificación de seguridad,
**para** responder rápidamente sin tener que navegar manualmente al panel correcto.

**Estimación:** 4 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Deep-link a sesión desde notificación de login
  Dado que recibo una notificación de "Nuevo login desde dispositivo desconocido"
  Cuando hago clic en "Ver sesión"
  Entonces navego directamente al panel de sesiones con esa sesión resaltada

Escenario 2: Revocar directamente desde notificación
  Dado que una notificación indica sesión activa sospechosa
  Cuando hago clic en "Cerrar esta sesión"
  Entonces el modal de confirmación OTP aparece directamente
  Y al confirmar la sesión queda revocada sin abandonar el centro de notificaciones

Escenario 3: Deep-link a dispositivo de confianza
  Dado que recibo notificación de "Dispositivo de confianza añadido"
  Cuando hago clic en "Ver dispositivos"
  Entonces navego al panel de dispositivos de confianza
```

---

### US-305 — Notificaciones en tiempo real vía SSE

**Como** usuario autenticado con el portal abierto,
**quiero** recibir alertas de seguridad en tiempo real sin recargar la página,
**para** reaccionar inmediatamente ante eventos críticos.

**Estimación:** 3 SP | **Prioridad:** Should Have

#### Criterios de aceptación

```gherkin
Escenario 1: Toast en tiempo real ante evento crítico
  Dado que tengo el portal abierto en mi navegador
  Cuando se produce un login desde un nuevo dispositivo
  Entonces aparece un toast de alerta en la esquina superior derecha
  Y el toast muestra: tipo de evento, dispositivo, IP y botón de acción
  Y el toast desaparece automáticamente tras 8 segundos (o al hacer clic en X)

Escenario 2: Badge se actualiza en tiempo real
  Dado que estoy navegando el portal
  Cuando llega un evento de seguridad vía SSE
  Entonces el badge del header se incrementa sin recargar la página

Escenario 3: Reconexión automática tras pérdida de conexión
  Dado que la conexión SSE se interrumpe (red inestable)
  Cuando la red se recupera
  Entonces el cliente reconecta automáticamente en <= 5 segundos
  Y no se pierden eventos (el servidor reenvía los eventos perdidos)
```

---

## Riesgos FEAT-004

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F4-001 | SSE connections abiertas consumen threads en el servidor | M | M | 🟡 Media | Usar Spring WebFlux reactive o `SseEmitter` con pool limitado; límite de 1 conexión SSE por usuario |
| R-F4-002 | `user_notifications` table crece sin límite (90 días de retención) | B | B | 🟢 Baja | Job nocturno @Scheduled que elimina notificaciones > 90 días (mismo patrón US-204) |
| R-F4-003 | Badge incorrecto si la sesión SSE se desconecta | M | B | 🟢 Baja | Polling de fallback cada 60s si SSE no está disponible |
| R-F4-004 | Deep-links en US-304 generan navegación fuera de contexto en mobile | B | B | 🟢 Baja | Detectar viewport < 768px y abrir panel en lugar de navegar |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio
- [x] 5 US con criterios Gherkin completos
- [x] Estimación en SP: 16 SP
- [x] Dependencias identificadas (FEAT-001/002/003 ✅, tabla nueva ⏳)
- [x] Riesgos documentados con mitigación
- [x] Stack confirmado: Java/Spring Boot + Angular + SSE

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 5 Planning · 2026-05-09*
