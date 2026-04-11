# Risk Register — BankPortal
## Última revisión: Sprint 18 Cierre — 2026-03-25

## Metadata
- **Proyecto:** BankPortal — Banco Meridian
- **SM:** SOFIA Scrum Master Agent
- **Creado:** 2026-03-14
- **Última revisión:** 2026-03-25 (Sprint 18 Cierre)
- **Próxima revisión:** Sprint 19 Planning

---

## Registro activo

| ID | Descripción | Categoría | P | I | Exp | Estado | Plan de respuesta | Responsable | Sprint |
|---|---|---|---|---|---|---|---|---|---|
| R-016-02 | Safari iOS <16.4 sin soporte Web Push | Externo | A | M | A | **Aceptado** | Fallback SSE in-app operativo — no bloquea funcionalidad crítica. Documentado en FEAT-014. | PO | — |
| R-019-01 | Rate limiting insuficiente en /cards/{id}/pin | Técnico | B | M | B | **Planificado** | DEBT-031 — Sprint 19. Añadir @RateLimited(maxAttempts=3, window=PT1H) por userId+cardId. | Tech Lead | S19 |
| R-019-02 | mTLS ausente en CoreBankingAdapter (mock) | Técnico | B | B | B | **Planificado** | DEBT-032 — Pre-producción. Configurar SSLContext + certificados mutuos antes de go-live. | DevOps | Pre-PRD |

---

## Riesgos cerrados

| ID | Descripción | Cerrado en | Resolución |
|---|---|---|---|
| R-001 | Desincronización reloj TOTP cliente/servidor | Sprint 1 | Tolerancia ±1 período implementada |
| R-002 | Pérdida dispositivo autenticador sin códigos backup | Sprint 2 | Descarga obligatoria 10 códigos backup |
| R-003 | Brute-force endpoint /2fa/verify | Sprint 3 | Rate limiting 5 intentos → bloqueo 15 min |
| R-004 | PO disponibilidad limitada retrasa gates | Sprint 4 | SLA 24h/48h acordado con Banco Meridian |
| R-005 | Incompatibilidad librería java-totp / Spring Boot | Sprint 1 | Verificado día 1 — compatible |
| R-006 | Secretos TOTP sin cifrado en BD | Sprint 2 | AES-256 implementado — ADR-003 |
| R-007 | Cambios normativa PCI-DSS mid-sprint | Sprint 8 | Sin cambios relevantes en el período |
| R-015-01 | Scheduler duplicado multi-instancia en scale-out | Sprint 18 | ADR-028 ShedLock implementado y verificado en CI/CD |
| R-015-02 | NextExecutionDateCalculator incorrecto meses cortos | Sprint 17 | Tests exhaustivos — 100% branch coverage |
| R-015-03 | Core bancario lento degrada batch scheduler | Sprint 17 | Circuit breaker activo — 5s timeout verificado |
| R-016-01 | push_subscriptions.auth en claro en BD | Sprint 18 | DEBT-028 cerrada S17 + V18b elimina columnas plain S18 |
| R-016-05 | >500 SSE concurrentes sin validar | Sprint 17 | Load test Gatling: 512 conc. — p99 145ms |
| R-018-01 | IDOR en /cards/{id} — acceso a tarjetas ajenas | Sprint 18 | belongsTo(userId) en todos los use-cases + tests integración |
| R-018-02 | PAN en claro en logs de aplicación | Sprint 18 | maskCardId() en todos los puntos — PCI scan limpio post-deploy |

---

## Evolución de exposición

| Sprint | Riesgos Altos | Riesgos Medios | Riesgos Bajos | Tendencia |
|---|---|---|---|---|
| Sprint 15 | 2 | 2 | 1 | ↓ |
| Sprint 16 | 3 | 1 | 1 | ↑ (DEBT-028 detectado) |
| Sprint 17 | 2 | 3 | 1 | → (R-016-01 mitigando) |
| **Sprint 18** | **1** | **0** | **2** | **↓↓ (R-016-01/R-015-01 cerrados)** |

---

## Deuda técnica abierta (referencia)

| ID | Descripción | CVSS/Prioridad | Sprint target |
|---|---|---|---|
| DEBT-031 | Rate limiting /cards/{id}/pin | 4.2 MEDIUM | Sprint 19 |
| DEBT-032 | mTLS CoreBankingAdapter para PRD | 2.7 LOW | Pre-producción |

---

## Criterios de escalado

| Exposición | Acción |
|---|---|
| ALTA | Escalar al PM inmediatamente. Revisar en cada Daily. Puede bloquear el sprint. |
| MEDIA | Revisar en Sprint Review. Monitorear en Daily si hay señales de materialización. |
| BAJA | Revisar en Sprint Review. Sin acción inmediata requerida. |

---

*SOFIA Scrum Master Agent — Risk Register actualizado Sprint 18 Cierre*
*CMMI Level 3 — RSKM SP 1.1 · RSKM SP 2.1 · RSKM SP 3.1*
*BankPortal — Banco Meridian — 2026-03-25*
