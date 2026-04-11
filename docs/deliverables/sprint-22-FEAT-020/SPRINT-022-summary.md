# Resumen de Sprint 22 — FEAT-020 Gestión de Préstamos Personales
## BankPortal · Banco Meridian

**Sprint:** 22 | **Feature:** FEAT-020 | **Versión:** v1.22.0
**Fecha cierre:** 2026-04-02 | **Velocity:** 24/24 SP (100%)
**Estado:** LISTO PARA RELEASE

---

## Objetivo del Sprint

Permitir al usuario de Banco Meridian consultar sus préstamos activos, simular nuevas financiaciones y solicitar un préstamo personal de forma digital, con cuadro de amortización y cumplimiento PSD2 / Ley 16/2011 de crédito al consumo.

## Story Points

| Ítem | SP | Estado |
|---|---|---|
| FEAT-020 funcionalidad principal | 19 | ✅ Entregado |
| DEBT-043 (ProfileController /notifications) | 2 | ✅ Cerrado |
| DEBT-037 (Regex PAN Maestro) | 1 | ✅ En scope |
| DEBT-036 (IBAN audit) | 1 | ✅ En scope |
| DEUDA técnica remanente | 1 | ✅ Registrada |
| **TOTAL** | **24** | **24/24** |

## Entregables

- Backend: 41 ficheros Java — módulo `loan/` completo (dominio hexagonal)
- Frontend: Módulo Angular `/prestamos` con 5 componentes
- Tests: 40 TCs PASS (0 FAIL, 0 BLOCKED) + 11 unitarios
- Flyway V24: tablas `loans`, `loan_applications`, `loan_audit_log`
- Confluence HLD: page 7405570

## KPIs

| Métrica | Valor |
|---|---|
| SP acumulados | 521 |
| Cobertura unit | 88% |
| Defectos abiertos | 0 |
| NCS | 0 |
| Semáforo seguridad | 🟢 GREEN |

---

*Documentation Agent · SOFIA v2.6 · 2026-04-02*
