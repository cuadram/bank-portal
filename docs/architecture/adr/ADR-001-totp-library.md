# ADR-001 — Librería TOTP: dev.samstevens.totp vs implementación manual

## Metadata

| Campo      | Valor                                              |
|------------|----------------------------------------------------|
| Feature    | FEAT-001                                           |
| Fecha      | 2026-03-12                                         |
| Estado     | Aceptado                                           |
| Supersede  | —                                                  |

## Contexto

FEAT-001 requiere generación y validación de OTP TOTP conforme a RFC 6238, incluyendo generación de secretos Base32, construcción de URI `otpauth://`, renderizado de QR y tolerancia de ventana temporal. El proyecto ya tiene el stack mandatado (Spring Boot 3.x / Java 21). Se debe elegir entre implementar TOTP desde primitivas criptográficas (BouncyCastle + librería QR manual) o adoptar una librería especializada.

## Decisión

Usar **`dev.samstevens.totp:totp-spring-boot-starter`** como librería de TOTP. Esta librería está explícitamente mandatada en el SRS (RR-004) y provee integración nativa con Spring Boot vía auto-configuration.

## Opciones consideradas

| Opción                                   | Pros                                                                              | Contras                                                             |
|------------------------------------------|-----------------------------------------------------------------------------------|---------------------------------------------------------------------|
| **dev.samstevens.totp (elegida)**        | Auto-configuration Spring Boot · RFC 6238 completo · Genera QR · Mantenida activamente · Ya mandatada en SRS | Dependencia externa — riesgo si se abandona (mitigado: licencia MIT, activa) |
| Implementación manual (BouncyCastle)     | Control total · Sin dependencia adicional                                         | ~400 líneas de código criptográfico · alto riesgo de error de implementación · no auditado para PCI-DSS |

## Consecuencias

- **Positivas:** tiempo de implementación reducido; validación RFC 6238 probada; compatible Google Authenticator / Authy out-of-the-box.
- **Trade-offs:** dependencia en librería de tercero; requiere añadir al SBOM (Software Bill of Materials).
- **Riesgos:** si la librería queda sin mantenimiento → migración futura estimada en 2-3 días. Bajo riesgo a corto plazo.
- **Impacto en servicios existentes:** ninguno. Librería embebida solo en `backend-2fa`.
