# ADR-001 — Elección de librería TOTP para Java/Spring Boot

## Metadata
| Campo | Valor |
|---|---|
| **Feature** | FEAT-001 | **Fecha** | 2026-03-14 |
| **Estado** | Aceptado |
| **Supersede** | — |

## Contexto
El microservicio `backend-2fa` requiere una implementación TOTP (RFC 6238) en Java 17 con Spring Boot 3.x.
La librería debe ser compatible con Spring Boot 3 (Jakarta EE, no javax), mantenida activamente
y capaz de generar secretos, QR URIs y verificar códigos con tolerancia de período configurable.

## Decisión
**Usar `dev.samstevens.totp:totp-spring-boot-starter:1.7.1`**

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **`dev.samstevens.totp` (elegida)** | Spring Boot starter nativo, autoconfiguration, soporte Jakarta EE, QR URI integrada, tolerancia configurable | Librería de comunidad (no Apache/Spring oficial) |
| `google-auth-java-client` | Respaldada por Google, estable | Sin Spring integration, sin QR URI, más configuración manual |
| Implementación propia RFC 6238 | Control total | Alto riesgo de error en implementación de seguridad — nunca hacer crypto from scratch |

## Consecuencias
- **Positivas:** integración limpia con Spring Boot 3, mínimo código boilerplate, soporte TOTP/HOTP
- **Trade-offs:** dependencia de librería de comunidad — requiere monitoreo de versiones y CVEs
- **Mitigación:** fijar versión exacta en pom.xml, revisar en cada sprint si hay actualizaciones de seguridad
- **Impacto en servicios existentes:** ninguno — librería nueva en servicio nuevo

---

# ADR-002 — Estrategia de cifrado de secretos TOTP en base de datos

## Metadata
| Campo | Valor |
|---|---|
| **Feature** | FEAT-001 | **Fecha** | 2026-03-14 |
| **Estado** | Aceptado |

## Contexto
Los secretos TOTP deben persistirse en base de datos para verificar OTPs en cada login.
A diferencia de las contraseñas (que se hashean), los secretos TOTP deben ser **recuperables**
(para poder verificar el OTP del usuario), lo que excluye el uso de hash unidireccional.
Esto implica cifrado simétrico reversible. PCI-DSS req. 8.4 e ISO 27001 A.9.4 exigen
protección fuerte de credenciales de autenticación.

## Decisión
**Cifrado simétrico AES-256-GCM con clave gestionada via variable de entorno `TOTP_ENCRYPTION_KEY`**

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **AES-256-GCM (elegida)** | Estándar de industria, authenticated encryption (integridad + confidencialidad), Spring Security Crypto lo soporta | Clave debe rotarse periódicamente — proceso de re-cifrado requerido |
| AES-256-CBC | Ampliamente soportado | Sin autenticación de integridad — vulnerable a bit-flipping attacks |
| Vault / KMS externo | Rotación automática de claves, auditoría de acceso a claves | Dependencia externa — fuera del alcance de FEAT-001; candidato para fase 2 |

## Consecuencias
- **Positivas:** GCM detecta manipulación del ciphertext (autenticado), rendimiento óptimo
- **Trade-offs:** gestión de `TOTP_ENCRYPTION_KEY` es responsabilidad del equipo DevOps — rotación manual
- **Riesgos:** si la clave se compromete, todos los secretos quedan expuestos — mitigación: secreto en Kubernetes Secret / Jenkins Credential, nunca en código
- **Impacto en servicios existentes:** ninguno

---

# ADR-003 — Modelo de sesión en dos fases (JWT parcial → JWT completo)

## Metadata
| Campo | Valor |
|---|---|
| **Feature** | FEAT-001 | **Fecha** | 2026-03-14 |
| **Estado** | Aceptado |

## Contexto
El flujo de login con 2FA requiere dos pasos: primero verificar contraseña, luego verificar OTP.
Se necesita un mecanismo para que el backend-2fa sepa que el usuario ya pasó el paso 1 (contraseña válida)
sin que ese estado otorgue acceso completo al sistema.

## Decisión
**JWT de sesión parcial con claim `scope: "2fa-pending"` emitido por el módulo JWT tras credenciales válidas.
backend-2fa valida este JWT parcial, verifica el OTP y emite un JWT de sesión completa con `scope: "full-session"`.**

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **JWT en dos fases (elegida)** | Stateless, alineado con arquitectura JWT existente, TTL corto en JWT parcial (5 min), sin estado en servidor | Dos claves JWT a gestionar (`JWT_PARTIAL_SECRET` / `JWT_FULL_SECRET`) |
| Sesión en Redis | Estado explícito, fácil revocación | Introduce dependencia de Redis — nueva infraestructura no planificada en FEAT-001 |
| Un único JWT con estado en BD | Simple | Stateful — contradice la arquitectura JWT del proyecto, acoplamiento a BD en cada request |

## Consecuencias
- **Positivas:** stateless, escalable horizontalmente, TTL corto en JWT parcial limita la ventana de ataque
- **Trade-offs:** si el JWT parcial es robado en la ventana de 5 min, el atacante puede intentar brute-force OTP (mitigado por rate limiting de 5 intentos)
- **Impacto en servicios existentes:** el módulo JWT existente debe emitir el claim `scope: "2fa-pending"` — cambio mínimo y no breaking

---

# ADR-004 — Rate limiting: capa de aplicación vs API Gateway

## Metadata
| Campo | Valor |
|---|---|
| **Feature** | FEAT-001 | **Fecha** | 2026-03-14 |
| **Estado** | Aceptado |

## Contexto
El endpoint `/api/2fa/verify` debe limitarse a 5 intentos fallidos por usuario+IP para
prevenir ataques de brute-force sobre OTPs. Se debe decidir dónde implementar este control.

## Decisión
**Implementar rate limiting en la capa de aplicación de `backend-2fa` usando Bucket4j,
con almacenamiento del contador en memoria (Caffeine cache) para FEAT-001.**

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Bucket4j en capa de aplicación (elegida)** | Sin dependencias externas, implementación rápida, lógica de negocio cerca del dominio | No distribuido — si hay múltiples instancias del servicio, el contador no se comparte |
| API Gateway (Kong, Nginx rate limit) | Centralizado, distribuido nativamente | Dependencia de infraestructura no disponible en FEAT-001; configuración fuera del alcance del developer |
| Redis + Bucket4j distribuido | Distribuido, preciso con múltiples instancias | Introduce Redis — nueva dependencia de infraestructura no planificada |

## Consecuencias
- **Positivas:** implementación en sprint 1 sin dependencias nuevas de infraestructura
- **Trade-offs:** si `backend-2fa` escala a múltiples réplicas, el rate limiting no es compartido entre pods
- **Mitigación fase 2:** migrar a Bucket4j + Redis cuando se produzca el primer escalado horizontal
- **Riesgo aceptado:** en FEAT-001, el servicio corre en réplica única — el riesgo es mínimo y aceptado por Tech Lead
- **Impacto en servicios existentes:** ninguno

---

*Generado por SOFIA Architect Agent — 2026-03-14*
*Estado: Aceptados — 🔒 Pendiente ratificación Tech Lead*
