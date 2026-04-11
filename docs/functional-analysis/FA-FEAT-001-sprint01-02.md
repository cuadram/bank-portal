# Análisis Funcional — FEAT-001: Autenticación de Doble Factor TOTP
**Sprints 1–2 · v1.1.0–v1.2.0 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V1–V4 migraciones BD, TwoFactorService.java, RecoveryCodeGeneratorService.java, pom.xml FEAT-001]*

---

## Contexto de negocio

El punto de partida de BankPortal es garantizar que solo los clientes legítimos acceden
a sus datos financieros. El módulo de autenticación implementa el segundo factor mediante
TOTP (Time-based One-Time Password, RFC 6238), estándar abierto compatible con apps
autenticadoras (Google Authenticator, Microsoft Authenticator, etc.).

Junto al 2FA, el módulo incorpora un registro de auditoría inmutable de todos los eventos
de autenticación, cumpliendo PCI-DSS requisito 10.7 (retención mínima 12 meses).

---

## FA-001-A — Registro y Activación del Segundo Factor

**Módulo:** Autenticación / 2FA
**Actores:** Cliente
**Regulación:** PSD2 Art. 97 (SCA), PCI-DSS Req. 8

### Descripción funcional
El cliente activa el segundo factor de autenticación desde su perfil de seguridad.
BankPortal genera un secreto TOTP cifrado (AES-256-CBC) que el cliente vincula
escaneando un código QR con su app autenticadora. Desde ese momento, el login
requiere el código OTP generado por la app.

### Flujo principal
1. Cliente accede a Seguridad → Activar segundo factor
2. BankPortal genera un secreto TOTP y lo muestra como QR
3. Cliente escanea el QR con su app autenticadora
4. Cliente introduce el primer OTP para confirmar la vinculación
5. 2FA queda activado; secreto almacenado cifrado en la base de datos

### Reglas de negocio
- **RN-F001-01:** El secreto TOTP se almacena siempre cifrado (AES-256-CBC); nunca en claro
- **RN-F001-02:** El OTP es válido durante 30 segundos; se admite un margen de ±1 período

---

## FA-001-B — Códigos de Recuperación

**Módulo:** Autenticación / 2FA
**Actores:** Cliente
**Regulación:** PCI-DSS Req. 8

### Descripción funcional
Al activar el 2FA, BankPortal genera un conjunto de códigos de recuperación de un solo
uso. El cliente los guarda de forma segura y puede usarlos si pierde acceso a su app
autenticadora.

### Reglas de negocio
- **RN-F001-03:** Los códigos de recuperación se almacenan hasheados con BCrypt (cost=10); nunca en claro
- **RN-F001-04:** Cada código de recuperación solo puede usarse una única vez

---

## FA-001-C — Registro de Auditoría de Autenticación

**Módulo:** Auditoría
**Actores:** Sistema (automático)
**Regulación:** PCI-DSS Req. 10.7 (retención ≥ 12 meses)

### Descripción funcional
Cada evento de autenticación (éxito, fallo, bloqueo) queda registrado de forma inmutable
en el log de auditoría. El registro incluye el tipo de evento, dirección IP, user-agent
y resultado. La tabla es INSERT-only: no se permite UPDATE ni DELETE.

### Reglas de negocio
- **RN-F001-05:** El audit_log es inmutable: no se permiten UPDATE ni DELETE
- **RN-F001-06:** Los registros incluyen siempre IP, user-agent, timestamp UTC y resultado (SUCCESS/FAILURE/BLOCKED)
