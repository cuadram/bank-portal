# Sprint Planning — Sprint 01
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Planning (PP + PMC — CMMI Nivel 3)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha de planning:** 2026-03-11
> **Sprint:** 01

---

## 1. Sprint Metadata

| Campo                  | Valor                                          |
|------------------------|------------------------------------------------|
| Sprint ID              | SPRINT-01                                      |
| Proyecto               | BankPortal — Banco Meridian                    |
| Período                | 2026-03-11 → 2026-03-25 (2 semanas)            |
| Capacidad comprometida | 40 SP                                          |
| Sprint Goal            | Implementar el flujo completo de autenticación 2FA (TOTP) en el portal bancario, cubriendo enrolamiento, verificación en login, códigos de recuperación e infraestructura base, con cobertura de tests ≥ 80% |
| Feature objetivo       | FEAT-001 — Autenticación de Doble Factor (2FA) |
| Rama git               | `feature/FEAT-001-autenticacion-2fa`           |
| Estado                 | PLANIFICADO                                    |

---

## 2. Capacidad del equipo

### Composición del equipo Sprint 01

| Rol                 | Disponibilidad | Horas/día | Días sprint | Horas brutas |
|---------------------|----------------|-----------|-------------|--------------|
| Backend Developer   | 100%           | 8h        | 10          | 80h          |
| Frontend Developer  | 100%           | 8h        | 10          | 80h          |
| QA Engineer         | 100%           | 8h        | 10          | 80h          |
| **TOTAL BRUTO**     |                |           |             | **240h**     |

### Factores de reducción

| Factor                                            | Reducción    |
|---------------------------------------------------|--------------|
| Ceremonias (planning 2h + daily 0.5h×10 + retro 2h) | −4h/persona → −12h total |
| Tareas administrativas / reuniones cliente         | −2h/persona → −6h total  |
| Buffer de impedimentos (10% capacidad bruta)       | −24h total               |
| **Total reducción**                               | **−42h**                 |

**Capacidad neta:** 240h − 42h = **198h**

### Conversión a Story Points

> **Primer sprint:** se aplica factor conservador del 70% (sin velocidad histórica)
>
> Capacidad comprometida: 198h × 70% = ~138h efectivas
> Ratio estimado: 40 SP / 198h netas ≈ **0,20 SP/hora**

**Capacidad comprometida para Sprint 01: 40 SP** ✅ (FEAT-001 encaja exactamente)

---

## 3. Sprint Goal

> **"Implementar el flujo completo de autenticación 2FA (TOTP) en el portal bancario de Banco Meridian: desde la configuración de la infraestructura base hasta el enrolamiento, verificación en login, gestión de códigos de recuperación y cobertura de tests automatizados, garantizando el cumplimiento de PCI-DSS 4.0 req. 8.4."**

### Indicador de éxito del Sprint Goal

| Criterio                                                    | Umbral    |
|-------------------------------------------------------------|-----------|
| US-001 + US-002 + US-003 completadas y aprobadas por PO     | Obligatorio |
| US-006 (infraestructura TOTP) completada en día 3 max.      | Obligatorio |
| Cobertura de tests backend ≥ 80%                            | Obligatorio |
| Sin NCs abiertas de severidad crítica o alta al cierre       | Obligatorio |
| US-004 + US-005 completadas (Should Have)                   | Deseable  |

---

## 4. Sprint Backlog — Items seleccionados

### Orden de ejecución recomendado (dependency-first)

| Orden | ID      | Título                                    | SP | Prioridad   | Dependencias      |
|-------|---------|-------------------------------------------|----|-------------|-------------------|
| 1     | US-006  | Setup infraestructura TOTP                | 3  | Must Have   | Ninguna           |
| 2     | US-001  | Activar 2FA con TOTP (enrolamiento)       | 8  | Must Have   | US-006            |
| 3     | US-002  | Verificar OTP en flujo de login           | 8  | Must Have   | US-006, US-001    |
| 4     | US-003  | Generar y gestionar códigos de recuperación | 5 | Must Have   | US-001            |
| 5     | US-004  | Desactivar 2FA con confirmación           | 5  | Should Have | US-001, US-003    |
| 6     | US-005  | Auditoría de eventos 2FA                  | 5  | Should Have | US-001, US-002    |
| 7     | US-007  | Tests de integración end-to-end 2FA       | 6  | Must Have   | US-001,002,003,004 |
|       | **TOTAL** |                                         | **40 SP** |          |                   |

---

## 5. Desglose de tasks por semana

### Semana 1 (2026-03-11 → 2026-03-18) — Infraestructura + Enrolamiento + Login

| Task   | US      | Descripción                                              | Rol            | SP  | Días est. |
|--------|---------|----------------------------------------------------------|----------------|-----|-----------|
| T-017  | US-006  | Dependencia `dev.samstevens.totp` en pom.xml             | Backend Dev    | 1   | 1         |
| T-018  | US-006  | Spring Security: pre-auth filter para flujo 2FA          | Backend Dev    | 1   | 1         |
| T-019  | US-006  | Variables de entorno AES key + app name en yml           | Backend Dev    | 1   | 1         |
| T-001  | US-001  | Endpoint POST /api/v1/2fa/enroll                         | Backend Dev    | 2   | 1         |
| T-002  | US-001  | Endpoint POST /api/v1/2fa/enroll/confirm                 | Backend Dev    | 2   | 1         |
| T-003  | US-001  | Cifrado AES-256 secreto TOTP                             | Backend Dev    | 2   | 1         |
| T-004  | US-001  | Angular: TwoFactorSetupComponent                         | Frontend Dev   | 2   | 2         |
| T-005  | US-002  | Modificar flujo auth/login para 2FA                      | Backend Dev    | 3   | 2         |
| T-006  | US-002  | Endpoint POST /api/v1/2fa/verify + rate limiter          | Backend Dev    | 3   | 2         |
| T-007  | US-002  | Angular: OtpVerificationComponent                        | Frontend Dev   | 2   | 2         |
| **S1 total** |    |                                                          |                | **19 SP** | |

### Semana 2 (2026-03-18 → 2026-03-25) — Recovery, Desactivación, Auditoría + Tests

| Task   | US      | Descripción                                              | Rol            | SP  | Días est. |
|--------|---------|----------------------------------------------------------|----------------|-----|-----------|
| T-008  | US-003  | Generación y almacenamiento recovery codes               | Backend Dev    | 2   | 1         |
| T-009  | US-003  | Angular: RecoveryCodesComponent                          | Frontend Dev   | 2   | 1         |
| T-010  | US-003  | Migración BD: tabla recovery_codes                       | Backend Dev    | 1   | 0.5       |
| T-011  | US-004  | Endpoint DELETE /api/v1/2fa/disable                      | Backend Dev    | 2   | 1         |
| T-012  | US-004  | Angular: UI desactivación en TwoFactorSetupComponent     | Frontend Dev   | 2   | 1         |
| T-013  | US-004  | Limpieza secreto TOTP + recovery codes al desactivar     | Backend Dev    | 1   | 0.5       |
| T-014  | US-005  | AuditLogService + tabla audit_log                        | Backend Dev    | 2   | 1         |
| T-015  | US-005  | AOP aspect @TwoFactorAudit                               | Backend Dev    | 2   | 1         |
| T-016  | US-005  | Migración BD: tabla audit_log                            | Backend Dev    | 1   | 0.5       |
| T-020  | US-007  | Tests unitarios backend — JUnit 5 + Mockito              | QA/Backend     | 2   | 1         |
| T-021  | US-007  | Tests integración backend — SpringBootTest + Testcontainers | QA/Backend  | 2   | 1.5       |
| T-022  | US-007  | Tests E2E Angular — Cypress flujo login + 2FA            | QA/Frontend    | 2   | 1.5       |
| **S2 total** |    |                                                          |                | **21 SP** | |

---

## 6. WIP Limits — Sprint 01

| Columna         | Límite | Notas                                              |
|-----------------|--------|----------------------------------------------------|
| READY           | 5      | Máx 5 US/tasks preparadas para jalar               |
| IN PROGRESS     | 3      | 1 US activa por desarrollador máximo               |
| CODE REVIEW     | 2      | Revisar antes de jalar nueva tarea                 |
| QA              | 2      | QA prioriza ejecución antes de nuevos ingresos     |
| WAITING APPROVAL| ∞      | Monitorear SLA 24h (US) / 48h (HLD/LLD)            |

---

## 7. Dependencias y pre-condiciones

| Dependencia                         | Estado          | Responsable     | Fecha límite |
|-------------------------------------|-----------------|-----------------|--------------|
| Librería `dev.samstevens.totp`       | ⏳ Por configurar | Backend Dev    | 2026-03-12   |
| Diseño UI pantallas 2FA             | ⏳ Por validar   | Frontend Dev + PO | 2026-03-12 |
| Módulo JWT activo y funcional       | ✅ Disponible    | —               | —            |
| Tabla `users` en BD                 | ✅ Disponible    | —               | —            |
| SSL/TLS en endpoints                | ✅ Disponible    | —               | —            |

> ⚠️ **Bloqueante potencial:** si la librería TOTP no está disponible al día 1 y el diseño UI no se valida en las primeras 24h, US-001 queda bloqueada. SM deberá escalar inmediatamente.

---

## 8. Risk Register — Sprint 01

| ID    | Riesgo                                      | Prob | Impacto | Exposición | Estado  | Plan de respuesta                                   | Responsable |
|-------|---------------------------------------------|------|---------|------------|---------|-----------------------------------------------------|-------------|
| R-001 | Desincronización de reloj TOTP              | M    | A       | **A**      | Abierto | Implementar tolerancia ±1 período; validar en tests | Backend Dev |
| R-002 | Pérdida dispositivo sin recovery codes      | B    | A       | M          | Abierto | Forzar descarga backup antes de cerrar enrolamiento | Frontend Dev |
| R-003 | Brute-force en endpoint /verify             | M    | A       | **A**      | Abierto | Rate limiting (5 intentos/10min) + bloqueo 15min    | Backend Dev |
| R-004 | Librería TOTP no disponible día 1           | B    | A       | M          | Abierto | SM escala a DevOps el mismo día; US-001 queda bloqueada | SM      |
| R-005 | Diseño UI no validado genera retrabajo      | M    | M       | M          | Abierto | PO valida mockups antes del día 2 del sprint        | PO / Frontend |
| R-006 | Capacidad primer sprint subestimada (−30%)  | M    | A       | **A**      | Abierto | Factor conservador 70% aplicado; Must Haves priorizados | SM      |

> 🔴 **Riesgos de exposición ALTA (R-001, R-003, R-006):** notificados al PM. Sin acción requerida inmediata, pero monitorizados daily.

---

## 9. Ceremonias del Sprint 01

| Ceremonia             | Fecha estimada  | Duración | Facilitador | Participantes            |
|-----------------------|-----------------|----------|-------------|--------------------------|
| Sprint Planning       | 2026-03-11      | 2h       | SM (SOFIA)  | PO, Dev Team, QA         |
| Daily Standup         | Lun-Vie diario  | 15 min   | SM (SOFIA)  | Dev Team, QA             |
| Backlog Refinement    | 2026-03-17      | 1h       | SM + PO     | Dev Team, QA             |
| Sprint Review         | 2026-03-25      | 1h       | SM + PO     | Dev Team, QA, Cliente    |
| Retrospectiva         | 2026-03-25      | 1h       | SM (SOFIA)  | Dev Team, QA             |

---

## 10. Definition of Done (DoD) — Sprint 01

Una User Story se marca **DONE** cuando:

- [ ] Código implementado y mergeado en `feature/FEAT-001-autenticacion-2fa`
- [ ] Cobertura de tests ≥ 80% (unitarios + integración)
- [ ] Code review aprobado por al menos 1 desarrollador par
- [ ] Sin issues críticos ni altos en SonarQube
- [ ] Documentación OpenAPI/Swagger actualizada
- [ ] Criterios de aceptación Gherkin verificados por QA
- [ ] Demo aprobada por Product Owner en Sprint Review

El **Sprint** se considera **DONE** cuando:

- [ ] Todas las US de prioridad **Must Have** cumplen su DoD individual
- [ ] Sprint Report generado y commitado
- [ ] Risk Register actualizado
- [ ] Acta de Sprint Review firmada por cliente (via Workflow Manager)
- [ ] Retrospectiva ejecutada y acta generada

---

## 11. Acuerdos de servicio (SLAs) — Sprint 01

| Tipo de gate                   | SLA acordado | Destino aprobación |
|--------------------------------|--------------|--------------------|
| Aprobación User Story (PO)     | 24h          | Product Owner       |
| Aprobación HLD/LLD (Arch)      | 48h          | Tech Lead           |
| Aprobación Sprint Review       | 48h          | Cliente / Banco Meridian |
| Code Review por par            | 8h laborables | Dev Team           |
| QA Sign-off por US             | 24h          | QA Lead             |

---

## 12. Trazabilidad CMMI Nivel 3

| Área de proceso CMMI         | Evidencia en este artefacto                                         |
|------------------------------|---------------------------------------------------------------------|
| PP — Project Planning        | Capacidad calculada, sprint goal, calendario, riesgos iniciales     |
| PMC — Project Monitoring     | WIP limits, alertas, SLAs, DoD sprint, métricas de seguimiento      |
| REQM — Requirements Mgmt     | Trazabilidad US ↔ FEAT-001 ↔ sprint backlog                         |
| RSKM — Risk Management       | Risk Register con probabilidad, impacto y plan de respuesta         |
| CM — Configuration Mgmt      | Rama git, conv. commits, artefactos versionados en docs/sprints/    |
| VER — Verification           | DoD con code review, cobertura tests y SonarQube                    |
| VAL — Validation             | Demo PO + firma cliente en Sprint Review                            |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 01 · 2026-03-11*
