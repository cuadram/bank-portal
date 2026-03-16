# Sprint Report — Sprint 4 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 4 |
| **Período** | 2026-04-28 → 2026-05-09 |
| **SM** | SOFIA SM Agent |
| **Fecha cierre** | 2026-05-09 |
| **Release** | v1.3.0 — Go/No-Go APPROVED |

## Sprint Goal
> **"Cerrar FEAT-002 al 100%, arrancar FEAT-003 con US-201/202/203/204 y saldar DEBT-004/005."**

**Estado: ✅ ALCANZADO**

---

## Resumen de resultados

| Métrica | Planificado | Real | Variación |
|---|---|---|---|
| Story Points | 24 | 24 | ✅ 0 |
| US completadas | 5 (US-105b/201/202/203/204) | 5 | ✅ 0 |
| DEBT resueltas | 2 (DEBT-004/005) | 2 | ✅ 0 |
| NCs Code Review | 0 | 0 | ✅ |
| Defectos QA | 0 | 0 | ✅ |
| Warnings QA | — | 1 (DEBT-006) | No bloqueante |
| Gates HITL completados | 5 | 5 | ✅ 100% |
| Ciclos CR | 1 | 1 | ✅ |
| WCAG 2.1 AA | 82 checks | 82/82 PASS | ✅ |
| PCI-DSS 4.0 req. 8.3 | CUMPLE | ✅ CUMPLE | — |
| ADR-008 cookie HttpOnly | CUMPLE | ✅ CUMPLE | — |

## Velocidad

| Tipo | SP planificados | SP completados |
|---|---|---|
| New Feature (FEAT-003 + US-105b) | 21 | 21 |
| Tech Debt (DEBT-004/005) | 3 | 3 |
| **Total Sprint 4** | **24** | **24** |

**Velocidad Sprint 4:** 24 SP
**Velocidad media acumulada (4 sprints):** 24 SP/sprint — **constante por 4° sprint consecutivo**

## Estado por ítem

| ID | Título | SP | Estado |
|---|---|---|---|
| DEBT-004 | DeviceFingerprintService → ua-parser-java | 2 | ✅ DONE |
| DEBT-005 | Header Deprecation en DELETE /deactivate | 1 | ✅ DONE |
| US-105b | FEAT-002 cierre: HMAC completo + página deny | 5 | ✅ DONE · FEAT-002 CERRADA |
| US-201 | Marcar dispositivo como de confianza | 3 | ✅ DONE |
| US-202 | Ver y eliminar dispositivos de confianza | 4 | ✅ DONE |
| US-203 | Login sin OTP desde dispositivo de confianza | 6 | ✅ DONE |
| US-204 | Expiración automática 30 días + job limpieza | 3 | ✅ DONE |

## Gates completados en Sprint 4

| Gate | Artefacto | Aprobador | Estado |
|---|---|---|---|
| 🔒 Sprint Planning | SPRINT-004-planning.md | Product Owner | ✅ APPROVED |
| 🔒 ADR-008 | ADR-008-trust-token-cookie.md | Tech Lead | ✅ APPROVED |
| 🔒 Code Review | FEAT-003-developer-output.md | Tech Lead | ✅ APPROVED (1 ciclo) |
| 🔒 QA Lead | QA-FEAT-003-sprint4.md | QA Lead | ✅ APPROVED |
| 🔒 QA Product Owner | QA-FEAT-003-sprint4.md | Product Owner | ✅ APPROVED |
| 🔒 Go/No-Go PROD v1.3.0 | RELEASE-v1.3.0.md | Release Manager | ✅ APPROVED |

## Acciones de mejora Sprint 3 — verificación de efectividad (ACT-10)

| Acción | Efectividad |
|---|---|
| ACT-12 DoR: header Deprecation en endpoints deprecated | ✅ DEBT-005 resuelto en día 1 — headers RFC 8594 operativos |
| ACT-13 DEBT-004 ua-parser-java | ✅ Edge detectado correctamente — E2E-S4-05 confirma en browser real |
| ACT-14 Protocolo scope reduction intra-sprint | ✅ No se produjo ninguna reducción de scope — sprint sin incidencias |
| ACT-15 Credentials en README antes del día 1 | ✅ `bankportal-trusted-device-hmac-key` documentado antes de arrancar |

## Risk Register — cambios Sprint 4

| ID | Riesgo | Estado |
|---|---|---|
| R-F2-005 | Clientes integran DELETE deprecated | ✅ MITIGADO — DEBT-005 operativo, headers visibles |
| R-S4-001 | US-203 complejidad filtro Spring Security | ✅ CERRADO — spike día 1 confirmó viabilidad sin issues |
| R-F3-001 | Trust token robado | ✅ CERRADO — HttpOnly + binding fingerprint |
| R-F3-002 | PCI-DSS auditoría omisión OTP | ✅ CERRADO — TRUSTED_DEVICE_LOGIN en audit_log |
| R-F3-004 | Job limpieza inactivo | ✅ CERRADO — verificación TTL en login como fallback |

## Deuda técnica generada Sprint 4

| ID | Descripción | Impacto | Sprint |
|---|---|---|---|
| DEBT-006 | Rotación TRUSTED_DEVICE_HMAC_KEY sin ventana de gracia | Medio | Sprint 5 |

## Features cerradas acumuladas

| Feature | SP | Sprints | Release |
|---|---|---|---|
| FEAT-001 — 2FA TOTP completo | 40 | 1–2 | v1.0.0 / v1.1.0 |
| FEAT-002 — Gestión de sesiones | 29 | 3–4 | v1.2.0 / v1.3.0 |
| FEAT-003 — Dispositivos de confianza | 16 | 4 | v1.3.0 |

## Métricas acumuladas del proyecto (4 sprints)

| Métrica | Total |
|---|---|
| Sprints completados | 4 |
| SP totales | 96/96 (100%) |
| Velocidad media | 24 SP/sprint — constante × 4 |
| Defectos QA acumulados | 0 |
| NCs CR acumuladas | 2 (S1) cerradas · S2/S3/S4 = 0 |
| Gates HITL totales | 22 completados |
| Releases PROD | v1.0.0 · v1.1.0 · v1.2.0 · v1.3.0 |
| ADRs generados | ADR-001 → ADR-008 |

---

*SOFIA SM Agent — 2026-05-09 · Sprint 4 CLOSED · v1.3.0 en PROD*
