# SPRINT 021 — Planning
**Proyecto:** BankPortal — Banco Meridian  
**SOFIA versión:** v2.3 | **Pipeline Step:** 1 — Scrum Master  
**Fecha de planificación:** 2026-03-31  
**Sprint:** 21  
**Duración:** 2 semanas (2026-03-31 → 2026-04-13)  
**Capacidad:** 24 SP  
**Release objetivo:** v1.21.0  

---

## 🎯 Sprint Goal

> **"Dar al usuario de Banco Meridian control total sobre su identidad digital en la plataforma: consultar y actualizar su perfil, gestionar sus consentimientos GDPR y ejercer sus derechos de portabilidad y supresión."**

Sprint mixto deliberado: **20 SP FEAT-019 (Centro de Privacidad y Perfil) + 4 SP deuda técnica**.  
Decisión aprobada por Product Owner (Angel de la Cuadra) en sesión de planificación 2026-03-31.

---

## 📦 Backlog del Sprint

### FEAT-019 — Centro de Privacidad y Perfil de Usuario (20 SP)

**Descripción:** El usuario puede consultar y actualizar sus datos personales, gestionar sus sesiones activas, administrar consentimientos GDPR y ejercer sus derechos de acceso, portabilidad y supresión. Cumplimiento GDPR Art.7, Art.12, Art.15, Art.16, Art.17.

**Contexto:** Cierra DEBT-039 (ProfileController sin implementar, detectado S20 LA-FRONT-004). Módulo `profile` documentado en FEAT-012 (S14) pero controller backend nunca implementado — ruta Angular activa sin endpoint real.

| Issue | Historia | SP | Criterios de aceptación | Regulación |
|---|---|---|---|---|
| SCRUM-106 | Como usuario, quiero consultar y actualizar mis datos personales (nombre, teléfono, dirección postal) desde mi perfil en la app | 4 | GET/PATCH /api/v1/profile; validación contra KYC existente; cambio de teléfono requiere verificación OTP; email no modificable (solo lectura, requiere trámite presencial); respuesta < 1s | GDPR Art.16 |
| SCRUM-107 | Como usuario, quiero ver mis sesiones activas con dispositivo, IP enmascarada y fecha de último acceso, y cerrarlas remotamente | 3 | GET /api/v1/profile/sessions; cierre remoto inmediato (revocación JWT en Redis blacklist); no se puede cerrar la sesión actual; integra con TokenService (DEBT-033) | PSD2-SCA, PCI-DSS |
| SCRUM-108 | Como usuario, quiero gestionar mis consentimientos GDPR (marketing, analítica, comunicaciones comerciales) con historial inmutable de cambios | 4 | GET/PATCH /api/v1/privacy/consents; tabla consent_history versionada; timestamp + IP en cada cambio; consentimientos de seguridad no desactivables; compatible con preferencias de notificación (FEAT-014) | GDPR Art.7, Art.13 |
| SCRUM-109 | Como usuario, quiero solicitar la descarga de todos mis datos personales en formato JSON firmado (derecho de acceso ampliado — portabilidad) | 3 | POST /api/v1/privacy/data-export; JSON firmado con SHA-256; incluye: perfil, consentimientos, historial sesiones, audit log propio; generación asíncrona; notificación push cuando listo; max 24h SLA | GDPR Art.15, Art.20 |
| SCRUM-110 | Como usuario, quiero solicitar la eliminación de mi cuenta y datos personales (derecho al olvido) con flujo de verificación 2FA y confirmación por email | 3 | POST /api/v1/privacy/deletion-request; requiere OTP 2FA + confirmación email; borrado lógico en BankPortal (soft delete + anonimización); notificación a CoreBanking vía webhook; SLA 30 días GDPR; cuenta suspendida inmediatamente tras confirmación | GDPR Art.17 |
| SCRUM-111 | Como admin, quiero que todas las solicitudes GDPR (exportación, supresión, consentimientos) queden registradas en un log de derechos con estado y SLA | 3 | Tabla gdpr_requests; estados: PENDING / IN_PROGRESS / COMPLETED / REJECTED; SLA 30 días (GDPR Art.12§3); endpoint admin GET /api/v1/admin/gdpr-requests; alerta automática si SLA > 25 días | GDPR Art.12 |

---

### Deuda técnica (4 SP)

| Issue | ID | SP | Descripción |
|---|---|---|---|
| SCRUM-112 | DEBT-036 | 2 | IBAN real en export_audit_log: inyectar AccountRepository en ExportAuditService para registrar IBAN en lugar de "ACCOUNT-" + id.substring(24). Detectado en retrospectiva S20 (MB-020-02) |
| SCRUM-113 | MB-020-03 | 2 | Paginación multi-página en PdfDocumentGenerator: corregir gestión de streams por página para extractos > 50 registros. Hallazgo Code Review RV-F018-S02, sprint 20 |

> **DEBT-037** (Regex PAN Maestro, CVSS 2.1): diferido a S22 — prioridad baja confirmada por PO.  
> **DEBT-039**: resuelto íntegramente por SCRUM-106 y SCRUM-107 (ProfileController implementado en FEAT-019).

---

## 📊 Distribución de capacidad

| Categoría | SP | % |
|---|---|---|
| FEAT-019 (nueva funcionalidad) | 20 | 83% |
| Deuda técnica (DEBT-036 + MB-020-03) | 4 | 17% |
| **Total** | **24** | **100%** |

---

## 🏗️ Diseño técnico preliminar

### Módulos nuevos
```
backend:
├── ProfileController          GET/PATCH /api/v1/profile
├── ProfileService             lógica de negocio perfil
├── PrivacyController          /api/v1/privacy/**
├── GdprRequestService         gestión solicitudes + SLA
├── ConsentManagementService   historial versionado
├── DataExportService          generación JSON firmado (async)
└── DeletionRequestService     borrado lógico + webhook CoreBanking

frontend:
├── features/profile/          componente real (reemplaza placeholder)
│   ├── profile-view.component.ts
│   ├── profile-edit.component.ts
│   └── sessions-list.component.ts
└── features/privacy/          Centro de Privacidad (módulo nuevo)
    ├── privacy-center.component.ts
    ├── consent-manager.component.ts
    ├── data-export.component.ts
    └── deletion-request.component.ts

DB (Flyway):
└── V22__profile_gdpr.sql      tablas: gdpr_requests, consent_history
```

### Integración con módulos existentes
| Módulo existente | Integración |
|---|---|
| TokenService (DEBT-033, S20) | Revocación de sesiones remotas desde perfil |
| ExportService (FEAT-018, S20) | Reutiliza lógica de generación para data-export GDPR |
| NotificationService (FEAT-014, S16) | Notificación push cuando data-export listo |
| KYC (FEAT-013, S15) | Validación previa a actualización de datos personales |
| Redis blacklist | JWT invalidation en cierre remoto de sesión |

---

## 🔗 Dependencias y riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-021-01 | Flujo "derecho al olvido" requiere coordinación con CoreBanking de Banco Meridian — API de baja no documentada | Alta | Alto | Alcance: borrado lógico en BankPortal + notificación a CoreBanking vía webhook. Si webhook no disponible en STG: mock documentado + DEBT en S22 |
| R-021-02 | GdprRequestService con SLA 30 días — proceso de revisión humana no definido por cliente | Media | Medio | Implementar como flujo totalmente automático. Dejar extensión para revisión manual como DEBT si cliente la requiere |
| R-021-03 | Actualización de datos personales requiere validación cruzada con KYC (FEAT-013) | Media | Alto | Integrar KYC check antes de PATCH /profile. Si KYC pendiente → solo lectura |
| R-021-04 | DataExportService: generación asíncrona puede exceder 24h SLA si volumen de datos es alto | Baja | Medio | Usar SpringBatch o @Async con timeout. Monitorizar en STG antes de G-7 |

---

## 📅 Ceremonias

| Ceremonia | Fecha | Artefacto |
|---|---|---|
| Sprint Planning | 2026-03-31 | Este documento |
| Daily Standup | L-V 09:00 | sofia.log |
| Sprint Review | 2026-04-11 | SPRINT-021-summary.md |
| Sprint Retrospectiva | 2026-04-12 | SPRINT-021-retrospectiva.md |
| Sprint Close | 2026-04-13 | session.json actualizado |

---

## 🏁 Definición de Done (DoD) Sprint 21

- [ ] SCRUM-106..113 en estado **Finalizada** en Jira
- [ ] ProfileController implementado — endpoint real, sin placeholder Angular
- [ ] Tests unitarios: cobertura >= 88% (mantener o mejorar)
- [ ] 0 defectos bloqueantes abiertos
- [ ] SpringContextIT PASS (guardrail LA-020-11)
- [ ] mvn compile BUILD SUCCESS antes de G-4b
- [ ] Smoke test PASS sobre entorno STG
- [ ] DEBT-039 cerrado (ProfileController real desplegado)
- [ ] Documentación CMMI actualizada (SRS, HLD, QA report)
- [ ] Confluence Sprint 21 publicado
- [ ] Release notes v1.21.0 generadas
- [ ] FA-Agent consolidado con FEAT-019

---

## 📐 CMMI Nivel 3 — Área PP (Project Planning)

**Estimación:** Planning Poker con referencia histórica (S18: 24SP, S19: 24SP, S20: 24SP, velocidad media acumulada: 23.65 SP/sprint).  
**Capacidad:** 24 SP confirmada — sin cambios en equipo.  
**Risk Register:** R-021-01 a R-021-04 registrados.  
**Baseline:** v1.21.0-baseline establecido en rama `sprint/21` desde HEAD Sprint 20 (v1.20.0).

### Métricas de referencia

| Sprint | Feature | SP | Tests | Cov | NCS | Release |
|---|---|---|---|---|---|---|
| S18 | FEAT-016 Tarjetas | 24 | 677 | 86% | 5 | v1.18.0 |
| S19 | FEAT-017 SEPA DD | 24 | 708 | 87% | 0 | v1.19.0 |
| S20 | FEAT-018 Export | 24 | 124* | 88% | 0 | v1.20.0 |
| **S21** | **FEAT-019 Privacidad** | **24** | **—** | **≥88%** | **0 objetivo** | **v1.21.0** |

*Tests propios del sprint S20.

---

## 🛡️ Guardrails activos (v1.0 — desde commit 2b7e283)

Los siguientes checks son BLOQUEANTES para avanzar al siguiente gate:

| Check | Gate | Regla |
|---|---|---|
| Verificación de paquete Java raíz | G-4 | `cat BankPortalApplication.java | head -1` antes de crear cualquier fichero Java (LA-020-09) |
| grep paquete en nuevos ficheros | G-5 | Code Reviewer verifica package real vs nuevos ficheros (LA-020-10) |
| SpringContextIT PASS | G-4b | Si no existe, Developer Agent la crea en el mismo step (LA-020-11) |
| mvn compile BUILD SUCCESS | G-4b | Sin BUILD SUCCESS en consola → gate no se aprueba (LA-020-11) |
| Módulo Angular registrado en router | G-4 | features/ nuevo → ruta lazy en app-routing + nav item en shell (LA-FRONT-001) |
| Sin placeholder en producción | G-4 | Verificar endpoint backend antes de crear componente (LA-FRONT-002) |

---

*Generado por SOFIA v2.3 — Step 1 Scrum Master — 2026-03-31*  
*Aprobación pendiente: Gate G-1 (Tech Lead / PO)*
