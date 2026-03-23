# ADR-017 — Resilience4j para resiliencia de llamadas al core bancario

## Metadata

| Campo | Valor |
|---|---|
| ADR | ADR-017 |
| Feature | FEAT-009 / US-902 |
| Proyecto | BankPortal — Banco Meridian |
| Fecha | 2026-03-21 |
| Estado | Propuesto |
| Relacionado con | ADR-016 (saga local → compensación), RF-902 |

---

## Contexto

Con `BankCoreRestAdapter` (US-901) llamando al core bancario real mediante HTTP,
BankPortal queda expuesto a fallos de red, timeouts y errores transitorios del
core. Sin protección, un core degradado podría bloquear hilos indefinidamente,
aumentar la latencia para todos los usuarios y propagar el fallo en cascada.

Necesitamos tres mecanismos ortogonales: circuit breaker (corta el flujo cuando
el core está caído), retry (reintenta en errores transitorios de red) y timeout
(evita que hilos queden bloqueados indefinidamente).

---

## Decisión

**Se adopta Resilience4j** como librería de resiliencia para todas las llamadas
a `BankCoreRestAdapter`, usando las anotaciones `@CircuitBreaker`, `@Retry` y
`@TimeLimiter` con la configuración documentada en `ResilienceConfig.java`.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Resilience4j** (elegido) | Nativo Spring Boot 3 · anotaciones declarativas · métricas Actuator/Micrometer incluidas · bien mantenido · sin bloqueo de hilos (virtual threads compatible) | Curva de aprendizaje para tuning de parámetros |
| Spring Retry | Ya en el ecosistema Spring · simple para retry | No tiene circuit breaker nativo · sin TimeLimiter · métricas limitadas |
| Hystrix (Netflix) | Battle-tested en legacy | Discontinuado desde 2018 — no compatible con Spring Boot 3 |
| Manual (try/catch + ExecutorService) | Control total | Sin métricas · no mantenible · reinventar la rueda |

---

## Configuración adoptada

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      bankCore:
        slidingWindowSize: 10
        failureRateThreshold: 50        # Abre al 50% de fallos en 10 llamadas
        waitDurationInOpenState: 30s    # Permanece OPEN 30s antes de HALF-OPEN
        permittedNumberOfCallsInHalfOpenState: 3
        registerHealthIndicator: true
  retry:
    instances:
      bankCore:
        maxAttempts: 3                  # 1 intento original + 2 reintentos
        waitDuration: 500ms
        retryExceptions:
          - java.net.ConnectException
          - java.net.SocketTimeoutException
        ignoreExceptions:
          - org.springframework.web.client.HttpClientErrorException
  timelimiter:
    instances:
      bankCore:
        timeoutDuration: 5s
        cancelRunningFuture: true
```

## Consecuencias

**Positivas:**
- Métricas `resilience4j.circuitbreaker.*` expuestas automáticamente en `/actuator/metrics`
- El circuit breaker evita cascada de fallos si el core está caído
- Los reintentos con backoff resuelven errores transitorios de red sin intervención manual
- Compatible con Spring Boot 3.3 y Java 21 virtual threads

**Trade-offs:**
- Overhead mínimo (~1-5ms) por llamada — aceptable según RNF-F9-001 (target ≤ 10ms)
- La combinación CB + Retry + TimeLimiter requiere orden correcto de anotaciones:
  TimeLimiter → Retry → CircuitBreaker (de exterior a interior)

**Impacto en otros componentes:**
- `BankCoreRestAdapter`: añadir 3 anotaciones en métodos públicos
- `pom.xml`: añadir `io.github.resilience4j:resilience4j-spring-boot3`
- `application.yml`: bloque `resilience4j.*` en todos los perfiles

---

*ADR-017 — SOFIA Architect Agent — BankPortal Sprint 11 — 2026-03-21*
