# ADR-022 — Revocación de Sesiones JWT: Redis + PostgreSQL híbrido

## Metadata

| Campo | Valor |
|---|---|
| ID | ADR-022 |
| Feature | FEAT-012-A — US-1205 |
| Fecha | 2026-03-23 |
| Estado | Aceptado |
| Autor | SOFIA Architect Agent |

## Contexto

US-1205 permite al usuario revocar sesiones JWT activas antes de su expiración
natural. JWT es stateless por diseño — la revocación requiere un mecanismo externo
(blacklist). Se evalúan tres estrategias.

## Decisión

**Híbrido Redis (hot path) + PostgreSQL (audit trail):**
- Redis: `SET jti:{jti_value} "revoked" EX {remaining_ttl_seconds}` — verificación O(1)
- PostgreSQL `revoked_tokens`: registro permanente para auditoría y reporting

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Redis + PostgreSQL híbrido** | O(1) en hot path; sin carga en BD; audit trail completo | Dos escrituras al revocar; Redis ya existe en el proyecto |
| Solo PostgreSQL | Simple; un solo sistema | JOIN en cada request autenticada — inaceptable en p95 < 300ms |
| Solo Redis | Máxima velocidad | Sin audit trail; datos volátiles si Redis falla |

## Consecuencias

- **Positivas:** Hot path sin latencia adicional relevante (~0.5ms Redis local).
  Audit trail completo para compliance PCI-DSS.
- **Trade-offs:** Si Redis no está disponible, `RevokedTokenFilter` usa
  `failOpen` (permite la request) con log.warn — mantiene disponibilidad a
  costa de que un token revocado pueda pasar en ventana de indisponibilidad.
- **Riesgo:** `failOpen` debe ser configurable — flag `JWT_REVOCATION_FAIL_OPEN=true`
  documentado como decisión operacional a revisar con el cliente.
- **Impacto en servicios existentes:** Redis ya operativo (FEAT-007 + FEAT-009).
  Sin cambios en contratos existentes.
