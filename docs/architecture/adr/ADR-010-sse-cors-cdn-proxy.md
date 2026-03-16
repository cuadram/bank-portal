# ADR-010 — SSE con Spring Security y CDN/proxy en producción

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-010 |
| **Deuda** | DEBT-007 |
| **Sprint** | 6 · 2026-05-26 |
| **Estado** | Propuesto → Pendiente aprobación Tech Lead |
| **Relacionado** | FEAT-004 US-305 (SSE), ADR-008 (cookie HttpOnly) |

---

## Contexto

`NotificationController.streamNotifications()` expone `GET /api/v1/notifications/stream`
produciendo `text/event-stream`. En STG funciona correctamente porque el cliente Angular
y el servidor comparten el mismo origen.

En producción, la arquitectura incluye:
1. **CDN (Cloudflare / Akamai):** almacena en caché por defecto todos los GET — SSE no es
   cacheable pero el CDN puede cerrar conexiones largas con timeout de 100s.
2. **Nginx proxy inverso:** hace buffering de responses HTTP por defecto — SSE requiere
   `X-Accel-Buffering: no` para streaming real.
3. **Spring Security:** el `SecurityFilterChain` puede cerrar el thread de la respuesta
   antes de que el `SseEmitter` complete, especialmente con `SessionManagementFilter`.

Estos tres factores combinados producen que los eventos SSE lleguen al cliente con retraso
variable o que la conexión se cierre prematuramente sin reconexión automática.

---

## Decisión

**Tres configuraciones coordinadas: Spring Security + Nginx header + CDN bypass.**

### 1. Spring Security — deshabilitar SessionManagementFilter para el endpoint SSE

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        // ... configuración existente ...
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // Endpoint SSE excluido del CSRF (es GET, ya protegido por JWT)
        .csrf(csrf -> csrf
            .ignoringRequestMatchers("/api/v1/notifications/stream"))
        // Permitir keep-alive largo en el endpoint SSE
        .headers(headers -> headers
            .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
            .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true)));
    return http.build();
}
```

### 2. Nginx — deshabilitar buffering para el endpoint SSE

```nginx
location /api/v1/notifications/stream {
    proxy_pass         http://bankportal-backend;
    proxy_http_version 1.1;
    proxy_set_header   Connection "";          # keep-alive
    proxy_buffering    off;                    # streaming real
    proxy_read_timeout 600s;                  # 10 min — mayor que el timeout SseEmitter (5 min)
    proxy_cache        off;
    add_header         X-Accel-Buffering no;  # señal a CDN de capa superior
    add_header         Cache-Control "no-cache, no-store";
}
```

### 3. CDN — excluir el endpoint SSE del caché

En Cloudflare (o equivalente):
```
Page Rule: api.bankportal.meridian.com/api/v1/notifications/stream
  Cache Level: Bypass
  Rocket Loader: Off
  Response Buffering: Off
```

### 4. Spring — header en la respuesta SSE

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamNotifications(
        @AuthenticationPrincipal Jwt jwt,
        HttpServletResponse response) {
    // Señal explícita a todos los proxies intermedios
    response.setHeader("X-Accel-Buffering", "no");
    response.setHeader("Cache-Control", "no-cache, no-store");
    response.setHeader("Connection", "keep-alive");

    UUID userId = UUID.fromString(jwt.getSubject());
    return sseRegistry.register(userId);
}
```

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Configuración coordinada (elegida)** ✅ | Funciona con cualquier CDN · headers estándar · sin cambio de protocolo | Requiere coordinación con equipo de infraestructura para regla CDN |
| WebSocket en lugar de SSE | Bidireccional · amplio soporte | Cambio mayor de arquitectura · requiere STOMP o similar · mayor complejidad |
| Long polling de fallback completo | Sin dependencia de SSE | Mayor carga en servidor · latencia mayor · ya implementado como backup (R-F4-003) |
| gRPC streaming | Muy eficiente | Requiere soporte del CDN · no soportado en todos los navegadores sin proxy |

---

## Consecuencias

### Positivas
- SSE funciona en producción con CDN/proxy sin cambio de protocolo.
- El polling fallback de 60s (R-F4-003, ya implementado) actúa como red de seguridad si alguna capa intermedia sigue bloqueando.
- Los headers `X-Accel-Buffering: no` y `Cache-Control: no-cache` son estándar y compatibles con todos los CDN principales.

### Trade-offs
- Requiere una regla de CDN adicional — coordinación con el equipo de operaciones de Banco Meridian.
- El timeout de Nginx (600s) debe ser mayor que el timeout del `SseEmitter` (300s) — si se cambia uno hay que actualizar el otro.

### Riesgo residual
- Si el equipo de infraestructura no puede modificar la regla de CDN en tiempo, el polling fallback (60s) garantiza que el badge se actualiza — solo los toasts en tiempo real se ven afectados. Impacto: bajo.

---

## Runbook de verificación en STG

```bash
# 1. Verificar que el endpoint responde como event-stream
curl -N -H "Authorization: Bearer <token>" \
  https://api-staging.bankportal.meridian.com/api/v1/notifications/stream

# 2. Verificar headers de respuesta
curl -I -H "Authorization: Bearer <token>" \
  https://api-staging.bankportal.meridian.com/api/v1/notifications/stream \
  | grep -E "Content-Type|X-Accel-Buffering|Cache-Control"
# Expected:
#   Content-Type: text/event-stream;charset=UTF-8
#   X-Accel-Buffering: no
#   Cache-Control: no-cache, no-store

# 3. Verificar que la conexión se mantiene > 60s
timeout 70 curl -N ... | head -c 500
```

---

*SOFIA Architect Agent · BankPortal · DEBT-007 · Sprint 6 · 2026-05-26*
*🔒 GATE: aprobación Tech Lead requerida antes de iniciar DEBT-007*
