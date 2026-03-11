# FEAT-001 — Login con autenticación de dos factores (2FA) por email

## Metadata
| Campo | Valor |
|---|---|
| ID | FEAT-001 |
| Tipo | Feature |
| Épica | EPIC-001 — Seguridad y Autenticación |
| Prioridad | Alta |
| Solicitado por | Product Owner — Banco Meridian |
| Fecha de solicitud | 2025-01-15 |

## Descripción de negocio

Banco Meridian requiere que todos los usuarios del portal bancario
verifiquen su identidad con un segundo factor de autenticación al iniciar
sesión. El segundo factor será un código OTP de 6 dígitos enviado al email
registrado del usuario, con una validez de 5 minutos.

## Valor de negocio

Reducir el riesgo de accesos no autorizados a cuentas bancarias.
Cumplir con regulación de seguridad financiera (PSD2 / SCA).

## Criterios de alto nivel

- El usuario recibe el código OTP por email tras ingresar usuario y contraseña
- El código tiene validez de 5 minutos y un solo uso
- Tras 3 intentos fallidos la cuenta se bloquea temporalmente (15 minutos)
- El flujo debe ser accesible (WCAG 2.1 AA)
- El tiempo total del flujo de login no debe superar 30 segundos (p95)

## Restricciones conocidas

- El proveedor de email ya está contratado: SendGrid
- El backend debe ser Java/Spring Boot
- El frontend debe ser Angular
- No se puede modificar el modelo de base de datos de usuarios existente
  (solo agregar columnas nuevas)

## Dependencias

- Servicio de autenticación existente: `auth-service` (ya en producción)
- Tabla `users` en PostgreSQL (esquema actual documentado en Confluence)
