# ADR-006 — Redis como token blacklist y estructura de concurrencia LRU de sesiones

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-006 |
| **Feature** | FEAT-002 — Gestión Avanzada de Sesiones |
| **Fecha** | 2026-04-14 |
| **Estado** | Propuesto |
| **Supersede** | — |
| **Relacionado** | ADR-001 (JWT RS256), DEBT-001 (Bucket4j + Redis) |

---

## Contexto

FEAT-002 requiere dos capacidades que necesitan decisión arquitectónica:

1. **Revocación inmediata de JWT**: el estándar JWT es stateless — una vez emitido, un token
   es válido hasta su expiración. Para revocar sesiones de forma inmediata necesitamos
   un mecanismo de blacklist que invalide JWTs individuales sin esperar su TTL natural.

2. **Control de sesiones concurrentes**: el sistema debe limitar el número máximo de
   sesiones activas por usuario (PCI-DSS req. 8.2) y aplicar política LRU cuando se
   supera el límite. Esto requiere un contador de sesiones activas con consistencia
   fuerte para evitar race conditions en entornos multi-réplica.

Redis ya está en el stack (DEBT-001: Bucket4j para rate limiting). La pregunta es si
extender su uso para estos dos nuevos requisitos o introducir un mecanismo alternativo.

---

## Decisión

**Usar Redis como almacén de estado de sesiones** con dos estructuras diferenciadas:
- `sessions:blacklist:{jti}` → SET con TTL igual al tiempo restante del JWT
- `sessions:active:{userId}:{jti}` → HASH con metadata de la sesión + TTL de inactividad

El control de concurrencia LRU se implementa mediante consulta a `user_sessions` en
PostgreSQL (fuente de verdad) en el momento del login, sin contador Redis separado.
La revocación se refleja tanto en Redis (blacklist) como en PostgreSQL (`revoked_at`).

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Redis blacklist + PostgreSQL como fuente de verdad** ✅ | Redis ya en stack · Latencia O(1) para check blacklist · PostgreSQL mantiene historial completo · TTL automático en Redis evita acumulación infinita | Dos fuentes deben mantenerse en sincronía · Redis es caché, no durable sin persistencia configurada |
| Solo PostgreSQL (table scan en cada request) | Única fuente de verdad · Durabilidad total | Latencia inaceptable para check en cada request autenticada · No escala con volumen de usuarios |
| JWT de corto TTL sin blacklist (5 min) | Stateless puro | Ventana de 5 min antes de que una sesión revocada deje de ser válida — inaceptable para caso "No fui yo" |
| Introducir Hazelcast o Infinispan | Caché distribuido in-memory con strong consistency | Añade nueva dependencia no existente en el stack · Complejidad operacional injustificada cuando Redis ya está disponible |

---

## Consecuencias

### Positivas
- Revocación de sesión efectiva en la siguiente request (< 10ms para check en Redis).
- Reutiliza la infraestructura Redis ya operativa — sin nueva dependencia.
- TTL automático en `sessions:blacklist:{jti}` garantiza que las entradas expiradas
  se limpian solas — sin job de limpieza.
- PostgreSQL mantiene el historial completo de sesiones para auditoría CMMI/PCI-DSS.

### Trade-offs
- Redis no es durable por defecto: si Redis reinicia sin AOF/RDB configurado, la blacklist
  se pierde. **Mitigación:** configurar `appendonly yes` en Redis de producción (ya documentado
  en runbook de DEBT-001). Los JWTs no revocados en Redis pero marcados en PostgreSQL
  quedan válidos hasta su TTL natural (máx. 60 min) — riesgo aceptado y documentado.
- Consistencia eventual entre Redis y PostgreSQL: si Redis falla entre la escritura en
  blacklist y la actualización en PostgreSQL, la sesión puede quedar en estado inconsistente.
  **Mitigación:** el `TokenBlacklistFilter` siempre comprueba Redis primero; si Redis no
  está disponible, falla abierto (la request pasa) — la sesión en PostgreSQL aparece como
  revocada en el listado de UI aunque el JWT siga siendo técnicamente válido.

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Redis down → blacklist perdida | Baja (HA configurada) | AOF en Redis PROD · Health check en Kubernetes |
| Acumulación de entradas en blacklist | Muy baja | TTL automático = session max lifetime |
| Race condition en concurrencia LRU | Baja | Consulta a PostgreSQL con SELECT FOR UPDATE en login |

### Impacto en servicios existentes
- `JwtService` (existente): añadir `jti` (UUID) como claim en el JWT emitido — cambio
  compatible hacia atrás porque es un claim adicional, no una modificación de claims
  existentes. Los clientes que ignoran `jti` no se ven afectados.
- `TokenBlacklistFilter` (nuevo): `OncePerRequestFilter` registrado **antes** del
  `JwtAuthenticationFilter` existente — sin modificación del filtro actual.
- Rate limiter Redis (DEBT-001): namespace independiente — sin colisión.

---

## Implementación de referencia

```java
// SessionRedisAdapter.java
@Component
@RequiredArgsConstructor
public class SessionRedisAdapter {

    private final RedisTemplate<String, String> redisTemplate;

    public void addToBlacklist(String jti, Duration remainingTtl) {
        redisTemplate.opsForValue().set(
            "sessions:blacklist:" + jti,
            "1",
            remainingTtl
        );
    }

    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey("sessions:blacklist:" + jti)
        );
    }

    public void setActiveSession(String userId, String jti,
                                  String metadata, Duration ttl) {
        redisTemplate.opsForValue().set(
            "sessions:active:" + userId + ":" + jti,
            metadata,
            ttl
        );
    }

    public void removeActiveSession(String userId, String jti) {
        redisTemplate.delete("sessions:active:" + userId + ":" + jti);
    }
}

// TokenBlacklistFilter.java
@Component
@RequiredArgsConstructor
public class TokenBlacklistFilter extends OncePerRequestFilter {

    private final SessionRedisAdapter sessionRedisAdapter;
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = extractBearerToken(request);
        if (token != null) {
            String jti = jwtService.extractJti(token);
            if (jti != null && sessionRedisAdapter.isBlacklisted(jti)) {
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("""
                    {"code":"SESSION_REVOKED","message":"Esta sesión ha sido revocada."}
                """);
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

---

## Configuración Redis requerida en producción

```yaml
# redis.conf — producción (ya configurado en DEBT-001 runbook)
appendonly yes          # AOF para durabilidad
appendfsync everysec    # Balance rendimiento/durabilidad
maxmemory-policy allkeys-lru  # Evicción LRU si se llena la memoria
```

---

*Generado por SOFIA Architect Agent · BankPortal · FEAT-002 · 2026-04-14*
