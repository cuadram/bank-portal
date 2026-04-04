# Análisis Funcional — FEAT-005: Login en Tiempo Real y Contexto de Seguridad
**Sprint 6 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: SseEvent.java, SseRegistry.java, LoginContextUseCase.java, AccountAndContextController.java]*

---

## Contexto de negocio

Para reforzar la experiencia de seguridad sin interrumpir el flujo del usuario, BankPortal
implementa actualizaciones en tiempo real mediante Server-Sent Events (SSE). El cliente
recibe en la app notificaciones instantáneas de eventos de seguridad sin necesidad de
refrescar, y el sistema detecta logins desde contextos geográficos o de red inusuales.

---

## FA-005-A — Notificaciones de Seguridad en Tiempo Real (SSE)

**Módulo:** Autenticación / Notificaciones
**Actores:** Cliente (app activa), Sistema
**Regulación:** PSD2 Art. 97

### Descripción funcional
Mientras el cliente tiene la app abierta, BankPortal mantiene un canal SSE activo.
Cuando ocurre un evento de seguridad relevante (nuevo login desde otro dispositivo,
intento fallido, cambio de configuración), la notificación aparece de forma inmediata
en la interfaz del cliente sin necesidad de polling.

### Reglas de negocio
- **RN-F005-01:** El canal SSE se cierra automáticamente si la sesión expira
- **RN-F005-02:** El sistema soporta un máximo de 500 conexiones SSE simultáneas (límite operativo)

---

## FA-005-B — Detección de Login desde Contexto Inusual

**Módulo:** Autenticación Contextual
**Actores:** Sistema (automático), Cliente
**Regulación:** PSD2 Art. 97 (SCA — autenticación basada en riesgo)

### Descripción funcional
El sistema registra las subredes IP habituales del cliente. Si se detecta un login
desde una subred desconocida, se genera una notificación de seguridad y se puede
exigir verificación adicional según la política de riesgo. El cliente puede confirmar
o denegar el acceso desde el email recibido.

### Reglas de negocio
- **RN-F005-03:** Una subred se considera conocida tras ser confirmada explícitamente por el cliente
- **RN-F005-04:** Los logins desde subredes desconocidas siempre generan notificación, independientemente de las preferencias
