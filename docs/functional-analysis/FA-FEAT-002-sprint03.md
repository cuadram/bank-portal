# Análisis Funcional — FEAT-002: Gestión Avanzada de Sesiones
**Sprint 3 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V5 migración BD, CreateSessionOnLoginUseCase.java, DenySessionByLinkUseCase.java, ListActiveSessionsUseCase.java]*

---

## Contexto de negocio

El cliente necesita visibilidad y control sobre todos los accesos activos a su cuenta.
Este módulo permite ver qué dispositivos tienen sesión activa, cerrar sesiones remotamente
e invalidar accesos sospechosos con un solo clic desde un enlace de email.

---

## FA-002-A — Consulta de Sesiones Activas

**Módulo:** Sesiones
**Actores:** Cliente
**Regulación:** PCI-DSS Req. 8.2

### Descripción funcional
El cliente visualiza todas las sesiones activas en su cuenta: dispositivo, navegador,
dirección IP (enmascarada) y momento del último acceso. Puede identificar sesiones
desconocidas y actuar sobre ellas.

### Reglas de negocio
- **RN-F002-01:** Las direcciones IP se muestran enmascaradas (nunca la IP completa visible al cliente)
- **RN-F002-02:** El token de sesión nunca se almacena en claro; solo su hash SHA-256

---

## FA-002-B — Cierre Remoto de Sesión

**Módulo:** Sesiones
**Actores:** Cliente
**Regulación:** PCI-DSS Req. 8.2

### Descripción funcional
El cliente puede cerrar cualquier sesión activa de forma remota. El cierre es inmediato:
el token queda revocado y el dispositivo afectado pierde el acceso en la próxima
petición autenticada.

### Reglas de negocio
- **RN-F002-03:** El cierre de sesión es irreversible e inmediato
- **RN-F002-04:** El cliente puede cerrar todas las sesiones excepto la propia (para evitar bloqueo)

---

## FA-002-C — Invalidación de Sesión por Enlace de Email

**Módulo:** Sesiones
**Actores:** Cliente (via email)
**Regulación:** PSD2 Art. 97

### Descripción funcional
Cuando se detecta un login desde un dispositivo desconocido, BankPortal envía al cliente
un email con un enlace de "denegar acceso". Al hacer clic, la sesión queda revocada
inmediatamente, sin necesidad de acceder a la app.

### Reglas de negocio
- **RN-F002-05:** El enlace de denegación es de un solo uso y tiene TTL de 1 hora
- **RN-F002-06:** El timeout de sesión por inactividad es configurable por el cliente entre 5 y 60 minutos (máx. PCI-DSS)
