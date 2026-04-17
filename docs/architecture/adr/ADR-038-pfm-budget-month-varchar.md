# ADR-038 — Presupuestos mensuales: YearMonth como varchar(7)
## Estado: Propuesto | Feature: FEAT-023 | Fecha: 2026-04-16
## Decisión: budget_month/alert_month almacenados como varchar(7) formato YYYY-MM. Sin tabla de períodos. Reset de consumo implícito por agregación mensual en BudgetService. Sin job batch.
