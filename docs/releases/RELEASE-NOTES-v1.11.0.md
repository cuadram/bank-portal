# Release Notes — BankPortal v1.11.0
## Sprint 11 — FEAT-009 Core Bancario Real + Pagos de Servicios

**Versión:** v1.11.0 | **Fecha:** 2026-03-21 | **Sprint:** 11 | **Jira:** SCRUM-32

---

## Resumen

BankPortal v1.11.0 conecta el core bancario real de Banco Meridian sustituyendo el mock de desarrollo introducido en Sprint 10, añade protección de rate limiting en endpoints financieros y lanza la funcionalidad de pagos de servicios (recibos domiciliados y facturas).

---

## Nuevas funcionalidades

### US-901 — BankCoreRestAdapter (integración core real)
- `BankCoreRestAdapter` activo con `@Profile("production")` — mock desactivado en producción
- Endpoints del core integrados: `/core/v1/transfers/own`, `/core/v1/transfers/external`, `/core/v1/accounts/{id}/balance`
- Idempotencia: `X-Idempotency-Key` en toda escritura — sin dobles cargos en reintentos

### US-902 — Resilience4j (ADR-017)
- Circuit breaker: abre al 50% de fallos en 10 llamadas · OPEN 30s · cierra tras 3 éxitos HALF-OPEN
- Retry: 2 reintentos con backoff 500ms solo en errores de red
- Timeout: 5s por llamada al core — nunca bloquea un hilo indefinidamente
- Métricas expuestas en `/actuator/metrics/resilience4j.*`

### US-903 — Pago de recibo domiciliado
- `GET /api/v1/bills` — lista recibos PENDING del usuario
- `POST /api/v1/bills/{id}/pay` — paga con confirmación OTP (PSD2 SCA)
- Persistencia en tabla `bill_payments` con `coreTxnId` trazable

### US-904 — Pago de factura con referencia
- `GET /api/v1/bills/lookup?reference={20digits}` — consulta factura en el core
- `POST /api/v1/bills/pay` — paga con OTP (PSD2 SCA) + referencia enmascarada en logs

## Deuda técnica resuelta

### DEBT-015 — Merge feature/FEAT-008-sprint10 → develop
- Rama develop actualizada con todos los artefactos de Sprint 10

### DEBT-016 — Rate limiting Bucket4j + Redis (ADR-018)
- 10 transfers/min por userId · 5 beneficiary creates/min por IP
- Fail-open si Redis no disponible — sin bloqueo de tráfico legítimo
- HTTP 429 con header `Retry-After` estándar RFC 6585

---

## Modelo de datos

### Flyway V12 — Nuevas tablas
- `bills` — recibos domiciliados con soft delete por status
- `bill_payments` — registro de pagos (recibos y facturas) con `core_txn_id`

---

## ⚠️ Notas de despliegue

```bash
# BankCoreRestAdapter requiere nuevas variables de entorno
export BANK_CORE_BASE_URL=https://api-core.bankmeridian.internal
export BANK_CORE_API_KEY=<valor desde Jenkins credential bankportal-core-api-key>

# Arrancar con perfil production para activar el adaptador real
SPRING_PROFILES_ACTIVE=production docker-compose up -d --build

# Verificar Flyway V12
curl http://localhost:8081/actuator/flyway
```

### Rollback a v1.10.0
```bash
IMAGE_TAG=v1.10.0 docker-compose up -d
# NOTA: v1.10.0 usa BankCoreMockAdapter — sin integración real
```

---

## Métricas del sprint

| Métrica | Valor |
|---|---|
| Story Points entregados | 20/20 (100%) |
| Tests unitarios nuevos | 15 |
| Tests totales acumulados | ~110 |
| Defectos en QA | 0 |
| Cobertura Gherkin | 100% (24/24) |
| CVEs críticos | 0 |

---

*BankPortal v1.11.0 — SOFIA DevOps Agent — Sprint 11 — 2026-03-21*
