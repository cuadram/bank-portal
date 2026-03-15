# Project Plan — BankPortal

## Metadata
- **Cliente:** Banco Meridian
- **PM/SM:** SOFIA Agent — Scrum Master
- **Fecha inicio:** 2026-03-16
- **Fecha fin estimada:** 2026-04-24 (2 sprints estimados)
- **Duración sprint:** 2 semanas
- **Metodología:** Scrumban · CMMI Nivel 3

---

## Alcance

Implementación del portal bancario digital de Banco Meridian. La entrega inicial
cubre la Épica de Seguridad y Control de Acceso, comenzando por la funcionalidad
crítica de autenticación de doble factor (2FA) basada en TOTP (RFC 6238), exigida
por PCI-DSS 4.0 req. 8.4 e ISO 27001 A.9.4.

---

## Estimación

| Épica | Feature | SP estimados | Sprints estimados | Prioridad |
|---|---|---|---|---|
| Seguridad y Control de Acceso | FEAT-001 — 2FA TOTP | 40 | 2 | CRÍTICA |

**Total SP estimados:** 40
**Sprints planificados:** 2
**Capacidad promedio estimada:** 20 SP/sprint (baseline conservador Sprint 1: 70%)

---

## Calendario de sprints

| Sprint | Fechas | Sprint Goal |
|---|---|---|
| Sprint 1 | 2026-03-16 → 2026-03-28 | Backend 2FA funcional: enrolamiento, verificación OTP y recuperación |
| Sprint 2 | 2026-03-30 → 2026-04-10 | Frontend Angular 2FA + auditoría + infra CI/CD + aceptación cliente |

---

## Equipo

| Rol | Persona | Disponibilidad |
|---|---|---|
| Product Owner | Seguridad TI — Banco Meridian | 50% |
| Tech Lead | [Por asignar] | 100% |
| Developer Backend | SOFIA Agent — Java Developer | 100% |
| Developer Frontend | SOFIA Agent — Angular Developer | 100% |
| QA Lead | SOFIA Agent — QA Tester | 100% |
| DevOps | SOFIA Agent — DevOps | 100% |
| Scrum Master | SOFIA Agent — SM/PM | 100% |
| Release Manager | [Por asignar] | 50% |

---

## Acuerdos de servicio (SLAs)

| Gate | SLA acordado con cliente |
|---|---|
| Aprobación User Stories | 24h |
| Aprobación HLD/LLD | 48h |
| Aprobación Sprint Review | 48h |
| Go/No-Go Release | 24h |

---

## Dependencias

| Dependencia | Tipo | Estado | Impacto |
|---|---|---|---|
| Módulo autenticación JWT | Técnica | ✅ Disponible | Bloqueante desarrollo |
| Tabla `users` en BD | Técnica | ✅ Disponible | Bloqueante desarrollo |
| Librería `java-totp` (JJWT) | Técnica | ⏳ Por configurar | Sprint 1 |
| Diseño UI pantallas 2FA | UX/UI | ⏳ Por validar | Sprint 2 |
| Certificado SSL/TLS | Infra | ✅ Disponible | — |

---

## Riesgos iniciales

Ver archivo: `risk-register-bankportal.md`
