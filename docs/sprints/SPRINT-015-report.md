# SPRINT-015 — Report de Cierre

**BankPortal · Banco Meridian · Sprint 15**

| Campo | Valor |
|---|---|
| Sprint | 15 |
| Período | 2026-03-23 → 2026-04-06 |
| Feature | FEAT-013 — Onboarding KYC / Verificación de Identidad |
| Release | v1.15.0 |
| Estado | ✅ COMPLETADO — 24/24 SP |
| Commits | d2d056d · 7657750 · 19d20b9 |
| Jira Epic | SCRUM-36 |

---

## Métricas del sprint

| Métrica | Valor |
|---|---|
| Story points planificados | 24 |
| Story points entregados | 24 (100%) |
| Defectos QA críticos/mayores | 0 |
| Findings Code Review | 4 (1 bloqueante + 3 menores — todos corregidos) |
| Tests unitarios nuevos | 29 escenarios |
| Cobertura capa application | ≥ 85% |
| Tests funcionales / Gherkin | 28 casos verificados |
| Tests seguridad | 8 verificaciones |
| Tests WCAG 2.1 AA | 6/6 criterios |

---

## Items completados

| # | ID | Tipo | Título | SP | Estado |
|---|---|---|---|---|---|
| 1 | RV-020 | Tech Debt | twoFactorEnabled desde BD en GetProfileUseCase | 1 | ✅ |
| 2 | SAST-001 | Tech Debt | Ofuscar IP en audit_log (RGPD Art.25) | 1 | ✅ |
| 3 | SAST-002 | Tech Debt | Rate limiting POST /profile/password (Bucket4j) | 1 | ✅ |
| 4 | US-1301 | Feature | Modelo de datos KYC + Flyway V15 | 3 | ✅ |
| 5 | US-1302 | Feature | API subida de documentos de identidad | 3 | ✅ |
| 6 | US-1303 | Feature | Motor de validación automática (@Async) | 2 | ✅ |
| 7 | US-1304 | Feature | Estado KYC y notificaciones | 3 | ✅ |
| 8 | US-1305 | Feature | Guard de acceso financiero KYC_REQUIRED | 2 | ✅ |
| 9 | US-1306 | Feature | Frontend Angular — KYC wizard 5 pasos | 5 | ✅ |
| 10 | US-1307 | Feature | Endpoint revisión manual ROLE_KYC_REVIEWER | 3 | ✅ |
| | | | **TOTAL** | **24** | |

---

## Deuda técnica generada

| ID | Descripción | Prioridad | Sprint objetivo |
|---|---|---|---|
| DEBT-023 | `KycAuthorizationFilter` no verifica período de gracia para usuarios pre-existentes | Baja | Sprint 17 |
| DEBT-024 | `KycReviewResponse` tipado (RV-026 sugerencia aplazada) | Baja | Sprint 17 |

---

## Decisiones técnicas tomadas

| ADR | Decisión | Impacto |
|---|---|---|
| ADR-023 | Almacenamiento documentos KYC en filesystem local AES-256-GCM | Requiere PVC + backup configurado en K8s |
| ADR-024 | Validación asíncrona vía ApplicationEventPublisher + @Async | Latencia subida < 200ms · validación < 5s post-request |

---

## Velocidad acumulada del proyecto

| Sprint | SP | Feature | Release |
|---|---|---|---|
| Sprint 1-2 | 40 | FEAT-001 2FA | v1.0 - v1.1 |
| Sprint 3 | 24 | FEAT-002 Token HMAC | v1.2 |
| Sprint 4 | 24 | FEAT-003 Dispositivos | v1.3 |
| Sprint 5-8 | 96 | FEAT-004..007 | v1.4 - v1.9 |
| Sprint 9 | 20 | FEAT-008 Transferencias | v1.10 |
| Sprint 10 | 20 | FEAT-009 Pagos | v1.11 |
| Sprint 11 | 20 | FEAT-009 Core real | v1.11 |
| Sprint 12 | 24 | FEAT-010 Dashboard BE | v1.12 |
| Sprint 13 | 24 | FEAT-011 Angular Dashboard | v1.13 |
| Sprint 14 | 24 | FEAT-012-A Perfil | v1.14 |
| **Sprint 15** | **24** | **FEAT-013 KYC** | **v1.15** |
| **TOTAL** | **355** | **15 sprints** | |

**Velocidad media:** 23.7 SP/sprint (15 sprints) · 0 defectos críticos acumulados ✅

---

## Cumplimiento normativo entregado

| Normativa | Requisito | Implementación | Estado |
|---|---|---|---|
| PSD2 | Verificación identidad antes de operaciones de pago | KycAuthorizationFilter bloquea transfers/payments/bills | ✅ |
| AML EU 2018/843 | Diligencia debida del cliente (CDD) | Flujo KYC completo + revisión manual KycAdminController | ✅ |
| RGPD Art.9 | Datos especiales (identidad) → cifrado + consentimiento | AES-256-GCM + retención 5 años documentada | ✅ |
| RGPD Art.25 | Privacidad por diseño (IP en logs) | maskIp() en UpdateProfileUseCase | ✅ |
| Circular BdE 1/2010 | Identificación equivalente digital | Wizard DNI/NIE/Pasaporte con validación automática | ✅ |

---

*SOFIA Scrum Master Agent — Cierre Sprint 15*
*CMMI Level 3 — PP SP 3.3 · PMC SP 1.6 · PMC SP 2.1*
*BankPortal — Banco Meridian — 2026-03-24*
