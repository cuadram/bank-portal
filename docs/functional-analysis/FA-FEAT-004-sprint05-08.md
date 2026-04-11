# Análisis Funcional — FEAT-004: Centro de Notificaciones de Seguridad
**Sprints 5 y 8 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V7+V9 migraciones BD, user_notifications, notification_preferences, US-301/302/303/304/403]*

---

## Contexto de negocio

El cliente necesita estar informado de cualquier evento relevante de seguridad en su cuenta:
nuevos logins, cambios de configuración, intentos fallidos. El Centro de Notificaciones
centraliza estos alertas en la app con acciones directas, y permite al cliente personalizar
qué tipo de avisos desea recibir.

---

## FA-004-A — Historial de Notificaciones de Seguridad

**Módulo:** Notificaciones de Seguridad
**Actores:** Cliente
**Regulación:** PCI-DSS Req. 10 (trazabilidad de eventos de seguridad)

### Descripción funcional
El cliente accede a un listado cronológico de todas las notificaciones de seguridad de
su cuenta: logins desde nuevos dispositivos, cambios de contraseña, activaciones de 2FA,
intentos fallidos. Cada notificación incluye información contextual (dispositivo, IP
enmascarada, fecha) y un enlace de acción directa cuando aplica.

### Reglas de negocio
- **RN-F004-01:** Las notificaciones de seguridad se retienen durante 90 días
- **RN-F004-02:** Las notificaciones de severidad ALTA (login sospechoso, bloqueo) no pueden desactivarse por el cliente

---

## FA-004-B — Gestión de Notificaciones (Leídas / No Leídas)

**Módulo:** Notificaciones de Seguridad
**Actores:** Cliente
**Regulación:** GDPR (control sobre información propia)

### Descripción funcional
El cliente visualiza un contador de notificaciones no leídas (badge) en la app. Puede
marcar notificaciones como leídas individualmente o todas a la vez. El sistema diferencia
entre el registro de auditoría (inmutable) y las notificaciones visibles al usuario (gestionables).

### Reglas de negocio
- **RN-F004-03:** Marcar una notificación como leída NO elimina el registro del audit_log
- **RN-F004-04:** El badge de no leídas se actualiza en tiempo real

---

## FA-004-C — Acciones Directas desde Notificación

**Módulo:** Notificaciones de Seguridad
**Actores:** Cliente
**Regulación:** PSD2 Art. 97

### Descripción funcional
Las notificaciones críticas incluyen un botón de acción directa: revocar sesión,
cancelar operación, reportar fraude. El cliente puede actuar sobre el evento desde
la propia notificación sin navegar por la app.

### Reglas de negocio
- **RN-F004-05:** Las acciones directas desde notificación requieren que la sesión del cliente esté activa

---

## FA-004-D — Preferencias de Notificación por Canal

**Módulo:** Notificaciones de Seguridad
**Actores:** Cliente
**Regulación:** GDPR (consentimiento canales de comunicación)

### Descripción funcional
El cliente configura qué tipos de notificaciones desea recibir y por qué canales
(email, push, in-app). Los eventos de seguridad críticos (ACCOUNT_LOCKED, login
desde ubicación inusual) siempre se notifican independientemente de la configuración.

### Reglas de negocio
- **RN-F004-06:** Los eventos ACCOUNT_LOCKED y LOGIN_NEW_CONTEXT_DETECTED no pueden desactivarse
- **RN-F004-07:** La configuración de canales es independiente por tipo de evento (email / push / in-app)
