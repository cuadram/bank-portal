# Sprint 10 — Planning

## Metadata CMMI (PP SP 2.1)

| Campo | Valor |
|---|---|
| Sprint | 10 |
| Proyecto | BankPortal — Banco Meridian |
| Feature | FEAT-008 — Transferencias Bancarias |
| Sprint Goal | Habilitar transferencias entre cuentas propias y a beneficiarios con confirmación 2FA, migrando JWT a RS256 y consolidando los tests de integración con BD real |
| Período | 2026-03-20 a 2026-04-02 (14 días) |
| Capacidad | 24 SP |
| Release objetivo | v1.10.0 |
| Rama | feature/FEAT-008-sprint10 |
| Fecha planning | 2026-03-20 |
| Jira Epic | SCRUM-31 |

---

## Revisión de mejoras Sprint 9 (ACT-10 — Ritual de kick-off)

| Acción | Estado | Efecto observado |
|---|---|---|
| MailHog SMTP fake para STG | Implementado | Stack STG 5/5 healthy con email testing operativo |
| application-staging.yml con defaults completos | Implementado | Arranque STG sin variables externas |
| Dockerfile frontend restaurado en repo | Implementado | Build reproducible desde cero |
| pom.xml con todas las dependencias sprints 1-8 | Implementado | 11 rondas de compilación resueltas — no repetir en Sprint 10 |

---

## Cálculo de capacidad (PP SP 2.2)

| Concepto | Valor |
|---|---|
| Días hábiles del sprint | 10 días |
| Velocidad histórica media | 23.875 SP/sprint (9 sprints) |
| Capacidad acordada Sprint 10 | 24 SP |
| Buffer reservado | 10% incluido en estimaciones individuales |

---

## Sprint Backlog

| # | ID | Título | Tipo | SP | Prioridad | Semana | Dependencias |
|---|---|---|---|---|---|---|---|
| 1 | DEBT-013 | Tests integración BD real (Testcontainers) | Tech Debt | 3 | Must Have | S1 | — |
| 2 | DEBT-014 | Migración JWT HS256 a RS256 | Tech Debt | 5 | Must Have | S1 | — |
| 3 | US-801 | Transferencia entre cuentas propias | Feature | 5 | Must Have | S1 | DEBT-014 |
| 4 | US-802 | Transferencia a beneficiario guardado | Feature | 5 | Must Have | S2 | US-801, US-803 |
| 5 | US-803 | Gestión de beneficiarios | Feature | 3 | Must Have | S2 | DEBT-014 |
| 6 | US-804 | Límites de transferencia + confirmación 2FA | Feature | 3 | Must Have | S2 | US-801 |
| | | **TOTAL** | | **24 SP** | | | |

---

## Distribución por semana

### Semana 1 (2026-03-20 a 2026-03-26) — 13 SP
| ID | Título | SP |
|---|---|---|
| DEBT-013 | Tests integración Testcontainers | 3 |
| DEBT-014 | Migración JWT RS256 | 5 |
| US-801 | Transferencia entre cuentas propias | 5 |

### Semana 2 (2026-03-27 a 2026-04-02) — 11 SP
| ID | Título | SP |
|---|---|---|
| US-802 | Transferencia a beneficiario guardado | 5 |
| US-803 | Gestión de beneficiarios | 3 |
| US-804 | Límites de transferencia + confirmación 2FA | 3 |

---

## Dependencias críticas

```
DEBT-014 (RS256)
    +-- US-801 (Transferencia propia) — requiere JWT RS256 en STG
    +-- US-803 (Beneficiarios)        — requiere JWT RS256 en STG

US-801 (Transferencia propia)
    +-- US-802 (Transferencia beneficiario) — patrón TransferUseCase compartido

US-803 (Beneficiarios)
    +-- US-802 (Transferencia beneficiario) — BeneficiaryRepositoryPort

US-801 + US-803
    +-- US-804 (Límites + 2FA) — TransferLimitValidationService
```

Orden de ejecución: DEBT-013 || DEBT-014 → US-801 || US-803 → US-802 → US-804

---

## Pre-requisitos Día 1 (bloqueantes)

- [ ] ADR-001 actualizado: migración a RS256 + impacto en tokens STG existentes
- [ ] Flyway V11 diseñado: beneficiaries, transfers, transfer_limits + índices
- [ ] Par RSA-2048 generado para STG: `openssl genrsa -out stg-private.pem 2048`
- [ ] docker-compose down -v en STG (limpiar tokens HS256 antes de RS256)
- [ ] Rama feature/FEAT-008-sprint10 creada desde develop

---

## Riesgos del sprint (Risk Register extracto)

| ID | Riesgo | Exposición | Acción inmediata |
|---|---|---|---|
| R-F8-001 | API core bancario no disponible | Alta | Mock desde Día 1 con interfaz sellada |
| R-F8-002 | DEBT-014 rompe tokens STG existentes | Media | docker-compose down -v previo documentado |
| R-F8-003 | Validación IBAN insuficiente | Media | commons-validator + tests de casos límite |
| R-F8-004 | Contadores Redis se pierden al reiniciar | Media | AOF ya activo en docker-compose |
| R-F8-005 | Transacción de transferencia incompleta | Media | @Transactional strict + compensación |

---

## Definition of Done (DoD) — Sprint 10

Además del DoD base (CLAUDE.md):

- [ ] DEBT-014: todos los tests existentes (72) PASS con RS256
- [ ] Flyway V11 aplicado limpiamente en STG (down -v previo documentado)
- [ ] Transferencia propia + beneficiario demostrable en STG
- [ ] OTP requerido en toda operación de transferencia (sin excepción)
- [ ] Límites validados contra Redis con TTL correcto hasta medianoche UTC
- [ ] audit_log contiene TRANSFER_INITIATED / TRANSFER_COMPLETED por cada operación
- [ ] Stack STG 5/5 healthy tras DEBT-014 (JWT RS256)
- [ ] DEBT-013: suite tests integración PostgreSQL real PASS en perfil 'integration'

---

## Métricas históricas (PMC SP 1.1)

| Sprint | SP plan | SP real | Velocidad | Deuda generada |
|---|---|---|---|---|
| Sprint 1 | 21 | 21 | 21 | 0 |
| Sprint 2 | 24 | 24 | 24 | 0 |
| Sprint 3 | 24 | 24 | 24 | 2 |
| Sprint 4 | 25 | 25 | 25 | 4 |
| Sprint 5 | 24 | 24 | 24 | 3 |
| Sprint 6 | 24 | 24 | 24 | 2 |
| Sprint 7 | 24 | 24 | 24 | 0 |
| Sprint 8 | 24 | 24 | 24 | 0 |
| Sprint 9 | 23 | 23 | 23 | 0 |
| **Sprint 10** | **24** | — | — | — |
| **Media** | **23.9** | **23.9** | **23.875** | — |

---

*Generado por SOFIA Scrum Master Agent — Step 1 Gate 1*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1*
*BankPortal Sprint 10 Planning — 2026-03-20*
