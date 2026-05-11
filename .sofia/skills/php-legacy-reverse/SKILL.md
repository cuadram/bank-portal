---
name: php-legacy-reverse
description: Reverse engineering de código PHP legacy en proyectos SOFIA-CORE. Stub experimental F1 S04 · tier-reassessment esperado al materializar scope real · puede promoverse a Tier A si FA real (analógico a fa-reverse-agent).
model: claude-sonnet-4-6
reasoning_effort: high
status: EXPERIMENTAL_STUB_S04
tier: B
tier_reassessment_pending: true
tier_reassessment_note: "Si scope completion revela FA real (Functional Archaeology · razonamiento crítico sobre código legacy huérfano · saca decisiones arquitectónicas), promover a Tier A vía LA dedicada S05+. Análogo: fa-reverse-agent (Tier A firmado SC-41 S03)."
materialized_at: 2026-05-11
materialization_sprint: S04
scope_completion_target: S05+
related_la: [LA-CORE-074, LA-CORE-094]
related_adr: ADR-008-v3
---

# php-legacy-reverse (STUB · EXPERIMENTAL_STUB_S04)

## Identidad

Agente especializado en ingeniería inversa de código PHP legacy. Consumidor principal previsto: IMESAPI (PHP legacy → .NET Core 8 · FACE/FACEB2B/AEAT regulado).

## Scope (provisional · scope-completion diferido S05+)

- Análisis estructural de código PHP legacy.
- Identificación de patrones, dependencias y reglas de negocio embebidas.
- Producción de documentación reverse para alimentar al `architect` en el diseño .NET equivalente.
- Coordinación con `fa-reverse-agent` (Tier A) si el scope final converge en FA real.

## Status

**EXPERIMENTAL_STUB_S04** · creado en Sprint S04 F1 tras decisión P4 firmada (ADR-008 v3). **No usar en pipeline productivo** hasta scope-completion (`S05-CAND-php-skills-completion`).

### Tier reassessment pendiente

Tier B firmado en el stub por **prudencia conservadora**. Si el scope completion revela que el agente ejecuta **Functional Archaeology real** (no mera lectura de código sino razonamiento arquitectónico crítico para la modernización legacy→moderno), debe promoverse a **Tier A** (Opus 4.7 xhigh), análogo al precedente `fa-reverse-agent` firmado en SC-41 S03. Mecanismo de promoción: LA dedicada en S05+ siguiendo flujo HITL (LA-CORE-018).

## Trazabilidad

- LA origen: LA-CORE-074 (matriz tier-model 30 agentes · php-legacy-reverse declarado)
- LA wrap: LA-CORE-094 (Fase 2 declarativa)
- ADR rector: ADR-008 v3 (sha16 `aa57973cb6f75730`)
- Decisión materialización: D-S04-P4-stubs-materializacion
- Item Jira: SC-51 (Sprint S04 F1)
- Precedente Tier A análogo: fa-reverse-agent (skills/fa-reverse-agent/SKILL.md)
