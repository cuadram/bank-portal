# ADR-029 — SEPA Mandate Storage Strategy

| Campo | Valor |
|---|---|
| **ID** | ADR-029 |
| **Feature** | FEAT-017 — Domiciliaciones y Recibos |
| **Estado** | APROBADO |
| **Fecha** | 2026-03-27 |
| **Decisor** | Tech Lead + Architect Agent (SOFIA v2.2) |
| **CMMI área** | DAR (Decision Analysis and Resolution) |

---

## Contexto

Al implementar FEAT-017 (Domiciliaciones SEPA), existe una decisión arquitectónica crítica sobre dónde reside la fuente de verdad de los mandatos SEPA y recibos domiciliados: ¿en la base de datos propia de BankPortal o delegada completamente al sistema CoreBanking?

Esta decisión afecta al rendimiento de consultas, a la capacidad offline/degradada, a la trazabilidad CMMI y al cumplimiento RGPD.

---

## Alternativas evaluadas

### Opción A — BD propia BankPortal (tablas `debit_mandates` + `direct_debits`)
**Ventajas:**
- Consultas en < 200ms p95 sin dependencia de CoreBanking
- Control total de RGPD sobre datos de mandatos (retención, borrado)
- Trazabilidad completa en audit_events propia
- Frontend funciona en modo lectura si CoreBanking está degradado
- Flyway V19: migración versionada, rollback controlado
- Consistente con el patrón establecido en FEAT-011 a FEAT-016

**Desventajas:**
- Duplicidad eventual con CoreBanking (fuente de verdad dual)
- Sincronización necesaria en eventos de devolución (CoreBanking → BankPortal)
- Complejidad adicional en el modelo de datos

### Opción B — Delegación completa a CoreBanking (proxy pattern)
**Ventajas:**
- Una sola fuente de verdad
- Sin duplicidad de datos

**Desventajas:**
- Latencia dependiente de CoreBanking (p95 > 500ms típico)
- Punto de fallo único: si CoreBanking no responde, el portal no funciona
- Sin control RGPD independiente: imposible retención/borrado selectivo
- Sin posibilidad de paginación server-side ni filtros avanzados sin lógica en CoreBanking
- Contradicción con el principio de autonomía de servicios (SOFIA Design Principle #2)

### Opción C — CQRS: escritura a CoreBanking, lectura desde BD propia
**Ventajas:**
- Consistencia eventual con fuente de verdad en CoreBanking
- Lecturas rápidas

**Desventajas:**
- Complejidad alta: event sourcing, cola de mensajes, saga pattern
- Fuera de scope de Sprint 19 (24 SP ya asignados)
- Overhead CMMI de documentación de contratos de mensajería

---

## Decisión

**✅ Opción A seleccionada: BD propia BankPortal.**

**Justificación:**
1. Consistente con el patrón arquitectónico establecido (FEAT-011 a FEAT-016 siguen el mismo modelo)
2. El CoreBanking de Banco Meridian en STG tiene SLA de 95% con p99 > 800ms — inaceptable para consultas de listado
3. RGPD Art. 17 (derecho al olvido) requiere control independiente de datos de pago
4. El Bounded Context de domiciliaciones es autónomo: BankPortal es el punto de autorización; CoreBanking es el ejecutor
5. La sincronización CoreBanking → BankPortal se limita a eventos de devolución (RETURNED) via webhook o polling job — complejidad acotada

**Protocolo de sincronización:**
- BankPortal crea mandatos en su BD + registra en CoreBanking via `CoreBankingAdapter.registerMandate()`
- CoreBanking notifica devoluciones via webhook `POST /internal/debits/{id}/return` (implementado en Sprint 19 como mock, webhook real en Sprint 20)
- La divergencia máxima tolerada entre BD propia y CoreBanking es de 1 día hábil

---

## Consecuencias

**Inmediatas (Sprint 19):**
- Flyway V19 crea tablas `debit_mandates` y `direct_debits` en PostgreSQL 16
- `CoreBankingAdapter` se extiende con `registerMandate()` y `processDebit()`
- `SimulaCobroJob` opera sobre la BD local para el MVP

**Futuras (Sprint 20+):**
- Implementar webhook real de CoreBanking para eventos RETURNED
- Evaluar Opción C (CQRS) cuando el volumen de mandatos supere 100k registros
- ADR-030 (pendiente): Estrategia de sincronización CoreBanking → BankPortal a largo plazo

---

*Architect Agent · CMMI DAR SP 1.1, 1.3, 1.5, 1.6 · SOFIA v2.2 · Sprint 19*