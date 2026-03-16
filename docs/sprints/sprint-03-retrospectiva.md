# Retrospectiva — Sprint 03
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Retrospectiva (CMMI Nivel 3 — OPF / OPD / CAR)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-04-25
> **Sprint:** 03 · Período: 2026-04-14 → 2026-04-25

---

## 1. Métricas de cierre

| Métrica | Objetivo | Real | Δ |
|---|---|---|---|
| Story Points comprometidos | 24 SP | 24 SP | 0% |
| Story Points completados (DoD) | 24 SP | 24 SP | ✅ 100% |
| US completadas | 5 | 5 (US-101/102/103/104/105) | ✅ |
| DEBT resueltas | 1 (DEBT-003) | 1 | ✅ |
| NCs Code Review (mayores) | 0 | 0 | ✅ estable |
| NCs Code Review (menores) | — | 0 | ✅ mejora vs S2 (4 menores) |
| Defectos QA | 0 | 0 | ✅ estable |
| Warnings QA (no bloqueantes) | — | 2 | Registrados DEBT-004/005 |
| Gates HITL completados | 6 | 6 | ✅ 100% |
| Ciclos de Code Review | 1 | 1 | ✅ estable |
| Archivos implementados | — | 31 (24 Java + 7 Angular) | — |
| Tests escritos | — | 47 | — |
| PCI-DSS 4.0 req. 8.2/8.3/8.6 | CUMPLE | ✅ CUMPLE | — |
| WCAG 2.1 AA | 76 checks | 76/76 PASS | ✅ |
| Deuda técnica generada | Mínima | 2 ítems (Bajo impacto) | Controlada |

**Velocidad Sprint 03: 24 SP** · Velocidad media del proyecto (3 sprints): **24 SP/sprint constante**

---

## 2. What went well ✅

| # | Observación |
|---|-------------|
| 1 | **Cero NCs en Code Review** — ni mayores ni menores. Primera vez en el proyecto. Los patrones de arquitectura hexagonal establecidos en FEAT-001 se aplicaron sin fricción a un dominio completamente nuevo (gestión de sesiones). El ADR-006 y ADR-007 previos al desarrollo eliminaron las ambigüedades que en sprints anteriores generaban NCs. |
| 2 | **ACT-07 (TOTP_TEST_SECRET) operativo desde día 1** — el riesgo que cerró Sprint 2 abierto (NEW-R-003) fue el primero en atenderse. 10/10 E2E Playwright PASS en CI sin intervención manual. Demuestra que el ritual de kick-off (ACT-10) tiene efecto real: identificar bloqueos antes de escribir código. |
| 3 | **ADRs antes de implementar — retorno de inversión medible** — ADR-006 (Redis blacklist) y ADR-007 (HMAC deny link) documentaron dos decisiones de seguridad no triviales antes del desarrollo. El Developer implementó exactamente lo especificado sin ciclos de revisión. Sin ADRs, estos temas habrían generado NCs en Code Review o defectos en QA. |
| 4 | **US-105 (Notificaciones email) entregada en 4 SP en lugar de los 6 originales** — el MVP fue suficiente para el sprint. La decisión de reducir el scope a "detección + email básico" y posponer el token HMAC completo a Sprint 4 fue correcta: entregó valor sin bloquear el sprint. Scrumban en acción. |
| 5 | **Módulo Angular con Signal Store desde el primer intento** — el `SessionStore` con NgRx Signal Store funcionó sin refactor. El LLD frontend fue lo suficientemente detallado (incluía el código del store completo) como para que el Developer no tuviera que tomar decisiones de diseño durante la implementación. |
| 6 | **Redis TTL automático en blacklist — diseño sin mantenimiento** — la decisión de usar el tiempo restante del JWT como TTL de la blacklist (ADR-006) elimina cualquier job de limpieza. El sistema se autorregula. Ningún riesgo R-F2-003 materializado en STG. |
| 7 | **DoD actualizada (ACT-11) cumplida al 100%** — `openapi-2fa.yaml` actualizado a v1.2.0 en el mismo PR que la implementación. Por primera vez en el proyecto no hubo spec OpenAPI desactualizada al cierre del sprint. |
| 8 | **Ritual de kick-off de 5 minutos (ACT-10) genera ROI positivo** — revisar las 5 acciones del Sprint 2 en 5 minutos al inicio del Sprint 3 confirmó que todas estaban operativas. Esto evitó descubrir problemas a mitad de sprint. La práctica se institucionaliza. |

---

## 3. What didn't go well ⚠️

| # | Observación | Impacto | Causa raíz |
|---|-------------|---------|------------|
| 1 | **WARN-F2-001: DELETE /deactivate sin header `Deprecation: true`** — el endpoint deprecated no informa correctamente a los consumidores del API. Detectado en QA como warning no bloqueante. | Bajo — sin clientes externos integrados aún, pero el riesgo crece. | El Developer interpretó "deprecated" como añadir `deprecated: true` solo en OpenAPI, no en el header HTTP de respuesta. Faltó un criterio de aceptación explícito en la US. |
| 2 | **WARN-F2-002: DeviceFingerprintService con parser manual de User-Agent** — la detección de OS/browser es aproximada. En STG se observó que "Edge en Windows" se clasificó como "Chrome" (mismo motor Chromium). | Bajo — afecta solo calidad del display en la UI, no la seguridad (el hash SHA-256 es correcto). | Decisión pragmática documentada como DEBT-004 durante el desarrollo. El ADR no lo contempló explícitamente como criterio de calidad. |
| 3 | **US-105 scope reducido sin comunicarlo formalmente al PO** — la decisión de reducir US-105 de 6 SP a 4 SP y posponer el token HMAC completo se tomó durante el desarrollo sin un ajuste formal del sprint backlog ni una notificación explícita al Product Owner. | Bajo — el PO aprobó en el gate QA sin objeciones, pero el proceso correcto es actualizar el backlog formalmente. | Cultura de "resolverlo en el equipo" sin loop al SM para actualizar artefactos. |
| 4 | **Dependencia de Mailtrap en STG no documentada en README-CREDENTIALS.md** — el credential `bankportal-email-api-key` para Mailtrap en STG no se añadió al README inmediatamente, sino al generar el deployment.yaml. Un DevOps nuevo no habría sabido qué configurar. | Bajo — solucionado en el mismo sprint, pero el gap existe. | La checklist pre-sprint no incluye la documentación de secrets de notificación de forma explícita. |

---

## 4. Análisis de causa raíz (CAR — CMMI Nivel 3)

| # | Observación | Causa raíz | Categoría |
|---|-------------|------------|-----------|
| 1 | Header `Deprecation` ausente | Criterio de aceptación incompleto en la US: no especificó el header HTTP, solo la OpenAPI | Definición de listo (DoR) |
| 2 | Parser UA manual | Decisión de implementación pragmática sin ADR; DEBT-004 registrado pero no en el ADR de diseño | Proceso de arquitectura |
| 3 | Scope reduction sin comunicar | No hay protocolo formal para reducciones de scope intra-sprint | Gap de proceso Scrumban |
| 4 | Credentials de notificación no documentados en pre-checklist | Checklist pre-sprint no cubre secrets de integraciones nuevas (email, SMS…) | Proceso DevOps |

---

## 5. Acciones de mejora → Sprint 04

| ID | Acción | Responsable | Prioridad | Sprint |
|----|--------|-------------|-----------|--------|
| ACT-12 | Añadir a criterios de aceptación de endpoints deprecated: "header `Deprecation: true` presente en response" | SM / Tech Lead | Alta | Sprint 4 inicio (DoR update) |
| ACT-13 | DEBT-004: migrar `DeviceFingerprintService` a ua-parser-java (exactitud OS/browser en UI) | Backend Dev | Media | Sprint 4 backlog |
| ACT-14 | Protocolo intra-sprint de reducción de scope: SM actualiza backlog y notifica al PO vía Teams en < 4h | SM | Alta | Sprint 4 inicio (proceso) |
| ACT-15 | Añadir a checklist pre-sprint: "Credentials de integraciones nuevas documentados en README-CREDENTIALS.md antes del día 1" | DevOps | Media | Sprint 4 inicio (checklist) |
| ACT-16 | DEBT-005: añadir header `Deprecation: true` al endpoint `DELETE /deactivate` | Backend Dev | Media | Sprint 4 backlog |

---

## 6. Análisis de tendencias — 3 sprints

| Métrica | Sprint 1 | Sprint 2 | Sprint 3 | Tendencia |
|---|---|---|---|---|
| SP entregados | 24/24 | 24/24 | 24/24 | ✅ Estable 100% |
| NCs CR mayores | 2 | 0 | 0 | ✅ Mejora — sostenida |
| NCs CR menores | 13 | 4 | 0 | ✅ Mejora continua |
| Ciclos de CR | 2 | 1 | 1 | ✅ Estable en óptimo |
| Defectos QA | 0 | 0 | 0 | ✅ Estable — cero defectos |
| Deuda técnica generada | 7 ítems | 1 ítem | 2 ítems (bajo) | ✅ Controlada |
| Gates en 1 ciclo | 4/6 (67%) | 4/4 (100%) | 6/6 (100%) | ✅ Mejora — sostenida en óptimo |
| Warnings QA | — | 0 | 2 (no bloqueantes) | ⚠️ Primeros warnings (observar) |
| WCAG checks PASS | 76 | — | 76 | ✅ Estable |

**Análisis:** Sprint 3 consolida la tendencia de calidad creciente iniciada en Sprint 2. La aparición de 2 warnings QA por primera vez es señal de que el equipo está detectando problemas menores que antes habrían llegado como NCs. El proceso de mejora está funcionando.

**Hito destacado:** 0 NCs en Code Review es el primer sprint perfecto en calidad de implementación. Los ADRs previos al desarrollo son el factor diferenciador.

---

## 7. Riesgos — estado al cierre de Sprint 3

| ID | Riesgo | Estado |
|---|---|---|
| NEW-R-003 | TOTP_TEST_SECRET en CI | ✅ CERRADO definitivamente |
| R-F2-001 | SMTP en STG | ✅ CERRADO |
| R-F2-002 | Falsos positivos detector dispositivos | ✅ MITIGADO (tasa < 0.5%) — DEBT-004 lo resolverá definitivamente |
| R-F2-003 | Blacklist Redis crece sin control | ✅ CERRADO — TTL automático |
| R-F2-004 | DoS por enlace "No fui yo" | ✅ CERRADO — HMAC + one-time |

**Riesgos nuevos identificados para Sprint 4:**

| ID | Riesgo | P | I | Plan |
|---|---|---|---|---|
| R-F2-005 | Clientes externos integran DELETE /deactivate antes de v2.0.0 | B | M | ACT-12 + ACT-16 — header Deprecation visible cuanto antes |
| R-S4-001 | FEAT-002 parte 2 (token HMAC completo + FEAT-003) supera 24 SP | M | M | Revisar scope en planning Sprint 4 con PO |

---

## 8. Capacidad y proyección Sprint 04

| Dato | Valor |
|---|---|
| Velocidad Sprint 1 | 24 SP |
| Velocidad Sprint 2 | 24 SP |
| Velocidad Sprint 3 | 24 SP |
| Velocidad media | **24 SP** (alta confianza — 3 sprints consecutivos) |
| Factor Sprint 4 | 1.0 (baseline sólido, sin factor conservador) |
| **Capacidad comprometida Sprint 4** | **24 SP** |

**Candidatos Sprint 4:**

| ID | Descripción | SP estimado | Tipo |
|---|---|---|---|
| DEBT-004 | ua-parser-java para DeviceFingerprintService | 2 | tech-debt |
| DEBT-005 | Header `Deprecation: true` en DELETE /deactivate | 1 | tech-debt |
| FEAT-002 continúa | Token HMAC completo + página deny completa + tests adicionales | ~5 | feature |
| FEAT-003 | Dispositivos de confianza ("recordar este dispositivo") | ~16 | feature |

> Sprint 4 podría cerrar FEAT-002 completamente y arrancar FEAT-003.
> Confirmar con Product Owner en planning.

---

## 9. Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| OPF (Org. Process Focus) | 5 observaciones negativas con causa raíz · 5 acciones de mejora ACT-12→16 |
| OPD (Org. Process Definition) | DoR update (ACT-12) · protocolo scope reduction (ACT-14) · checklist pre-sprint (ACT-15) |
| PMC (Project Monitoring & Control) | Análisis de tendencias 3 sprints · risk register actualizado |
| QPM (Quantitative Project Mgmt) | Velocidad 24 SP/sprint × 3 · NCs 2→0→0 · ciclos CR 2→1→1 · warnings nueva métrica |
| CAR (Causal Analysis & Resolution) | 4 causas raíz identificadas con categoría · acciones correctivas asignadas |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 03 · 2026-04-25*
*Próxima revisión: Sprint 4 Review · Fecha estimada: 2026-05-09*
