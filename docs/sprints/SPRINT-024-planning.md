# SPRINT-024 — Planning Document
## BankPortal · Banco Meridian · FEAT-022 Bizum P2P
**Fecha:** 14/04/2026 | **SOFIA v2.7** | **Capacidad:** 24 SP

---

## Sprint Goal
> *Permitir al cliente de Banco Meridian enviar y solicitar pagos inmediatos entre particulares mediante Bizum, con SCA OTP, límites configurables y notificaciones en tiempo real, cumpliendo PSD2 Art.97.*

---

## Capacidad del equipo
| Concepto | Valor |
|---|---|
| Velocidad referencia (media S21-S23) | 24 SP |
| Split feature / deuda | 20 SP feature + 4 SP deuda técnica |
| Duración | 2 semanas |
| Sprints históricos entregados | 23 |
| Story points acumulados | 545 SP |

---

## Backlog Sprint 24

### Feature — FEAT-022 Bizum P2P (20 SP)

| ID Jira | US | SP | Criterios de aceptación clave |
|---|---|---|---|
| SCRUM-132 | US-F022-01: Alta y vinculación Bizum | 4 | El usuario puede vincular su número de móvil a su cuenta. Solo 1 cuenta activa por número. Validación OTP al vincular. RN: unicidad de número en el sistema. |
| SCRUM-133 | US-F022-02: Envío de pago Bizum con SCA | 5 | Envío por número de teléfono. Confirmación SCA OTP obligatoria (PSD2 Art.97). Límite diario 1.000 EUR configurable. Notificación push al emisor y receptor. |
| SCRUM-134 | US-F022-03: Solicitud de cobro a contacto | 4 | El usuario puede solicitar dinero a un número de teléfono. El receptor acepta o rechaza. Expiración 24h. SCA en aceptación. Notificación push al receptor. |
| SCRUM-135 | US-F022-04: Historial de transacciones Bizum | 3 | Lista paginada de envíos, cobros y solicitudes. Filtros: tipo (envío/cobro/solicitud), fecha, estado. Detalle de cada operación. |
| SCRUM-136 | US-F022-05: Límites y configuración Bizum | 2 | Consulta y modificación de límite diario (máx. 1.000 EUR). Activar/desactivar Bizum. Cambios con SCA. Configuración en application.properties (patrón DEBT-044). |
| SCRUM-137 | US-F022-06: Notificaciones push operaciones Bizum | 2 | Push VAPID en: envío realizado, cobro recibido, solicitud recibida, solicitud expirada/rechazada. Integración con NotificationService (FEAT-014). |

**Subtotal feature: 20 SP**

### Deuda técnica (4 SP)

| ID Jira | DEBT | SP | Justificación |
|---|---|---|---|
| SCRUM-138 | DEBT-045: Índice compuesto bizum_transactions (phone_number, status, created_at) | 2 | Rendimiento queries de historial con filtros combinados. Detectado en diseño preliminar de LLD. |
| SCRUM-139 | DEBT-046: Seeds notificaciones — rutas /bizum registradas en app-routing | 2 | LA-023-01: seeds deben referenciar solo rutas registradas en app-routing.module.ts. Corrección preventiva antes de Step 4. |

**Subtotal deuda: 4 SP | TOTAL SPRINT: 24 SP**

### Issues de soporte (gestión / sin SP)

| ID Jira | Task | Descripción |
|---|---|---|
| SCRUM-140 | TASK: HLD + LLD Bizum — Architect Step 3 | Arquitectura dominio bizum: hexagonal, ADR, Flyway V27 |
| SCRUM-141 | TASK: QA Plan FEAT-022 — QA Step 6 | Plan de pruebas funcionales + seguridad PSD2 |
| SCRUM-142 | TASK: Sprint 24 Closure — Workflow Manager Step 9 | Cierre Jira + Confluence + Lessons Learned + Dashboard |

---

## Regulación aplicable

| Marco | Artículo / Requisito |
|---|---|
| PSD2 RTS (EU 2018/389) | Art.97 — SCA obligatoria en pagos iniciados por usuario |
| PSD2 RTS | Art.16 — Exención SCA importes < 30 EUR (candidato fase 2) |
| SEPA Instant (SCT Inst) | Liquidación en < 10 segundos, disponibilidad 24/7/365 |
| Banco de España Circular 4/2019 | Servicios de pago y autenticación reforzada de clientes |
| GDPR Art.6 | Base legal para tratamiento del número de teléfono como dato personal |
| LSSICE Art.21 | Consentimiento para comunicaciones comerciales por push |

---

## Dependencias y riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R-024-01 | API Bizum/Redsys no disponible en STG | M | A | CoreBankingMockBizumClient — patrón ADR-037 (mock por perfil staging) |
| R-024-02 | Límite diario variable por perfil de cliente | B | M | Externalizar a application.properties — patrón DEBT-044 aplicado desde V27 |
| R-024-03 | Número de teléfono ya vinculado en otra entidad | M | B | BizumPhoneConflictException controlada + mensaje de usuario |
| R-024-04 | Concurrencia en pagos simultáneos misma cuenta | B | A | Optimistic locking en BizumTransaction + constraint DB unicidad |

---

## Integración con features anteriores

| Feature | Punto de integración |
|---|---|
| FEAT-001 / FEAT-002 | OTP/SCA — reutilizar TwoFactorService y OtpValidationUseCase sin modificación |
| FEAT-007 | Deducción de saldo de cuenta origen vía AccountRepositoryPort |
| FEAT-014 | Notificaciones push VAPID — reutilizar NotificationService.send() |
| FEAT-017 | Patrón SEPA — referencia para modelo de transacción instantánea |
| FEAT-019 | Trazabilidad GDPR — registrar en audit_log con IBAN real (LA-020-03) |
| FEAT-020/021 | Patrón CoreBankingMock y BigDecimal HALF_EVEN para importes |

---

## Definition of Done — Sprint 24

- [ ] 6 US implementadas y verificadas contra prototipo HITL (LA-023-02)
- [ ] DEBT-045 y DEBT-046 cerrados en el sprint
- [ ] 0 CVE críticos · 0 CVE altos (Security Agent)
- [ ] Mínimo 10 tests unitarios dominio bizum + SpringContextIT
- [ ] Cobertura estimada >= 88%
- [ ] Flyway V27__bizum.sql aplicada sin errores (Flyway histórico: V26 = deposits)
- [ ] SCA OTP funcional en staging con bypass code 123456
- [ ] Smoke test actualizado pasando 17/17+ endpoints
- [ ] FA v0.4 generado con FEAT-022 consolidado (gen-fa-document.py)
- [ ] 17 DOCX + 3 XLSX + 1 JSON generados (Documentation Agent Step 8)
- [ ] LESSONS_LEARNED.md regenerado (Step 9)
- [ ] Dashboard Global actualizado en cada gate (GR-011)
- [ ] Jira SCRUM-132..142: todos en Finalizada
- [ ] Confluence: página Resultados + Retrospectiva Sprint 24 publicadas
- [ ] session.json: sprint_closed=true · acum=569SP
