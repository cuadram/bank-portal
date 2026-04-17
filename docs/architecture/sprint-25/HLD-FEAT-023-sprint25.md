# HLD — FEAT-023 · Mi Dinero — Gestor de Finanzas Personales (PFM)

## Metadata
- **Feature:** FEAT-023 | **Proyecto:** BankPortal | **Cliente:** Banco Meridian
- **Stack:** Java (Spring Boot) + Angular 17 + PostgreSQL
- **Tipo:** new-feature | **Sprint:** 25 | **Versión:** 1.0 | **Estado:** DRAFT
- **Architect Agent:** SOFIA v2.7 · 2026-04-16

## Análisis de impacto
Sin cambios de contrato en servicios existentes. Nuevo bounded context `pfm` aislado.
Lectura sobre transactions/bill_payments existentes. FEAT-014 notificaciones — nuevo tipo BUDGET_ALERT.

## Servicios involucrados
| Servicio | Acción | Responsabilidad |
|---|---|---|
| pfm (NUEVO) | CREATE | Bounded context completo PFM |
| transaction (FEAT-002) | READ | Fuente movimientos para categorización |
| bill (FEAT-018) | READ | biller_name para top comercios |
| notification (FEAT-014) | INTEGRATE | Emisión BUDGET_ALERT |
| dashboard | MODIFY | Añadir slot PfmWidgetComponent |

## Contrato de integración backend ↔ frontend
Base URL: `/api/v1/pfm` | Auth: Bearer JWT
Endpoints: GET /overview · GET /budgets · POST /budgets · DELETE /budgets/{id} · GET /analysis · GET /distribution · PUT /movimientos/{id}/category · GET /widget

## Decisiones técnicas — ADRs
- ADR-037: Categorización en tiempo de consulta (no persistida)
- ADR-038: Presupuestos sin tabla de períodos explícita (YearMonth varchar)
- ADR-039: Top comercios unificación transactions + bill_payments (DEBT-047)
