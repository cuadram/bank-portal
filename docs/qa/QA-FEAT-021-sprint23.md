# QA Report — FEAT-021: Depositos a Plazo Fijo
**Sprint 23 · BankPortal · Banco Meridian · QA Tester Agent · SOFIA v2.7**
**Fecha:** 2026-04-09 | **Repositorio activo:** JPA-REAL | **Veredicto:** LISTO PARA RELEASE SIN CONDICIONES

---

## Resumen de ejecucion

| Metrica               | Valor |
|-----------------------|-------|
| Total casos de prueba | 47    |
| PASS                  | 47    |
| FAIL                  | 0     |
| BLOCKED               | 0     |
| Tests unitarios       | 11    |
| Tests funcionales     | 28    |
| Tests seguridad       | 8     |
| Cobertura estimada    | 89%   |

---

## Tests funcionales — FEAT-021

| TC | Descripcion | Endpoint | Resultado |
|---|---|---|---|
| TC-F021-01 | POST /deposits/simulate importe 10000 12m -> 200 con TIN/TAE/IRPF | POST /deposits/simulate | PASS |
| TC-F021-02 | POST /deposits/simulate importe < 1000 -> 400 RN-F021-01 | POST /deposits/simulate | PASS |
| TC-F021-03 | POST /deposits/simulate plazo 61m -> 400 RN-F021-02 | POST /deposits/simulate | PASS |
| TC-F021-04 | POST /deposits/simulate sin JWT -> 200 (publico RN-F021-03) | POST /deposits/simulate | PASS |
| TC-F021-05 | GET /deposits sin JWT -> 401 | GET /deposits | PASS |
| TC-F021-06 | GET /deposits JWT valido -> 200 lista paginada | GET /deposits | PASS |
| TC-F021-07 | GET /deposits deposito FGD <= 100k -> fgdCovered=true RN-F021-05 | GET /deposits | PASS |
| TC-F021-08 | GET /deposits/{id} propio -> 200 con cuadro IRPF | GET /deposits/{id} | PASS |
| TC-F021-09 | GET /deposits/{id} de otro usuario -> 403 RN-F021-10 | GET /deposits/{id} | PASS |
| TC-F021-10 | GET /deposits/{id} inexistente -> 404 | GET /deposits/{id} | PASS |
| TC-F021-11 | POST /deposits OTP valido -> 201 deposito ACTIVE | POST /deposits | PASS |
| TC-F021-12 | POST /deposits OTP invalido -> 401 OTP_INVALID (PSD2 SCA) | POST /deposits | PASS |
| TC-F021-13 | POST /deposits importe < 1000 -> 400 RN-F021-01 | POST /deposits | PASS |
| TC-F021-14 | POST /deposits renovacion RENEW_MANUAL por defecto -> confirmado RN-F021-07 | POST /deposits | PASS |
| TC-F021-15 | POST /deposits sin JWT -> 401 | POST /deposits | PASS |
| TC-F021-16 | PATCH /deposits/{id}/renewal -> 200 instruccion actualizada | PATCH /deposits/{id}/renewal | PASS |
| TC-F021-17 | PATCH /deposits/{id}/renewal deposito CANCELLED -> 409 | PATCH /deposits/{id}/renewal | PASS |
| TC-F021-18 | PATCH /deposits/{id}/renewal de otro usuario -> 403 | PATCH /deposits/{id}/renewal | PASS |
| TC-F021-19 | POST /deposits/{id}/cancel OTP valido -> 200 con penalizacion | POST /deposits/{id}/cancel | PASS |
| TC-F021-20 | POST /deposits/{id}/cancel OTP invalido -> 401 | POST /deposits/{id}/cancel | PASS |
| TC-F021-21 | POST /deposits/{id}/cancel deposito CANCELLED -> 409 | POST /deposits/{id}/cancel | PASS |
| TC-F021-22 | POST /deposits/{id}/cancel de otro usuario -> 403 | POST /deposits/{id}/cancel | PASS |
| TC-F021-23 | Calculo IRPF 19% intereses <= 6000 EUR | Simulacion | PASS |
| TC-F021-24 | Calculo IRPF 21% intereses 6001-50000 EUR | Simulacion | PASS |
| TC-F021-25 | Calculo IRPF 23% intereses > 50000 EUR | Simulacion | PASS |
| TC-F021-26 | Flyway V26 aplicado — 26/26 migrations OK | Flyway | PASS |
| TC-F021-27 | Seeds STG: 2 depositos en BD para usuario pruebas | SQL | PASS |
| TC-F021-28 | Angular /depositos: nav item visible, ruta carga componente | Frontend | PASS |

## Tests de seguridad

| TC | Check | Resultado |
|---|---|---|
| TC-SEC-01 | OTP requerido apertura (PSD2 SCA) | PASS |
| TC-SEC-02 | OTP requerido cancelacion (PSD2 SCA) | PASS |
| TC-SEC-03 | Cross-user isolation GET /deposits/{id} | PASS |
| TC-SEC-04 | Cross-user isolation PATCH renewal | PASS |
| TC-SEC-05 | Cross-user isolation POST cancel | PASS |
| TC-SEC-06 | Sin JWT -> 401 en todos los endpoints protegidos | PASS |
| TC-SEC-07 | PAN Luhn validacion (DEBT-037) | PASS |
| TC-SEC-08 | Simulador publico sin autenticacion (RN-F021-03) | PASS |

## Tests unitarios (ejecutados en Step 4)

| Clase | TCs | Resultado |
|---|---|---|
| IrpfRetentionCalculatorTest | TC-001..006 | 6/6 PASS |
| OpenDepositUseCaseTest | TC-007..011 | 5/5 PASS |

---

## Verificacion STG

- Repositorio activo: JPA-REAL (PostgreSQL 16 via Flyway V26)
- Stack: backend:8081 · frontend:4201 · postgres:5433
- Seeds V26: 2 depositos activos confirmados en BD
- Frontend: menu Depositos visible, simulador funcional, listado carga correctamente

---

*QA Tester Agent — SOFIA v2.7 — Sprint 23 — 2026-04-09*
