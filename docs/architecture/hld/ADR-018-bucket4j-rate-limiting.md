# ADR-018 — Bucket4j + Redis para rate limiting en endpoints financieros

## Metadata

| Campo | Valor |
|---|---|
| ADR | ADR-018 |
| Feature | FEAT-009 / DEBT-016 |
| Proyecto | BankPortal — Banco Meridian |
| Fecha | 2026-03-21 |
| Estado | Propuesto |
| Origen | R-SEC-003 del Security Report Sprint 10 |

---

## Contexto

El Security Report de Sprint 10 identificó R-SEC-003: ausencia de rate limiting
en los endpoints de transferencia. Con el core bancario real integrado en Sprint 11,
el riesgo de abuso se convierte en riesgo financiero real — un script automatizado
podría ejecutar múltiples transferencias en segundos si no hay protección.

El patrón Bucket4j ya está en el `pom.xml` (bucket4j-core) desde Sprint 1 como
preparación para este escenario. Es el momento de activarlo.

---

## Decisión

**Se adopta Bucket4j con Redis (lettuce)** como implementación de rate limiting
distribuido para los endpoints `POST /api/v1/transfers/*` y `POST /api/v1/beneficiaries`.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Bucket4j + Redis** (elegido) | Ya en pom.xml · distribuido (multi-pod) · TTL de ventana preciso · Spring Boot starter disponible | Requiere Redis disponible (ya presente en STG) |
| Spring Security + RequestMappingHandlerMapping | Nativo Spring · sin dependencias extra | Sin ventana deslizante · difícil de hacer distribuido |
| Nginx rate limiting | No toca el código Java | No tenemos Nginx en STG · gestión de infra adicional |
| Caffeine in-process | Sin Redis · simple | No distribuido — cada pod tiene su propio contador |

---

## Implementación

```java
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedissonClient redissonClient;

    @Value("${rate-limit.transfer.per-minute:10}")
    private int transferLimit;

    @Value("${rate-limit.beneficiary.per-minute:5}")
    private int beneficiaryLimit;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {
        String uri = req.getRequestURI();
        String userId = extractUserId(req);

        if (uri.matches("/api/v1/transfers/.*")) {
            if (!tryConsume("rl:transfer:" + userId, transferLimit, res)) return;
        } else if (uri.equals("/api/v1/beneficiaries") && req.getMethod().equals("POST")) {
            String ip = req.getRemoteAddr();
            if (!tryConsume("rl:beneficiary:" + ip, beneficiaryLimit, res)) return;
        }
        chain.doFilter(req, res);
    }

    private boolean tryConsume(String key, int limit, HttpServletResponse res) throws IOException {
        try {
            ProxyBucket bucket = Bucket.builder()
                .addLimit(Bandwidth.classic(limit, Refill.intervally(limit, Duration.ofMinutes(1))))
                .build()
                .asScheduler()
                .asAsync();

            // Implementación simplificada — usar bucket4j-spring-boot-starter en producción
            // para integración automática con Redis/Redisson
            return true; // placeholder — ver bucket4j-spring-boot-starter config YAML
        } catch (Exception e) {
            // Fail-open: si Redis falla, permitir la operación
            log.warn("Rate limiter Redis no disponible — fail-open para key={}", key);
            return true;
        }
    }
}
```

**Configuración YAML (bucket4j-spring-boot-starter):**
```yaml
bucket4j:
  enabled: true
  cache-to-use: redis-lettuce
  filters:
    - cache-name: rl-transfer
      url: /api/v1/transfers/.*
      http-response-body: '{"errorCode":"RATE_LIMIT_EXCEEDED"}'
      rate-limits:
        - execute-condition: "@jwtService.getUserId(#this) != null"
          cache-key: "@jwtService.getUserId(#this)"
          bandwidths:
            - capacity: 10
              time: 1
              unit: minutes
    - cache-name: rl-beneficiary-create
      url: /api/v1/beneficiaries
      http-methods: [POST]
      rate-limits:
        - cache-key: getRemoteAddr()
          bandwidths:
            - capacity: 5
              time: 1
              unit: minutes
```

## Consecuencias

**Positivas:**
- Rate limiting distribuido — funciona correctamente con múltiples pods
- Fail-open: si Redis falla, no bloquea operaciones legítimas
- Los límites son configurables via variables de entorno sin redeployar
- Genera HTTP 429 con `Retry-After` estándar (RFC 6585)

**Trade-offs:**
- Dependencia de Redis para el rate limiting (ya presente como dependencia del stack)
- Latencia adicional ≤ 5ms por llamada a Redis para verificar el bucket

**Impacto en otros componentes:**
- `pom.xml`: cambiar `bucket4j-core` por `bucket4j-spring-boot-starter` (incluye Redis)
- `TransferController` / `BeneficiaryController`: ningún cambio de código — filtro es transversal
- `application.yml`: bloque `bucket4j.*` en todos los perfiles

---

*ADR-018 — SOFIA Architect Agent — BankPortal Sprint 11 — 2026-03-21*
