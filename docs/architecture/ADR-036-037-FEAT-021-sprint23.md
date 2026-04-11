# ADR-036 — Cálculo IRPF por tramos con BigDecimal (extensión ADR-034)

**Feature:** FEAT-021 | **Fecha:** 2026-04-06 | **Estado:** Aceptado

## Contexto
El módulo de Depósitos requiere calcular retención IRPF sobre intereses aplicando tramos del Art.25 Ley 35/2006: 19% (≤6.000€), 21% (≤50.000€), 23% (>50.000€). Los intereses de un depósito pueden atravesar un único tramo o quedar en el inferior, pero el cálculo debe ser exacto en todo caso.

## Decisión
Implementar `IrpfRetentionCalculator` como servicio de dominio reutilizable. Todos los cálculos usan `BigDecimal` con `RoundingMode.HALF_EVEN` (coherente con ADR-034). Los límites de tramo son constantes de clase para facilitar tests. El tipo efectivo se determina por comparación simple sobre el total de intereses brutos (no cálculo acumulativo por tramos — simplificación válida para depósito único).

## Opciones consideradas
| Opción | Pros | Contras |
|---|---|---|
| **Tramo simple sobre total** ← elegida | Simple, reproducible, suficiente para depósito único | No acumula tramos (irrelevante para 1 depósito) |
| Cálculo acumulativo por tramos | Más preciso si hay múltiples productos | Complejidad innecesaria en scope actual |
| `double` | Simple | Inaceptable por LA-019-13 / ADR-034 |

## Consecuencias
- Coherencia total con `AmortizationCalculator` (ADR-034).
- `IrpfRetentionCalculator` es reutilizable por `DepositSimulatorService` y `GetDepositDetailUseCase`.
- Tests: comparar con `BigDecimal.compareTo()`, nunca `equals()`.

---

# ADR-037 — CoreBankingMockDepositClient — extensión del patrón ADR-035

**Feature:** FEAT-021 | **Fecha:** 2026-04-06 | **Estado:** Aceptado

## Contexto
El módulo de Depósitos necesita registrar aperturas y cancelaciones en CoreBanking. No existe entorno real para STG (igual que con el scoring de préstamos en ADR-035).

## Decisión
Implementar `CoreBankingMockDepositClient` siguiendo el mismo patrón que `CoreBankingMockScoringClient` (ADR-035): componente Spring sin `@Profile` especial, con logging estructurado de cada operación. Dos métodos: `registrarApertura()` y `registrarCancelacion()`. En go-live se reemplaza por cliente HTTP real sin cambiar el contrato del puerto.

## Consecuencias
- Patrón consistente con FEAT-020 — Developer Agent conoce la convención.
- No requiere `@Profile("mock")` — es el único client disponible en todos los entornos hasta go-live.
- Deuda técnica registrada: sustitución por cliente HTTP real (sprint de go-live).

---

*ADR-036/037 · Architect Agent · SOFIA v2.7 · Sprint 23 · 2026-04-06*
