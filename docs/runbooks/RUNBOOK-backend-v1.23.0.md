# Runbook Operacional — v1.23.0
**BankPortal · Banco Meridian · Sprint 23**
**Fecha:** 2026-04-09

---

## Arranque del stack

    docker compose -f infra/compose/docker-compose.yml up -d
    # Verificar: curl http://localhost:8081/actuator/health

## Verificacion Flyway V26

    docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
      "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 3;"
    # Esperado: V26__deposits.sql en el tope

## Verificacion depositos en BD

    docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
      "SELECT id, importe, plazo_meses, estado FROM deposits LIMIT 5;"

## Endpoints criticos v1.23.0

| Endpoint | Auth | Descripcion |
|---|---|---|
| POST /api/v1/deposits/simulate | Sin | Simulador publico |
| GET  /api/v1/deposits | Bearer JWT | Listado depositos usuario |
| POST /api/v1/deposits | Bearer JWT | Apertura con OTP |
| GET  /api/v1/deposits/{id} | Bearer JWT | Detalle + cuadro IRPF |
| PATCH /api/v1/deposits/{id}/renewal | Bearer JWT | Instruccion renovacion |
| POST /api/v1/deposits/{id}/cancel | Bearer JWT | Cancelacion anticipada con OTP |

## Alertas y umbrales

- HTTP 5xx en /deposits > 1% -> escalar a tech-lead
- OTP_INVALID rate > 5% en 5 min -> posible ataque de fuerza bruta -> bloquear IP

*DevOps Agent — SOFIA v2.7 — Sprint 23 — 2026-04-09*
