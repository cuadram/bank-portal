# Análisis Funcional — FEAT-006: Bloqueo de Cuenta y Autenticación Contextual
**Sprint 7 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V8 migración BD, AccountLockUseCase.java, AccountUnlockUseCase.java, US-601/602/603]*

---

## Contexto de negocio

La protección ante ataques de fuerza bruta es obligatoria en cualquier sistema bancario.
Este módulo implementa el bloqueo automático de cuenta tras intentos fallidos repetidos
de OTP, junto con un mecanismo seguro de desbloqueo por email y la autenticación contextual
basada en subredes IP conocidas.

---

## FA-006-A — Bloqueo Automático de Cuenta por Intentos Fallidos

**Módulo:** Autenticación / Seguridad
**Actores:** Sistema (automático)
**Regulación:** PCI-DSS Req. 8.3 (bloqueo tras 6 intentos; BankPortal configura N)

### Descripción funcional
Si un cliente supera el número máximo de intentos fallidos de OTP en una ventana de
24 horas, su cuenta queda bloqueada automáticamente. El bloqueo es inmediato y afecta
a todos los canales de acceso. El cliente recibe una notificación por email.

### Reglas de negocio
- **RN-F006-01:** El contador de intentos fallidos se resetea al hacer login exitoso o al desbloquear la cuenta
- **RN-F006-02:** La cuenta bloqueada no puede acceder a ningún servicio de BankPortal hasta ser desbloqueada

---

## FA-006-B — Desbloqueo de Cuenta por Email

**Módulo:** Autenticación / Seguridad
**Actores:** Cliente (via email)
**Regulación:** PCI-DSS Req. 8

### Descripción funcional
El cliente desbloquea su cuenta haciendo clic en el enlace seguro recibido por email.
El enlace contiene un token HMAC de un solo uso con TTL de 1 hora. Una vez usado,
el contador de intentos se resetea y la cuenta vuelve al estado activo.

### Reglas de negocio
- **RN-F006-03:** El token de desbloqueo es de un único uso y expira en 1 hora
- **RN-F006-04:** El desbloqueo por email no requiere que el cliente recuerde su contraseña

---

## FA-006-C — Autenticación Contextual por Subred IP

**Módulo:** Autenticación Contextual
**Actores:** Sistema (automático), Cliente
**Regulación:** PSD2 (autenticación basada en riesgo)

### Descripción funcional
El sistema mantiene un registro de subredes IP confirmadas por el cliente. Los accesos
desde subredes conocidas tienen menor fricción; los accesos desde subredes desconocidas
generan alerta y pueden requerir verificación adicional.

### Reglas de negocio
- **RN-F006-05:** Las preferencias de notificación del cliente no pueden desactivar las alertas de acceso desde ubicación inusual
