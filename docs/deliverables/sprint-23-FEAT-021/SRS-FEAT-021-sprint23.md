# SRS — FEAT-021: Depósitos a Plazo Fijo
**Sprint 23 · BankPortal · Banco Meridian · SOFIA v2.7**

---

## 1. Metadata

| Campo | Valor |
|---|---|
| ID Feature | FEAT-021 |
| Proyecto | bank-portal |
| Cliente | Banco Meridian |
| Stack | Java 21 (backend) · Angular 17 (frontend) · PostgreSQL |
| Tipo de trabajo | new-feature |
| Sprint objetivo | 23 |
| Período | 2026-04-07 → 2026-04-20 |
| Release objetivo | v1.23.0 |
| Capacidad | 24 SP (19 feature + 5 deuda técnica) |
| Prioridad | Alta |
| Solicitado por | Product Owner |
| Versión SRS | 1.0 |
| Estado | APPROVED |

---

## 2. Descripción del sistema / contexto

BankPortal es el portal digital de Banco Meridian que permite a sus clientes gestionar sus productos financieros de forma autónoma. En el Sprint 22 se completó el módulo de préstamos personales (FEAT-020), cerrando la primera línea de crédito minorista. FEAT-021 abre la línea complementaria: **productos de ahorro a plazo fijo**.

Los depósitos a plazo fijo son el producto de captación bancaria más extendido en España. El cliente entrega un capital durante un período acordado a cambio de una retribución fija (TIN/TAE). La regulación española exige información precontractual clara, retención IRPF en origen y cobertura del Fondo de Garantía de Depósitos (FGD) hasta 100.000€ por titular.

El actor principal es el **cliente autenticado de Banco Meridian**. El sistema debe cubrir el ciclo completo: consulta → simulación → contratación → gestión (renovación / cancelación anticipada).

---

## 3. Alcance

**Incluido:**
- Consulta de depósitos activos del cliente (lista + detalle)
- Simulador de depósito sin autenticación (herramienta de captación)
- Apertura de depósito con autenticación reforzada 2FA (SCA/PSD2)
- Instrucción de renovación al vencimiento (auto / manual / cancelar)
- Cancelación anticipada con cálculo de penalización y confirmación 2FA
- Cálculo de IRPF por tramos según Art. 25 Ley 35/2006
- Badge informativo FGD (cobertura hasta 100.000€)
- Módulo Angular `DepositModule` con 5 componentes
- Flyway V25__deposits.sql
- Cierre de DEBT-036, DEBT-037 y DEBT-044

**Excluido:**
- Depósitos estructurados o vinculados a fondos de inversión (MiFID II scope)
- Gestión de cuentas remuneradas (cuenta ahorro — scope futuro)
- Renovación automática ejecutada por scheduler (backend batch — scope futuro)
- Depósitos en moneda extranjera

---

## 4. Épica

**EPIC-FEAT-021:** Depósitos a Plazo Fijo — Captación Digital

Banco Meridian necesita ofrecer a sus clientes la posibilidad de contratar depósitos a plazo fijo desde el portal digital para aumentar la captación de pasivo sin intervención de sucursal. El módulo completa el catálogo de productos financieros del portal junto con los préstamos personales (FEAT-020).

---

## 5. User Stories

---

### US-F021-01: Consulta de depósitos activos

**Como** cliente autenticado de Banco Meridian
**Quiero** ver el listado paginado de mis depósitos a plazo fijo con su estado actual
**Para** conocer en todo momento mi posición de ahorro y los productos contratados

**Story Points:** 3 · **Prioridad:** Alta · **Dependencias:** Ninguna

#### Criterios de aceptación

```gherkin
Scenario: Cliente con depósitos activos consulta su listado
  Given el cliente está autenticado con JWT válido
  When realiza GET /deposits
  Then el sistema devuelve HTTP 200
  And la respuesta incluye para cada depósito: id, importe, TIN, TAE, plazo (días),
      fecha apertura, fecha vencimiento, estado (ACTIVE|MATURED|CANCELLED)
  And los resultados están paginados (page, size, totalElements)
  And los depósitos en estado ACTIVE muestran badge FGD si importe ≤ 100.000€

Scenario: Cliente sin depósitos consulta el listado
  Given el cliente está autenticado con JWT válido
  And no tiene ningún depósito contratado
  When realiza GET /deposits
  Then el sistema devuelve HTTP 200 con lista vacía (content: [])
  And no devuelve HTTP 404

Scenario: Acceso sin autenticación
  Given no hay JWT en la cabecera Authorization
  When se realiza GET /deposits
  Then el sistema devuelve HTTP 401
```

---

### US-F021-02: Detalle de depósito y cuadro de liquidación IRPF

**Como** cliente autenticado de Banco Meridian
**Quiero** ver el detalle completo de un depósito incluyendo el cuadro de liquidación con retención IRPF
**Para** conocer con exactitud la rentabilidad neta real que recibiré al vencimiento

**Story Points:** 3 · **Prioridad:** Alta · **Dependencias:** US-F021-01

#### Criterios de aceptación

```gherkin
Scenario: Cliente consulta detalle de su depósito activo
  Given el cliente está autenticado con JWT válido
  And tiene un depósito con id={depositId}
  When realiza GET /deposits/{depositId}
  Then el sistema devuelve HTTP 200
  And la respuesta incluye todos los campos de lista más:
      intereses_brutos, retencion_irpf, intereses_netos, importe_total_vencimiento
  And retencion_irpf aplica tramos: 19% hasta 6.000€ / 21% hasta 50.000€ / 23% superior
  And todos los cálculos usan BigDecimal con redondeo HALF_EVEN

Scenario: Cliente intenta acceder al depósito de otro usuario
  Given el cliente A está autenticado
  And existe un depósito perteneciente al cliente B
  When cliente A realiza GET /deposits/{depositId_de_B}
  Then el sistema devuelve HTTP 403

Scenario: Depósito con ID inexistente
  Given el cliente está autenticado
  When realiza GET /deposits/id-inexistente
  Then el sistema devuelve HTTP 404
```

---

### US-F021-03: Simulador de depósito a plazo fijo

**Como** visitante o cliente de Banco Meridian (autenticado o no)
**Quiero** simular un depósito introduciendo importe y plazo antes de contratar
**Para** evaluar la rentabilidad y tomar una decisión de contratación informada

**Story Points:** 3 · **Prioridad:** Alta · **Dependencias:** Ninguna

#### Criterios de aceptación

```gherkin
Scenario: Simulación válida sin autenticación
  Given el endpoint no requiere JWT
  And el TIN vigente está configurado en application.properties (DEBT-044)
  When se realiza POST /deposits/simulate con importe=10000 y plazo=12
  Then el sistema devuelve HTTP 200 con:
      tin, tae, intereses_brutos, retencion_irpf_estimada, intereses_netos,
      importe_total_vencimiento
  And todos los valores son positivos y coherentes entre sí
  And los cálculos usan BigDecimal HALF_EVEN

Scenario: Importe inferior al mínimo
  Given se realiza POST /deposits/simulate
  When el importe es 500 (inferior al mínimo de 1.000€)
  Then el sistema devuelve HTTP 400 con mensaje: "Importe mínimo: 1.000€"

Scenario: Plazo fuera de rango
  Given se realiza POST /deposits/simulate
  When el plazo es 0 o superior a 60 meses
  Then el sistema devuelve HTTP 400 con mensaje descriptivo del rango válido
```

---

### US-F021-04: Apertura de depósito con confirmación 2FA

**Como** cliente autenticado de Banco Meridian
**Quiero** contratar un depósito a plazo fijo confirmando con mi OTP
**Para** formalizar la apertura de forma segura y regulatoriamente válida (PSD2/SCA)

**Story Points:** 5 · **Prioridad:** Alta · **Dependencias:** US-F021-01, US-F021-03

#### Criterios de aceptación

```gherkin
Scenario: Apertura exitosa con OTP válido
  Given el cliente está autenticado con JWT válido
  And tiene saldo suficiente en la cuenta origen
  When realiza POST /deposits con importe=10000, plazo=12, cuentaOrigenId, otp=VALIDO
  Then el sistema devuelve HTTP 201
  And el depósito queda en estado ACTIVE
  And la cuenta origen refleja el débito del importe
  And CoreBankingMockDepositClient registra la operación
  And Flyway V25 ha creado las tablas deposits y deposit_applications

Scenario: Apertura sin OTP
  Given el cliente está autenticado
  When realiza POST /deposits sin campo otp
  Then el sistema devuelve HTTP 400 con código OTP_REQUIRED (RN-F021-08)

Scenario: OTP inválido
  Given el cliente está autenticado
  When realiza POST /deposits con otp=INVALIDO
  Then el sistema devuelve HTTP 401 con código OTP_INVALID

Scenario: Saldo insuficiente en cuenta origen
  Given el cliente está autenticado y otp es válido
  And el saldo de la cuenta origen es inferior al importe solicitado
  When realiza POST /deposits
  Then el sistema devuelve HTTP 422 con código INSUFFICIENT_FUNDS

Scenario: Importe fuera del rango de producto
  Given el importe es inferior a 1.000€ o superior al límite del producto
  When realiza POST /deposits con otp válido
  Then el sistema devuelve HTTP 422 con código AMOUNT_OUT_OF_RANGE
```

---

### US-F021-05: Instrucción de renovación al vencimiento

**Como** cliente autenticado de Banco Meridian
**Quiero** indicar qué debe ocurrir con mi depósito cuando venza
**Para** asegurar la gestión automática de mis ahorros según mis preferencias

**Story Points:** 2 · **Prioridad:** Media · **Dependencias:** US-F021-04

#### Criterios de aceptación

```gherkin
Scenario: Actualización exitosa de instrucción de renovación
  Given el cliente está autenticado
  And tiene un depósito en estado ACTIVE
  When realiza PATCH /deposits/{id}/renewal con instruccion=RENEW_AUTO
  Then el sistema devuelve HTTP 200
  And el depósito refleja la nueva instrucción
  And los valores válidos son: RENEW_AUTO | RENEW_MANUAL | CANCEL_AT_MATURITY

Scenario: Intento de modificar instrucción en depósito vencido
  Given el depósito está en estado MATURED o CANCELLED
  When se intenta PATCH /deposits/{id}/renewal
  Then el sistema devuelve HTTP 409 con mensaje de estado incompatible

Scenario: Depósito de otro usuario
  When el cliente intenta modificar un depósito ajeno
  Then el sistema devuelve HTTP 403
```

---

### US-F021-06: Cancelación anticipada con penalización

**Como** cliente autenticado de Banco Meridian
**Quiero** poder cancelar mi depósito antes del vencimiento asumiendo la penalización
**Para** recuperar liquidez en caso de necesidad aunque implique un coste

**Story Points:** 3 · **Prioridad:** Media · **Dependencias:** US-F021-04

#### Criterios de aceptación

```gherkin
Scenario: Cancelación anticipada exitosa
  Given el cliente está autenticado
  And tiene un depósito en estado ACTIVE
  When realiza POST /deposits/{id}/cancel con otp=VALIDO
  Then el sistema devuelve HTTP 200 con:
      importe_abonado, penalizacion_aplicada, intereses_devengados
  And el depósito pasa a estado CANCELLED
  And la cuenta origen recibe el abono (importe - penalización)
  And penalización = % configurable × intereses devengados hasta fecha de cancelación

Scenario: Cancelación sin OTP
  When se intenta POST /deposits/{id}/cancel sin otp
  Then el sistema devuelve HTTP 400 con código OTP_REQUIRED

Scenario: OTP inválido en cancelación
  When se intenta POST /deposits/{id}/cancel con otp inválido
  Then el sistema devuelve HTTP 401 con código OTP_INVALID

Scenario: Depósito ya cancelado o vencido
  Given el depósito está en estado CANCELLED o MATURED
  When se intenta POST /deposits/{id}/cancel
  Then el sistema devuelve HTTP 409
```

---

## 6. Reglas de Negocio

| ID | Descripción | US vinculada |
|---|---|---|
| RN-F021-01 | Importe mínimo de depósito: 1.000€ | US-F021-03, US-F021-04 |
| RN-F021-02 | Plazo: mínimo 1 mes, máximo 60 meses | US-F021-03, US-F021-04 |
| RN-F021-03 | TIN/TAE configurables en application.properties por perfil de entorno | US-F021-03, US-F021-04 |
| RN-F021-04 | Retención IRPF: 19% hasta 6.000€ / 21% hasta 50.000€ / 23% superior | US-F021-02, US-F021-03 |
| RN-F021-05 | FGD: badge informativo si importe ≤ 100.000€ (RDL 16/2011) | US-F021-01 |
| RN-F021-06 | Cálculo con BigDecimal HALF_EVEN (coherente con ADR-034) | US-F021-02, US-F021-03 |
| RN-F021-07 | Renovación por defecto: RENEW_MANUAL (cliente debe instruir explícitamente) | US-F021-05 |
| RN-F021-08 | OTP obligatorio para apertura y cancelación anticipada (PSD2 SCA) | US-F021-04, US-F021-06 |
| RN-F021-09 | Penalización cancelación anticipada: configurable en application.properties | US-F021-06 |
| RN-F021-10 | Un cliente no puede acceder ni modificar depósitos de otro cliente | Todas |

---

## 7. Requerimientos No Funcionales (delta)

> Base: SRS Baseline BankPortal — RNF-001 a RNF-008

| ID | Categoría | Descripción | Criterio medible |
|---|---|---|---|
| RNF-D021-01 | Precisión | Cálculo IRPF y penalización | Sin error de redondeo — BigDecimal HALF_EVEN en todos los cálculos monetarios |
| RNF-D021-02 | Seguridad | Apertura y cancelación | SCA obligatorio (OTP 2FA) — coherente con PSD2 |
| RNF-D021-03 | Configurabilidad | TIN, TAE, penalización | Inyectados vía @Value desde application.properties — sin hardcode |
| RNF-D021-04 | Rendimiento | Simulación | Respuesta < 200ms p95 (cálculo en memoria, sin BD) |

---

## 8. Restricciones

| ID | Tipo | Descripción |
|---|---|---|
| RR-F021-01 | Normativa | Ley 44/2002 — información precontractual obligatoria en simulador y apertura |
| RR-F021-02 | Normativa | IRPF Art. 25 Ley 35/2006 — retención en origen por tramos obligatoria |
| RR-F021-03 | Normativa | FGD RDL 16/2011 — comunicar cobertura hasta 100.000€/titular |
| RR-F021-04 | Normativa | PSD2 Dir. 2015/2366 — SCA para débito de cuenta en apertura |
| RR-F021-05 | Técnica | BigDecimal para todos los cálculos monetarios (ADR-034) |
| RR-F021-06 | Técnica | Patrón hexagonal coherente con módulo loan/ (FEAT-020) |
| RR-F021-07 | Técnica | CoreBankingMockDepositClient — reutilizar patrón ADR-035 |
| RR-F021-08 | Técnica | Flyway V25 — idempotente con ON CONFLICT (LA-022-09) |

---

## 9. Supuestos y dependencias

**Supuestos:**
- El TIN de referencia para STG es 3.25% anual (configurable en application-stg.properties)
- La penalización por cancelación anticipada es el 25% de los intereses devengados (configurable)
- CoreBanking mock responde síncronamente (patrón heredado de ADR-035 en FEAT-020)
- No existen depósitos históricos en BD al iniciar el sprint — Flyway V25 parte de tablas vacías

**Dependencias:**
- DEBT-044 (externalizar TAE) debe resolverse en el mismo Step 4 que US-F021-03/04 para que el simulador y apertura lean TIN desde properties desde el primer momento
- DEBT-036 y DEBT-037 son independientes y pueden resolverse en paralelo al desarrollo de FEAT-021

---

## 10. Matriz de Trazabilidad (RTM)

| ID US | SP | Proceso Negocio | RN vinculadas | RNF vinculados | Componente Arq. | Caso de Prueba | Estado |
|---|---|---|---|---|---|---|---|
| US-F021-01 | 3 | Consulta depósitos | RN-F021-05, 10 | RNF-001 | DepositController · ListDeposits | TC-DEP-001..003 | APPROVED |
| US-F021-02 | 3 | Detalle + IRPF | RN-F021-04, 06, 10 | RNF-D021-01 | GetDepositDetail · IrpfRetentionCalculator | TC-DEP-004..007 | APPROVED |
| US-F021-03 | 3 | Simulación | RN-F021-01..04, 06 | RNF-D021-01, 03, 04 | SimulateDeposit · DepositSimulatorService | TC-DEP-008..011 | APPROVED |
| US-F021-04 | 5 | Apertura 2FA | RN-F021-01, 02, 07, 08 | RNF-D021-02, 03 | OpenDeposit · CoreBankingMockDepositClient | TC-DEP-012..017 | APPROVED |
| US-F021-05 | 2 | Renovación | RN-F021-07, 10 | RNF-001 | SetRenewalInstruction | TC-DEP-018..020 | APPROVED |
| US-F021-06 | 3 | Cancelación | RN-F021-08, 09, 10 | RNF-D021-01, 02 | CancelDeposit · PenaltyCalculator | TC-DEP-021..025 | APPROVED |
| DEBT-036 | 2 | Audit log | — | — | ExportAuditService | TC-DEBT036-01 | APPROVED |
| DEBT-037 | 1 | Validación PAN | — | RNF-004 | CardValidationService | TC-DEBT037-01..04 | APPROVED |
| DEBT-044 | 2 | Configuración | RN-F021-03 | RNF-D021-03 | AmortizationCalculator · DepositSimulatorService | TC-DEBT044-01 | APPROVED |

---

## 11. Definition of Done aplicable

- [ ] Código implementado en arquitectura hexagonal coherente con módulo loan/
- [ ] Tests unitarios escritos — cobertura ≥ 80% del módulo deposit/
- [ ] Tests de integración: SpringContextIT + smoke test
- [ ] Flyway V25 aplicado sin errores, idempotente
- [ ] Code Review: 0 blockers · 0 major
- [ ] Security Agent: 0 CVE críticos
- [ ] QA Lead: 100% casos de prueba PASS
- [ ] DEBT-036/037/044 cerrados en Jira
- [ ] FA-index actualizado: functionalities y business_rules coherentes
- [ ] validate-fa-index PASS 8/8
- [ ] 17 DOCX + 3 XLSX generados (Documentation Agent)
- [ ] Atlassian sincronizado: issues Finalizada + páginas Confluence
- [ ] Dashboard Global regenerado en cada gate

---

*SRS generado por Requirements Analyst Agent — SOFIA v2.7 — Sprint 23 — 2026-04-06*
