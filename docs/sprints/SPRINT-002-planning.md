# Sprint Planning — Sprint 2 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 2 |
| **Período** | 2026-03-30 → 2026-04-10 |
| **SM** | SOFIA SM Agent |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Product Owner |

---

## Sprint Goal

> **"Completar FEAT-001 al 100%: desactivación 2FA, auditoría completa PCI-DSS, suite E2E automatizada y deuda técnica crítica resuelta — módulo 2FA listo para cumplimiento regulatorio."**

---

## Velocidad y capacidad

| Parámetro | Valor |
|---|---|
| Velocidad Sprint 1 (baseline) | 24 SP — 100% entregado |
| Días laborables Sprint 2 | 10 |
| Factor de ajuste | 1.0 (baseline confirmado) |
| **Capacidad comprometida** | **24 SP** |

> Sprint 1 entregó al 100% sin impedimentos significativos.
> Se mantiene la misma capacidad sin factor conservador adicional.

---

## Backlog del Sprint 2

| ID | Título | SP | Tipo | Prioridad | Dependencias |
|---|---|---|---|---|---|
| DEBT-001 | RateLimiterService → Bucket4j + Redis distribuido | 4 | tech-debt | Alta | US-002 ✅ |
| DEBT-002 | JwtService → JJWT RSA-256 con keypair real | 4 | tech-debt | Alta | US-002 ✅ |
| US-004 | Desactivar 2FA con confirmación de contraseña | 5 | new-feature | Should Have | US-001 ✅ |
| US-005 | Auditoría completa de eventos 2FA (inmutabilidad) | 5 | new-feature | Should Have | US-001–004 |
| US-007 | Suite E2E Playwright — todos los flujos 2FA | 6 | new-feature | Must Have | US-001–005 |
| **Total** | | **24 SP** | | | |

---

## Orden de ejecución y dependencias

```
Semana 1 (paralelo):
  DEBT-001 → RateLimiter Redis        (Java Dev — 4 SP)
  DEBT-002 → JWT RSA-256              (Java Dev — 4 SP)
  US-004   → Desactivar 2FA           (Java Dev + Angular Dev — 5 SP)

Semana 2:
  US-005   → Auditoría inmutable      (Java Dev — 5 SP)
    └─► depende de US-004 (evento 2FA_DEACTIVATED debe existir)
  US-007   → Suite E2E Playwright     (Angular Dev + QA — 6 SP)
    └─► depende de US-004 + US-005 completos
```

---

## Tablero Jira — Sprint 2 inicial

```
| READY              | IN PROGRESS | CODE REVIEW | QA | DONE |
|--------------------|-------------|-------------|----| -----|
| DEBT-001 (4 SP)    |      —      |      —      | —  |  —   |
| DEBT-002 (4 SP)    |             |             |    |      |
| US-004   (5 SP)    |             |             |    |      |
| US-005   (5 SP)    |             |             |    |      |
| US-007   (6 SP)    |             |             |    |      |
```

---

## Pre-requisitos técnicos antes de iniciar

| Pre-requisito | Responsable | Bloqueante para |
|---|---|---|
| Redis disponible en entorno DEV/STG | DevOps | DEBT-001 |
| Keypair RSA-256 generado (privado + público) | DevOps | DEBT-002 |
| Entorno Playwright configurado en CI | DevOps | US-007 |

```bash
# Generar keypair RSA-256 para DEBT-002
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
# Distribuir a Jenkins Credentials y K8s Secret antes de iniciar DEBT-002
```

---

## Risk Register — Sprint 2

| ID | Riesgo | P | I | Exposición | Plan |
|---|---|---|---|---|---|
| NEW-R-001 | Redis no disponible en STG antes de iniciar DEBT-001 | M | M | 🟡 Media | Validar disponibilidad día 1. Si no → postponer a Sprint 3 con impacto documentado |
| NEW-R-002 | Keypair RSA no provisionado antes de DEBT-002 | B | A | 🟡 Media | DevOps genera keypair en día 1. Bloquear DEBT-002 hasta confirmación |
| NEW-R-003 | US-007 E2E bloquea release si falla en CI | M | A | 🟠 Alta | Iniciar configuración Playwright en día 1. No esperar a tener todos los flujos implementados |
| R-008 | FEAT-001 no cierra en Sprint 2 | B | A | 🟡 Media | US-004/005 son Should Have — US-007+DEBT son Must Have — priorizar en ese orden |

---

## Gates HITL Sprint 2

| Gate | Artefacto | Aprobador | SLA |
|---|---|---|---|
| 🔒 Sprint Planning | Este documento | Product Owner | 24 h |
| 🔒 Code Review | CR Sprint 2 | Tech Lead | 24 h/NC |
| 🔒 QA Doble Gate | QA Report Sprint 2 + PCI-DSS checklist | QA Lead + PO | 24 h |
| 🔒 Go/No-Go PROD v1.1.0 | Release v1.1.0 | Release Manager | 4 h |

> No se genera SRS delta: US-004, US-005 y US-007 están completamente
> documentados en SRS-FEAT-001-2FA.md (aprobado en Sprint 1).
> No se genera HLD/LLD delta: los componentes son extensiones naturales
> de la arquitectura hexagonal del LLD-backend-2fa.md ya aprobado.
> El Architect sí generará un ADR-005 para DEBT-002 (RSA-256 vs HS256).

---

## Definición de Hecho — Sprint 2

Además del DoD base SOFIA + customización Banco Meridian:
- [ ] FEAT-001 entregada al 100% (7 US completas: US-006/001/002/003/004/005/007)
- [ ] RateLimiter distribuido funcional con Redis (DEBT-001)
- [ ] JWT RSA-256 funcional con keypair real (DEBT-002)
- [ ] Suite Playwright con ≥ 10 tests E2E — todos PASS en Jenkins
- [ ] Checklist PCI-DSS 4.0 req. 8.4 firmado por QA Lead
- [ ] Tabla audit_log inmutable verificada en test de integración
- [ ] Release v1.1.0 con todos los módulos 2FA desplegada en PROD

---

*Generado por SOFIA SM Agent — 2026-03-30*
*🔒 GATE: aprobación Product Owner requerida antes de iniciar Sprint 2*
