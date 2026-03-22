# ADR-019 — Estrategia de cálculo del Dashboard: on-demand con caché materializada

## Metadata

| Campo | Valor |
|---|---|
| ADR | ADR-019 |
| Feature | FEAT-010 / US-1001/1002/1003/1004 |
| Proyecto | BankPortal — Banco Meridian |
| Fecha | 2026-03-22 |
| Estado | Propuesto |

---

## Contexto

El dashboard requiere agregar datos de múltiples tablas (`transfers`, `bill_payments`)
para calcular resúmenes, categorías y evoluciones. Hay tres estrategias posibles:

1. **On-demand puro**: calcular en tiempo real en cada petición → query costosa cada vez
2. **Job batch nocturno**: precalcular todo de noche → datos no actualizados durante el día
3. **On-demand con caché materializada en BD** → calcular la primera vez, guardar en `spending_categories`, reusar hasta que caduque o haya nuevas transacciones

---

## Decisión

**Se adopta la estrategia on-demand con caché materializada en `spending_categories`.**

El primer acceso al dashboard de un período calcula y persiste. Las siguientes peticiones
leen de la caché. La caché se invalida automáticamente cuando se registra una nueva
transacción en el período (evento `@TransactionalEventListener`).

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **On-demand + caché BD** (elegido) | Datos frescos · primera petición algo más lenta · sin jobs externos | Primera petición ≤ 500ms (p95 RNF) |
| On-demand puro | Simplicidad · siempre datos frescos | Latencia alta con historial grande |
| Job batch nocturno | Consultas rápidas siempre | Datos desactualizados hasta 24h · complejidad operativa |
| Redis cache | Latencia mínima | Datos perdidos en restart · TTL mal calibrado = datos rancios |

---

## Implementación

```java
// En TransferUseCase y BillPaymentUseCase — tras persistir operación exitosa:
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onNewTransaction(NewTransactionEvent event) {
    // Invalida caché del período afectado
    spendingCategoryRepo.deleteByUserAndPeriod(event.userId(), event.period());
}

// En SpendingCategoryService:
public List<SpendingCategoryDto> getCategories(UUID userId, String period) {
    List<SpendingCategoryDto> cached = repo.findCachedCategories(userId, period);
    if (!cached.isEmpty()) return cached;          // Caché hit

    // Caché miss → calcular + persistir
    List<RawSpendingRecord> raw = repo.findRawSpendings(userId, period);
    List<SpendingCategoryDto> computed = categorize(raw);
    repo.upsertSpendingCategories(userId, period, computed);
    return computed;
}
```

## Consecuencias

**Positivas:**
- Latencia p95 ≤ 100ms tras el primer cálculo (lectura directa de `spending_categories`)
- Datos siempre actualizados (invalidación por evento)
- Sin dependencias de jobs externos ni Redis adicional

**Trade-offs:**
- Primera petición de un período nuevo puede tardar hasta 500ms (aceptable según RNF-F10-001)
- El `@TransactionalEventListener` acopla levemente los módulos dashboard y transfer/bill

---

*ADR-019 — SOFIA Architect Agent — BankPortal Sprint 12 — 2026-03-22*
