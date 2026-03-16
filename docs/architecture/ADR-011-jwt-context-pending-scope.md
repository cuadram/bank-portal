# ADR-011 — Nuevo scope JWT "context-pending" para Login Contextual

## Metadata

| Campo | Valor |
|---|---|
| **ADR ID** | ADR-011 |
| **Proyecto** | BankPortal — Banco Meridian |
| **Feature** | FEAT-006 — Autenticación Contextual |
| **Estado** | ✅ ACEPTADO — Tech Lead — 2026-06-09 |
| **Fecha** | 2026-06-09 |
| **Autor** | SOFIA Architect Agent |
| **Supersede** | ADR-003 (extiende — no sustituye) |

---

## Contexto

FEAT-006 US-603 introduce el concepto de "login contextual": cuando un usuario se autentica correctamente (credenciales + OTP) pero desde una subnet IP no reconocida, el sistema no debe emitir un JWT de sesión completa. En su lugar, debe emitir un token de "contexto pendiente" que solo permita acceder al endpoint de confirmación de contexto, hasta que el usuario confirme el nuevo contexto por email.

Esto requiere un nuevo scope JWT que el `SecurityFilterChain` entienda y que restrinja el acceso a todos los endpoints excepto `/auth/context/confirm`.

El ADR-003 definió los dos scopes existentes: `pre-auth` (2FA pendiente) y `full-session` (sesión completa). Este ADR añade un tercer scope intermedio.

---

## Decisión

### Nuevo scope: `context-pending`

| Atributo | Valor |
|---|---|
| **Claim `scope`** | `context-pending` |
| **TTL** | 900 segundos (15 minutos) |
| **Algoritmo firma** | RS256 (mismo keypair que `full-session`) |
| **Renovable** | No — debe solicitar nuevo email de confirmación si expira |
| **Blacklistable** | Sí — el `jti` se registra en Redis como `context-pending:jti` |

### Claims emitidos en JWT `context-pending`

```json
{
  "sub":            "<UUID del usuario>",
  "scope":          "context-pending",
  "jti":            "<UUID único del token>",
  "detectedSubnet": "10.20.x.x",
  "iat":            <timestamp emisión>,
  "exp":            <timestamp emisión + 900>
}
```

**Nota:** `twoFaEnabled` NO se incluye en `context-pending` — no es relevante y reduce la superficie de información en un token de vida corta.

### Endpoints accesibles con scope `context-pending`

| Endpoint | Método | Descripción |
|---|---|---|
| `POST /auth/context/confirm` | POST | Confirmar contexto nuevo (consume el token) |
| `POST /auth/context/resend` | POST | Reenviar email de confirmación |
| `GET /auth/context/status` | GET | Verificar estado del contexto (para polling frontend) |

**Todos los demás endpoints** devuelven `HTTP 403 Forbidden` con código `SCOPE_INSUFFICIENT` si reciben un JWT `context-pending`.

### Impacto en SecurityFilterChain

```java
// SecurityConfig.java — añadir antes del bloque full-session
.requestMatchers("/auth/context/**").hasAuthority("SCOPE_context-pending")
// Garantizar que context-pending NO puede acceder a recursos protegidos
.requestMatchers("/api/**").hasAuthority("SCOPE_full-session")
```

**Nota crítica:** El orden de los `requestMatchers` importa. `SCOPE_context-pending` debe declararse ANTES de `SCOPE_full-session` para que el match sea correcto. Un JWT `full-session` también puede acceder a `/auth/context/**` (para usuarios que vuelven a confirmar subnets desde sesión activa).

### Flujo completo

```
1. Usuario autenticado (credenciales + OTP ✅) desde subnet nueva
2. JwtService.issueContextPending(userId, detectedSubnet) → JWT context-pending
3. Frontend recibe JWT context-pending → redirige a pantalla de aviso
4. NotificationService envía email con enlace HMAC-SHA256 (TTL 15min)
5. Usuario hace clic en enlace:
   POST /auth/context/confirm?token=<hmac>
   Authorization: Bearer <jwt-context-pending>
6. ContextConfirmationService:
   a. Valida JWT context-pending (no expirado, no en blacklist)
   b. Valida token HMAC del email (TTL, one-time)
   c. Registra subnet como known_subnets[user_id] (confirmed=true)
   d. Invalida JWT context-pending en Redis blacklist
   e. Emite JWT full-session
7. audit_log: LOGIN_NEW_CONTEXT_CONFIRMED (userId, subnet, IP)
8. Frontend recibe JWT full-session → acceso normal
```

### Tabla conocida known_subnets (Flyway V8)

El scope `context-pending` siempre incluye la subnet detectada. La confirmación persiste en `known_subnets` con `confirmed=true`. Los logins posteriores desde esa subnet no activan el flujo contextual.

---

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| Usar sesión HTTP (cookie) en lugar de JWT para contexto pendiente | Rompe la arquitectura stateless. JWT es consistente con ADR-003. |
| Emitir JWT full-session directamente y bloquear a nivel de middleware | El middleware no puede revocar fácilmente. JWT con scope limitado es más seguro: si el token se filtra, el daño es mínimo. |
| Scope `pre-auth` ampliado con claim adicional | `pre-auth` tiene semántica diferente (2FA pendiente). Mezclar semánticas rompe la legibilidad. Mejor un scope explícito. |
| No usar JWT — solo sesión con estado | Incompatible con arquitectura actual (stateless, multi-réplica). |

---

## Consecuencias

### Positivas
- Seguridad: tokens de vida corta con permisos mínimos para el flujo contextual
- Trazabilidad: `detectedSubnet` en el JWT permite auditoría sin BD adicional para el flujo de confirmación
- Consistencia: el patrón de scopes JWT (pre-auth → context-pending → full-session) es ahora completo y documentado
- SecurityFilterChain limpio: cada scope mapea a un conjunto claro de endpoints

### Negativas / Riesgos
- Complejidad adicional en SecurityFilterChain: tercer scope a gestionar
- R-F6-003: el orden de `requestMatchers` debe ser correcto — test de integración obligatorio
- Frontend debe gestionar un tercer estado de autenticación (pantalla de contexto pendiente)

### Mitigaciones
- Test de integración `SecurityFilterChainContextPendingTest` — verificar que `full-session` no puede acceder a `/auth/context/confirm` con el scope incorrecto y viceversa
- LLD-006 (backend + frontend) documenta el flujo completo antes del primer commit

---

## Relación con otros ADRs

| ADR | Relación |
|---|---|
| ADR-003 | Extiende: añade `context-pending` al catálogo de scopes JWT |
| ADR-007 | Reutiliza: patrón token HMAC-SHA256 para enlace de confirmación email |
| ADR-006 | Independiente: rate limiting sigue aplicando sobre el endpoint `/auth/context/confirm` |

---

## Trazabilidad CMMI Nivel 3

| Área | Evidencia |
|---|---|
| REQM | US-603 criterios de aceptación cubiertos por este ADR |
| TS | Diseño técnico completo antes del código (gate LLD-006) |
| VER | Test `SecurityFilterChainContextPendingTest` como verificación formal |
| RSKM | R-F6-003 mitigado con test de integración obligatorio |

---

*Generado por SOFIA Architect Agent · BankPortal · 2026-06-09*
*✅ ACEPTADO — Tech Lead — 2026-06-09 · Gate: ADR-011 + LLD-006 + LLD-007 + LLD-frontend-config-history*
