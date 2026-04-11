# Release Notes — v1.23.0
**BankPortal · Banco Meridian · Sprint 23 · FEAT-021 Depositos a Plazo Fijo**
**Fecha release:** 2026-04-09 | **Tipo:** Feature release | **Breaking changes:** Ninguno

---

## Que hay de nuevo

### FEAT-021 — Depositos a Plazo Fijo

Nueva funcionalidad completa de depositos a plazo fijo para clientes de Banco Meridian:

- **Simulador publico**: calculo instantaneo de rentabilidad sin autenticacion. TIN/TAE + cuadro fiscal IRPF (Art.25 Ley 35/2006) con tramos 19%/21%/23%.
- **Listado de depositos**: vista paginada con badge FGD para depositos hasta 100.000 EUR (RDL 16/2011).
- **Detalle con cuadro fiscal**: intereses brutos, retencion IRPF estimada, intereses netos y total al vencimiento.
- **Apertura con SCA**: contratacion de deposito con confirmacion OTP (PSD2 Art.97).
- **Gestion de renovacion**: instruccion configurable — automatica, manual o cancelar al vencimiento (RN-F021-07).
- **Cancelacion anticipada con SCA**: calculo de penalizacion proporcional al tiempo transcurrido.
- **Nav item Depositos** (icono 💰) anadido al sidebar de BankPortal.

### Deudas tecnicas cerradas

| Deuda | Descripcion | Sprint cierre |
|---|---|---|
| DEBT-036 | IBAN real en export_audit_log via AccountRepositoryPort | S23 (verificado) |
| DEBT-037 | Regex PAN Maestro 19 digitos + algoritmo Luhn | S23 |
| DEBT-044 | TAE prestamos externalizada a application.yml | S23 |

---

## Cambios tecnicos

### Backend

- Nuevo modulo `deposit/` con arquitectura hexagonal completa (dominio, aplicacion, infra, API).
- 6 endpoints REST: POST /simulate (publico), GET /, POST /, GET /{id}, PATCH /{id}/renewal, POST /{id}/cancel.
- Flyway V26__deposits.sql: tablas `deposits` + `deposit_applications` + seeds STG idempotentes.
- `application.yml`: nuevas propiedades `bank.products.deposit.*` y `bank.products.loan.tae`.
- `CardPanValidator`: validacion PAN 13-19 digitos + Luhn (DEBT-037).

### Frontend

- Nuevo modulo Angular lazy `/depositos` con 5 componentes: lista, detalle, simulador, formulario apertura, selector renovacion.
- Navegacion interna via `router.navigate()` — sin `[href]` (LA-023-01).

---

## Instrucciones de despliegue

1. `docker compose build backend frontend` — reconstruir imagenes
2. `docker compose up -d` — Flyway V26 se aplica automaticamente al arrancar
3. Verificar: `GET http://localhost:8081/api/v1/actuator/health` -> UP
4. Ejecutar smoke test: `bash infra/compose/smoke-test-v1.23.0.sh`

---

## Rollback

1. `docker compose stop backend frontend`
2. Restaurar imagen anterior `backend-2fa:v1.22.0`
3. Flyway V26 requiere rollback manual: `DROP TABLE deposit_applications; DROP TABLE deposits;`

---

*DevOps Agent — SOFIA v2.7 — Sprint 23 — 2026-04-09*
