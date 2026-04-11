# FEAT-016 — Gestión de Tarjetas

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-016 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Operaciones Bancarias |
| Solicitante | Producto Digital — Banco Meridian |
| Fecha creación | 2026-03-25 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Sprint | 18 |
| SP feature | 17 SP |
| SP deuda incluida | 7 SP (DEBT-026 + DEBT-030 + V17c + ADR-028/R-015-01) |
| SP total sprint | 24 SP |
| Release objetivo | v1.18.0 |

---

## Descripción de negocio

Con cuentas, transferencias, transferencias programadas y notificaciones operativas,
el portal bancario carece de uno de los elementos centrales del día a día financiero:
la **gestión de tarjetas**. Banco Meridian emite tarjetas de débito y crédito vinculadas
a las cuentas de sus clientes, pero actualmente no expone ningún control sobre ellas
en el portal digital.

FEAT-016 implementa el ciclo completo de gestión de tarjetas desde el portal:

1. **Consulta** — ver las tarjetas vinculadas a las cuentas del usuario con su estado y saldo disponible.
2. **Bloqueo / desbloqueo** — el usuario puede bloquear temporalmente una tarjeta perdida o sospechosa y reactivarla si aparece.
3. **Límites** — consultar y modificar los límites de gasto diario y mensual dentro de los rangos permitidos por el banco.
4. **PIN** — cambio de PIN de forma segura con verificación 2FA.
5. **Historial** — transacciones por tarjeta con exportación PDF.

---

## Objetivo y valor de negocio

- **Autoservicio**: reduce llamadas al call center por bloqueo de tarjeta (estimado −35%).
- **Seguridad percibida**: el usuario controla en tiempo real el estado de sus tarjetas.
- **Catálogo mínimo viable**: feature exigida por el SLA contractual con Banco Meridian para Q2 2026.
- **Diferenciación**: límites configurables por el propio usuario → ventaja vs banca tradicional.

---

## Alcance funcional

### Incluido en FEAT-016
- Modelo de datos `cards` + Flyway V18
- Consulta de tarjetas vinculadas por cuenta/usuario
- Detalle de tarjeta: PAN enmascarado, estado, tipo (débito/crédito), fecha expiración, límites
- Bloqueo / desbloqueo con 2FA (OTP)
- Modificación de límites de gasto diario y mensual
- Cambio de PIN con verificación 2FA
- Historial de transacciones por tarjeta (paginado, exportable PDF)
- Frontend Angular — módulo completo de tarjetas
- Auditoría completa en `audit_log`

### Excluido (backlog futuro)
- Solicitud de nueva tarjeta virtual o física
- Activación de tarjeta recién emitida
- Seguimiento de envío físico
- Configuración de tarjeta para Apple Pay / Google Pay
- Disputas y contracargos

---

## User Stories

| ID | Título | SP | Prioridad |
|---|---|---|---|
| US-1601 | Modelo de datos `cards` + Flyway V18 | 2 | Must Have |
| US-1602 | Consulta de tarjetas y detalle | 3 | Must Have |
| US-1603 | Bloqueo / desbloqueo con 2FA | 3 | Must Have |
| US-1604 | Gestión de límites de tarjeta | 3 | Must Have |
| US-1605 | Cambio de PIN con 2FA | 3 | Must Have |
| US-1606 | Frontend Angular — gestión completa de tarjetas | 3 | Must Have |

**Total FEAT-016: 17 SP**

---

## Deuda técnica Sprint 18

| ID | Descripción | SP | Prioridad |
|---|---|---|---|
| ADR-028 | Implementar ShedLock multi-instancia scheduler | 3 | Alta — R-015-01 nivel 3 |
| DEBT-030 | Paginar `findDueTransfers` en batches de 500 | 2 | Media |
| DEBT-026 | Race condition push subscription limit (5 slots) | 1 | Baja |
| V17c | Eliminar columnas `auth_plain` / `p256dh_plain` | 1 | Media |

**Total deuda: 7 SP**

---

## Normativa aplicable

| Normativa | Requisito |
|---|---|
| PCI-DSS 4.0 req. 3 | PAN siempre enmascarado (primeros 6 + últimos 4) |
| PCI-DSS 4.0 req. 8 | Cambio de PIN con MFA obligatorio |
| PSD2 RTS Art.97 | SCA para bloqueo/desbloqueo y cambio de límites |
| RGPD Art.25 | Privacy by design: PAN nunca en logs |

---

*Generado por SOFIA Scrum Master Agent — Sprint 18 Planning — 2026-03-25*
*CMMI Level 3 — PP SP 2.1 · REQM SP 1.1*
*BankPortal — Banco Meridian*
