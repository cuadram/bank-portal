# ADR-002 — Patrón pre-auth token para flujo login 2FA step-up

## Metadata

| Campo      | Valor                                              |
|------------|----------------------------------------------------|
| Feature    | FEAT-001                                           |
| Fecha      | 2026-03-12                                         |
| Estado     | Aceptado                                           |
| Supersede  | —                                                  |

## Contexto

Cuando un usuario con 2FA activo se autentica con credenciales correctas, el sistema debe suspender la emisión del JWT de acceso completo hasta que el segundo factor sea verificado. Se necesita un mecanismo para mantener el estado de "credenciales validadas, 2FA pendiente" entre la llamada a `/auth/login` y la llamada a `/2fa/verify`. Hay dos opciones principales: sesión temporal en servidor (stateful) o token provisional (stateless).

## Decisión

Usar un **pre-auth token**: JWT firmado de corta duración (TTL = 5 minutos) con el claim adicional `pre_auth: true`. El token identifica al usuario pero no otorga acceso a recursos protegidos. El endpoint `/2fa/verify` valida este token antes de proceder.

## Opciones consideradas

| Opción                           | Pros                                                                          | Contras                                                                     |
|----------------------------------|-------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| **Pre-auth token JWT (elegida)** | Stateless — sin estado en servidor · Escalable horizontalmente · TTL corto (5min) — auto-expira · Consistente con el modelo JWT existente del proyecto | El token viaja en la respuesta HTTP — riesgo mitigado por TLS + corta duración |
| Sesión temporal en Redis         | No viaja en cliente · Revocación inmediata posible                            | Introduce dependencia de Redis no existente · Estado en servidor · Complejidad operacional |

## Consecuencias

- **Positivas:** el Auth Service existente emite el pre-auth token con el mismo mecanismo que el JWT completo — mínima modificación del flujo de autenticación. El frontend simplemente discrimina por presencia del campo `pre_auth_token` en la respuesta.
- **Trade-offs:** el pre-auth token no puede revocarse antes de su expiración si no hay Redis. Mitigado por el TTL de 5 minutos.
- **Riesgos:** si el frontend no limpia el pre-auth token de sessionStorage tras la verificación, podría reutilizarse en la misma sesión de navegador. Mitigado: `AuthInterceptor` limpia sessionStorage en cada verificación exitosa o fallida.
- **Impacto en servicios existentes:** `POST /api/v1/auth/login` modifica su respuesta (campo adicional condicional). La respuesta sigue siendo retrocompatible — clientes sin 2FA reciben el campo `access_token` como antes.
