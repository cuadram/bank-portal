# Retrospectiva — Sprint 04
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Retrospectiva (CMMI Nivel 3 — OPF / OPD / CAR)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-05-09
> **Sprint:** 04 · Período: 2026-04-28 → 2026-05-09

---

## 1. Métricas de cierre

| Métrica | Objetivo | Real | Δ |
|---|---|---|---|
| Story Points comprometidos | 24 SP | 24 SP | ✅ 0% |
| Story Points completados (DoD) | 24 SP | 24 SP | ✅ 100% |
| US completadas | 5 (US-105b/201/202/203/204) | 5 | ✅ |
| DEBT resueltas | 2 (DEBT-004/005) | 2 | ✅ |
| NCs Code Review (mayores) | 0 | 0 | ✅ estable × 3 sprints |
| NCs Code Review (menores) | 0 | 0 | ✅ estable × 3 sprints |
| Defectos QA | 0 | 0 | ✅ estable × 4 sprints |
| Warnings QA (no bloqueantes) | — | 1 (DEBT-006) | ↓ mejora vs Sprint 3 (2 warnings) |
| Gates HITL completados | 6 | 6 | ✅ 100% |
| Ciclos de Code Review | 1 | 1 | ✅ estable × 3 sprints |
| ADR-008 aplicado en implementación | CUMPLE | ✅ CUMPLE | — |
| PCI-DSS 4.0 req. 8.3 | CUMPLE | ✅ TRUSTED_DEVICE_LOGIN auditado | — |
| WCAG 2.1 AA | 82 checks | 82/82 PASS | ✅ |
| Deuda técnica generada | Mínima | 1 ítem (Medio impacto) | ↓ mejora vs Sprint 3 (2 ítems) |
| Spike US-203 ejecutado | Día 1 | ✅ sin bloqueos | — |
| ACT-15 pre-sprint credentials | Día 1 | ✅ operativo antes del código | — |

**Velocidad Sprint 04: 24 SP**
**Velocidad media acumulada (4 sprints): 24 SP/sprint — constante × 4° sprint consecutivo**

---

## 2. What went well ✅

| # | Observación |
|---|-------------|
| 1 | **ADR-008 antes del código — tercer sprint validando el patrón** — ADR-008 (trust token cookie HttpOnly) fue el primer artefacto generado del sprint, aprobado por Tech Lead antes de que el Developer escribiera una sola línea de US-201/203. Resultado: 0 NCs en Code Review × 3 sprints consecutivos. La correlación es inequívoca: cuando las decisiones de diseño están documentadas antes del desarrollo, el Code Reviewer no tiene nada que rechazar. |
| 2 | **ACT-15 cumplida — credential documentado el día 1** — `bankportal-trusted-device-hmac-key` aparecía en `README-CREDENTIALS.md` antes de arrancar el desarrollo. En Sprint 3, este mismo credential se documentó al final (al generar el deployment.yaml). La diferencia de proceso eliminó un riesgo de bloqueo operativo en la mitad del sprint. |
| 3 | **ACT-14 cumplida por ausencia** — el protocolo de reducción de scope intra-sprint se cumplió porque no fue necesario usarlo: el sprint no tuvo ninguna reducción de scope. Esto es en sí mismo un indicador de que el planning está bien calibrado — 4 sprints con exactamente el scope comprometido. |
| 4 | **Spike US-203 en día 1 — riesgo R-S4-001 cerrado a tiempo** — el filtro `TrustedDeviceAuthFilter` en Spring Security era el componente de mayor incertidumbre técnica. El spike de 2 horas en el día 1 confirmó la viabilidad y desbloqueó la planificación detallada de la semana 2 sin sorpresas. El ritual de identificar y resolver incertidumbre técnica antes de comprometer es ahora una práctica establecida. |
| 5 | **Binding de fingerprint a trust token — seguridad por diseño** — la decisión de ligar el trust token al hash del User-Agent + IP subnet (ADR-008) se validó en E2E: TC-203-03 (fingerprint cambiado → OTP requerido) y TC-203-04 (IDOR → OTP requerido) pasaron sin necesidad de ajustes. El equipo está internalizando "secure by design" como criterio de aceptación, no como auditoría posterior. |
| 6 | **DEBT-004 y DEBT-005 saldadas en < 3 SP totales** — dos deudas que llevaban desde Sprint 3 en el backlog se resolvieron en los primeros 2 días del sprint. El patrón de incluir deuda técnica en el sprint backlog junto con features funciona: no se acumula indefinidamente ni bloquea el velocity. |
| 7 | **ACT-12 generó un artefacto reutilizable** — el criterio de aceptación para endpoints deprecated (header `Deprecation: true` + `Sunset` + `Link`) quedó formalizado en la DoR. En Sprint 5+ cualquier endpoint que se deprece tiene ya el estándar documentado — no hay que volver a descubrirlo. Las retrospectivas están produciendo mejoras institucionales, no solo individuales. |
| 8 | **Warning QA: de 2 a 1** — Sprint 3 tuvo 2 warnings no bloqueantes. Sprint 4 tuvo 1. La tendencia descendente indica que el equipo está anticipando problemas en el diseño en lugar de descubrirlos en QA. DEBT-006 (rotación HMAC sin ventana de gracia) fue identificado como riesgo conocido durante el desarrollo, registrado proactivamente, y convertido en un ítem de backlog antes de que QA lo señalara. |

---

## 3. What didn't go well ⚠️

| # | Observación | Impacto | Causa raíz |
|---|-------------|---------|------------|
| 1 | **DEBT-006: rotación de TRUSTED_DEVICE_HMAC_KEY sin ventana de gracia** — si se rota la clave HMAC en producción (operación de seguridad rutinaria cada 30-90 días), todos los trust tokens activos quedan invalidados de forma inmediata. Los usuarios con dispositivos de confianza registrados verán aparecer el OTP sin previo aviso. Impacto UX significativo para usuarios de largo plazo. | Medio — no afecta la seguridad, pero sí la UX y la confianza del usuario en la plataforma. | El ADR-008 contempló el TTL y el binding de fingerprint, pero no modeló el escenario de rotación operativa de la clave. Es un gap de diseño en la fase de arquitectura, no de implementación. |
| 2 | **LLD de FEAT-003 no generado formalmente** — FEAT-003 reutilizó los LLD de FEAT-002 (DeviceFingerprintService) y el ADR-008 como referencia. Sin embargo, no existe un documento LLD-backend-trusted-devices.md ni LLD-frontend-trusted-devices.md en `docs/architecture/lld/`. Para un proyecto en CMMI Nivel 3, la documentación de bajo nivel debería ser un artefacto explícito, no implícito. | Bajo — el equipo implementó correctamente, pero la trazabilidad documental tiene un gap. | El Architect y el SM no incluyeron la creación de LLD formal como criterio del gate de arquitectura en Sprint 4. El ADR-008 cubrió la decisión crítica y se asumió que era suficiente. |
| 3 | **OpenAPI no actualizada a v1.3.0** — la DoD incluye "spec OpenAPI actualizada cuando se modifica contrato API" (ACT-11). Sprint 4 añadió 3 endpoints (`GET/DELETE /api/v1/trusted-devices`) y extendió `POST /api/v1/2fa/verify` con el parámetro `trustDevice`. La spec `openapi-2fa.yaml` no refleja estos cambios. El QA Report no lo señaló como bloqueante, lo que indica un gap en el checklist de QA. | Medio — cualquier cliente que consuma la API contra la spec v1.2.0 no verá los endpoints de FEAT-003 documentados. Riesgo de integración. | DoD ACT-11 se verificó superficialmente en el Code Review. El Reviewer no comprobó que la spec había sido actualizada para los nuevos endpoints. |
| 4 | **ADR-005 fuera de la carpeta `adr/`** — el archivo `ADR-005-jwt-rsa256.md` existe en `docs/architecture/` raíz pero no en `docs/architecture/adr/` junto al resto de ADRs. Detectado en el escaneo de repo al retomar la sesión. | Bajo — no afecta la funcionalidad, pero rompe la consistencia del directorio de ADRs y dificulta la navegación. | Fue creado en Sprint 2 antes de establecer la convención de directorio. Nunca se movió al hacer el refactor del repo. |

---

## 4. Análisis de causa raíz (CAR — CMMI Nivel 3)

| # | Observación | Causa raíz | Categoría |
|---|-------------|------------|-----------|
| 1 | DEBT-006 rotación HMAC | ADR-008 no modeló el escenario de rotación operativa de claves criptográficas | Proceso de arquitectura — gap en ADR |
| 2 | Sin LLD FEAT-003 | Gate de arquitectura no requirió LLD como artefacto entregable explícito para FEAT-003 | Proceso de arquitectura — gate incompleto |
| 3 | OpenAPI no actualizada v1.3.0 | DoD ACT-11 no verificada exhaustivamente en Code Review ni en QA checklist | Proceso de calidad — DoD enforcement |
| 4 | ADR-005 fuera de carpeta | Convención de directorio establecida después de crear el archivo; no se retroaplicó | Proceso de CM — deuda organizativa |

---

## 5. Acciones de mejora → Sprint 05

| ID | Acción | Responsable | Prioridad | Sprint |
|----|--------|-------------|-----------|--------|
| ACT-17 | DEBT-006: implementar soporte de clave dual para rotación HMAC sin invalidar tokens activos (clave nueva para sign, ambas para verify durante ventana de gracia de 30 días) | Backend Dev | Alta | Sprint 5 backlog (1er ítem) |
| ACT-18 | Añadir al gate de arquitectura: "LLD backend + LLD frontend requeridos para toda feature con nuevos endpoints o nuevos componentes Angular" | SM / Architect | Alta | Sprint 5 inicio (gate update) |
| ACT-19 | Actualizar `openapi-2fa.yaml` a v1.3.0 con endpoints FEAT-003 antes del día 1 de Sprint 5 (pendiente de Sprint 4) | Backend Dev | Alta | Pre-Sprint 5 · día 1 bloqueante |
| ACT-20 | Añadir al Code Review checklist: "spec OpenAPI actualizada para todos los endpoints nuevos/modificados" | SM / Tech Lead | Alta | Sprint 5 inicio (CR checklist) |
| ACT-21 | Mover `ADR-005-jwt-rsa256.md` a `docs/architecture/adr/` para consolidar todos los ADRs en un único directorio | SM | Baja | Pre-Sprint 5 · día 1 |

---

## 6. Análisis de tendencias — 4 sprints

| Métrica | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 | Tendencia |
|---|---|---|---|---|---|
| SP entregados | 24/24 | 24/24 | 24/24 | 24/24 | ✅ Constante 100% × 4 |
| NCs CR mayores | 2 | 0 | 0 | 0 | ✅ Estable en óptimo × 3 |
| NCs CR menores | 13 | 4 | 0 | 0 | ✅ Estable en óptimo × 3 |
| Ciclos de CR | 2 | 1 | 1 | 1 | ✅ Estable en óptimo × 3 |
| Defectos QA | 0 | 0 | 0 | 0 | ✅ Perfecto × 4 sprints |
| Deuda generada | 7 | 1 | 2 | 1 | ✅ Controlada (tendencia ↓) |
| Warnings QA | — | 0 | 2 | 1 | ✅ Mejora (tendencia ↓) |
| Gates en 1 ciclo | 4/6 (67%) | 4/4 (100%) | 6/6 (100%) | 6/6 (100%) | ✅ Estable en óptimo × 3 |
| ADR pre-desarrollo | No | Parcial | Sí | Sí | ✅ Institucionalizado |
| ACT efectividad | — | 3/5 (60%) | 5/5 (100%) | 4/4 (100%) | ✅ Mejora sostenida |

**Análisis acumulado:** Sprint 4 consolida el perfil de calidad del equipo. Tres métricas llevan 3 sprints consecutivos en su valor óptimo (NCs CR, ciclos CR, gates 100%). La deuda técnica generada es la más baja del proyecto (1 ítem de impacto medio). Las acciones de retrospectiva tienen una tasa de efectividad del 100% en los últimos 2 sprints — el proceso de mejora continua es funcional.

**Señal de alerta controlada:** el gap de OpenAPI y la ausencia de LLD formal para FEAT-003 indican que el equipo está ganando velocidad de implementación pero a costa de rigor documental. ACT-18, ACT-19 y ACT-20 atacan este patrón antes de que se convierta en deuda técnica estructural.

---

## 7. Riesgos — estado al cierre de Sprint 4

| ID | Riesgo | Estado |
|---|---|---|
| R-F3-001 | Trust token robado | ✅ CERRADO — HttpOnly + binding fingerprint validados en E2E |
| R-F3-002 | PCI-DSS auditoría omisión OTP | ✅ CERRADO — TRUSTED_DEVICE_LOGIN en audit_log inmutable |
| R-F3-004 | Job limpieza inactivo | ✅ CERRADO — TTL verificado en login como segunda línea |
| R-S4-001 | US-203 complejidad Spring Security | ✅ CERRADO — spike día 1 resolvió la incertidumbre |

**Riesgos abiertos trasladados a Sprint 5:**

| ID | Riesgo | P | I | Plan |
|---|---|---|---|---|
| R-S5-001 | DEBT-006: rotación HMAC invalida trust tokens en prod | M | M | ACT-17 — clave dual en Sprint 5 |
| R-S5-002 | OpenAPI v1.2.0 en producción mientras FEAT-003 ya está desplegada | B | M | ACT-19 — actualizar antes del día 1 Sprint 5 |
| R-S5-003 | FEAT-004 no definida — posible planning Sprint 5 sin backlog suficiente | M | M | Sesión de refinamiento con PO antes del planning |

---

## 8. Capacidad y proyección Sprint 05

| Dato | Valor |
|---|---|
| Velocidad Sprint 1–4 | 24 SP × 4 (muy alta confianza) |
| Factor Sprint 5 | 1.0 — sin ajuste |
| **Capacidad comprometida Sprint 5** | **24 SP** |

**Candidatos Sprint 5 (pendiente confirmación PO):**

| ID | Descripción | SP estimado | Tipo | Prioridad |
|---|---|---|---|---|
| DEBT-006 | Rotación HMAC key con ventana de gracia | ~5 | tech-debt | Alta — R-S5-001 |
| ACT-19 | OpenAPI v1.3.0 — endpoints FEAT-003 | ~1 | documental | Alta — pre-sprint |
| LLD-003 | LLD backend + frontend FEAT-003 (ACT-18) | ~2 | documental | Alta — gate update |
| FEAT-004 | Por definir con PO | ~16 | feature | — |

> Sprint 5 arranca con las 3 acciones de mejora de alta prioridad (ACT-17/19 + LLD-003)
> que suman ~8 SP, dejando ~16 SP disponibles para FEAT-004.

---

## 9. Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| OPF (Org. Process Focus) | 4 observaciones con causa raíz · 5 acciones ACT-17→21 · tasa efectividad retrospectivas 100% |
| OPD (Org. Process Definition) | Gate arquitectura update (ACT-18) · CR checklist update (ACT-20) · DoR OpenAPI (ACT-19/20) |
| PMC (Project Monitoring & Control) | Tendencias 4 sprints · risk register actualizado · R-S5-001/002/003 nuevos |
| QPM (Quantitative Project Mgmt) | NCs: 2→0→0→0 · Warnings: —→0→2→1 · Deuda: 7→1→2→1 · Velocidad 24×4 |
| CAR (Causal Analysis & Resolution) | 4 causas raíz · 2 en proceso arquitectura · 1 en calidad · 1 en CM |
| CM (Configuration Management) | ADR-005 desplazado detectado — ACT-21 corrige inconsistencia de directorio |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 04 · 2026-05-09*
*Próxima revisión: Sprint 5 Review · Fecha estimada: 2026-05-23*
