# FEAT-001 — Autenticación de Doble Factor (2FA)

## Metadata

| Campo            | Valor                                      |
|------------------|--------------------------------------------|
| Feature ID       | FEAT-001                                   |
| Proyecto         | BankPortal — Banco Meridian                |
| Prioridad        | CRÍTICA                                    |
| Estado           | READY FOR SPRINT                           |
| Epic             | Seguridad y Control de Acceso              |
| Solicitante      | Seguridad TI — Banco Meridian              |
| Fecha creación   | 2026-03-11                                 |
| Stack            | Java/Spring Boot (backend) + Angular (frontend) |

---

## Descripción de negocio

Banco Meridian requiere implementar autenticación de doble factor (2FA) basada en TOTP
(Time-based One-Time Password, RFC 6238) en el portal bancario digital. Esta capacidad
es obligatoria para cumplir con los estándares PCI-DSS 4.0 (req. 8.4) y la regulación
bancaria vigente sobre accesos a sistemas críticos.

El usuario podrá activar/desactivar 2FA desde su perfil, vincular una aplicación
autenticadora (Google Authenticator / Authy), y disponer de códigos de recuperación
en caso de pérdida de dispositivo.

---

## Objetivo y valor de negocio

- **Reducción de riesgo**: mitigar accesos no autorizados por robo de credenciales
- **Cumplimiento normativo**: PCI-DSS 4.0 req. 8.4, ISO 27001 A.9.4
- **Confianza del cliente**: reforzar la percepción de seguridad del portal digital
- **KPI**: tasa de adopción 2FA ≥ 60% en 90 días post-lanzamiento

---

## Alcance funcional

### Incluido en FEAT-001
- Enrolamiento 2FA con generación de QR (TOTP/HOTP)
- Verificación de código OTP en flujo de login
- Generación y gestión de códigos de recuperación (one-time)
- Desactivación de 2FA con re-autenticación de contraseña
- Registro de auditoría de eventos 2FA

### Excluido (fuera de alcance)
- 2FA por SMS (OTP via mensaje de texto) — backlog futuro
- 2FA por biometría — backlog futuro
- Gestión de dispositivos de confianza — backlog futuro

---

## User Stories

| ID     | Título                                      | SP | Prioridad |
|--------|---------------------------------------------|----|-----------|
| US-001 | Activar 2FA con TOTP (enrolamiento)         | 8  | Must Have |
| US-002 | Verificar OTP en flujo de login             | 8  | Must Have |
| US-003 | Generar y gestionar códigos de recuperación | 5  | Must Have |
| US-004 | Desactivar 2FA con confirmación             | 5  | Should Have |
| US-005 | Auditoría de eventos 2FA                    | 5  | Should Have |
| US-006 | Setup de infraestructura TOTP               | 3  | Must Have |
| US-007 | Tests de integración end-to-end 2FA         | 6  | Must Have |

**Total estimado: 40 SP**

---

## Criterios de aceptación (nivel Feature)

- [ ] Un usuario autenticado puede activar 2FA y obtener un QR para su app autenticadora
- [ ] El login con 2FA activo exige código OTP válido (ventana ±30 s, tolerancia ±1 período)
- [ ] Se generan 10 códigos de recuperación de un solo uso al activar 2FA
- [ ] Un usuario puede desactivar 2FA confirmando su contraseña actual
- [ ] Todos los eventos 2FA quedan registrados en la tabla de auditoría con IP, timestamp y resultado
- [ ] Los secretos TOTP se almacenan cifrados (AES-256) en base de datos
- [ ] Los endpoints 2FA están protegidos por JWT y requieren sesión activa
- [ ] El frontend muestra estado 2FA (activo/inactivo) en el panel de perfil

---

## Dependencias

| Dependencia                  | Tipo     | Estado    |
|------------------------------|----------|-----------|
| Módulo de autenticación JWT  | Técnica  | ✅ Disponible |
| Tabla `users` en BD          | Técnica  | ✅ Disponible |
| Librería `java-totp` (JJWT)  | Técnica  | ⏳ Por configurar |
| Diseño UI (pantallas 2FA)    | UX/UI    | ⏳ Por validar |
| Certificado SSL/TLS endpoint | Infra    | ✅ Disponible |

---

## Riesgos identificados

| Riesgo                              | Probabilidad | Impacto | Mitigación                          |
|-------------------------------------|-------------|---------|-------------------------------------|
| Desincronización de reloj TOTP      | Media        | Alto    | Implementar tolerancia de ±1 período |
| Pérdida de dispositivo sin recovery | Baja         | Alto    | Obligar descarga de códigos backup   |
| Brute-force en endpoint /verify     | Media        | Alto    | Rate limiting + bloqueo tras 5 fallos |

---

## Definition of Ready (DoR) — FEAT-001

- [x] Feature descrita con criterios de aceptación claros
- [x] User stories identificadas y estimadas en SP
- [x] Dependencias técnicas identificadas
- [x] Riesgos documentados
- [x] Stack tecnológico confirmado (Java/Spring Boot + Angular)
- [x] Aprobado por Product Owner
