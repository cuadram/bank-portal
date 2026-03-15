# Project Plan — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Cliente** | Banco Meridian |
| **Proyecto** | BankPortal — Portal Bancario Digital |
| **PM / SM** | SOFIA SM Agent |
| **Fecha inicio** | 2026-03-16 |
| **Fecha fin estimada** | 2026-04-10 |
| **Duración sprint** | 2 semanas (estándar SOFIA) |
| **Versión** | v1.0 |
| **Estado** | DRAFT — pendiente aprobación PO |

---

## Alcance

BankPortal es el portal bancario digital de Banco Meridian. La Fase 1 contempla
la implementación de la feature FEAT-001 (Autenticación de Doble Factor con TOTP),
requerida para cumplimiento PCI-DSS 4.0 (req. 8.4) e ISO 27001 A.9.4.

**Objetivo de negocio:** reducir el riesgo de accesos no autorizados y alcanzar
≥ 60% de adopción 2FA en 90 días post-lanzamiento.

**Entregables principales:**
- Backend Java/Spring Boot: módulo 2FA (enrolamiento, verificación, recuperación, auditoría)
- Frontend Angular: flujo 2FA en login + panel de configuración en perfil
- Tests unitarios, de integración y E2E (Playwright)
- Pipeline Jenkins configurado
- Documentación técnica (HLD, LLD, OpenAPI)

---

## Estimación

| Épica / Feature | SP Estimados | Sprints | Prioridad |
|---|---|---|---|
| FEAT-001 — 2FA TOTP | 40 | 2 | CRÍTICA |
| **Total** | **40** | **2** | |

---

## Planificación de sprints

| Sprint | Fechas | Sprint Goal | SP Objetivo |
|---|---|---|---|
| Sprint 1 | 2026-03-16 → 2026-03-27 | Infraestructura TOTP operativa + flujos core de 2FA (activar y verificar) | 24 |
| Sprint 2 | 2026-03-30 → 2026-04-10 | Flujos de recuperación, auditoría y cobertura E2E completa — feature lista para producción | 16 |

---

## Distribución de User Stories por sprint

### Sprint 1 — 24 SP (Must Have críticos)

| ID | Título | SP | Prioridad |
|---|---|---|---|
| US-006 | Setup de infraestructura TOTP | 3 | Must Have |
| US-001 | Activar 2FA con TOTP (enrolamiento) | 8 | Must Have |
| US-002 | Verificar OTP en flujo de login | 8 | Must Have |
| US-003 | Generar y gestionar códigos de recuperación | 5 | Must Have |
| **Total** | | **24** | |

### Sprint 2 — 16 SP (Should Have + cobertura)

| ID | Título | SP | Prioridad |
|---|---|---|---|
| US-004 | Desactivar 2FA con confirmación | 5 | Should Have |
| US-005 | Auditoría de eventos 2FA | 5 | Should Have |
| US-007 | Tests de integración end-to-end 2FA | 6 | Must Have |
| **Total** | | **16** | |

---

## Capacidad del equipo — Sprint 1 (baseline conservador)

| Parámetro | Valor |
|---|---|
| Días laborables | 10 días |
| Horas/día | 8 h |
| Personas | 3 (1 Java Dev, 1 Angular Dev, 1 QA) |
| **Capacidad bruta** | **240 h** |
| Ceremonias (-4h/persona) | -12 h |
| Buffer impedimentos (10%) | -24 h |
| **Capacidad neta** | **204 h** |
| Factor conservador primer sprint (70%) | ~143 h efectivas |
| Ratio SP/h estimado (baseline) | ~0.17 SP/h |
| **Capacidad en SP (Sprint 1)** | **~24 SP** |

---

## Equipo

| Rol | Persona | Disponibilidad |
|---|---|---|
| Product Owner | [Por mapear — Banco Meridian] | 50% |
| Tech Lead | [Por mapear — Experis] | 100% |
| Java Developer | [Por mapear — Experis] | 100% |
| Angular Developer | [Por mapear — Experis] | 100% |
| QA Lead | [Por mapear — Experis] | 100% |
| Release Manager | [Por mapear — Experis] | 25% |
| SM / PM | SOFIA SM Agent | 100% |

> ⚠️ Roles marcados "Por mapear" deben resolverse en Kick-off antes del Sprint 1.

---

## Acuerdos de servicio (SLAs)

| Gate | SLA acordado | Consecuencia si vence |
|---|---|---|
| Aprobación User Stories (PO) | 24 h | SM escala a PM |
| Aprobación HLD/LLD (Tech Lead) | 48 h | SM escala a PM |
| Code Review (NCs resueltas) | 24 h por NC | Workflow Manager notifica |
| Aceptación QA (QA Lead + PO) | 24 h | SM escala a PM |
| Sprint Review (cliente) | 48 h | SM escala a PM |
| Release Go/No-Go (Release Manager) | 24 h | SM escala a PM |

---

## Riesgos iniciales

Ver Risk Register adjunto: `risk-register.md`

---

## Criterios de éxito del proyecto

- FEAT-001 entregada en ≤ 2 sprints (40 SP)
- 0 NCs BLOQUEANTES abiertas al momento del release
- Cobertura de tests unitarios ≥ 80%
- Todos los gates HITL aprobados sin escalado a PM
- Cumplimiento PCI-DSS 4.0 req. 8.4 verificado por QA

---

*Generado por SOFIA SM Agent — 2026-03-14*
*Estado: DRAFT — 🔒 Pendiente aprobación Product Owner*
