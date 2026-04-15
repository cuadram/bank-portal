# Sprint 24 Planning — BankPortal · Banco Meridian
**SOFIA v2.7 · Scrum Master Agent · Step 1**

---

## Metadata

| Campo | Valor |
|---|---|
| Sprint | 24 |
| Feature | FEAT-022 — Bizum P2P |
| Período | 2026-04-21 → 2026-05-04 (2 semanas) |
| Capacidad | 24 SP |
| Velocidad referencia | 24 SP (S21–S23 estable) |
| Release objetivo | v1.24.0 |
| SOFIA version | v2.7 |
| Rama git | feature/FEAT-022-sprint24 |

---

## Sprint Goal

> **"Permitir al cliente de Banco Meridian enviar y recibir pagos P2P inmediatos mediante número de teléfono registrado en Bizum, con autenticación SCA OTP, verificación de límites regulatorios y notificaciones push en tiempo real, cumpliendo PSD2 Art.97 SCA y SEPA Instant Credit Transfer."**

---

## Distribución de capacidad

| Tipo | SP | % |
|---|---|---|
| New Feature (FEAT-022) | 19 | 79% |
| Tech Debt (DEBT-045/046) | 5 | 21% |
| **Total** | **24** | **100%** |

Ratio deuda/feature: 0.26 — dentro del umbral saludable (< 0.30).

---

## Backlog del Sprint

### FEAT-022 — Bizum P2P (19 SP)

| ID | User Story | SP | Criterio de aceptación clave |
|---|---|---|---|
| US-F022-01 | Activación Bizum y vinculación número de teléfono | 2 | POST /bizum/activate → vincula número móvil a cuenta, valida formato E.164, estado ACTIVE en BD |
| US-F022-02 | Enviar pago Bizum con SCA OTP | 5 | POST /bizum/payments → valida OTP, comprueba límite €500/op y €2.000/día, debita cuenta, estado COMPLETED en <10s |
| US-F022-03 | Solicitar dinero a contacto Bizum | 3 | POST /bizum/requests → crea solicitud PENDING, notifica push al destinatario, expira en 24h si no se acepta |
| US-F022-04 | Aceptar o rechazar solicitud de dinero recibida | 2 | PATCH /bizum/requests/{id} → ACCEPTED (ejecuta pago SCA) / REJECTED (notifica push al solicitante) |
| US-F022-05 | Historial de operaciones Bizum | 3 | GET /bizum/transactions → lista paginada enviadas/recibidas/solicitadas, filtro por tipo y estado |
| US-F022-06 | Notificaciones push Bizum | 2 | Push VAPID en: recepción pago, solicitud dinero entrante, solicitud aceptada/rechazada |
| US-F022-07 | Interfaz Angular módulo Bizum (5 pantallas) | 2 | Module lazy /bizum, nav item en shell, pantallas: inicio, enviar, solicitar, historial, configuración |

### Tech Debt (5 SP)

| ID | Descripción | SP | Área |
|---|---|---|---|
| DEBT-045 | Adaptar CoreBanking mock con endpoint SEPA Instant Credit Transfer (ADR-038) | 3 | Backend |
| DEBT-046 | Refactorizar key pattern Redis rate-limit (unificar patrón userId:feature:date) | 2 | Infra |

---

## Regulación aplicable

| Marco regulatorio | Aplicación en FEAT-022 |
|---|---|
| PSD2 Art.97 (Dir. 2015/2366) | SCA obligatorio en pagos: OTP como factor posesión |
| SEPA Instant Credit Transfer (SCT Inst) | Liquidación ≤10s, disponibilidad 24/7/365, límite €100.000/operación |
| Circular BdE 4/2019 (servicios de pago) | Información previa, confirmación expresa, comprobante de operación |
| Reglamento BIZUM / Sistema de Pagos Inmediatos | Límite operativo €500/operación, €2.000/día — configurable por entidad |
| GDPR Art.6 | Consentimiento explícito para vincular número de teléfono a cuenta |

---

## Arquitectura técnica — diseño previo (input para Step 3)

### Backend — módulo hexagonal `bizum/`

```
bizum/
├── domain/
│   ├── model/        BizumPayment, BizumRequest, BizumContact, BizumStatus
│   ├── exception/    LimitExceededException, PhoneNotRegisteredException,
│   │                 RequestExpiredException, BizumNotActiveException
│   ├── service/      BizumLimitService, PhoneRegistrationService
│   └── repository/   BizumPaymentRepositoryPort, BizumRequestRepositoryPort
├── application/
│   ├── usecase/      Activate, SendPayment, RequestMoney, AcceptRequest,
│   │                 RejectRequest, ListTransactions (6 UC)
│   └── dto/          8 DTOs (Send/RequestCmd, PaymentResponse, RequestResponse,
│                     TransactionSummary, ActivationRequest, LimitStatus)
├── infrastructure/
│   ├── persistence/  BizumPaymentEntity, BizumRequestEntity, JpaAdapters x2
│   ├── corebanking/  CoreBankingMockBizumClient — SEPA Instant (ADR-038)
│   └── redis/        BizumRateLimitAdapter (DEBT-046)
└── api/              BizumController + BizumExceptionHandler (LA-TEST-003)
```

**Flyway:** V27__bizum.sql (bizum_payments, bizum_requests, bizum_contacts)
**Config:** bank.bizum.limit.per-operation=500, bank.bizum.limit.per-day=2000

### Frontend — módulo Angular `features/bizum/`

```
bizum/
├── bizum.module.ts + bizum-routing.module.ts
├── models/          bizum.model.ts
├── services/        bizum.service.ts
└── components/
    ├── bizum-home/          Panel principal — saldo + acciones rápidas
    ├── bizum-send/          Formulario envío + stepper OTP
    ├── bizum-request/       Formulario solicitud dinero
    ├── bizum-history/       Historial paginado con filtros
    └── bizum-settings/      Activar/desactivar + límites
```

### ADR-038 — CoreBanking Mock SEPA Instant
- Mock sincrono que simula liquidación instantánea (sin delay real)
- Responde COMPLETED en <100ms en STG
- Genera referencia SEPA Instant: `BIZUM-{uuid}`

---

## Riesgos del Sprint

| ID | Riesgo | Prob | Impacto | Mitigación |
|---|---|---|---|---|
| R-024-01 | Integración SEPA Instant más compleja de lo estimado en mock | M | M | DEBT-045 en primeros 2 días — early feedback |
| R-024-02 | Flujo OTP reutilizado pero con contexto diferente (Bizum vs Depósito) | B | M | Revisar TwoFactorService extensibilidad en Step 3 |
| R-024-03 | Redis rate-limit con carga concurrente P2P | B | B | DEBT-046 en Step 4, smoke test carga básica |

---

## Deudas técnicas identificadas para sprints futuros

| ID | Descripción | Prioridad | Sprint target |
|---|---|---|---|
| DEBT-047 | Bizum — internacionalización límites por país (SCT Inst europeo) | Baja | S26 |

---

## Issues Jira a crear

| # | Tipo | Título | SP |
|---|---|---|---|
| 1 | Story | US-F022-01: Activación Bizum y vinculación número de teléfono | 2 |
| 2 | Story | US-F022-02: Enviar pago Bizum con SCA OTP | 5 |
| 3 | Story | US-F022-03: Solicitar dinero a contacto Bizum | 3 |
| 4 | Story | US-F022-04: Aceptar o rechazar solicitud de dinero recibida | 2 |
| 5 | Story | US-F022-05: Historial de operaciones Bizum | 3 |
| 6 | Story | US-F022-06: Notificaciones push Bizum | 2 |
| 7 | Story | US-F022-07: Interfaz Angular módulo Bizum (5 pantallas) | 2 |
| 8 | Task | DEBT-045: CoreBanking mock SEPA Instant Credit Transfer | 3 |
| 9 | Task | DEBT-046: Refactorizar key pattern Redis rate-limit | 2 |
| 10 | Task | SPRINT-024 Planning & Setup — Step 1 Scrum Master | — |

---

## Métricas acumuladas (entrada Sprint 24)

| Métrica | Valor |
|---|---|
| Story Points acumulados | 545 SP (S1–S23) |
| Tests totales | 953 |
| Cobertura | 89% |
| Defectos en producción | 0 |
| Velocidad últimos 3 sprints | 24 / 24 / 24 SP |
| NCs abiertas | 0 |

---

*Generado por Scrum Master Agent — SOFIA v2.7 — Step 1 — Sprint 24*
