# Retrospectiva Sprint 22 — FEAT-020 · v1.22.0

**Proyecto:** BankPortal · Banco Meridian  
**Sprint:** 22 · Feature: FEAT-020 — Gestión de Préstamos Personales  
**Fecha:** 2026-04-02  
**Confluence:** https://nemtec.atlassian.net/wiki/spaces/SOFIA/pages/7667713  
**SOFIA:** v2.6

---

## ✅ Qué fue bien

- 24/24 SP entregados (100%) — segunda vez consecutiva
- 51 tests PASS, 0 FAIL, 0 BLOCKED — mejor QA del proyecto
- Semáforo seguridad GREEN — DEBT-040/041 cerrados (CVSS 5.3 y 4.8)
- 0 defectos abiertos al cierre
- BUG-STG-022-002 detectado y corregido en el mismo ciclo de STG
- GR-010 bloqueó G-9 correctamente cuando había deuda vencida
- 17 DOCX + 3 XLSX generados como binarios reales (LA-022-08)
- FA-Document 78 func 188 RN — validado 8/8 checks

## ⚠️ Qué mejorar

- LA-022-07: Step 3b omitido — requiere GR-012 verificación antes de Step 4
- LA-022-08: Doc Agent generó .md en lugar de .docx en primera ejecución
- LA-022-06: gate_pending string rompía HTML del dashboard en 4 puntos

## 💡 Acciones S23

- GR-012 activo: verificar 3b en pipeline
- Guardrail extensión .docx en Step 8
- DEBT-037 (Regex PAN Maestro) — 1 SP
- DEBT-044 (TAE properties) — 1 SP
- Definir FEAT-021

## 📊 Velocidad

| Sprint | SP | Acum |
|--------|----|------|
| S20 | 24 | 473 |
| S21 | 24 | 497 |
| S22 | 24 | 521 |

Velocidad media (S20-S22): 24 SP/sprint — Estable

*Generado por SOFIA v2.6 — Step 9 — *
