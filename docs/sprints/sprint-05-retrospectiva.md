# Retrospectiva — Sprint 05
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Retrospectiva (CMMI Nivel 3 — OPF / OPD / CAR)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-05-23
> **Sprint:** 05 · Período: 2026-05-12 → 2026-05-23

---

## 1. Métricas de cierre

| Métrica | Objetivo | Real | Δ |
|---|---|---|---|
| Story Points comprometidos | 24 SP | 24 SP | ✅ 0% |
| Story Points completados (DoD) | 24 SP | 24 SP | ✅ 100% |
| US completadas | 5 (US-301/302/303/304/305) | 5 | ✅ |
| DEBT resueltas | 1 (DEBT-006) | 1 | ✅ |
| Docs gap cerradas | 3 (OpenAPI + 2 LLD) | 3 | ✅ ACT-18/19/20 |
| NCs Code Review (mayores) | 0 | 0 | ✅ estable × 5 sprints |
| NCs Code Review (menores) | 0 | 2 → resueltas en el mismo ciclo | ⚠️ primera vez con menores desde S2 |
| Defectos QA | 0 | 0 | ✅ estable × 5 sprints |
| Warnings QA | — | 1 (WARN-F4-001) | Estable vs Sprint 4 |
| Gates HITL completados | 6 | 6 | ✅ 100% |
| Ciclos de Code Review | 1 | 1 | ✅ |
| WCAG 2.1 AA | 88 checks | 88/88 PASS | ✅ |
| ADR-009 antes del código | CUMPLE | ✅ CUMPLE | — |
| OpenAPI v1.3.0 día 1 | CUMPLE | ✅ CUMPLE | — |

**Velocidad Sprint 05: 24 SP**
**Velocidad media acumulada (5 sprints): 24 SP/sprint — constante × 5° sprint consecutivo**

---

## 2. What went well ✅

| # | Observación |
|---|-------------|
| 1 | **ACT-18/19/20 resueltas el día 1 — patrón de deuda documental cerrado a la primera oportunidad** — los tres gaps identificados en la retro de Sprint 4 (LLD ausente, OpenAPI desactualizada, CR checklist sin verificación de spec) se atacaron el día 1 del sprint, antes del primer commit de código. El LLD-003 fue aprobado por el Tech Lead antes del desarrollo. La OpenAPI v1.3.0 existía en disco antes de que el Developer abriera un editor. Esta secuencia — documentación primero, código después — es el mismo patrón que eliminó las NCs en Sprint 3. |
| 2 | **DEBT-006 clave dual HMAC — diseño de seguridad sin impacto operativo** — la rotación de claves criptográficas en producción es habitualmente un evento de mantenimiento con ventana de interrupción. La implementación de ADR-009 (clave dual sign/verify con ventana de gracia de 30 días) elimina completamente esa ventana. Validado en E2E-S5-01/02 con tokens reales. Es el tipo de solución que el equipo no habría diseñado así en Sprint 1 — la madurez técnica del equipo es visible en las decisiones de arquitectura. |
| 3 | **NCs del CR resueltas en el mismo ciclo sin retraso de pipeline** — las 2 NCs menores (RV-S5-001 `@Async`+`@Transactional`, RV-S5-002 `Integer.MAX_VALUE` page size) fueron identificadas, corregidas y re-verificadas dentro del mismo gate de Code Review. El QA Tester recibió código ya corregido — sin retrabajo a posteriori. La calidad de los tests previos al CR permitió al Reviewer detectar problemas sutiles de concurrencia que no habrían aflorado en QA. |
| 4 | **SSE con degradación elegante — diseño resiliente desde el primer intento** — US-305 implementó: SSE para eventos críticos + polling fallback 60s si SSE falla + auto-dismiss de toasts a los 8s + límite 1 conexión por usuario + cleanup en 3 callbacks. Ninguno de estos casos fue detectado como gap en QA — llegaron implementados correctamente desde el Developer. Los riesgos R-F4-001/002/003 identificados en el planning se tradujeron directamente en código defensivo. |
| 5 | **ACT-22 (efectividad ACTs Sprint 4): 5/5 × tercer sprint consecutivo** — todas las acciones del Sprint 4 fueron efectivas. ACT-21 (ADR-005 movido) se ejecutó en la propia retrospectiva. El ritual de kick-off de 5 minutos (ACT-10) sigue generando ROI: ninguna de las 5 ACTs llegó al sprint sin estar operativa. |
| 6 | **`findByIdAndUserId()` — el CR detectó un problema de escalabilidad antes de producción** — RV-S5-002 identificó que `markOneAsRead()` cargaba todas las notificaciones del usuario con `Integer.MAX_VALUE` para filtrar en memoria. En STG con datos de prueba esto no falla nunca. En PROD tras 60 días con usuarios activos, habrían sido cientos de registros innecesarios. El CR como mecanismo de escalabilidad prevention funciona. |
| 7 | **Sprint con 3 tipos de trabajo sin fricción** — Sprint 5 mezcló deuda técnica (DEBT-006, 5 SP), gap documental (3 SP) y nueva feature (US-301→305, 16 SP). Los tres tipos coexistieron sin conflicto de prioridades, sin scope reduction intra-sprint y sin bloqueos entre dependencias. La práctica de ordenar el backlog por dependencias técnicas (documentación → arquitectura → código) demostró su valor. |
| 8 | **GRACE_VERIFY en audit_log — observabilidad de la rotación operativa** — el evento `TRUSTED_DEVICE_GRACE_VERIFY` no era un requisito funcional de ninguna US, sino una decisión de diseño del Developer al implementar ADR-009. Permite al equipo de operaciones monitorizar cuántos tokens están en período de gracia tras una rotación, y cuándo han expirado definitivamente. Es un ejemplo de "operabilidad como feature" que no estaba en el backlog pero añade valor real. |

---

## 3. What didn't go well ⚠️

| # | Observación | Impacto | Causa raíz |
|---|---|---|---|
| 1 | **2 NCs menores en Code Review — primera vez desde Sprint 2** — `@Async`+`@Transactional` mezclados en el mismo método y `Integer.MAX_VALUE` como page size son problemas que un developer senior debería haber anticipado. Ambos están documentados en las mejores prácticas de Spring y en la DoR del módulo. | Bajo — resueltos en el mismo ciclo sin impacto en el pipeline. Sin embargo, la reaparición de NCs menores después de 3 sprints en cero es una señal a observar. | El módulo `notification` es código nuevo en un dominio diferente (no hay LLD previo de referencia como sí tenían session y trusteddevice). El Developer implementó sin una referencia arquitectónica consolidada para ese módulo específico. |
| 2 | **`TrustedDevicesComponent.spec.ts` ausente — tests Angular de Sprint 4 pendientes** — el LLD-frontend-trusted-devices.md (generado en Sprint 5) identificó explícitamente que el componente `TrustedDevicesComponent` carecía de spec formal. Estos tests estaban "pendientes para Sprint 5" en el LLD pero no se incluyeron en el backlog del sprint. | Bajo — cobertura E2E cubre los flujos críticos, pero la cobertura unitaria Angular del componente es inferior a los estándares del proyecto. | Al formalizar el LLD en Sprint 5, los tests pendientes se documentaron pero no se convirtieron en ítems de backlog con SP asignados. El SM no hizo el seguimiento para convertirlos en tareas planificadas. |
| 3 | **R-S5-004 abierto — procedimiento de vaciado de HMAC_KEY_PREVIOUS no automatizado** — el runbook de rotación documenta el paso de vaciar `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS` tras 30 días, pero no existe un mecanismo automatizado que lo haga ni una alerta que recuerde hacerlo. Si el operador no lo hace manualmente, la ventana de gracia se extiende indefinidamente. | Medio — la seguridad no se degrada (ambas claves son válidas), pero el diseño depende de disciplina operativa manual. | ADR-009 documentó el riesgo (R-S5-004) pero dejó la mitigación como "documentar en runbook". Es suficiente para el sprint actual pero insuficiente a largo plazo en un entorno PCI-DSS. |
| 4 | **WARN-F4-001: `buildBody()` solo tiene 3 casos descriptivos de 13 en el enum** — el switch en `NotificationService.buildBody()` cubre `LOGIN_NEW_DEVICE`, `SESSION_REVOKED` y `TRUSTED_DEVICE_CREATED`, pero los 10 tipos restantes devuelven el `displayTitle` genérico sin contexto adicional. Detectado en QA como warning no bloqueante. | Bajo — funcional, pero los mensajes de 10 tipos de evento son menos informativos de lo que podrían ser. | La integración de `NotificationService` con los módulos FEAT-001/002/003 (que generarían los metadatos para construir mensajes descriptivos) está pendiente de Sprint 6. El Developer implementó los 3 casos más evidentes sin esperar a la integración completa. |

---

## 4. Análisis de causa raíz (CAR — CMMI Nivel 3)

| # | Observación | Causa raíz | Categoría |
|---|---|---|---|
| 1 | NCs menores en CR | Módulo `notification` sin LLD de referencia previo — el Developer no tenía un artefacto de diseño para ese módulo equivalente al que existía para session y trusteddevice | Proceso de arquitectura — LLD generado a posteriori en el mismo sprint |
| 2 | `TrustedDevicesComponent.spec.ts` ausente | Tests documentados en LLD pero no convertidos en ítems de backlog con SP | Gap de proceso SM — deuda de tests no gestionada en el backlog |
| 3 | HMAC_KEY_PREVIOUS sin automatización de vaciado | ADR-009 delega la mitigación a disciplina operativa manual sin safety net automatizado | Gap de proceso operativo — ausencia de alerta o job automatizado |
| 4 | `buildBody()` incompleto | Integración `NotificationService`↔FEAT-001/002/003 pendiente; Developer implementó MVP sin esperar la integración | Gap de planificación — dependencia de integración no secuenciada |

---

## 5. Acciones de mejora → Sprint 06

| ID | Acción | Responsable | Prioridad | Sprint |
|----|---|---|---|---|
| ACT-22 | LLD del módulo `notification` (backend + frontend) antes del código de Sprint 6 (ACT-18 pattern) | Architect | Alta | Sprint 6 inicio (gate) |
| ACT-23 | Añadir `TrustedDevicesComponent.spec.ts` al backlog Sprint 6 como ítem explícito con SP asignados | SM | Media | Sprint 6 backlog (~2 SP) |
| ACT-24 | DEBT-007: configurar CORS + Spring Security para SSE con CDN/proxy en PROD — ADR-010 requerido | Backend Dev / DevOps | Media | Sprint 6 backlog |
| ACT-25 | Mecanismo automatizado para vaciado de `HMAC_KEY_PREVIOUS` tras 30 días: @Scheduled job que loguea WARN si `GRACE_VERIFY` aparece más de 35 días | Backend Dev | Media | Sprint 6 backlog (~2 SP) |
| ACT-26 | Completar `buildBody()` en `NotificationService` con los 10 tipos restantes al integrar FEAT-001/002/003 | Backend Dev | Media | Sprint 6 (durante integración) |

---

## 6. Análisis de tendencias — 5 sprints

| Métrica | S1 | S2 | S3 | S4 | S5 | Tendencia |
|---|---|---|---|---|---|---|
| SP entregados | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | ✅ Constante 100% × 5 |
| NCs CR mayores | 2 | 0 | 0 | 0 | 0 | ✅ Estable en óptimo × 4 |
| NCs CR menores | 13 | 4 | 0 | 0 | 2 | ⚠️ Reaparición puntual — observar |
| Ciclos de CR | 2 | 1 | 1 | 1 | 1 | ✅ Estable en óptimo × 4 |
| Defectos QA | 0 | 0 | 0 | 0 | 0 | ✅ Perfecto × 5 sprints |
| Deuda generada | 7 | 1 | 2 | 1 | 1 | ✅ Controlada y estable |
| Warnings QA | — | 0 | 2 | 1 | 1 | ✅ Estable (tendencia controlada) |
| Gates en 1 ciclo | 67% | 100% | 100% | 100% | 100% | ✅ Estable en óptimo × 4 |
| ACT efectividad | — | 60% | 100% | 100% | 100% | ✅ Estable en óptimo × 3 |
| LLD antes del código | No | No | Sí | Parcial | Sí | ✅ Institucionalizado (con una excepción puntual) |

**Análisis:** La reaparición de 2 NCs menores en Sprint 5 (tras 3 sprints en cero) no indica regresión — ambas fueron detectadas y corregidas dentro del mismo ciclo CR sin impacto en QA. El patrón se explica por la ausencia de LLD previo para el módulo `notification`, que es exactamente la causa raíz identificada. ACT-22 ataca este patrón para Sprint 6.

**Hito del proyecto:** 5 sprints consecutivos al 100% con velocidad constante de 24 SP/sprint. 0 defectos QA acumulados en todo el proyecto. El proceso SOFIA está en madurez operativa.

---

## 7. Riesgos — estado al cierre de Sprint 5

| ID | Riesgo | Estado |
|---|---|---|
| R-S5-001 | DEBT-006 rotación HMAC invalida tokens | ✅ CERRADO — clave dual operativa |
| R-S5-002 | OpenAPI desactualizada | ✅ CERRADO — v1.3.0 día 1 |
| R-S5-003 | FEAT-004 no definida | ✅ CERRADO |
| R-F4-001 | SSE threads en servidor | ✅ CERRADO |
| R-F4-002 | Tabla notifications sin límite | ✅ CERRADO |
| R-F4-003 | Badge incorrecto si SSE cae | ✅ CERRADO |
| R-S5-004 | HMAC_KEY_PREVIOUS no vaciada | ⚠️ ABIERTO → ACT-25 Sprint 6 |

**Riesgos nuevos para Sprint 6:**

| ID | Riesgo | P | I | Plan |
|---|---|---|---|---|
| R-S6-001 | DEBT-007: SSE bloqueado por CDN/proxy en PROD | M | M | ACT-24 + ADR-010 |
| R-S6-002 | Integración NotificationService con FEAT-001/002/003 — scope mayor a lo estimado | M | M | Revisar en planning Sprint 6 con spikes técnicos previos |
| R-S6-003 | Cobertura unitaria Angular < 80% si tests Sprint 4 siguen pendientes | B | M | ACT-23 — incluir en Sprint 6 backlog |

---

## 8. Capacidad y proyección Sprint 06

| Dato | Valor |
|---|---|
| Velocidad S1–S5 | 24 SP × 5 (máxima confianza) |
| Factor Sprint 6 | 1.0 |
| **Capacidad comprometida Sprint 6** | **24 SP** |

**Candidatos Sprint 6:**

| ID | Descripción | SP est. | Tipo | Prioridad |
|---|---|---|---|---|
| ACT-23 | `TrustedDevicesComponent.spec.ts` + cobertura Angular Sprint 4 | 2 | tests-deuda | Media |
| ACT-25 | Job @Scheduled HMAC_KEY_PREVIOUS cleanup automático | 2 | operabilidad | Media |
| DEBT-007 | SSE + CORS + Spring Security para CDN/proxy PROD | 3 | tech-debt | Media |
| FEAT-004 cont. | Integración `NotificationService` con FEAT-001/002/003 + `buildBody()` completo | 5 | feature | Alta |
| FEAT-005 | Por definir con PO | ~12 | feature | — |

---

## 9. Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| OPF | 4 observaciones con causa raíz · 5 acciones ACT-22→26 · 3 sprints consecutivos ACT 100% efectivas |
| OPD | LLD obligatorio para `notification` (ACT-22) · tests pendientes como backlog ítems (ACT-23) |
| PMC | Tendencias 5 sprints · R-S5-004 abierto · R-S6-001/002/003 nuevos |
| QPM | SP 24×5 · NCs menores: 13→4→0→0→2 (puntual) · Defectos QA 0×5 · Deuda 7→1→2→1→1 |
| CAR | 4 causas raíz · 1 en arquitectura · 1 en proceso SM · 1 en operaciones · 1 en planificación |
| MA | KPIs de proceso estables: velocidad constante · 0 defectos QA acumulados · warnings controlados |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 05 · 2026-05-23*
*Próxima revisión: Sprint 6 Review · Fecha estimada: 2026-06-06*
