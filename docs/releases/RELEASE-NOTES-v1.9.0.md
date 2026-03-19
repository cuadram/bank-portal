# Release Notes — v1.9.0 — BankPortal
## Sprint 9 · FEAT-007 Consulta de Cuentas y Movimientos

---

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.9.0-rc (STG) → v1.9.0 (PROD post Go/No-Go) |
| **Fecha release** | 2026-03-19 |
| **Sprint** | 9 |
| **Cliente** | Banco Meridian / Experis |
| **Rama** | `feature/FEAT-007-sprint9` |
| **Commit base** | `b22caaf` |
| **Jira** | [SCRUM-30](https://nemtec.atlassian.net/browse/SCRUM-30) |
| **Aprobado QA** | ✅ Gate 5 — 2026-03-19 |

---

## Nuevas funcionalidades — FEAT-007

### US-701 — Resumen de cuentas con saldo
El usuario autenticado puede consultar todas sus cuentas activas con saldo disponible, saldo retenido e IBAN enmascarado. El saldo se actualiza en tiempo real vía SSE cuando llega un evento de nuevo movimiento.

### US-702 — Consulta de movimientos paginados con filtros
Listado paginado de movimientos (20/página) con filtros combinables: fecha inicio/fin, tipo (CARGO/ABONO), importe mínimo/máximo. Resultados cacheados 30 segundos con evicción automática en nuevo movimiento.

### US-703 — Búsqueda full-text de movimientos
Búsqueda por concepto con mínimo 3 caracteres y debounce de 300ms. Compatible y combinable con todos los filtros de US-702. Resultados con highlight del término buscado.

### US-704 — Extracto bancario PDF/CSV con integridad certificada
Descarga de extracto mensual en dos formatos:
- **PDF**: plantilla corporativa Banco Meridian (#1B3A6B), tabla de movimientos, resumen de ingresos/cargos/saldo. Integridad garantizada via header `X-Content-SHA256`.
- **CSV**: UTF-8 con BOM (compatible Excel), separador `;`, cabeceras en español.
Límite: 500 movimientos por extracto. Descarga ≤5 segundos. Auditoría `STATEMENT_DOWNLOADED` en cada descarga.

### US-705 — Categorización automática de movimientos
Categorización automática de movimientos por reglas keyword case-insensitive sobre el concepto. 10 categorías implementadas: NOMINA, BIZUM, DEVOLUCION, COMISION, TRANSFERENCIA, CAJERO, RECIBO_UTIL, DOMICILIACION, COMPRA, OTRO (fallback). Filtro por categoría integrado en la vista de movimientos.

---

## Deuda técnica resuelta

### DEBT-011 — SSE escalado horizontal via Redis Pub/Sub
Resuelve el problema de eventos SSE confinados al pod publicador. Implementa canal Redis `sse:user:{userId}` y `sse:broadcast` con fallback graceful a SseRegistry local si Redis no disponible. Métrica `sse.redis.fallback.count` expuesta en Prometheus.

### DEBT-012 — Job nocturno de purga de notificaciones
Job `@Scheduled(cron="0 0 2 * * *")` que elimina notificaciones con más de 90 días. Idempotente, con log estructurado `purge.notifications.count`. Elimina acumulación silenciosa de datos que causaría degradación de BD a largo plazo.

---

## Cambios de infraestructura

| Componente | Cambio |
|---|---|
| **Flyway** | Nueva migración V10 — tablas `accounts`, `account_balances`, `transactions` + índices GIN |
| **Redis** | Nuevo — requerido para DEBT-011. Ver secrets en `.env.example` |
| **Docker Compose** | Actualizado — añadido servicio `redis` + variables FEAT-007 |
| **Dockerfile backend** | Actualizado — base Java 21 JRE Alpine |
| **Dockerfile frontend** | Nuevo — Node 22 build + Nginx Alpine runtime |
| **Jenkinsfile** | Actualizado — stages E2E STG + WCAG axe-core + stages FEAT-007 |

### Variables de entorno nuevas

| Variable | Descripción | Obligatoria |
|---|---|---|
| `REDIS_URL` | URL Redis para SSE Pub/Sub (DEBT-011) | ✅ |
| `REDIS_PASSWORD` | Password Redis | ✅ |
| `STATEMENT_EXPORT_MAX_TRANSACTIONS` | Límite movimientos por extracto (default 500) | ❌ |
| `SSE_REDIS_CHANNEL_PREFIX` | Prefijo canal Redis (default `sse:user`) | ❌ |
| `NOTIFICATION_PURGE_CRON` | Expresión cron purga (default `0 0 2 * * *`) | ❌ |

---

## Endpoints nuevos — OpenAPI v1.6.0

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/accounts` | Resumen cuentas con saldo (US-701) |
| `GET` | `/api/v1/accounts/{id}/transactions` | Movimientos paginados + filtros + búsqueda (US-702/703) |
| `GET` | `/api/v1/accounts/{id}/statements/{year}/{month}` | Extracto PDF/CSV (US-704) |

---

## Breaking Changes
> ✅ Ninguno — sprint aditivo, sin modificaciones de contratos existentes.

---

## Servicios afectados

| Servicio | Versión anterior | Versión nueva | Target |
|---|---|---|---|
| `bankportal-backend-2fa` | v1.8.0 | v1.9.0-rc | Docker Compose STG |
| `bankportal-frontend-portal` | v1.8.0 | v1.9.0-rc | Docker Compose STG |
| PostgreSQL | 16 | 16 (Flyway V10) | Docker Compose |
| Redis | — | 7-alpine (nuevo) | Docker Compose |

---

## Métricas de calidad del sprint

| Métrica | Valor |
|---|---|
| Story Points entregados | 23 / 23 SP (100%) |
| Tests totales | 72 (48 unit + 6 IT + 18 E2E) |
| Defectos críticos | 0 |
| Cobertura Gherkin | 100% (19/19 escenarios) |
| Cobertura código | ~85% |
| Velocidad media acumulada | 23.875 SP/sprint (9 sprints) |

---

## Instrucciones de despliegue STG

```bash
# 1. Clonar y configurar .env
cp infra/compose/.env.example infra/compose/.env
# Rellenar: DB_PASSWORD, REDIS_PASSWORD, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY

# 2. Build de imágenes (o pull desde registry si ya están pusheadas)
docker-compose -f infra/compose/docker-compose.yml build

# 3. Arrancar servicios
IMAGE_TAG=v1.9.0-rc \
docker-compose -f infra/compose/docker-compose.yml up -d

# 4. Verificar health checks
curl -f http://localhost:8081/actuator/health/readiness
curl -f http://localhost:4201/health

# 5. Verificar Flyway V10
docker exec bankportal-backend wget -qO- \
  http://localhost:8080/actuator/flyway | python3 -m json.tool
```

---

## Procedimiento de rollback a v1.8.0

```bash
# 1. Parar contenedores actuales
docker-compose -f infra/compose/docker-compose.yml down

# 2. Restaurar imágenes v1.8.0
IMAGE_TAG=v1.8.0 \
docker-compose -f infra/compose/docker-compose.yml up -d

# 3. IMPORTANTE: Flyway V10 es aditiva — no requiere rollback de BD
#    Las tablas accounts/transactions pueden coexistir sin afectar v1.8.0

# 4. Verificar health
curl -f http://localhost:8081/actuator/health/readiness

# 5. Notificar al PM y documentar causa en post-mortem
```

---

*SOFIA DevOps Agent · BankPortal · Sprint 9 · Gate 6 · 2026-03-19*
