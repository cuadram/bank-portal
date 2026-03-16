# Retrospectiva — Sprint 06
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Retrospectiva (CMMI Nivel 3 — OPF / OPD / CAR)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-06-06
> **Sprint:** 06 · Período: 2026-05-26 → 2026-06-06

---

## 1. Métricas de cierre

| Métrica | Objetivo | Real | Δ |
|---|---|---|---|
| Story Points comprometidos | 22 SP (+2 buffer) | 22 SP | ✅ buffer no consumido |
| Items completados | 7 | 7 | ✅ |
| NCs Code Review (mayores) | 0 | 0 | ✅ estable × 5 sprints consecutivos |
| NCs Code Review (menores) | 0 | 2 → resueltas en el ciclo | ⚠️ segunda ocurrencia — causa raíz diferente a S5 |
| Defectos QA | 0 | 0 | ✅ estable × 6 sprints consecutivos |
| Warnings QA | — | 1 (WARN-F5-001) | Estable (1 por tercer sprint consecutivo) |
| Gates HITL completados | 6 | 6 | ✅ 100% |
| WCAG 2.1 AA | 96 checks | 96/96 PASS | ✅ |
| PCI-DSS req. 10.7 | US-402 | ✅ hash SHA-256 scope documentado | — |
| Buffer consumido | 2 SP | 0 SP | ✅ riesgo R-S6-002 no se materializó |
| ACT Sprint 5 efectividad | 5/5 | 5/5 (100%) | ✅ cuarto sprint consecutivo 100% |

**Velocidad Sprint 06:** 22 SP (sprint con buffer explícito por primera vez)
**Velocidad media acumulada (6 sprints): 23.7 SP/sprint**

---

## 2. What went well ✅

| # | Observación |
|---|-------------|
| 1 | **Buffer explícito de 2 SP — primera vez en el proyecto y funcionó** — el planning de Sprint 6 incluyó 2 SP de buffer por R-S6-002 (integración NotificationService potencialmente mayor a lo estimado). El riesgo no se materializó y el buffer no fue consumido. Este es exactamente el comportamiento correcto del buffer: no se usa, se devuelve. La lección es que planificar con buffer explícito reduce la ansiedad del equipo y permite tomar decisiones de scope sin presión. A considerar como práctica para sprints con riesgos de integración. |
| 2 | **ADR-010 como prerequisito real — SSE funcionó en STG sin retrabajo** — el runbook del ADR-010 incluyó los 3 comandos de verificación exactos (`curl -N`, `curl -I`, `timeout 70 curl`). El Developer ejecutó el runbook al finalizar DEBT-007 y confirmó que los headers ADR-010 estaban presentes antes de pasar el code review. Cero sorpresas en QA. Es la materialización del principio "architecture as executable documentation". |
| 3 | **NCs menores × 2 — causa raíz diferente, no regresión de proceso** — las 2 NCs de Sprint 6 (imports no usados: `TrustedDeviceRepository` en `HmacKeyRotationMonitorJob` y `@Async` en `ExportSecurityHistoryUseCase`) son cualitativamente distintas a las NCs de Sprint 5 (`@Async`+`@Transactional` mezclados, `Integer.MAX_VALUE` page size). Las de Sprint 5 eran problemas de diseño. Las de Sprint 6 son imports residuales — ruido de generación de código. No indican degradación de calidad de diseño. El Code Reviewer los identificó correctamente como menores. |
| 4 | **SUG-S6-002 convertida en mejora antes de QA** — el Code Reviewer sugirió documentar el scope del hash SHA-256 en el CSV (`#sha256-scope=data-rows-only`). El Developer la aplicó en la misma corrección de NCs, antes de que QA viera el código. El canal CR→Developer sigue siendo el filtro más eficiente — las sugerencias llegan a QA ya implementadas. |
| 5 | **`buildBody()` exhaustivo con switch Java — la compilación como safety net** — el switch en `NotificationService.buildBody()` es exhaustivo sobre el enum `SecurityEventType`. Si alguien añade un nuevo tipo de evento al enum sin actualizar el switch, el compilador genera un error. Se convirtió un problema de completitud en un problema de compilación. Es un ejemplo de "make wrong code impossible to compile". |
| 6 | **HMAC_KEY_PREVIOUS monitor sin revelar el valor de la clave** — `HmacKeyRotationMonitorJob` registra `HMAC_KEY_PREVIOUS_ROTATION_OVERDUE` en audit_log pero nunca loguea ni persiste el valor real de la clave. Una revisión de seguridad básica (búsqueda de `hmacKeyPrevious` en logs) no encuentra ninguna traza del valor. La práctica de "no loguear secrets" fue aplicada sin instrucción explícita — está internalizada en el equipo. |
| 7 | **FEAT-005 US-401 SecurityScore — lógica de negocio en el use case, no en el controller** — `computeSecurityScore()` es un método privado en `SecurityDashboardUseCase`. El controller solo llama a `execute()` y devuelve el DTO. El Code Reviewer no encontró ninguna lógica de negocio en la capa API — el patrón está completamente institucionalizado. |
| 8 | **Exportación PDF con `#1B3A6B` corporate — consistencia visual sin especificación** — el color de cabecera del PDF (`new java.awt.Color(27, 58, 107)`) coincide con el color corporativo de Experis/BankMeridian definido en el SOFIA setup inicial. El Developer lo aplicó sin que nadie lo indicara explícitamente en el ticket. El equipo tiene contexto de cliente internalizado, no solo requisitos técnicos. |

---

## 3. What didn't go well ⚠️

| # | Observación | Impacto | Causa raíz |
|---|---|---|---|
| 1 | **NCs menores × 2 por segunda vez consecutiva — patrón a cortar** — Sprint 5 tuvo 2 NCs menores (problemas de diseño Spring). Sprint 6 tuvo 2 NCs menores (imports residuales). Causa raíz diferente, pero el patrón cuantitativo es el mismo: 2 NCs menores por segundo sprint consecutivo. Aunque ambas se resolvieron en el mismo ciclo, el objetivo es 0 NCs menores × N sprints, no 2 NCs menores × N sprints. | Bajo — resueltas en el mismo ciclo. Medio a largo plazo si se vuelve sistemático: erosiona la confianza en el proceso de auto-revisión del Developer. | En Sprint 5: gap de LLD antes del código (código nuevo sin referencia). En Sprint 6: imports residuales de borrador inicial no limpiados antes del CR. Dos causas raíz distintas pero con el mismo síntoma — el Developer no hace auto-revisión de imports antes de hacer commit. |
| 2 | **WARN-F5-001 — `SecurityDashboardUseCase` con 5 consultas secuenciales** — el dashboard ejecuta 5 queries a BD en serie: `countEventsByTypeAndPeriod`, `countActiveByUserId` (sessions), `countActiveByUserId` (devices), `countUnreadByUserId`, `findRecentByUserId`. Con latencias individuales de 5-10ms cada una, la latencia acumulada es 25-50ms en STG. En PROD con carga real, puede ser 3-10× mayor. | Bajo en STG, Medio-Alto en PROD con > 1000 usuarios concurrentes. Registrado como DEBT-008. | El LLD-backend-security-audit.md documentó el problema con el comentario `// en producción usar CompletableFuture si latencia > 50ms`, pero no lo convirtió en una condición de la DoD de Sprint 6. La deuda se creó con conocimiento explícito pero sin plazo urgente. |
| 3 | **US-403 (Preferencias de seguridad) no planificada en Sprint 6** — US-403 era un "Should Have" de FEAT-005 con 3 SP estimados. No se planificó porque el planning priorizó DEBT-007 + ACT-23/25 + FEAT-004 integración. Con el buffer no consumido, habría habido capacidad técnica para incluirla. | Bajo — US-403 no era bloqueante y el Sprint Goal se alcanzó. Pero la funcionalidad de preferencias de notificaciones (R-F5-003) queda pendiente. | El SM estimó conservadoramente para gestionar el riesgo de integración. El buffer fue una decisión correcta de risk management. Sin embargo, no se revisó la capacidad real al confirmar que R-S6-002 no se materializó en la semana 1. Una revisión de mid-sprint podría haber añadido US-403. |
| 4 | **Claim `twoFaEnabled` en JWT — SUG-S6-001 pendiente de verificación** — el Code Reviewer detectó que `SecurityAuditController` extrae `twoFaActive` del claim JWT `twoFaEnabled`, pero no verificó explícitamente que `JwtService.issueFullSession()` emite ese claim. Si el claim no existe, el SecurityScore siempre devuelve "ALERT". QA confirmó que el claim está presente en STG — pero la verificación fue ad-hoc, no sistematizada. | Bajo — funciona en STG. Sin embargo, si se modifica `JwtService` en el futuro sin actualizar el claim, el bug es silencioso (score siempre ALERT sin error visible). | La dependencia entre la estructura del JWT y el controller no está documentada en el LLD ni en el OpenAPI schema. Es un contrato implícito. |

---

## 4. Análisis de causa raíz (CAR — CMMI Nivel 3)

| # | Observación | Causa raíz | Categoría |
|---|---|---|---|
| 1 | NCs menores × 2 (imports residuales) | El Developer no ejecuta auto-revisión de imports antes de commitar — no existe un paso de checklist de pre-commit que incluya "verificar imports no usados" | Proceso de desarrollo — ausencia de pre-commit checklist |
| 2 | DEBT-008 (consultas secuenciales) | El LLD documentó el problema pero no lo convirtió en criterio de DoD — las deudas documentadas en comentarios de código no entran automáticamente al backlog | Proceso de gestión de deuda — gap entre LLD y backlog |
| 3 | US-403 no planificada | No se revisó la capacidad al confirmar que R-S6-002 no se materializó — sin revisión de mid-sprint de backlog | Proceso de planning — ausencia de revisión de mid-sprint capacity |
| 4 | Claim JWT sin documentar | Contrato implícito entre JWT structure y controller no capturado en LLD ni OpenAPI | Proceso de arquitectura — gap de documentación de contratos internos |

---

## 5. Acciones de mejora → Sprint 07

| ID | Acción | Responsable | Prioridad | Sprint |
|----|---|---|---|---|
| ACT-27 | Añadir al self-review checklist del Developer: "eliminar imports no usados — ejecutar `Organize Imports` en IDE antes de cada commit" | SM / Developer | Alta | Sprint 7 inicio (pre-commit checklist) |
| ACT-28 | DEBT-008: `SecurityDashboardUseCase` → `CompletableFuture.allOf()` para las 5 consultas en paralelo | Backend Dev | Media | Sprint 7 backlog (~3 SP) |
| ACT-29 | US-403 Preferencias de seguridad — incluir en backlog Sprint 7 con DoD que incluya R-F5-003 verificado | SM / PO | Media | Sprint 7 backlog (~3 SP) |
| ACT-30 | Documentar contratos JWT en OpenAPI security schemes: listar los claims emitidos (`sub`, `scope`, `jti`, `twoFaEnabled`) con sus tipos y origen. Añadir verificación al CR checklist: "claims JWT usados en controllers están documentados en OpenAPI" | Architect / Backend Dev | Media | Sprint 7 inicio (LLD + OpenAPI update) |

---

## 6. Análisis de tendencias — 6 sprints

| Métrica | S1 | S2 | S3 | S4 | S5 | S6 | Tendencia |
|---|---|---|---|---|---|---|---|
| SP entregados | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 22/22 | ✅ 100% × 6 sprints |
| NCs CR mayores | 2 | 0 | 0 | 0 | 0 | 0 | ✅ Óptimo × 5 sprints |
| NCs CR menores | 13 | 4 | 0 | 0 | 2 | 2 | ⚠️ 2 × 2 sprints consecutivos — ACT-27 |
| Defectos QA | 0 | 0 | 0 | 0 | 0 | 0 | ✅ Perfecto × 6 sprints |
| Deuda generada | 7 | 1 | 2 | 1 | 1 | 1 | ✅ Estable en mínimo × 3 sprints |
| Warnings QA | — | 0 | 2 | 1 | 1 | 1 | ✅ Estable y controlado |
| Gates en 1 ciclo | 67% | 100% | 100% | 100% | 100% | 100% | ✅ Óptimo × 5 sprints |
| ACT efectividad | — | 60% | 100% | 100% | 100% | 100% | ✅ Óptimo × 4 sprints |
| LLD antes del código | No | No | Sí | Parcial | Sí | Sí | ✅ Institucionalizado × 3 sprints |
| Buffer planificado | No | No | No | No | No | Sí (no consumido) | 🆕 Primera vez — evaluar repetición |

**Análisis de las NCs menores:** el patrón de 2 NCs menores en S5 y S6 tiene causas raíz distintas (diseño en S5, imports en S6), pero el síntoma cuantitativo es el mismo. ACT-27 ataca la causa de S6 directamente (pre-commit checklist). Si S7 tiene NCs menores, la investigación debe ir más profunda — el patrón cuantitativo persistente merece una CAR más formal.

**Hito del proyecto:** 6 sprints consecutivos al 100% de entregas. 0 defectos QA en todo el proyecto. 34 gates HITL completados en 1 ciclo × los últimos 5 sprints. La deuda técnica generada lleva 3 sprints en 1 ítem por sprint — nivel de madurez operativa muy alto.

---

## 7. Riesgos — estado al cierre de Sprint 6

| ID | Riesgo | Estado |
|---|---|---|
| R-S6-001 | SSE bloqueado por CDN/proxy PROD | ✅ CERRADO — ADR-010 + headers verificados en STG |
| R-S6-002 | Integración NotificationService scope > estimado | ✅ CERRADO — 5 SP exactos, buffer no consumido |
| R-S6-003 | Cobertura Angular < 80% | ✅ CERRADO — ACT-23 ~88% cobertura |
| R-S5-004 | HMAC_KEY_PREVIOUS sin automatización | ✅ CERRADO — ACT-25 job @Scheduled 03:00 UTC operativo |
| R-F5-001 | PDF generación bloquea thread | ✅ CERRADO — generación en memoria, MAX_EVENTS=1000 |
| R-F5-003 | Preferencias desactivan eventos PCI-DSS | ⚠️ PARCIAL — separación audit_log implementada en `buildBody()` pero US-403 no planificada todavía |

**Riesgos nuevos para Sprint 7:**

| ID | Riesgo | P | I | Plan |
|---|---|---|---|---|
| R-S7-001 | DEBT-008 latencia dashboard en PROD con carga real | M | M | ACT-28 — `CompletableFuture.allOf()` Sprint 7 |
| R-S7-002 | Claim `twoFaEnabled` JWT roto si se modifica `JwtService` | B | M | ACT-30 — documentar en OpenAPI + CR checklist |
| R-S7-003 | US-403 no planificada → R-F5-003 queda sin cobertura completa | M | B | ACT-29 — incluir US-403 en Sprint 7 |

---

## 8. Capacidad y proyección Sprint 07

| Dato | Valor |
|---|---|
| Velocidad S1–S6 | 23.7 SP/sprint (media) |
| Factor Sprint 7 | 1.0 |
| **Capacidad comprometida Sprint 7** | **24 SP** |

**Candidatos Sprint 7:**

| ID | Descripción | SP est. | Tipo | Prioridad |
|---|---|---|---|---|
| ACT-28 | DEBT-008: `CompletableFuture.allOf()` en `SecurityDashboardUseCase` | 3 | tech-debt | Alta |
| ACT-29 / US-403 | Preferencias de seguridad unificadas (FEAT-005 cierre) | 3 | feature | Alta |
| ACT-30 | Claims JWT en OpenAPI + CR checklist | 1 | documental | Media |
| FEAT-006 | Por definir con PO | ~17 | feature | — |

---

## 9. Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| OPF | 4 observaciones con causa raíz · 4 acciones ACT-27→30 · 4 sprints consecutivos ACT 100% efectivas |
| OPD | Pre-commit checklist (ACT-27) · contratos JWT en OpenAPI (ACT-30) |
| PMC | Tendencias 6 sprints · R-S5-004 cerrado · R-S7-001/002/003 nuevos |
| QPM | SP 142/142 · NCs menores: 13→4→0→0→2→2 (patrón cuantitativo — ACT-27) · Defectos 0×6 · Deuda 7→1→2→1→1→1 |
| CAR | 4 causas raíz · 1 pre-commit · 1 gestión deuda · 1 mid-sprint capacity · 1 contrato JWT |
| MA | 6 sprints · velocidad media 23.7 SP · 0 defectos QA acumulados · buffer explícito primera vez |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 06 · 2026-06-06*
*Próxima revisión: Sprint 7 Review · Fecha estimada: 2026-06-20*
