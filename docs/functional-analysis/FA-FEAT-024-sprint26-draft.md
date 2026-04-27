# FA — FEAT-024 · Objetivos de Ahorro (Sprint 26)

| Campo | Valor |
|---|---|
| **Feature** | FEAT-024 — Objetivos de Ahorro ("Mis Metas") |
| **Sprint** | 26 |
| **Release target** | v1.26.0 |
| **Segmento bancario** | Retail Banking — Banca Digital |
| **Estado** | DRAFT (Gate 2b) |
| **Origen** | SRS-FEAT-024-sprint26.md (537 líneas, 8 US, 15 RNs, 7 RNFs) |
| **Aprobado SRS** | G-2 PO 2026-04-22 |
| **Capacity** | 24 SP (18 feature + 6 deuda OpenAPI) |
| **Funcionalidades FA** | 8 (FA-SAV-001 .. FA-SAV-008) |
| **Reglas de negocio** | 15 (RN-F024-01 .. RN-F024-15) |

---

## 1. Resumen ejecutivo (lenguaje de negocio)

FEAT-024 introduce en BankPortal el concepto de **Objetivos de Ahorro con propósito**, permitiendo al cliente Banco Meridian estructurar su ahorro en metas concretas (viaje, hogar, vehículo, emergencia, educación) con seguimiento de progreso, aportaciones manuales y automáticas, alertas de hitos y proyección de cumplimiento.

La feature cierra la narrativa "banca inteligente" iniciada con FEAT-023 (PFM): si "Mi Dinero" permitía **entender** los gastos, "Mis Metas" permite **actuar** sobre el ahorro, transformándolo de residuo pasivo en dinero con propósito. El posicionamiento competitivo equipara funcionalmente a BankPortal con N26 Spaces, Revolut Goals y Monzo Pots, eliminando la dependencia de apps de terceros (Monefy, Fintonic).

**Decisión arquitectónica clave (ADR-040):** los fondos asignados a un objetivo se segregan **virtualmente** sobre la cuenta de origen (afectan al saldo disponible pero NO al saldo contable). No constituyen depósito a plazo regulado y la cuenta sigue siendo legalmente del cliente — comunicado claro en UI.

**Métricas de éxito (3 meses post-release):**
- ≥ 15% de clientes activos crean al menos un objetivo
- ≥ 40% de objetivos creados configuran aportación automática
- ≥ 60% de objetivos creados alcanzan el hito 25%
- 0 incidencias críticas de segregación de fondos

---

## 2. Actores

| Rol | Acciones funcionales |
|---|---|
| **Cliente Banco Meridian** | Crear, editar, pausar y cerrar objetivos · realizar aportaciones manuales · configurar reglas automáticas · consultar progreso e hitos · ejercer derechos GDPR Art.15/17 |
| **Sistema (scheduler)** | Ejecutar reglas de aportación automática mensuales en ventana 02:00-06:00 UTC con idempotencia y reintentos backoff |
| **Sistema (notificaciones)** | Emitir push de hitos 25/50/75/100% con idempotencia por (goal_id, percent) |

---

## 3. Catálogo de funcionalidades

### FA-SAV-001 — Creación de objetivo de ahorro con propósito

El cliente Banco Meridian autenticado puede crear hasta **10 objetivos de ahorro activos simultáneamente**. Cada objetivo se define con nombre descriptivo, importe target entre 100€ y 500.000€, fecha límite entre 30 días y 30 años, categoría predefinida (VIAJE/HOGAR/VEHICULO/EMERGENCIA/EDUCACION) o personalizada (máx. 50 chars), e icono+color. Inicialización en estado ACTIVE con importe reservado a cero.

**Reglas aplicables:** RN-F024-01 · RN-F024-02 · RN-F024-07
**Origen:** US-024-01 (3 SP, MUST, SCRUM-163)
**Regulación:** GDPR

### FA-SAV-002 — Listado de objetivos con progreso y proyección

El cliente visualiza todos sus objetivos activos con barra de progreso porcentual, **proyección de fecha real de cumplimiento al ritmo actual** e indicador visual de riesgo cuando la proyección excede la fecha límite. Sugerencia automática de aportación mensual recalculada si el ritmo es insuficiente. Filtrado por estado (ACTIVE/PAUSED/CLOSED) cumpliendo GDPR Art.15.

**Reglas aplicables:** RN-F024-08
**Origen:** US-024-02 (2 SP, MUST, SCRUM-164)
**Regulación:** GDPR

### FA-SAV-003 — Detalle de objetivo con histórico de aportaciones e hitos

El cliente accede al detalle completo: metadatos, **histórico paginado de aportaciones** (manuales y automáticas, DESC), hitos alcanzados con fecha, y configuración de regla automática si existe. Enforcement de ownership devuelve 403 sin revelar existencia ante accesos cruzados.

**Reglas aplicables:** RN-F024-10
**Origen:** US-024-03 (2 SP, MUST, SCRUM-165)
**Regulación:** GDPR

### FA-SAV-004 — Aportación manual puntual a objetivo

El cliente puede transferir entre 10€ y 5.000€ desde una cuenta origen elegible hacia un objetivo activo. **Segregación virtual:** importe reservado del objetivo aumenta, availableBalance disminuye, **ledgerBalance NO cambia**. Validación de saldo previo, rechazo si supera target, normalización de signos server-side (LA-CORE-055). Auditoría completa (actor + importe + cuenta + timestamp).

**Reglas aplicables:** RN-F024-03 · RN-F024-05 · RN-F024-15
**Origen:** US-024-04 (3 SP, MUST, SCRUM-166)
**Regulación:** GDPR

### FA-SAV-005 — Aportación automática mensual recurrente

Configuración por objetivo: importe 10€-5.000€, día 1-28 (evita meses cortos), cuenta origen. Scheduler ejecuta en ventana **02:00-06:00 UTC** con idempotencia garantizada por UK (goal_id, allocation_month). Saldo insuficiente → FAILED + push, regla sigue activa sin reintento ese mes. Fallo técnico → reintentos backoff exponencial 1m/5m/15m. Cierre del objetivo cancela cascade la regla.

**Reglas aplicables:** RN-F024-04 · RN-F024-13 · RN-F024-14
**Origen:** US-024-05 (3 SP, MUST, SCRUM-167)
**Regulación:** GDPR

### FA-SAV-006 — Edición, pausa y cierre con devolución

Edición de nombre, target y fecha límite (target ≥ reservedAmount). Pausa de regla automática manteniendo progreso. Cierre con devolución t+0 a cuenta origen (o cuenta primaria si la original ya no existe). **Devoluciones > 30€ requieren SCA PSD2 vía 2FA (FEAT-001)** — proporcionalidad regulatoria. Soft-delete de objetivos cerrados con preservación 7 años (obligación contable/fiscal); accesibles para GDPR Art.15.

**Reglas aplicables:** RN-F024-06 · RN-F024-11 · RN-F024-12
**Origen:** US-024-06 (2 SP, MUST, SCRUM-168)
**Regulación:** PSD2-SCA · GDPR

### FA-SAV-007 — Notificaciones push de hitos de progreso

Push web (VAPID heredando FEAT-014) cuando el progreso cruza 25%, 50%, 75% o 100%. **Idempotencia por UK (goal_id, percent)** — reaperturas/re-aportaciones que vuelvan a cruzar umbral no duplican notificación. Hito 100% incluye CTA al flujo de cierre con devolución. Sin suscripción push: registro en auditoría + historial FEAT-004 sin emisión. Sin retroactividad para hitos anteriores a la suscripción.

**Reglas aplicables:** RN-F024-09
**Origen:** US-024-07 (2 SP, SHOULD, SCRUM-169)
**Regulación:** GDPR

### FA-SAV-008 — Widget Mi ahorro en dashboard

Widget agregado en dashboard de inicio: importe total reservado, aportaciones del mes en curso, número de objetivos activos, próximo hito por alcanzar. CTA "Crea tu primer objetivo" si no hay activos. Ocultable desde configuración. WCAG 2.1 AA · latencia p95 < 200 ms.

**Reglas aplicables:** RN-F024-05 · RN-F024-09
**Origen:** US-024-08 (1 SP, SHOULD, SCRUM-170)
**Regulación:** GDPR

---

## 4. Reglas de negocio (15)

| ID | Regla |
|---|---|
| RN-F024-01 | targetAmount ∈ [100€..500.000€]; targetDate ∈ [hoy+30d..hoy+30a] |
| RN-F024-02 | Máx. 10 objetivos ACTIVE simultáneos por usuario; PAUSED/CLOSED/COMPLETED no cuentan |
| RN-F024-03 | Aportación manual: importe ∈ [10€..5.000€]; AMOUNT_OUT_OF_RANGE fuera de rango |
| RN-F024-04 | Aportación auto + saldo insuficiente → FAILED + push; regla sigue activa, sin reintento ese mes |
| RN-F024-05 | Segregación virtual (ADR-040 α): reservedAmount afecta availableBalance, NO ledgerBalance; no constituye depósito a plazo regulado |
| RN-F024-06 | Cierre devuelve t+0 a cuenta origen última aportación; fallback a cuenta primaria |
| RN-F024-07 | Categorías: VIAJE/HOGAR/VEHICULO/EMERGENCIA/EDUCACION/OTROS + customCategory ≤ 50 chars |
| RN-F024-08 | Proyección por ritmo actual; projectionRisk=true si excede targetDate; suggestedMonthlyContribution recalculado |
| RN-F024-09 | Idempotencia hito por UK (goal_id, percent); reaperturas no duplican notificación |
| RN-F024-10 | GDPR Art.15/17: objetivos+aportaciones en export FEAT-019; soft-delete preserva 7 años |
| RN-F024-11 | Devoluciones > 30€ requieren SCA PSD2 Art.97 vía 2FA (FEAT-001) |
| RN-F024-12 | CLOSED preservados 7 años por obligación contable/fiscal; sin eliminación física |
| RN-F024-13 | Scheduler en ventana 02:00-06:00 UTC; dayOfMonth ∈ [1..28] (evita meses cortos) |
| RN-F024-14 | Fallo técnico CoreBanking → reintentos backoff 1m/5m/15m antes de FAILED + TECHNICAL_ERROR |
| RN-F024-15 | availableBalance = ledgerBalance − Σ(reservedAmount) de objetivos ACTIVE con esa cuenta como origen |

---

## 5. Marco regulatorio aplicable

| Marco | Aplicación en FEAT-024 |
|---|---|
| **GDPR Art.15** | Derecho de acceso: objetivos y aportaciones incluidos en export personal (FEAT-019) |
| **GDPR Art.17** | Derecho al olvido: cierre soft-delete con preservación contable 7 años |
| **PSD2 Art.97 (SCA)** | Devoluciones > 30€ requieren autenticación reforzada vía 2FA |
| **Ley 10/2014** | Saldos reservados NO son depósito a plazo; sin Fondo de Garantía específico — comunicado claro en UI |
| **PCI-DSS v4** | No aplica directo (sin datos de tarjeta); reutiliza infra PCI-compliant del portal |

---

## 6. Trazabilidad

| FA | Endpoint | Tabla / Migración | DEBT vinculadas |
|---|---|---|---|
| FA-SAV-001 | POST /api/v1/savings/goals | savings_goals (V29) | — |
| FA-SAV-002 | GET /api/v1/savings/goals | savings_goals | — |
| FA-SAV-003 | GET /goals/{id} (+contributions, +milestones) | goal_allocations + goal_milestones | — |
| FA-SAV-004 | POST /goals/{id}/contributions | goal_allocations | — |
| FA-SAV-005 | PUT/DELETE /goals/{id}/auto-rule | goal_auto_rules + AutoContributionScheduler | — |
| FA-SAV-006 | PUT/DELETE /goals/{id} (X-OTP > 30€) | savings_goals (status, closed_at) | — |
| FA-SAV-007 | (sin endpoint público; backend + push VAPID) | goal_milestones (UK goal+percent) | — |
| FA-SAV-008 | GET /api/v1/savings/dashboard-widget | (lectura agregada) | — |
| (transversal) | /v3/api-docs · /swagger-ui.html | (springdoc) | DEBT-048 |
| (transversal) | (script SOFIA validate-smoke-vs-openapi) | (script) | DEBT-049 |
| (transversal) | (skill devops actualizada) | (.sofia/skills/devops/SKILL.md) | DEBT-050 |

---

## 7. Riesgos identificados (heredados del SRS)

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R-S26-01 | Segregación virtual α genera confusión contable | Media | Alto | ADR-040 documenta α + evolución β; banner UI "Saldo reservado no devenga intereses" |
| R-S26-02 | Scheduler requiere config UTC coherente en staging | Baja | Media | Test @SpringBootTest timeshift; cron documentado en application.yml |
| R-S26-03 | OpenAPI expone drift de features antiguas | Media | Media | DEBT-048 incluye auditoría retroactiva pre-FEAT-024 |
| R-S26-05 | Aportación auto 02:00 UTC durante mantenimiento CoreBanking | Baja | Media | Reintentos backoff RN-F024-14; ventana mantenimiento documentada |
| R-S26-06 | UK (goal_id, allocation_month) bloquea aportaciones manuales múltiples | Baja | Media | allocation_month NULL para MANUAL; UK aplica solo a AUTO |

---

## 8. Estado y próximos pasos

- **Estado actual:** DRAFT — Gate 2b
- **Siguiente paso:** Step 2c (UX/UI Designer) → prototipo PROTO-FEAT-024-sprint26.html heredando PROTO-FEAT-023-sprint25 (LA-CORE-050 PASO 0)
- **Tras Step 3 (Architect):** Gate 3b enriquecerá este draft con módulos hexagonales, entidades, integraciones (HLD/LLD/ADR-040/041/042) → estado READY_FOR_REVIEW
- **Tras Step 8 (Documentation):** Gate 8b consolidará FA-FEAT-024-sprint26.md final → DELIVERED
- **FA Word v0.11** generado en este Gate 2b vía gen-fa-document.py (LA-025-02 v2.8)

---

*Generado por FA-Agent SOFIA v2.8 · Gate 2b · Sprint 26 · 2026-04-26*
