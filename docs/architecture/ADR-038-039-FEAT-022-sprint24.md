# ADRs — FEAT-022: Bizum P2P
**Sprint 24 · BankPortal · Banco Meridian · SOFIA v2.7**

---

## ADR-038 — CoreBanking Mock SEPA Instant: respuesta síncrona en STG

**Estado:** ACEPTADO  
**Fecha:** 2026-04-14  
**Autores:** Architect Agent · Tech Lead

### Contexto
FEAT-022 requiere liquidación SEPA Instant (SCT Inst) para los pagos Bizum. En producción real, SEPA Instant se procesa en <10s vía la red EBA CLEARING/RT1 o STET. En el entorno STG de BankPortal no existe conexión real al sistema Bizum/Redsys. El patrón del proyecto (precedente ADR-035 préstamos, ADR-037 depósitos) es usar un mock CoreBanking para STG.

### Decisión
`CoreBankingMockBizumClient` implementa `SepaInstantPort` con respuesta **síncrona inmediata** (<100ms) que devuelve siempre `status: COMPLETED` con referencia `BIZUM-{uuid}`. El adaptador se anota con `@Primary` sin `@Profile` para ser activo en todos los entornos salvo que se inyecte un adaptador real.

```java
@Primary
@Component
public class CoreBankingMockBizumClient implements SepaInstantPort {
    @Override
    public SepaInstantResult executeTransfer(String debtorIban, String creditorPhone,
                                              BigDecimal amount, String concept) {
        return SepaInstantResult.builder()
            .status(TransferStatus.COMPLETED)
            .reference("BIZUM-" + UUID.randomUUID())
            .completedAt(Instant.now())
            .build();
    }
}
```

### Consecuencias
- ✅ STG funciona sin infraestructura SEPA real
- ✅ Patrón consistente con ADR-035/037
- ⚠️ El mock no valida límites de red ni TTL real SEPA — cubierto por `BizumLimitService`
- ⚠️ En producción real deberá sustituirse por el adaptador Redsys/Bizum — DEBT-047

---

## ADR-039 — Redis rate limit: key pattern canónico por feature

**Estado:** ACEPTADO  
**Fecha:** 2026-04-14  
**Autores:** Architect Agent · Tech Lead

### Contexto
DEBT-046 detectó que los contadores Redis de rate limiting usaban patrones de key inconsistentes entre features (OTP, exportación, ahora Bizum), lo que generaba riesgo de colisiones y dificultad de depuración. Además, el TTL de los contadores no estaba alineado con el reset diario a medianoche UTC.

### Decisión
Key pattern canónico para todos los rate limiters del proyecto:

```
ratelimit:{userId}:{feature}:{yyyy-MM-dd}
```

Ejemplos:
```
ratelimit:550e8400-e29b-41d4-a716-446655440000:bizum:2026-04-14
ratelimit:550e8400-e29b-41d4-a716-446655440000:export:2026-04-14
ratelimit:550e8400-e29b-41d4-a716-446655440000:otp:2026-04-14
```

TTL: calculado como segundos hasta 00:00:00 UTC del día siguiente.

```java
@Component
public class BizumRateLimitAdapter {
    private static final String KEY_PATTERN = "ratelimit:%s:bizum:%s";

    public BigDecimal getDailyUsed(UUID userId) {
        String key = String.format(KEY_PATTERN, userId, LocalDate.now(ZoneOffset.UTC));
        // Ejemplo real: "ratelimit:{userId}:bizum:2026-04-14"
        String val = redisTemplate.opsForValue().get(key);
        return val == null ? BigDecimal.ZERO : new BigDecimal(val);
    }

    public void increment(UUID userId, BigDecimal amount) {
        String key = String.format(KEY_PATTERN, userId, LocalDate.now(ZoneOffset.UTC));
        redisTemplate.opsForValue().increment(key, amount.longValue());
        // TTL hasta medianoche UTC
        long secondsToMidnight = ChronoUnit.SECONDS.between(
            Instant.now(), LocalDate.now(ZoneOffset.UTC).plusDays(1)
                .atStartOfDay(ZoneOffset.UTC).toInstant());
        redisTemplate.expire(key, Duration.ofSeconds(secondsToMidnight));
    }
}
```

### Consecuencias
- ✅ Colisiones entre features imposibles
- ✅ Reset automático a medianoche UTC por TTL
- ✅ Patrón extensible a futuras features con rate limiting
- ✅ DEBT-046 CLOSED con esta implementación

---

*ADRs generados por Architect Agent — SOFIA v2.7 — Step 3 — Sprint 24*
