# SPRINT-016 — Planning

**BankPortal · Banco Meridian · Sprint 16**

| Campo | Valor |
|---|---|
| Sprint | 16 |
| Período | 2026-03-25 → 2026-04-08 |
| Feature | FEAT-014 — Notificaciones Push & In-App |
| Objetivo | Sistema completo de notificaciones: web push (FCM/VAPID), centro de notificaciones Angular, alertas transaccionales y de seguridad, preferencias por canal |
| Velocity objetivo | 24 SP |
| Estado | 🟡 PLANNING |

---

## Capacidad del equipo

| Rol | Disponibilidad |
|---|---|
| Backend Dev | 10 días / 40h |
| Frontend Dev | 10 días / 40h |
| QA Lead | 10 días |
| Tech Lead | 10 días |

**Velocidad media (últimos 3 sprints):** 24 SP

---

## Backlog del sprint — Sprint Goal

> *Entregar un sistema de notificaciones completo para BankPortal que permita al cliente recibir alertas en tiempo real sobre sus operaciones financieras, eventos de seguridad y estado KYC — tanto en la app (SSE) como fuera de ella (Web Push / FCM), con gestión completa de preferencias.*

---

## Items seleccionados

| # | ID | Tipo | Título | SP | Prioridad |
|---|---|---|---|---|---|
| 1 | DEBT-023 | Tech Debt | `KycAuthorizationFilter` período de gracia usuarios pre-existentes | 1 | Alta |
| 2 | DEBT-024 | Tech Debt | `KycReviewResponse` tipado (RV-026 aplazada) | 1 | Baja |
| 3 | US-1401 | Feature | Modelo preferencias de notificación + Flyway V16 | 2 | Alta |
| 4 | US-1402 | Feature | Centro de notificaciones backend (historial, read/unread, paginado) | 3 | Alta |
| 5 | US-1403 | Feature | Stream SSE extendido — suscripción por categoría | 2 | Alta |
| 6 | US-1404 | Feature | Web Push (FCM / VAPID) — subscripción y envío | 5 | Alta |
| 7 | US-1405 | Feature | Alertas transaccionales (transfer, payment, bill) | 3 | Alta |
| 8 | US-1406 | Feature | Alertas de seguridad (nuevo dispositivo, contraseña, 2FA) | 3 | Media |
| 9 | US-1407 | Feature | Frontend Angular — notification bell + centro de notificaciones | 4 | Alta |
| | | | **TOTAL** | **24** | |

---

## Distribución temporal (sprints de 2 semanas)

| Semana | Actividades |
|---|---|
| Semana 1 | DEBT-023/024 · US-1401 (Flyway V16) · US-1402 backend · US-1403 SSE |
| Semana 2 | US-1404 FCM/VAPID · US-1405 alertas transaccionales · US-1406 alertas seguridad · US-1407 Angular |

---

## Riesgos identificados

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Integración FCM requiere credenciales de proyecto Firebase | Media | Usar VAPID como fallback sin cuenta Firebase |
| Safari no soporta Web Push estándar en iOS < 16.4 | Alta | Fallback SSE in-app — funcionalidad crítica no depende de push |
| Volumen de notificaciones bajo carga genera contención en SSE registry | Baja | Límite de 50 emitters/usuario ya existente en SseEmitterRegistry |

---

## DoD aplicable

- [ ] Tests unitarios ≥ 80% cobertura capa application
- [ ] 0 defectos críticos/mayores QA
- [ ] Pipeline Jenkins verde
- [ ] Code Review 0 findings bloqueantes
- [ ] Product Owner demo en STG aprobada
- [ ] CMMI PP SP 2.1 · CMMI PMC SP 1.1

---

*SOFIA Scrum Master Agent — Sprint 16 Planning*
*BankPortal — Banco Meridian — 2026-03-24*
