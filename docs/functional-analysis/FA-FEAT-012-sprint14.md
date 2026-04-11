# Análisis Funcional — FEAT-012: Gestión de Perfil de Usuario
**Sprint 14 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V14 migración BD, UpdateProfileUseCase.java, ChangePasswordUseCase.java, US-1201/1202/1203/1204/1205]*

---

## Contexto de negocio

El cliente gestiona sus datos personales y preferencias de seguridad desde su perfil.
El módulo cubre la actualización de datos de contacto, el cambio de contraseña con
política de historial, las preferencias de notificación y la revocación explícita
de sesiones (tokens JWT).

---

## FA-012-A — Consulta y Actualización de Datos Personales

**Módulo:** Perfil
**Actores:** Cliente
**Regulación:** GDPR Art. 16 (derecho de rectificación)

### Descripción funcional
El cliente consulta y actualiza sus datos personales de contacto: teléfono móvil,
dirección postal y país. Los cambios se propagan al Core Banking para mantener la
consistencia.

### Reglas de negocio
- **RN-F012-01:** El email del cliente no puede modificarse desde BankPortal; requiere trámite presencial en oficina
- **RN-F012-02:** El número de teléfono móvil debe ser verificado antes de ser usado para 2FA por SMS

---

## FA-012-B — Cambio de Contraseña con Historial

**Módulo:** Perfil / Seguridad
**Actores:** Cliente
**Regulación:** PCI-DSS Req. 8.3

### Descripción funcional
El cliente cambia su contraseña de acceso. BankPortal verifica que la nueva contraseña
cumple la política de complejidad y que no coincide con ninguna de las últimas 3
contraseñas usadas. Tras el cambio exitoso, todas las sesiones activas (excepto la
actual) quedan revocadas.

### Reglas de negocio
- **RN-F012-03:** La nueva contraseña no puede coincidir con ninguna de las 3 anteriores
- **RN-F012-04:** El cambio de contraseña revoca automáticamente todas las sesiones activas excepto la actual

---

## FA-012-C — Gestión de Preferencias de Comunicación

**Módulo:** Perfil / Notificaciones
**Actores:** Cliente
**Regulación:** GDPR (consentimiento comunicaciones)

### Descripción funcional
El cliente configura sus preferencias de comunicación: canales habilitados (email, push,
in-app) y tipos de notificaciones deseadas. Las alertas de seguridad críticas no pueden
desactivarse.

### Reglas de negocio
- **RN-F012-05:** Las preferencias de comunicación se aplican a todos los módulos de BankPortal
- **RN-F012-06:** Desactivar el canal push no cancela la suscripción VAPID; solo deja de recibir notificaciones

---

## FA-012-D — Revocación de Tokens Activos

**Módulo:** Perfil / Seguridad
**Actores:** Cliente
**Regulación:** PCI-DSS Req. 8.2, PSD2

### Descripción funcional
El cliente puede revocar explícitamente tokens JWT activos (por ejemplo, tras detectar
acceso no autorizado). La revocación es inmediata y afecta al JWT tanto en Redis
(hot path) como en la tabla de revocados en base de datos (audit trail PCI-DSS).

### Reglas de negocio
- **RN-F012-07:** Los JWTs revocados se verifican en tiempo O(1) mediante Redis blacklist; la BD es el registro de auditoría
