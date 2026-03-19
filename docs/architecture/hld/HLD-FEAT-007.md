# HLD — FEAT-007: Consulta de Cuentas y Movimientos
## BankPortal · Banco Meridian · Sprint 9
*SOFIA Architect Agent · 2026-03-19*

## Metadata
| Campo | Valor |
|---|---|
| Feature | FEAT-007 |
| Sprint | 9 |
| Versión | 1.0 |
| Estado | Pendiente aprobación Tech Lead |
| ADRs asociados | ADR-013, ADR-014, ADR-015 |
| Cumplimiento | PCI-DSS 4.0 req. 3.4 / 4.2 · GDPR Art. 25 |

## Análisis de impacto en monorepo

| Servicio | Impacto | Acción |
|---|---|---|
| backend-2fa (AuthService) | Validar scope full-session en nuevos endpoints | Verificar JwtAuthFilter |
| user_notifications (SSE) | DEBT-011 refactoriza SseEmitter → Redis Pub/Sub | ADR-013 |
| NotificationPurgeJob | DEBT-012 nuevo @Scheduled — sin impacto API | Solo config scheduler |
| accounts, transactions, statements | Dominios nuevos — 0 conflicto | Flyway V10/V11/V12 |

## Diagrama C4 Nivel 1 (Contexto)

```mermaid
C4Context
  title BankPortal — Contexto FEAT-007

  Person(user, "Usuario autenticado", "JWT full-session")

  System_Boundary(portal, "BankPortal") {
    System(frontend, "Angular SPA", "AccountList, TransactionList, Search, Chart, PDF")
    System(backend, "Spring Boot API", "AccountService, TransactionHistoryUseCase, StatementGeneratorService")
    SystemDb(db, "PostgreSQL", "accounts, transactions, statements, user_notifications")
    SystemDb(redis, "Redis", "SSE Pub/Sub canal por userId, JWT blacklist")
  }

  System_Ext(corebanking, "Core Banking Banco Meridian", "Fuente de verdad saldos y movimientos")

  Rel(user, frontend, "HTTPS / TLS 1.3")
  Rel(frontend, backend, "REST API v1.6 / JWT Bearer")
  Rel(backend, db, "JPA / Flyway V10-V12")
  Rel(backend, redis, "Redis Pub/Sub SSE")
  Rel(backend, corebanking, "REST interno / sync nightly")
```

## Diagrama C4 Nivel 2 (Contenedores)

```mermaid
C4Container
  title BankPortal — Contenedores FEAT-007

  Person(user, "Usuario autenticado")

  Container(ng, "Angular 17 SPA", "AccountListComponent, TransactionListComponent, SseService")
  Container(api, "Spring Boot API", "AccountController, TransactionController, StatementController")
  Container(acc, "AccountService", "Saldo real, @Cacheable 30s")
  Container(txn, "TransactionHistoryUseCase", "Cursor pagination, JPA Specification")
  Container(stmt, "StatementGeneratorService", "JasperReports PDF, signed URL")
  Container(cat, "CategorySummaryService", "Agrupación top-5")
  Container(purge, "NotificationPurgeJob", "@Scheduled cron 02:00 (DEBT-012)")
  ContainerDb(pg, "PostgreSQL", "accounts, transactions, statements")
  ContainerDb(redis, "Redis", "SSE Pub/Sub, JWT blacklist")

  Rel(user, ng, "HTTPS")
  Rel(ng, api, "REST + SSE stream")
  Rel(api, acc, "delegación")
  Rel(api, txn, "delegación")
  Rel(api, stmt, "delegación")
  Rel(api, cat, "delegación")
  Rel(acc, pg, "JPA")
  Rel(txn, pg, "JPA Specification")
  Rel(stmt, pg, "JPA + JasperReports")
  Rel(cat, pg, "JPA aggregation")
  Rel(purge, pg, "@Scheduled DELETE")
  Rel(acc, redis, "Pub/Sub saldo update")
```

## Diagrama de secuencia — US-702 (Historial con cursor)

```mermaid
sequenceDiagram
  participant U as Usuario
  participant NG as Angular SPA
  participant API as Spring Boot API
  participant DB as PostgreSQL

  U->>NG: Selecciona cuenta
  NG->>API: GET /api/v1/accounts/{id}/transactions?limit=20
  API->>DB: SELECT * FROM transactions WHERE account_id=? ORDER BY date DESC, id DESC LIMIT 20
  DB-->>API: [20 rows + metadata cursor]
  API-->>NG: {items: [...], nextCursor: "base64..."}
  NG-->>U: Renderiza lista con scroll infinito

  U->>NG: Scroll al final (carga más)
  NG->>API: GET /api/v1/accounts/{id}/transactions?cursor=base64...&limit=20
  API->>DB: SELECT * WHERE (date, id) < (cursorDate, cursorId) LIMIT 20
  DB-->>API: [siguiente página]
  API-->>NG: {items: [...], nextCursor: null}
  NG-->>U: Append items — no hay más
```

## Decisiones de arquitectura

### ADR-013 — Redis Pub/Sub para SSE multi-pod (DEBT-011)
- **Problema:** SseEmitter en memoria no escala a múltiples pods
- **Decisión:** RedisMessageListenerContainer — canal sse:{userId} por conexión
- **Fallback:** polling Angular 30s si Redis no disponible
- **Estado:** ACEPTADO

### ADR-014 — Cursor-based pagination para historial
- **Problema:** OFFSET/LIMIT genera full scan en tablas > 10k filas
- **Decisión:** cursor (date, id) serializado en Base64 opaco
- **Índice requerido:** (account_id, date DESC, id DESC) en Flyway V10
- **Estado:** ACEPTADO

### ADR-015 — JasperReports para extracto PDF
- **Problema:** US-704 requiere PDF con formato corporativo Banco Meridian
- **Decisión:** JasperReports con template .jrxml — signed URL TTL 60s
- **Alternativas descartadas:** iText (AGPL), PDFBox (bajo nivel), wkhtmltopdf (binario nativo)
- **Estado:** ACEPTADO

*CMMI Level 3 — TS SP 1.1 · TS SP 2.1 · TS SP 3.1*
*SOFIA Architect Agent · BankPortal Sprint 9 · 2026-03-19*
