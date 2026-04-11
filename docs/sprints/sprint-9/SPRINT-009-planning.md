# Sprint 9 — Planning
## BankPortal · FEAT-007 Consulta de Cuentas y Movimientos + DEBT-011/012
*SOFIA Scrum Master Agent · 2026-03-17*

---

## 1. Sprint Goal

> **"Dar al usuario acceso a su posición financiera completa: consulta de saldo,
> historial de movimientos con búsqueda y filtros, y descarga de extractos certificados;
> consolidando la infraestructura SSE para escenarios multi-pod."**

Sprint 9 abre la épica de **Operaciones Bancarias** con FEAT-007 completo — las 5 User
Stories más las dos deudas técnicas críticas de Sprint 8 (DEBT-011 Redis Pub/Sub y
DEBT-012 purga de notificaciones). Con este sprint el portal trasciende la capa de
seguridad y se convierte en la ventanilla digital operativa de Banco Meridian.

---

## 2. Métricas de referencia

| Indicador | Valor |
|---|---|
| Velocidad media (8 sprints) | 23.875 SP |
| Desviación estándar | ±0.9 SP |
| Capacidad Sprint 9 | **24 SP** |
| SP planificados | **23 SP** |
| Margen de buffer | 1 SP |
| Features en curso | FEAT-007 (inicio épica Operaciones Bancarias) |
| Deuda técnica prioritaria | DEBT-011, DEBT-012 |
| Release objetivo | v1.9.0 — 2026-04-14 |

---

## 3. Backlog del sprint

| ID | Descripción | SP | Tipo | Prioridad | Semana | Bloqueante para |
|---|---|---|---|---|---|---|
| ADR-014 | Diseño Redis Pub/Sub + fallback graceful | 0* | Arquitectura | Must Have | D1 S1 | DEBT-011 |
| DEBT-011 | Redis Pub/Sub para SSE escalado horizontal | 3 | Tech Debt | Must Have | S1 | US-701 (SSE) |
| DEBT-012 | Job nocturno purga user_notifications >90d | 2 | Tech Debt | Must Have | S1 | — |
| Flyway V10 | Tablas accounts + transactions + índices | 2* | Infra | Must Have | D1 S1 | US-701/702 |
| US-701 | Ver resumen de cuentas con saldo | 3 | Feature | Must Have | S1 | — |
| US-702 | Consultar movimientos paginados con filtros | 5 | Feature | Must Have | S1 | — |
| US-703 | Buscar movimiento por concepto, importe o fecha | 3 | Feature | Must Have | S2 | — |
| US-704 | Descargar extracto mensual PDF / CSV | 4 | Feature | Should Have | S2 | — |
| US-705 | Categorización automática de movimientos | 3 | Feature | Should Have | S2 | US-702/703 |
| **Total** | | **23 SP** | | | | |

*ADR-014 y Flyway V10 son actividades de arquitectura/infra sin coste SP propio — se
ejecutan como prerequisito del día 1 Semana 1 antes de arrancar el código.

---

## 4. Distribución por semana

### Semana 1 — 13 SP (fundamentos + core financiero)

```
Día 1 (prerequisitos — no contabilizan SP):
  ADR-014     → Diseño Redis Pub/Sub: channel naming, fallback, reconexión
  Flyway V10  → accounts + account_balances + transactions
                 + índices: transactions(account_id, created_at DESC)
                            transactions(account_id, concept gin_trgm)
                 + datos mock realistas (2 cuentas, 200 movimientos por cuenta)

DEBT-011 [3 SP] → RedisMessageListenerContainer + MessageListenerAdapter
                   Channel: sse:events:{userId} + sse:events:broadcast
                   SseRegistry cross-pod + fallback en memoria
                   Test: evento llega a cliente en pod diferente al publicador

DEBT-012 [2 SP] → NotificationPurgeJob @Scheduled(cron="0 0 2 * * *")
                   Batch delete created_at < NOW()-90d
                   Log estructurado purge.notifications.count
                   Test idempotencia + límite 90d exacto

US-701 [3 SP]   → AccountSummaryUseCase + AccountRepositoryPort (mock)
                   AccountSummaryDto + AccountController GET /api/v1/accounts
                   Angular AccountSummaryComponent (Signals) + SSE reactivo
                   audit_log: ACCOUNT_BALANCE_VIEWED

US-702 [5 SP]   → TransactionHistoryUseCase + Pageable Spring Data
                   GET /api/v1/accounts/{id}/transactions?page&size&from&to&type&min&max
                   Page<TransactionDto> + filtros combinados
                   Angular TransactionListComponent (virtual scroll CDK)
                   @Cacheable("transactions") TTL 30s + @CacheEvict SSE
```

**Total Semana 1: 13 SP**

### Semana 2 — 10 SP (búsqueda + extractos + categorización)

```
US-703 [3 SP]   → Filtro LIKE + índice GIN full-text PostgreSQL en concept
                   Mínimo 3 chars + debounce 300ms Angular
                   Integración con TransactionHistoryUseCase
                   Highlight término en resultados

US-704 [4 SP]   → StatementExportUseCase (@Async, streaming — patrón FEAT-005)
                   PDF: plantilla Banco Meridian (#1B3A6B) + hash SHA-256 pie
                   CSV: UTF-8 BOM + headers fecha;concepto;importe;saldo;categoria
                   GET /api/v1/accounts/{id}/statements/{year}/{month}?format=pdf|csv
                   audit_log: STATEMENT_DOWNLOADED · Límite 500 movimientos

US-705 [3 SP]   → TransactionCategorizationService
                   Enum TransactionCategory (10 valores)
                   Matching case-insensitive sobre concept
                   Persistencia lazy en transactions.category
                   Angular: paleta CSS variables por categoría + icono
```

**Total Semana 2: 10 SP**

---

## 5. Arquitectura Sprint 9 — decisiones clave

### ADR-014 — Redis Pub/Sub para SSE (prerequisito día 1)

**Problema:** `SseRegistry` gestiona conexiones en memoria local al pod.
En multi-pod un evento publicado en el pod A no llega al cliente SSE conectado al pod B.

**Decisión:**
```
Publisher (cualquier pod)
    │ RedisTemplate.convertAndSend("sse:events:{userId}", event)
    ▼
Redis Pub/Sub broker
    ├── Pod A: RedisMessageListenerContainer → SseRegistry.sendToUser(userId, event)
    └── Pod B: RedisMessageListenerContainer → SseRegistry.sendToUser(userId, event)
```

**Fallback:** Si Redis no disponible → SseRegistry en memoria (instancia única).
Log WARN + métrica `sse.redis.fallback.count`.

### Flyway V10 — Esquema bancario

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    alias VARCHAR(100) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    type VARCHAR(20) NOT NULL,   -- CORRIENTE, AHORRO, NOMINA
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE account_balances (
    account_id UUID PRIMARY KEY REFERENCES accounts(id),
    available_balance DECIMAL(15,2) NOT NULL,
    retained_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    transaction_date TIMESTAMP NOT NULL,
    concept VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'OTRO',
    type VARCHAR(20) NOT NULL,   -- CARGO, ABONO
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_account_date
    ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_concept_fts
    ON transactions USING gin(to_tsvector('spanish', concept));
```

### Adaptador bancario — interfaz sellada para swap Sprint 10

```java
// Puerto — no cambia entre Sprint 9 y Sprint 10
public interface AccountRepositoryPort {
    List<AccountSummaryDto> findByUserId(UUID userId);
    Page<TransactionDto> findTransactions(UUID accountId,
        TransactionFilter filter, Pageable pageable);
    Optional<AccountBalanceDto> getBalance(UUID accountId);
}
// @Profile("!production") → MockAccountRepositoryAdapter  (Sprint 9)
// @Profile("production")  → CoreBankingAccountAdapter      (Sprint 10)
```

---

## 6. Dependencias y riesgos

### Dependencias resueltas ✅
- JWT + SecurityFilterChain (FEAT-001) · audit_log inmutable (FEAT-005)
- JwtBlacklistService Redis (DEBT-009 Sprint 8)
- SseRegistry + SseNotificationService (FEAT-004 Sprint 8)
- OpenPDF disponible (FEAT-005)

### Riesgos priorizados

| ID | Riesgo | P | I | Mitigación |
|---|---|---|---|---|
| R-F7-001 | API core bancario no disponible | A | A | Mock sellado Sprint 9; swap transparente Sprint 10 sin cambiar use cases |
| R-F7-002 | Queries lentas en transactions sin índices | M | M | Flyway V10 incluye índices GIN + B-tree desde el inicio |
| R-F7-003 | DEBT-011 bloquea SSE de US-701 | M | M | DEBT-011 es ítem #1; US-701 arranca en paralelo con mock SSE local |
| R-F7-005 | Saldo en caché desactualizado | M | M | TTL 30s + invalidación activa vía SSE |
| R-S9-001 | ADR-014 no aprobado antes de DEBT-011 | M | A | ADR-014 se revisa en Gate 1 junto con este planning |

---

## 7. Definition of Done Sprint 9

### Deuda técnica
- [ ] DEBT-011: evento SSE llega a cliente en pod diferente al publicador (test multi-instancia STG)
- [ ] DEBT-011: fallback graceful si Redis no disponible — log WARN, sin error al usuario
- [ ] DEBT-012: job a 02:00 UTC, purga >90d, log estructurado, idempotente

### FEAT-007
- [ ] US-701: carga ≤2s p95 · IBAN enmascarado · saldo real-time SSE · ACCOUNT_BALANCE_VIEWED
- [ ] US-702: paginación 20/pág · filtros fecha/tipo/importe combinables · caché TTL 30s
- [ ] US-703: búsqueda ≥3 chars · debounce 300ms · highlight · combinada con filtros US-702
- [ ] US-704: PDF Banco Meridian + SHA-256 · CSV UTF-8 BOM · ≤5s/500mov · STATEMENT_DOWNLOADED
- [ ] US-705: 10 categorías · OTRO como fallback · filtro integrado en US-702

### Calidad
- [ ] ≥ 65 tests nuevos (unit + IT + E2E Playwright)
- [ ] 0 defectos críticos · Cobertura ≥ 80% en clases nuevas
- [ ] OpenAPI v1.6.0 publicada · Flyway V10 ejecutado en STG sin errores

---

## 8. Gates HITL Sprint 9

| Gate | Responsable | Momento | Contenido |
|---|---|---|---|
| Gate 1 — Planning | Product Owner | Día 1 S1 | Este documento + FEAT-007.md |
| Gate 2 — Arquitectura | Tech Lead | Día 2-3 S1 | ADR-014 + LLD-010 |
| Gate 3 — Code Review S1 | Tech Lead | Fin S1 | DEBT-011/012 + US-701 + US-702 |
| Gate 4 — Code Review S2 | Tech Lead | Fin S2 | US-703 + US-704 + US-705 |
| Gate 5 — QA | QA Lead | Fin S2 | ≥65 tests · 0 defectos · E2E Playwright |
| Gate 6 — DevOps | DevOps | Post-Gate 5 | Merge → develop · tag v1.9.0-rc · STG |

---

## 9. Prerrequisitos técnicos día 1

| Prerequisito | Bloqueante para | Estado |
|---|---|---|
| ADR-014 redactado y enviado a Tech Lead | DEBT-011 | ⏳ Sprint 9 día 1 |
| Flyway V10 SQL revisado | US-701, US-702 | ⏳ Sprint 9 día 1 |
| Mock data script (2 cuentas, 200 mov./cuenta) | US-701/702/703 | ⏳ Sprint 9 día 1 |
| Merge rama Sprint 8 → develop | Baseline limpia | ⚠️ Pendiente manual |
| Tag v1.8.0 sobre main | Trazabilidad CMMI | ⚠️ Pendiente manual |

---

## 10. Acciones de mejora Sprint 8 → Sprint 9

| ID | Acción | Responsable | Cuándo |
|---|---|---|---|
| ACT-32 | Separar lógica SSE de NotificationCenterComponent en SseNotificationService dedicado | Frontend Dev | S1 previo a US-701 |
| ACT-33 | ADR-014 antes de DEBT-011 — evitar retrabajo de arquitectura | Architect | Día 1 obligatorio |
| ACT-34 | Test de carga SSE: 200 conexiones concurrentes en STG (SUG-S8-001) | QA | Gate 5 |
| ACT-35 | Documentar interfaz AccountRepositoryPort en OpenAPI antes del mock | Backend Dev | Día 1 S1 |

---

## 11. Artefactos a generar en Sprint 9

| Artefacto | Agente responsable | Gate |
|---|---|---|
| ADR-014 — Redis Pub/Sub design | Architect Agent | Gate 2 |
| LLD-010 — Cuentas y movimientos backend + frontend | Architect Agent | Gate 2 |
| OpenAPI v1.6.0 | Backend Dev | Gate 3 |
| Flyway V10 migration SQL | Backend Dev | Gate 2 |
| SPRINT-009-report.md | Scrum Master Agent | Post-Gate 6 |
| Delivery package v1.9.0 (Word + Excel) | Documentation Agent | Post-Gate 6 |

---

## 12. Release planning actualizado

| Release | Contenido | ETA | Estado |
|---|---|---|---|
| v1.8.0 | FEAT-004 + DEBT-009/010 | 2026-03-31 | ⚠️ Pending tag (manual) |
| **v1.9.0** | **FEAT-007 + DEBT-011/012** | **2026-04-14** | 🔄 Sprint 9 en curso |
| v2.0.0 | FEAT-008 Transferencias entre cuentas | 2026-04-28 | Backlog |

---

## 13. Velocidad acumulada (proyección 9 sprints)

| Sprint | SP | Feature principal |
|---|---|---|
| Sprint 1 | 22 | FEAT-001 parcial |
| Sprint 2 | 24 | FEAT-001 cierre |
| Sprint 3 | 23 | FEAT-002 |
| Sprint 4 | 25 | FEAT-003 |
| Sprint 5 | 24 | FEAT-004 parcial |
| Sprint 6 | 23 | FEAT-005 |
| Sprint 7 | 24 | FEAT-006 |
| Sprint 8 | 24 | FEAT-004 cierre |
| **Sprint 9** | **23** | **FEAT-007** |
| **Total acumulado** | **212 SP** | |
| **Velocidad media** | **23.56 SP/sprint** | |

---

*SOFIA Scrum Master Agent · BankPortal Sprint 9 · 2026-03-17*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1 · REQM SP 1.3*
*Scrumban: Sprint planificado + flujo continuo Kanban intra-sprint*
