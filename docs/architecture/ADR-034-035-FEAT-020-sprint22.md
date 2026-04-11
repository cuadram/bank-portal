# ADR-034 — Cálculo de cuota y TAE con BigDecimal escala 10 (Método Francés)

**Feature:** FEAT-020 | **Fecha:** 2026-04-02 | **Estado:** Aceptado  
**Autor:** Architect Agent — SOFIA v2.6

---

## Contexto

El módulo de Préstamos Personales requiere calcular cuotas mensuales y TAE con precisión matemática regulatoria. La Directiva 2008/48/CE (Art.19) y la Ley 16/2011 exigen que el TAE se muestre con precisión de al menos 2 decimales. Los errores de redondeo acumulados en 84 iteraciones (plazo máximo) pueden producir descuadres significativos si se usa aritmética de punto flotante.

---

## Decisión

Usar `BigDecimal` con escala 10 y `RoundingMode.HALF_EVEN` para todos los cálculos intermedios del método francés. El resultado final se presenta con escala 2 (céntimos).

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **BigDecimal escala 10 + HALF_EVEN** ← elegida | Precisión regulatoria, sin drift acumulado, modo bancario estándar | Mayor verbosidad en código |
| `double` / `float` | Simple | Error acumulado en 84 iteraciones, inaceptable para regulación financiera |
| BigDecimal escala 2 | Menos código | Pérdida de precisión en cálculos intermedios (r = TAE/12 necesita más decimales) |

---

## Consecuencias

- **Positivas:** Cumplimiento regulatorio garantizado. Resultados deterministas entre entornos.
- **Trade-offs:** Código más verboso. Los tests deben comparar con `compareTo(0) == 0`, no con `equals`.
- **Riesgos:** Ninguno relevante.
- **Impacto en servicios existentes:** Ninguno. AmortizationCalculator es nuevo.

---

*ADR-034 · Architect Agent · SOFIA v2.6 · Sprint 22 · 2026-04-02*

---

# ADR-035 — Pre-scoring mock determinista para STG

**Feature:** FEAT-020 | **Fecha:** 2026-04-02 | **Estado:** Aceptado

---

## Contexto

CoreBanking de Banco Meridian no tiene un entorno de scoring real disponible para STG. La solicitud de préstamo debe simular una respuesta de pre-scoring durante el desarrollo y las pruebas.

---

## Decisión

Implementar `CoreBankingMockScoringClient` con algoritmo determinista: `Math.abs(userId.hashCode()) % 1000`. Score > 600 → PENDING, ≤ 600 → REJECTED. El mock está en el paquete `infrastructure/scoring/` sin `@Profile` especial — es el único client disponible; en producción se reemplazará por cliente HTTP real a CoreBanking.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Hash determinista** ← elegida | Reproducible por userId — tests previsibles | No refleja scoring real |
| Random | Simple | No determinista — tests frágiles |
| Siempre PENDING | Simple | No testa el flujo de rechazo |

---

## Consecuencias

- **Positivas:** Tests reproducibles. QA puede identificar userIds que dan PENDING/REJECTED.
- **Trade-offs:** En producción debe reemplazarse por cliente CoreBanking real.
- **Riesgo RSK-022-01:** marcado como deuda técnica DEBT-044 para sprint de go-live.

---

*ADR-035 · Architect Agent · SOFIA v2.6 · Sprint 22 · 2026-04-02*
