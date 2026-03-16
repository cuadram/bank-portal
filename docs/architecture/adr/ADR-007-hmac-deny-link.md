# ADR-007 — HMAC firmado para enlace "No fui yo" en alertas de seguridad

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-007 |
| **Feature** | FEAT-002 — US-105 Notificaciones de login inusual |
| **Fecha** | 2026-04-14 |
| **Estado** | Propuesto |
| **Relacionado** | ADR-006, R-F2-004 (riesgo DoS por link) |

---

## Contexto

US-105 requiere un enlace "No fui yo" en el email de alerta de seguridad que,
al ser clicado, revoca la sesión sospechosa sin requerir autenticación del usuario
(porque puede que no sea él quien inició esa sesión).

Esto plantea un riesgo de seguridad: si el token del enlace es predecible o
reutilizable, un atacante podría usarlo para revocar sesiones de otros usuarios
(DoS sobre cuentas) o para obtener información sobre la existencia de sesiones.

---

## Decisión

Usar **HMAC-SHA256** para firmar el token del enlace de denegación, con las
siguientes propiedades de seguridad:

```
denyToken = Base64URL( HMAC-SHA256(key=SESSION_DENY_LINK_HMAC_KEY,
                                    data="{jti}:{userId}:{expiresAt}") )
```

El token se incluye en la URL: `/api/v1/sessions/deny/{denyToken}`

El endpoint verifica:
1. La firma HMAC con la clave secreta del servidor
2. Que `expiresAt` no ha pasado (TTL 24h)
3. Que el token no ha sido usado antes (SET en Redis con TTL 24h)

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **HMAC-SHA256 con TTL + one-time** ✅ | No requiere almacenamiento de tokens · Verificable sin BD · Protege contra replay | Requiere clave secreta configurada en el servidor |
| UUID aleatorio almacenado en BD | Simple de implementar | Requiere tabla adicional · Cleanup periódico |
| JWT firmado con RS256 | Infraestructura ya disponible | Overhead para un caso de uso simple · TTL largo en JWT problemático |
| Sin protección (URL con sessionId directo) | Más simple | Cualquiera con el link puede revocar cualquier sesión → inaceptable |

---

## Consecuencias

### Positivas
- Sin tabla adicional en BD.
- Verificación stateless del HMAC + verificación Redis de one-time use.
- TTL corto (24h) limita la ventana de explotación.

### Trade-offs
- Si `SESSION_DENY_LINK_HMAC_KEY` rota, todos los links pendientes quedan inválidos.
  **Mitigación:** rotación coordinada con ventana de gracia (24h).

### Impacto en servicios existentes
- Ninguno. Endpoint público nuevo `/api/v1/sessions/deny/{token}` sin auth.

---

*Generado por SOFIA Architect Agent · BankPortal · FEAT-002 · 2026-04-14*
