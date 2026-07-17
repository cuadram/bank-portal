# QA Report — Sprint 27 · S27-saneamiento+deudas (rev.2, evidencia pristina)
**Fecha:** 2026-07-17 · **Agente:** QA Tester + panel adversarial · **Gate:** G-6 (HITL QA)
**Modelo (Pre-step 6):** sonnet-4.6 (config_block_missing_default_sonnet)

## Contexto
- Repositorio activo: JPA-REAL · Datos: SEED-BD (bankportal_it) · Perfil: integration-compose
- Comando: **mvn -Pintegration-compose clean verify** (CLEAN — evidencia pristina, sin XML stale)
- Base: HEAD ec56e95 + fix DEBT-067 (working tree, pendiente de commit)
- Build: BUILD SUCCESS (42.5 s)

## GR-QA-002 — Evidencia ejecutable (pristina)
| Evidencia | Valor |
|---|---|
| IT failsafe TEST-*.xml | **17 clases** (tras clean, sin stale) |
| IT tests | **70** · fallos 0 · errores 0 · skipped 0 |
| Unit surefire | 663 · fallos 0 · errores 0 · skipped 28 |
| Test regresion starvation | reglasSanasNoSufrenStarvation PASS (DEBT-067) |
| Timestamp | 2026-07-17 (clean verify) |

CORRECCION vs rev.1: la rev.1 declaraba "22 XML / 85 / 15 @Disabled" — inflado por 5 XML de una corrida previa (clases renombradas por DEBT-065). Con clean: 17/70/0. Evidencia ahora reproducible.

## 28 unit skipped (trazabilidad)
- 15 = slices @Disabled DEBT-066 (StatementController 7, SecurityConfigHistory 3, AccountUnlock 2, Sse 2, LoginContext 1) — endpoints sin cobertura ejecutable, riesgo de seguridad registrado.
- 13 = SessionControllerTest 5, NotificationControllerTest 6, AmortizationCalculatorTest 2 (deudas previas, requieren justificacion trazable).

## Condiciones para G-6
- C1 (RESUELTA): starvation scheduler corregida (DEBT-067) + test de regresion PASS.
- C2 (CONDICION): DEBT-066 — cobertura de integracion de endpoints de seguridad (AccountUnlock, LoginContext, SecurityConfigHistory) diferida a S28 con tests compensatorios. PO debe aceptar el diferimiento explicitamente.
- C3 (CONDICION): justificar/documentar los 13 skipped restantes (Session/Notification/Amortization) para trazabilidad CMMI.
- C4 (PENDIENTE): commit del fix DEBT-067 para atar la evidencia a un SHA.

## Veredicto QA
**APROBADO CON CONDICIONES** — el codigo que corre esta verde (70 IT + 663 unit, 0 fallos), el defecto mayor (starvation) esta corregido y verificado. Quedan condiciones C2/C3/C4 para cierre limpio.

---
_Rev.2 tras panel adversarial + clean verify · 2026-07-17 · APROBADO CON CONDICIONES_
