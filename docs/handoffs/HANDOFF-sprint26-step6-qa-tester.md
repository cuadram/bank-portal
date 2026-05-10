# HANDOFF Sprint 26 · Step 6 → Step 7 (DevOps · gate HITL DV G-7)

**Generado por:** SOFIA QA Tester · cierre Step 6
**Fecha:** 2026-05-08
**Sprint:** 26 · **Feature:** FEAT-024 Objetivos de Ahorro · v1.26.0
**Branch:** feature/FEAT-024-sprint26
**HEAD:** (commit del Step 6 pendiente — sustituye este placeholder al hacer push)
**Estado pipeline:** current_step=6 · status=gate_pending · gate_pending=G-6 · esperando aprobación HITL QA Lead + Product Owner

---

## 0. Resumen ejecutivo (TL;DR)

| Métrica | Resultado |
|---|---|
| Lista canónica mvn (19 clases · 145 tests) | **145/145 PASS** |
| Cobertura JaCoCo savings | INSTR 84.3% · LINE 87.2% · BRANCH 88.1% |
| Playwright E2E API-driven (savings.spec.ts) | **6/6 PASS** |
| ng build:prod | **PASS** (340 kB initial) |
| ng test (frontend total) | FAIL (10 errores TS legacy, 0 en savings) |
| axe-core WCAG (login) | **FAIL** (2 violaciones serias) |
| Smoke compose (actuator + 11 endpoints OpenAPI) | PASS |
| Defectos críticos | **2** (BUG-Q-001, BUG-Q-008) |
| Defectos altos | **1** (BUG-Q-003) |
| Defectos medios | 4 (BUG-Q-004, Q-005, Q-007, Q-009) |
| Defectos bajos | 1 (BUG-Q-006) |
| Veredicto QA | **APROBADO CON CONDICIONES** |

## 1. Ruta de progreso del sprint



## 2. Veredicto QA · APROBADO CON CONDICIONES

### Justificación

La implementación de FEAT-024 demuestra **calidad funcional sólida** en la lógica nueva: 145/145 tests unit+IT pasan, 6/6 E2E pasan, cobertura JaCoCo 84-88% sobre savings, los 9 user stories cubren happy + error path, y los 13 de 15 RN se validan con éxito. La pirámide CMMI L3 está respetada (unit + integration con BD real + E2E).

Sin embargo, las pruebas manuales contra el entorno staging real revelaron **2 defectos críticos** y **1 alto** que afectan flujos primarios:

1. **BUG-Q-001 (CRÍTICO)** · seed V30 inserta `category=VIAJES` cuando enum es `VIAJE` → `GET /goals` rompe con 400 BAD_REQUEST. Cualquier usuario en STG/Demo no puede listar sus objetivos.

2. **BUG-Q-008 (CRÍTICO)** · 5 contribuciones simultáneas → 5/5 status 201 pero solo se reservan 60€ de los 150€ esperados. **Pérdida silenciosa de fondos** por lost-update sin locking optimista. Inadmisible en producción bancaria.

3. **BUG-Q-003 (ALTO)** · segunda llamada a `PUT /auto-rule` lanza 500 con stack trace por DataIntegrityViolationException (uk_goal_active_rule). Rompe contrato REST idempotente RFC 7231.

### Condiciones para aprobación G-6

| # | Acción | Owner | Antes de |
|---|---|---|---|
| C1 | Fix BUG-Q-001 (V32 con UPDATE category) | Developer | Aprobación G-6 |
| C2 | Fix BUG-Q-008 (@Version + retry/409) + IT concurrencia | Developer | G-7 (deploy) |
| C3 | Fix BUG-Q-003 (upsert auto-rule) + IT idempotencia | Developer | G-7 |
| C4 | Re-test QA tras C1/C2/C3 | QA | G-7 |
| C5 | Generar smoke-test-v1.26.sh (DEBT-049) | DevOps | G-7 |
| C6 | Aceptar diferimiento S27 de BUG-Q-004/005/006/007/009 + GAPs cobertura | PO | Decisión G-6 |

### Veredicto alternativo

Si el PO exige cero diferimientos críticos para release v1.26.0, el veredicto es **RECHAZADO** y se vuelve a Step 4 con los 3 fixes (estimación 0.5-1 día fix + 0.5 día re-test).

## 3. Entregables producidos

| # | Entregable | Ruta | Estado |
|---|---|---|---|
| 1 | Test Plan FEAT-024 | docs/quality/TestPlan-FEAT-024-sprint26.md | ✓ creado |
| 2 | QA Execution Report | docs/quality/QA-Report-FEAT-024-sprint26.md | ✓ creado (38 kB) |
| 3 | Evidencias (mvn, surefire, ng, playwright, axe) | docs/quality/evidence/sprint-26/ | ✓ 14 ficheros + surefire-canonical/ |
| 4 | Spec Playwright savings + config + a11y | apps/frontend-portal/e2e-savings/ + playwright.config.savings.ts | ✓ creado · reutilizable |
| 5 | .gitignore actualizado | .gitignore | ✓ añadidas exclusiones de artefactos build |
| 6 | Handoff Step 6 → Step 7 | docs/handoffs/HANDOFF-sprint26-step6-qa-tester.md | ✓ este fichero |

## 4. Defectos abiertos por severidad

### CRÍTICOS (bloqueantes G-6)
| ID | Resumen | Endpoint | Fix propuesto |
|---|---|---|---|
| BUG-Q-001 | seed VIAJES rompe GET /goals | GET /goals | V32 UPDATE category |
| BUG-Q-008 | pérdida fondos en 5 contribuciones paralelas | POST /contributions | @Version + retry |

### ALTOS (re-test obligatorio tras fix)
| ID | Resumen | Endpoint | Fix propuesto |
|---|---|---|---|
| BUG-Q-003 | PUT auto-rule 2x → 500 | PUT /auto-rule | upsert pattern |

### MEDIOS (diferibles a S27 con aprobación PO)
| ID | Resumen | Diferible |
|---|---|---|
| BUG-Q-004 | RN-F024-13 días [1,5,10,15,20,25,28] no validados | sí |
| BUG-Q-005 | cap @Max(5000) amount no documentado | sí (decisión PO) |
| BUG-Q-007 | widget no marca degraded:true | sí (junto con fix BUG-Q-001) |
| BUG-Q-009 | WCAG title + lang en index.html | sí (hotfix HTML) |

### BAJOS (mejora hardening)
| ID | Resumen |
|---|---|
| BUG-Q-006 | existence oracle leve en validación vs ownership |

### OBSERVACIONES (Doc / no defectos)
| ID | Resumen |
|---|---|
| OBS-DOC-001 | Skill QA y handoff §5.5 indican OTP en body; en realidad header X-OTP |
| OBS-SEC-002 | DEBT-059 confirmada (RESERVED_EXCEEDS_TARGET expone amounts) |

## 5. Información de contexto crítica

### 5.1 Identidad (verificada)


### 5.2 Stack & entorno (sin cambios desde Step 5b)
- Backend: Java 21 / Spring Boot 3.3.4
- Frontend: Angular 17
- BD: PostgreSQL 16 · Flyway V1..V31
- ShedLock: 5.16.0 LockProvider JdbcTemplate
- Compose: infra/compose/docker-compose.yml · puertos 8081/4201/5433/6380/8025

### 5.3 OTP bypass — CORRECCIÓN respecto al handoff Step 5b
- Mecanismo: header HTTP `X-OTP` (NO body como decía la skill §5.5)
- Código bypass STG: `123456` (configurado en `application-staging.yml · totp.stg-bypass-code`)
- Ver OBS-DOC-001 — actualizar SRS/handoff template en Step 8.

### 5.4 Códigos de error HTTP del módulo savings (verificados en runtime)
Todos los handlers funcionan según LLD excepto en BUG-Q-003 (500 stack expuesto). Lista completa en SavingsExceptionHandler.java verificada.

### 5.5 Estado de session.json al cierre Step 6


## 6. Acciones pendientes para HITL Angel (PO+QA Lead)

1. Revisar **§14 del QA Report** (veredicto + condiciones)
2. Decidir entre:
   - **APROBAR G-6 con condiciones C1-C6** → Developer hace fixes en este sprint, QA re-testa antes de G-7
   - **RECHAZAR G-6** → vuelta a Step 4 con los 3 fixes obligatorios
3. Comando esperado al PO:
   - `apruebo G-6 con condiciones · veredicto APROBADO CON CONDICIONES · BUG-Q-001/008 fix bloqueante para G-7`
   - o bien: `rechazo G-6 · vuelta a Step 4 para fix de BUG-Q-001/008/003`

## 7. Comandos de bootstrap rápido (para Step 7 DevOps)



## 8. Restricciones operativas (sin cambios)
Ver Step 5b handoff §8.

## 9. Pieces of evidence al cierre Step 6



## 10. Comando del PO esperado



Tras G-6 → Step 7 (DevOps · HITL DV G-7).

## 11. Preámbulo recomendado para próximo chat (Step 7 DevOps)



---

**FIN DEL HANDOFF.**

Generado por SOFIA QA Tester al cierre del Step 6 con veredicto APROBADO CON CONDICIONES.
Próximo agente: DevOps (Step 7 · gate HITL DV G-7), tras aprobación HITL del PO.