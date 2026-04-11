# SPRINT 020 — Planning
**Proyecto:** BankPortal — Banco Meridian  
**SOFIA versión:** v2.3 | **Pipeline Step:** 1 — Scrum Master  
**Fecha de planificación:** 2026-03-30  
**Sprint:** 20 de 20 (Sprint 20/20)  
**Duración:** 2 semanas (2026-03-30 → 2026-04-12)  
**Capacidad:** 24 SP  
**Release objetivo:** v1.20.0  

---

## 🎯 Sprint Goal

> **"Eliminar la deuda técnica acumulada en S19 y entregar exportación de movimientos para cumplimiento regulatorio (PSD2 Art. 47 — acceso al historial de pagos)."**

Sprint mixto deliberado: **16 SP deuda técnica + 8 SP FEAT-018**.  
Decisión aprobada por Tech Lead (Angel de la Cuadra) como PO en sesión de planificación 2026-03-30.

---

## 📦 Backlog del Sprint

### FEAT-018 — Exportación de Movimientos (8 SP)
**Descripción:** El usuario puede exportar su historial de movimientos bancarios en formato PDF y CSV, seleccionando rango de fechas y tipo de movimiento. Cumplimiento PSD2 Art. 47 (acceso al historial).

| Historia | SP | Criterios de aceptación |
|---|---|---|
| SCRUM-96: Como usuario, quiero descargar mis movimientos en PDF con cabecera corporativa, filtrado por fecha y cuenta | 3 | PDF generado < 3s, cabecera Banco Meridian, firma digital de integridad, max 12 meses |
| SCRUM-97: Como usuario, quiero exportar movimientos en CSV para importar en Excel/contabilidad | 2 | Encoding UTF-8 BOM, separador `;`, columnas: fecha, concepto, importe, saldo, IBAN |
| SCRUM-98: Como usuario, quiero filtrar por tipo de movimiento antes de exportar (transferencias, domiciliaciones, tarjetas) | 2 | Filtro multicriteria, preview count antes de exportar, max 500 registros por export |
| SCRUM-99: Como admin, quiero que todos los exports queden auditados en el log de actividad (GDPR Art.15) | 1 | Audit log: userId, timestamp, filtros aplicados, formato, num_registros, IP |

**Regulación:** PSD2 Art.47 (historial de pagos), GDPR Art.15 (portabilidad de datos), PCI-DSS (no exportar PAN completo — masked)

---

### DEBT-032 — Lambda Refactor (4 SP)
**Descripción:** Refactorizar lambdas anónimas en servicios críticos a clases con nombre para mejorar stack traces, testabilidad y legibilidad (detectado en Code Review S18-S19).

| Historia | SP | Alcance |
|---|---|---|
| SCRUM-100: Refactor lambdas → named classes en TransactionService, DirectDebitService, ScheduledTransferService | 4 | Mínimo 8 lambdas complejas, añadir unit tests específicos para cada clase extraída |

---

### DEBT-033 — Angular AuthService Refactor (4 SP)
**Descripción:** AuthService monolítico con 380 líneas — separar en TokenService, SessionService, AuthGuard limpio. Eliminar dependencias circulares detectadas.

| Historia | SP | Alcance |
|---|---|---|
| SCRUM-101: Split AuthService → TokenService + SessionService + AuthGuard | 4 | Zero breaking changes en componentes existentes, cobertura > 85% en nuevos servicios |

---

### DEBT-034 — DebitProcessorStrategy (4 SP)
**Descripción:** Implementar patrón Strategy completo para procesamiento de domiciliaciones. Actualmente lógica condicional if/else en DebitProcessorService (detectado S19).

| Historia | SP | Alcance |
|---|---|---|
| SCRUM-102: Implementar Strategy pattern: SEPACoreDebitStrategy, SEPACORDebitStrategy, RecurringDebitStrategy | 4 | Interface DebitProcessingStrategy, Factory, tests por estrategia, eliminar if/else |

---

### DEBT-035 — CoreBanking Webhook RETURNED (4 SP)
**Descripción:** El webhook de CoreBankingAdapter no maneja el estado RETURNED de domiciliaciones (devoluciones SEPA). Notificación al usuario no implementada.

| Historia | SP | Alcance |
|---|---|---|
| SCRUM-103: Handler RETURNED en CoreBankingWebhookController + notificación push + update estado mandato | 4 | Estado mandato → RETURNED, notificación push R-code, audit trail, test integración |

---

## 📊 Distribución de capacidad

| Categoría | SP | % |
|---|---|---|
| FEAT-018 (nueva funcionalidad) | 8 | 33% |
| Deuda técnica (DEBT-032..035) | 16 | 67% |
| **Total** | **24** | **100%** |

---

## 🔗 Dependencias y riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| R-020-01: Librería PDF (iText/PDFBox) — licencia comercial | Media | Alto | Evaluar Apache PDFBox (Apache 2.0) en día 1 |
| R-020-02: DEBT-033 AuthService — breaking change en guards | Media | Alto | Feature flag, tests E2E antes de merge |
| R-020-03: DEBT-035 RETURNED — CoreBanking sandbox no soporta estado | Baja | Medio | Mock en tests IT, documentar limitación |
| R-020-04: Acoplamiento DEBT-034 con FEAT-017 ya en STG | Baja | Alto | Rama separada, merge post-QA |

---

## 📅 Ceremonias

| Ceremonia | Fecha | Artefacto |
|---|---|---|
| Sprint Planning | 2026-03-30 | Este documento |
| Daily Standup | L-V 09:00 | sofia.log |
| Sprint Review | 2026-04-10 | SPRINT-020-summary.md |
| Sprint Retrospectiva | 2026-04-11 | SPRINT-020-retrospectiva.md |
| Sprint Close | 2026-04-12 | session.json actualizado |

---

## 🏗️ Definición de Done (DoD) Sprint 20

- [ ] Todos los SCRUM-96..103 en estado **Finalizada** en Jira
- [ ] Tests unitarios: cobertura >= 87% (mantener o mejorar)
- [ ] 0 defectos bloqueantes abiertos
- [ ] DEBT-022 evaluado (aunque no resuelto si no cabe en capacidad)
- [ ] Smoke test PASS sobre entorno STG
- [ ] Documentación CMMI actualizada (SRS, HLD, QA report)
- [ ] Confluence Sprint 20 publicado
- [ ] Release notes v1.20.0 generadas
- [ ] FA-Agent consolidado con FEAT-018

---

## 📐 CMMI Nivel 3 — Área PP (Project Planning)

**Estimación:** Planning Poker con referencia histórica (FEAT-016: 24SP, FEAT-017: 24SP, velocidad media: 23.6 SP/sprint).  
**Capacidad:** 24 SP confirmada por Tech Lead.  
**Risk Register:** R-020-01 a R-020-04 registrados.  
**Baseline:** v1.20.0-baseline establecido en rama `sprint/20` desde commit `48c2a0d` (HEAD Sprint 19).

---

*Generado por SOFIA v2.3 — Step 1 Scrum Master — 2026-03-30*  
*Aprobación pendiente: Gate G-1 (Tech Lead / PO)*
