# ADR-011 — Nuevo scope JWT "context-pending" para autenticación contextual

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-011 |
| **Feature** | FEAT-006 US-603 |
| **Sprint** | 7 · 2026-06-09 |
| **Estado** | Propuesto → Pendiente aprobación Tech Lead |
| **Relacionado** | ADR-002 (fases JWT), ADR-005 (RS256), ADR-007 (HMAC tokens), FEAT-006 |

---

## Contexto

FEAT-006 US-603 requiere que el sistema pueda detectar un login desde una subnet IP
no vista anteriormente y pedir confirmación por email antes de emitir el JWT completo.

El flujo actual tiene dos scopes JWT (ADR-002):
- `2fa-pending`: fase previa al OTP
- `full-session`: sesión completa

Para implementar el "login contextual" se necesita un estado intermedio: el usuario
ya superó el OTP correctamente, pero el sistema no puede emitir `full-session` porque
el contexto de red es desconocido. Durante ese intermedio, el usuario necesita un
token para poder llamar a `POST /api/v1/auth/confirm-context` cuando haga clic en el
enlace del email de confirmación.

---

## Decisión

**Añadir un tercer scope JWT: `context-pending`.**

| Scope | Emitido tras | TTL | Válido en |
|---|---|---|---|
| `2fa-pending` | Validar credenciales | 300s | `/enroll`, `/activate`, `/verify`, `/verify-recovery` |
| `context-pending` | OTP correcto pero subnet nueva | 900s (15 min) | **Solo** `/auth/confirm-context` |
| `full-session` | OTP correcto + subnet conocida (o contexto confirmado) | 3600s | Todos los demás endpoints |

### Claims adicionales en `context-pending`

```json
{
  "sub":           "uuid-del-usuario",
  "scope":         "context-pending",
  "jti":           "uuid-del-token",
  "pendingSubnet": "10.20",
  "iat":           1234567890,
  "exp":           1234568790
}
```

El claim `pendingSubnet` identifica la subnet que requiere confirmación. Al recibir el
token de email en `confirm-context`, el sistema verifica que la subnet actual del request
coincide con `pendingSubnet` antes de emitir `full-session`.

### Flujo completo US-603

```
POST /api/v1/2fa/verify (OTP correcto, subnet 10.20 desconocida)
  → Sistema verifica known_subnets: 10.20 no está en la tabla
  → Emite JWT context-pending (scope=context-pending, pendingSubnet="10.20", TTL 15min)
  → Envía email: "Nuevo acceso detectado — haz clic para confirmar"
  → Respuesta: { accessToken: "...", scope: "context-pending", contextConfirmationRequired: true }

(Usuario hace clic en el enlace del email)

POST /api/v1/auth/confirm-context
  Authorization: Bearer <context-pending JWT>
  Body: { confirmationToken: "<token HMAC del email>" }
  → Verificar: JWT scope=context-pending ✅
  → Verificar: token HMAC del email (TTL 15min, one-time use, patrón ADR-007) ✅
  → Verificar: subnet actual del request == pendingSubnet del JWT claim ✅
  → Insertar/actualizar known_subnets: subnet="10.20", confirmed=true
  → Revocar context-pending JWT (blacklist Redis)
  → Emite JWT full-session
  → audit_log: LOGIN_NEW_CONTEXT_CONFIRMED
```

### Impacto en SecurityFilterChain

```java
// Filtro de scope en JwtAuthenticationFilter:
String scope = jwt.getClaim("scope");
switch (scope) {
  case "2fa-pending"      -> allowedPaths = Set.of("/api/v1/2fa/enroll", "/api/v1/2fa/activate", ...);
  case "context-pending"  -> allowedPaths = Set.of("/api/v1/auth/confirm-context");  // NUEVO
  case "full-session"     -> allowedPaths = ALL_PROTECTED_PATHS;
  default                 -> throw UNAUTHORIZED;
}
```

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Nuevo scope `context-pending` (elegida)** ✅ | Consistente con el patrón ADR-002 · Permite filtrado explícito en SecurityFilterChain · El claim `pendingSubnet` es inspeccionable y auditable | Tercer scope → mayor complejidad en el filtro de seguridad |
| Estado en sesión Redis (sin JWT) | Sin cambios en JWT structure | Requiere almacenamiento de estado servidor + TTL Redis extra · Contradice el diseño stateless de la autenticación |
| URL firmada con HMAC (sin JWT) | Simple | El usuario necesita estar "autenticado" de alguna forma para llamar a `/confirm-context` — sin JWT no hay forma de identificar al usuario |
| Redirect directo en el enlace del email (sin endpoint) | Muy simple | No permite emitir JWT full-session desde el backend tras confirmación — requeriría segundo login |

---

## Consecuencias

### Positivas
- Flujo limpio y auditable: `context-pending` es un estado explícito en el JWT, visible en logs.
- Reutiliza el patrón ADR-007 (HMAC + TTL + one-time use) para el token de confirmación del email.
- El claim `pendingSubnet` permite verificar que el request de confirmación viene desde la misma red (defensa en profundidad).
- TTL de 15min es suficiente para que el usuario reciba y abra el email.

### Trade-offs
- `SecurityFilterChain` necesita manejar 3 scopes en lugar de 2. El switch es O(1) — sin impacto de rendimiento.
- Si el usuario no confirma en 15min, el `context-pending` JWT expira y debe iniciar login de nuevo. Aceptable.
- El claim `pendingSubnet` puede ser leído si el JWT es decodificado (no es secreto — Base64). No es PII sensible.

### Cambios en código requeridos

1. `JwtService.issueContextPending(userId, subnet)` — nuevo método
2. `JwtAuthenticationFilter` — añadir case `context-pending` con allowedPaths restringidos
3. `ConfirmContextController` — nuevo endpoint `POST /api/v1/auth/confirm-context`
4. `LoginContextUseCase` — verifica subnet, gestiona known_subnets, emite full-session
5. Flyway V8 — tabla `known_subnets` (ya incluida en el planning)

---

## Riesgo residual

| ID | Descripción | Mitigación |
|---|---|---|
| R-F6-002 | VPNs corporativas generan nueva subnet en cada sesión → falsos positivos | Whitelist de subnets corporativas configurable (`known_subnets.confirmed=true` inicial en el onboarding) |
| R-ADR011-01 | El claim `pendingSubnet` viaja en el JWT (decodificable) | La subnet es información de red no sensible — no es PII. No expone datos del usuario. |

---

*SOFIA Architect Agent · BankPortal · FEAT-006 · Sprint 7 · 2026-06-09*
*🔒 GATE: aprobación Tech Lead requerida antes de iniciar US-603*
