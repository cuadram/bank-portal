# FEAT-007 — Consulta de Cuentas y Movimientos
## BankPortal · Banco Meridian
*SOFIA Scrum Master Agent · 2026-03-19*

## Metadata
- **Épica:** Operaciones Bancarias
- **Sprint:** 9
- **Capacidad:** 23 SP
- **Release:** v1.9.0 — 2026-04-14
- **Prioridad:** Must Have

## Sprint Goal
Permitir al usuario consultar su posición financiera completa: saldo de
cuentas, historial de movimientos con búsqueda y filtros avanzados, y descarga
de extractos; consolidando la infraestructura SSE para escenarios multi-pod
con Redis Pub/Sub.

## User Stories

| ID | Descripción | SP | Criterios clave |
|---|---|---|---|
| US-701 | Consultar listado de cuentas con saldo actualizado | 3 | Saldo en tiempo real, skeleton loader, empty state |
| US-702 | Ver historial de movimientos paginado con filtros | 4 | Cursor-based pagination, filtros fecha/tipo, infinite scroll |
| US-703 | Búsqueda de movimientos por importe, fecha y concepto | 3 | Full-text + JPA Specification, debounce 300ms, highlights |
| US-704 | Descarga de extracto PDF (30/90/365 días) | 3 | Signed URL, formato Banco Meridian, 3 rangos |
| US-705 | Resumen visual de gastos por categoría | 2 | Top-5 + otros, interactivo, Chart.js/D3 |

## Deuda técnica incluida

| ID | Descripción | SP |
|---|---|---|
| DEBT-011 | Redis Pub/Sub para SSE multi-pod | 3 |
| DEBT-012 | Job de purga automática notificaciones 90d | 2 |

## Infraestructura requerida
- Flyway V10: tablas `accounts`, `transactions`, `statements`
- OpenAPI v1.6.0 (ACT-32)
- Redis Pub/Sub channel por userId

## Dependencias
- FEAT-001/002/003/004 en PROD ✅
- Redis disponible en STG ✅ (ya usado por DEBT-009)
- Datos sintéticos en STG (PCI-DSS req. 3.4)

## Riesgos
- R-S9-004 ALTO: datos financieros reales en STG — mitigación: solo datos sintéticos

*CMMI Level 3 — REQM SP 1.1 · PP SP 2.1*
