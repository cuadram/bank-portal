# Documentation Index — FEAT-007: Consulta de Cuentas y Movimientos
## BankPortal · Sprint 9 · Post-Architect
*SOFIA Documentation Agent · 2026-03-19*

## Artefactos generados en Step 3 (Architect)

| Artefacto | Ruta | Confluence | Estado |
|---|---|---|---|
| HLD FEAT-007 | `docs/architecture/hld/HLD-FEAT-007.md` | [Ver en Confluence](https://nemtec.atlassian.net/wiki/spaces/SOFIA/pages/1572865) | ✅ Aprobado Tech Lead |
| LLD-010 Backend | `docs/architecture/lld/LLD-010-accounts-backend.md` | — | ✅ Generado |
| OpenAPI v1.6.0 | `docs/architecture/openapi/openapi-v1.6.0.yaml` | — | ✅ Generado |
| SRS FEAT-007 | `docs/srs/SRS-FEAT-007.md` | [Ver en Confluence](https://nemtec.atlassian.net/wiki/spaces/SOFIA/pages/1474561) | ✅ Aprobado PO |

## Diagramas incluidos en HLD-FEAT-007.md

| Diagrama | Tipo | Contenido |
|---|---|---|
| C4 Nivel 1 — Contexto | Mermaid C4Context | BankPortal ↔ Core Banking ↔ Usuario |
| C4 Nivel 2 — Contenedores | Mermaid C4Container | AccountService, TransactionHistoryUseCase, Redis, PostgreSQL |
| Secuencia US-702 | Mermaid sequenceDiagram | Historial con cursor-based pagination |

## ADRs registrados (Sprint 9)

| ID | Título | Estado |
|---|---|---|
| ADR-013 | Redis Pub/Sub para SSE multi-pod (DEBT-011) | ✅ Aceptado |
| ADR-014 | Cursor-based pagination historial movimientos | ✅ Aceptado |
| ADR-015 | JasperReports para extracto PDF (US-704) | ✅ Aceptado |

## Próximos artefactos — Step 8 (post DevOps)

Generación automática tras aprobación Gate 5:
- Word: Project Plan v9, Sprint 9 Report, Risk Register, Architecture Doc FEAT-007
- Excel: NC Tracker Sprint 9, Decision Log ADR-013/014/015, Quality Dashboard
- Ruta: `docs/deliverables/sprint-9-FEAT-007/word/` y `excel/`

*CMMI Level 3 — OPF SP 1.3 · CM SP 1.1*
