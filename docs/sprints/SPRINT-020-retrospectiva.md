# Sprint 20 — Retrospectiva
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 20 | **Release:** v1.20.0 | **Fecha:** 2026-03-30  
**SOFIA Step:** 9 — Workflow Manager  

---

## ✅ Qué fue bien

**WB-020-01 — Sprint mixto exitoso**
La decisión de combinar deuda técnica (16 SP) con nueva funcionalidad (8 SP) demostró ser la estrategia correcta. Los 4 debts cerrados eliminan riesgos técnicos que habrían afectado a S21.

**WB-020-02 — DEBT-038 resuelto en mismo sprint**
El hallazgo de seguridad (accountId ↔ userId, CVSS 4.8) detectado en Step 5b fue corregido antes de QA en lugar de diferirse. Mejora del proceso respecto a sprints anteriores.

**WB-020-03 — Tablero Scrumban completo**
Configuración de los nuevos estados (Code Review, QA, Waiting Approval) en Jira. El tablero refleja ahora fielmente el pipeline SOFIA. Visibilidad total del estado real de las tareas.

**WB-020-04 — Cobertura +1% sin esfuerzo adicional**
El refactor de lambdas (DEBT-032) y el split de AuthService (DEBT-033) generaron clases más testables, elevando la cobertura de 87% a 88% de forma natural.

**WB-020-05 — DEBT-033 Angular: 0 breaking changes**
El split de `AuthService` en tres servicios cohesivos se completó sin afectar a ningún componente existente. Validado con tests E2E.

---

## ⚠️ Qué mejorar

**MB-020-01 — Jira no actualizado durante el pipeline (resuelto)**
Las transiciones de Jira no se ejecutaron automáticamente en cada step. Detectado y corregido en este sprint. **Acción correctiva:** SOFIA actualiza Jira en cada cambio de step sin necesidad de instrucción explícita del PO.

**MB-020-02 — IBAN en audit log usa accountId como proxy**
`export_audit_log` registra `"ACCOUNT-" + id.substring(24)` en lugar del IBAN real. Requiere inyección de `AccountRepository`. Registrado como **DEBT-036** para S21.

**MB-020-03 — PdfDocumentGenerator: paginación multi-página incompleta**
La gestión de streams por página en el generador PDF tiene una inconsistencia identificada en Code Review (RV-F018-S02). Funcional para documentos de 1 página pero puede fallar en extractos > 50 registros que requieran salto de página. Registrado para revisión S21.

---

## 💡 Lecciones aprendidas (LA-020)

| ID | Tipo | Descripción | Corrección |
|---|---|---|---|
| LA-020-01 | process | Jira debe actualizarse en cada step del pipeline sin instrucción explícita | Regla permanente: transición automática en cada gate |
| LA-020-02 | security | Hallazgos de seguridad CVSS > 4.0 deben resolverse en el mismo sprint donde se detectan | Corrección en mismo sprint (no diferir si CVSS ≥ 4.0) |
| LA-020-03 | architecture | Audit log con datos derivados (IBAN desde accountId) crea inconsistencia — enriquecer en el momento de escritura | DEBT-036: inyectar AccountRepository en ExportAuditService |
| LA-020-04 | devops | El workflow de Jira debe configurarse con todos los estados SOFIA antes del primer sprint | Checklist de onboarding de proyecto incluye configuración de workflow |

---

## 📊 Velocidad Sprint 20 vs histórico

```
S12: 24 SP  S13: 24 SP  S14: 24 SP  S15: 24 SP
S16: 24 SP  S17: 24 SP  S18: 24 SP  S19: 24 SP
S20: 24 SP  ← 9 sprints consecutivos a velocidad máxima
```

**Velocidad media acumulada (S1-S20): 23.65 SP/sprint**

---

## 🎯 Objetivos Sprint 21 (propuesta)

1. **FEAT-019** — a definir por PO
2. **DEBT-036** — IBAN real en audit log
3. **DEBT-037** — Regex PAN Maestro 19 dígitos (CVSS 2.1)
4. Revisión paginación `PdfDocumentGenerator` (multi-página)

---

*Generado por SOFIA v2.3 · Workflow Manager · Step 9 · Sprint 20 · 2026-03-30*
