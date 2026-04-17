# ADR-037 — Categorización PFM en tiempo de consulta (no persistida)
## Estado: Propuesto | Feature: FEAT-023 | Fecha: 2026-04-16
## Decisión
La categoría de cada movimiento se calcula en tiempo de consulta aplicando reglas en memoria. Solo se persiste el override manual del usuario en pfm_user_rules.
## Opciones
| Opción | Pros | Contras |
|---|---|---|
| **Cálculo en consulta** ✅ | Siempre consistente; sin columna persistida | Coste CPU |
| Persistir categoría | Lectura rápida | Stale ante cambio de reglas; migración retroactiva |
## Consecuencias: índice (concept_pattern) obligatorio. Límite 5.000 tx/usuario (RNF-D023-06).
