# HLD — High Level Design
## FEAT-018: Exportación de Movimientos Bancarios (PDF/CSV)
**Sprint:** 20 | **Versión:** v1.20.0 | **SOFIA Step:** 3 — Architect  
**Fecha:** 2026-03-30 | **Estado:** BASELINE  

---

## 1. Contexto arquitectural

FEAT-018 se integra en el módulo `export` del monolito modular BankPortal. Reutiliza la capa de acceso a datos de movimientos existente (implementada en S7-S10) y añade un nuevo subsistema de generación de documentos con auditoría asíncrona.

### Principios aplicados
- **Single Responsibility:** `ExportService` solo orquesta; `PdfGenerator` y `CsvGenerator` son estrategias independientes.
- **Open/Closed:** Nueva interfaz `DocumentGenerator<T>` permite añadir formatos futuros (XLSX, OFX) sin modificar el servicio.
- **Async audit:** El registro de auditoría no forma parte del flujo crítico — Spring `@Async` + retry.

---

## 2. Diagrama de componentes (C4 — Nivel 3)

```
┌─────────────────────────────────────────────────────────────────┐
│  Angular 17 Frontend                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MovementsModule                                         │    │
│  │  ├── ExportPanelComponent (nuevo)                        │    │
│  │  ├── ExportFilterFormComponent (nuevo)                   │    │
│  │  ├── ExportPreviewComponent (nuevo)                      │    │
│  │  └── ExportService (nuevo — HTTP client)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS · JWT Bearer
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Spring Boot 3.3.4 Backend (backend-2fa)                         │
│                                                                   │
│  ┌─────────────────────┐   ┌──────────────────────────────┐     │
│  │  ExportController   │──▶│  ExportService               │     │
│  │  /api/v1/accounts/  │   │  ├── PdfDocumentGenerator    │     │
│  │  {id}/exports/      │   │  │   (Apache PDFBox 3.x)      │     │
│  └─────────────────────┘   │  ├── CsvDocumentGenerator    │     │
│                             │  └── ExportAuditService @Async│    │
│  ┌─────────────────────┐   └──────────────┬───────────────┘     │
│  │  TransactionRepo    │◀─────────────────┘                      │
│  │  (existente S7-S10) │                                          │
│  └─────────────────────┘                                          │
└──────────────────────────────────────────┬──────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────┐
                    │  PostgreSQL 16                            │
                    │  ├── transactions (existente)            │
                    │  └── export_audit_log (NUEVO — V21)      │
                    └─────────────────────────────────────────┘
```

---

## 3. Flujo de secuencia — Export PDF

```
Frontend          ExportController    ExportService      PdfGenerator    AuditService   DB
   │                    │                  │                  │              │            │
   │─POST /exports/pdf─▶│                  │                  │              │            │
   │                    │─exportPdf()─────▶│                  │              │            │
   │                    │                  │─fetchMovements()─────────────────────────────▶│
   │                    │                  │◀─List<Transaction>────────────────────────────│
   │                    │                  │─generatePdf()───▶│              │            │
   │                    │                  │◀─byte[]──────────│              │            │
   │                    │                  │─auditAsync()─────────────────────▶│          │
   │                    │                  │                  │  (fire&forget)│─INSERT────▶│
   │◀─200 PDF bytes─────│◀─ResponseEntity──│                  │              │            │
```

---

## 4. Nuevos componentes

| Componente | Tipo | Descripción |
|---|---|---|
| `ExportController` | REST Controller | Endpoints PDF, CSV, preview |
| `ExportService` | Service | Orquestación: fetch → generate → audit |
| `DocumentGenerator<T>` | Interface | Contrato para generadores de documento |
| `PdfDocumentGenerator` | Component | Implementación PDF con Apache PDFBox 3.x |
| `CsvDocumentGenerator` | Component | Implementación CSV UTF-8 BOM |
| `ExportAuditService` | Service @Async | Persistencia asíncrona en export_audit_log |
| `ExportAuditLogRepository` | Repository | JPA sobre export_audit_log |
| `ExportRequest` | DTO | fechaDesde, fechaHasta, tipoMovimiento, formato |
| `ExportPreviewResponse` | DTO | count de registros según filtros |
| `V21__export_audit_log.sql` | Flyway | DDL tabla export_audit_log |

---

## 5. Decisiones arquitecturales

- **ADR-030:** Uso de Apache PDFBox 3.x sobre iText (licencia Apache 2.0 vs AGPL) → ver ADR-030
- **ADR-031:** Generación síncrona para ≤ 500 registros, asíncrona con polling para volúmenes mayores (fuera de alcance S20)
- **Reutilización:** `TransactionJpaRepository` existente — nuevo método `findByAccountIdAndDateBetweenAndType()`

---

## 6. Impacto en componentes existentes

| Componente | Cambio | Riesgo |
|---|---|---|
| `TransactionJpaRepository` | Nuevo método de consulta con filtros | Bajo |
| `SecurityConfig` | Nuevo endpoint `/exports/**` con auth JWT | Bajo |
| `app-routing.module.ts` | Lazy load módulo export | Bajo |
| Docker Compose | Sin cambios | Nulo |

---

*Generado por SOFIA v2.3 · Architect · Step 3 · Sprint 20 · 2026-03-30*
