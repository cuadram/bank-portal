# Análisis Funcional — FEAT-003: Dispositivos de Confianza
**Sprint 4 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V6 migración BD, trusted_devices tabla, US-201/203/204]*

---

## Contexto de negocio

La autenticación reforzada con OTP en cada login, aunque segura, genera fricción para
el uso cotidiano. Los dispositivos de confianza permiten al cliente marcar su dispositivo
habitual para omitir el OTP, mejorando la experiencia sin reducir la seguridad:
el dispositivo queda vinculado criptográficamente al cliente.

---

## FA-003-A — Registro de Dispositivo de Confianza

**Módulo:** Dispositivos de Confianza
**Actores:** Cliente
**Regulación:** PSD2 Art. 97 (SCA — excepción dispositivo registrado)

### Descripción funcional
Tras un login exitoso con OTP, el cliente puede marcar su dispositivo como de confianza.
BankPortal genera un token de confianza único vinculado a la huella digital del dispositivo
(User-Agent + subred IP) y lo almacena como cookie HttpOnly. El dispositivo queda
reconocido durante 30 días.

### Reglas de negocio
- **RN-F003-01:** El token de confianza se almacena como cookie HttpOnly; nunca en localStorage
- **RN-F003-02:** El token de confianza expira a los 30 días desde su creación; se renueva en cada uso
- **RN-F003-03:** Si el dispositivo cambia de red sustancialmente, se requiere re-verificación con OTP

---

## FA-003-B — Login sin OTP desde Dispositivo de Confianza

**Módulo:** Dispositivos de Confianza
**Actores:** Cliente
**Regulación:** PSD2 Art. 97 (excepción SCA — dispositivo registrado)

### Descripción funcional
Si el cliente accede desde un dispositivo de confianza válido, el paso de OTP se omite.
El sistema valida el token de confianza en la cookie, verifica la huella del dispositivo
y si ambos coinciden, concede acceso directo.

### Reglas de negocio
- **RN-F003-04:** Un usuario puede tener un máximo de 5 dispositivos de confianza activos simultáneamente

---

## FA-003-C — Revocación de Dispositivos de Confianza

**Módulo:** Dispositivos de Confianza
**Actores:** Cliente
**Regulación:** PCI-DSS Req. 8

### Descripción funcional
El cliente puede consultar el listado de dispositivos de confianza y revocar cualquiera
de ellos (o todos a la vez) desde el panel de seguridad. La revocación es inmediata.

### Reglas de negocio
- **RN-F003-05:** Un dispositivo revocado debe volver a completar el OTP en el siguiente login
- **RN-F003-06:** El cliente puede revocar todos sus dispositivos de confianza con una única acción
