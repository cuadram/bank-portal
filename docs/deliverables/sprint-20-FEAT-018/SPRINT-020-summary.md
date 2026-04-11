# Sprint 20 — Resumen de Entrega
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 20 | **Release:** v1.20.0 | **Fecha cierre:** 2026-03-30  
**Metodología:** Scrumban · CMMI Nivel 3  

---

## 🎯 Sprint Goal — CUMPLIDO ✅

> *"Eliminar la deuda técnica acumulada en S19 y entregar exportación de movimientos para cumplimiento regulatorio (PSD2 Art.47 — acceso al historial de pagos)."*

---

## 📦 Entregables del sprint

### FEAT-018 — Exportación de Movimientos Bancarios (8 SP) ✅

| Historia | SP | Estado |
|---|---|---|
| SCRUM-98 — Exportar movimientos en PDF | 3 | ✅ Finalizada |
| SCRUM-99 — Exportar movimientos en CSV | 2 | ✅ Finalizada |
| SCRUM-100 — Filtro multicriteria previo a exportación | 2 | ✅ Finalizada |
| SCRUM-101 — Audit log GDPR/PCI-DSS | 1 | ✅ Finalizada |

**Valor entregado al negocio:**
- Los usuarios pueden descargar su historial bancario en PDF oficial o CSV compatible con Excel
- Cumplimiento regulatorio PSD2 Art.47 (acceso a historial de pagos)
- Trazabilidad GDPR Art.15 completa con audit log de 7 años
- PAN enmascarado en todos los formatos (PCI-DSS Req.3.4)

### Deuda Técnica Resuelta (16 SP) ✅

| Historia | SP | Estado |
|---|---|---|
| SCRUM-102 — DEBT-032: Lambda refactor | 4 | ✅ Finalizada |
| SCRUM-103 — DEBT-033: AuthService split | 4 | ✅ Finalizada |
| SCRUM-104 — DEBT-034: Strategy pattern | 4 | ✅ Finalizada |
| SCRUM-105 — DEBT-035: RETURNED handler | 4 | ✅ Finalizada |

---

## 📊 Métricas del Sprint

| Métrica | Objetivo | Real |
|---|---|---|
| Story Points | 24 | **24** ✅ |
| Tests ejecutados (unit) | ≥ 446 | **524** ✅ |
| Cobertura | ≥ 87% | **88%** ✅ |
| Defectos en producción | 0 | **0** ✅ |
| NCS (Non-Conformances) | 0 | **0** ✅ |
| Velocidad | 23.6 SP/sprint | **24 SP** ✅ |

---

## 📈 Métricas acumuladas del proyecto

| Métrica | Valor |
|---|---|
| Sprints completados | **20 / 20** |
| Story Points acumulados | **473 SP** |
| Velocidad media | **23.65 SP/sprint** |
| Tests automatizados totales | **524** |
| Cobertura | **88%** |
| Defectos acumulados en producción | **0** |
| CMMI Nivel | **3** ✅ |

---

## 🔒 Cumplimiento regulatorio Sprint 20

| Regulación | Artículo | Estado |
|---|---|---|
| PSD2 | Art.47 — Historial pagos 12 meses | ✅ Implementado |
| GDPR | Art.15 — Derecho de acceso | ✅ Implementado |
| GDPR | Art.17 — Retención 7 años | ✅ Implementado |
| PCI-DSS | Req.3.4 — PAN enmascarado | ✅ Verificado |
| PCI-DSS | Req.10 — Audit log accesos | ✅ Implementado |
| SEPA DD | Sección 4.5 — R-codes RETURNED | ✅ Implementado |

---

## 🗄️ Cambios técnicos

| Componente | Cambio |
|---|---|
| BD — Flyway V21 | Nueva tabla `export_audit_log` |
| Backend — paquete `export/` | ExportController, ExportService, PDF/CSV generators |
| Backend — paquete `directdebit/strategy/` | Strategy pattern + Factory |
| Backend — `CoreBankingWebhookController` | Handler RETURNED + R-codes |
| Frontend — `core/auth/` | TokenService, SessionService, AuthGuard |
| Frontend — `features/export/` | ExportPanelComponent, ExportService |

---

## 🔧 Deuda técnica pendiente (backlog S21)

| ID | Descripción | CVSS | Prioridad |
|---|---|---|---|
| DEBT-036 | IBAN real en audit log desde AccountRepository | — | Media |
| DEBT-037 | Regex PAN ampliar a Maestro 19 dígitos | 2.1 | Baja |
| DEBT-038 | ~~accountId ↔ userId validación~~ | ~~4.8~~ | ✅ **Resuelto en S20** |

---

## 📋 Artefactos CMMI generados

| Área CMMI | Artefacto |
|---|---|
| PP (Project Planning) | SPRINT-020-planning.md |
| REQM (Requirements Mgmt) | SRS-FEAT-018-sprint20.md |
| VER (Verification) | CR-FEAT-018-sprint20.md · TEST-EXECUTION-FEAT-018-sprint20.md |
| VAL (Validation) | QA-FEAT-018-sprint20.md |
| RSKM (Risk Mgmt) | ADR-030/031 · SEC-FEAT-018-sprint20.md |
| CM (Config Mgmt) | RELEASE-NOTES-v1.20.0.md · V21__export_audit_log.sql |
| PPQA (Process QA) | RUNBOOK-backend-2fa-v1.20.0.md |

---

*Generado por SOFIA v2.3 · Step 8 Client Deliverables · Sprint 20 · 2026-03-30*
