# Release Notes — v1.24.0 — BankPortal

## Metadata
- **Fecha release:** 2026-04-14
- **Sprint:** 24 | **Cliente:** Banco Meridian
- **Servicios desplegados:** bankportal-backend, bankportal-frontend
- **Aprobado por:** Release Manager — Banco Meridian

## Nuevas funcionalidades

### FEAT-022 — Bizum P2P
Pagos inmediatos P2P mediante Bizum con autenticación de segundo factor (SCA/OTP) conforme a PSD2 Art.97.

**US cubiertas:** US-F022-01..07

| Funcionalidad | Descripción |
|---|---|
| Activación Bizum | Vinculación teléfono E.164 con consentimiento GDPR Art.6 |
| Envío de pago | Transferencia SEPA Instant hasta €500/op · SCA OTP obligatorio |
| Solicitud de cobro | Solicitud P2P con TTL 24h · aceptar (OTP) o rechazar |
| Historial | Listado paginado con enmascaramiento teléfonos (RN-F022-09) |
| Límites regulatorios | €500/op · €2.000/día (Circular BdE 4/2019) — configurables |
| Módulo Angular | `/bizum` lazy · sidebar nav 💸 · 5 componentes · fidelidad PROTO-FEAT-022 |

## Deudas técnicas cerradas
- **DEBT-045** — CoreBankingMockBizumClient SEPA Instant (ADR-038)
- **DEBT-046** — Redis rate limit key pattern canónico (ADR-039)

## Cambios de infraestructura

| Tipo | Detalle |
|---|---|
| Flyway V27 | V27__bizum.sql — 3 tablas nuevas (bizum_activations, bizum_payments, bizum_requests) |
| Redis keys | `ratelimit:{userId}:bizum:{date}` — reutiliza instancia existente |
| Config | `bank.bizum.limit.*` y `bank.bizum.request.ttl-hours` en application.yml |

## Breaking Changes
> Ninguno — release compatible hacia atrás. V27 es additive (solo CREATE TABLE).

## Servicios afectados

| Servicio | Versión anterior | Versión nueva | Cambios |
|---|---|---|---|
| bankportal-backend | v1.23.0 | v1.24.0 | Módulo bizum + V27 Flyway |
| bankportal-frontend | v1.23.0 | v1.24.0 | BizumModule lazy /bizum |

## Smoke tests
16/16 PASS — ver `docs/devops/SMOKE-TEST-v1.24.0.sh`
SM-13..16 nuevos (Bizum endpoints → 401 sin token)

## Procedimiento de despliegue
```bash
git tag -a v1.24.0 -m "Sprint 24 — Bizum P2P PSD2 SCA"
git push origin v1.24.0
docker compose -f infra/compose/docker-compose.yml up -d --no-deps backend frontend
bash docs/devops/SMOKE-TEST-v1.24.0.sh
```

## Rollback
```bash
# Rollback a v1.23.0 — V27 additive, sin down migration necesaria
docker compose -f infra/compose/docker-compose.yml \
  up -d --no-deps backend=v1.23.0 frontend=v1.23.0
```

---
*DevOps Agent — SOFIA v2.7 — Sprint 24 — 2026-04-14*
