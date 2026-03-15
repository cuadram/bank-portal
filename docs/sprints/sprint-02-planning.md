# Sprint Planning — Sprint 02
## Proyecto: BankPortal · Cliente: Banco Meridian

> **Artefacto:** Sprint Planning (PP + PMC — CMMI Nivel 3)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha de planning:** 2026-03-14
> **Sprint:** 02

---

## 1. Sprint Metadata

| Campo                  | Valor                                                      |
|------------------------|------------------------------------------------------------|
| Sprint ID              | SPRINT-02                                                  |
| Proyecto               | BankPortal — Banco Meridian                                |
| Período                | 2026-03-25 → 2026-04-08 (2 semanas)                        |
| Velocidad Sprint 01    | 40 SP completados (baseline establecido)                   |
| Capacidad comprometida | 38 SP                                                      |
| Sprint Goal            | Fortalecer la seguridad del módulo 2FA en producción (Redis rate-limiting + anti-replay TOTP), completar la cobertura E2E Playwright y accesibilidad runtime, y dejar el sistema listo para onboarding de nuevas features |
| Rama git               | `feature/FEAT-002-seguridad-calidad-sprint02` (a crear)    |
| Estado                 | PLANIFICADO                                                |

---

## 2. Retrospectiva Sprint 01 — Entradas al Planning

### Lo que funcionó bien
- Pipeline SOFIA (SM → REQ → ARCH → Dev → CR → QA) sin bloqueos entre roles
- Patrón `exhaustMap` establecido para operaciones destructivas → consistencia en US-002, 003, 004
- `disableAttempted` / `verifyAttempted` — patrones reutilizables detectados y documentados
- WCAG 2.1 AA checklist incremental: US-001 (8 verificaciones) → US-004 (21 verificaciones)
- Zero rework mayor tras CR — NCs detectadas y corregidas en la misma sesión en US-003 y US-004

### Impedimentos / mejoras identificadas
- `apps/frontend-portal/` untracked en git — detectado en merge. Mitigación: `.gitignore` review + `git status` en Definition of Done
- WARN-01 (7mo test backend) pendiente desde Sprint 01 hasta el final — registrar en DoD que tests de use cases deben estar completos antes del QA sign-off
- JaCoCo 0.8.12 incompatible con JDK 25+ — upgrade urgente antes del siguiente ciclo CI/CD

### Ajustes al proceso Sprint 02
- DoD añade: `git status --short` limpio como gate de merge
- DoD añade: todos los tests de un use case completos antes de QA sign-off
- Velocidad establecida: 40 SP → capacidad Sprint 02 al 95% = **38 SP**

---

## 3. Sprint Goal

> **"Elevar el módulo 2FA de BankPortal a nivel de producción: sustituir el rate-limiter in-process por Bucket4j+Redis, implementar protección anti-replay TOTP, completar la suite E2E Playwright para los flujos críticos y verificar accesibilidad runtime. Al final del sprint, el módulo 2FA pasa de 'funcionalmente completo' a 'production-ready'."**

### Criterios de éxito

| Criterio                                                      | Umbral      |
|---------------------------------------------------------------|-------------|
| DEBT-001 resuelto: RateLimiter con Redis en entorno local     | Obligatorio |
| DEBT-002 resuelto: anti-replay TOTP con ventana configurable  | Obligatorio |
| Suite E2E Playwright: ≥ 4 flujos críticos automatizados       | Obligatorio |
| Accesibilidad runtime: contraste, foco, NVDA verificados      | Obligatorio |
| DEBT-003 + RV-001/002/003 resueltos                           | Should Have |
| FEAT-002 análisis + HLD aprobado                              | Could Have  |

---

## 4. Backlog del Sprint 02

### 4.1 Deuda técnica — Seguridad (Must Have)

| ID       | Título                                             | SP | Prioridad   | Origen       |
|----------|----------------------------------------------------|----|-------------|--------------|
| DEBT-001 | RateLimiterService: Bucket4j in-process → Redis    | 8  | Must Have   | CR Sprint 01 |
| DEBT-002 | Anti-replay TOTP: ventana de uso único por OTP     | 5  | Must Have   | CR Sprint 01 |

**DEBT-001 — Detalle:**
El `RateLimiterService` actual usa `ConcurrentHashMap` en memoria. En entornos con múltiples instancias (Kubernetes, rolling deploy), cada pod tiene su propio contador → un atacante puede superar el rate limit simplemente rotando entre instancias. Redis centraliza el estado.
- Añadir `bucket4j-redis` al `pom.xml`
- `docker-compose.yml`: servicio Redis Alpine
- `RedisRateLimiterService` implementando el mismo contrato de puerto
- Actualizar `application.yml` con `spring.data.redis.*`
- Tests: `RateLimiterServiceTest` actualizado + test de race condition simulada

**DEBT-002 — Detalle:**
`dev.samstevens.totp` no protege contra replay dentro de la ventana de 30 s. Un OTP interceptado puede reutilizarse hasta que expire. La mitigación estándar es una cache de OTPs usados (Redis, TTL = 90 s).
- `OtpReplayCache` interface (puerto de dominio)
- `RedisOtpReplayCacheAdapter` (infrastructure)
- `VerifyOtpUseCase` y `ConfirmEnrollmentUseCase`: verificar cache antes de validar
- Tests unitarios: mock del cache + tests de replay

---

### 4.2 Deuda técnica — Calidad y tooling (Should Have)

| ID       | Título                                             | SP | Prioridad   | Origen       |
|----------|----------------------------------------------------|----|-------------|--------------|
| DEBT-003 | JaCoCo 0.8.12 → 0.8.13+ (soporte JDK 25+)         | 1  | Should Have | CR Sprint 01 |
| RV-001   | Mock TwoFactorStore en TestBed — auth interceptor  | 3  | Should Have | CR Sprint 01 |
| RV-002   | PUBLIC_PATHS matching robusto en interceptor       | 2  | Should Have | CR Sprint 01 |
| RV-003   | Cancelar setTimeout handles en ngOnDestroy         | 1  | Should Have | CR Sprint 01 |

**RV-001:** El `auth.interceptor.ts` no tiene test de integración en TestBed con `TwoFactorStore` mockeado. Escenarios sin cobertura: token ausente, token pre-auth, token de sesión, ruta pública.

**RV-002:** `PUBLIC_PATHS` usa comparación exacta de string — `/auth/login` no matchea `/auth/login?redirect=`. Usar `startsWith` o `URL.pathname`.

---

### 4.3 Tests E2E y accesibilidad (Must Have)

| ID  | Título                                             | SP | Prioridad   | Origen       |
|-----|----------------------------------------------------|----|-------------|--------------|
| L6  | E2E Playwright — flujos críticos 2FA (4 flujos)    | 8  | Must Have   | QA Sprint 01 |
| L4  | Accesibilidad runtime: contraste, foco, AT         | 5  | Must Have   | QA Sprint 01 |

**L6 — Flujos Playwright mínimos:**
1. Enrolamiento completo (US-001): login → QR → confirmar OTP → recovery codes
2. Login con OTP (US-002): pre-auth token → verificar OTP → dashboard
3. Login con recovery code (US-002/003): recovery code consumido
4. Desactivar 2FA (US-004): password + OTP → status DISABLED

**L4 — Accesibilidad runtime:**
- Contraste WCAG AA (ratio ≥ 4.5:1) en estados de error y estados activos
- Foco visible en todos los elementos interactivos (outline no removido)
- Flujo de teclado completo (Tab, Shift+Tab, Enter, Escape)
- NVDA + Firefox: anuncio correcto de `role=alert`, `aria-busy`, `aria-invalid`

---

### 4.4 Nueva feature — Análisis (Could Have)

| ID      | Título                                             | SP | Prioridad   |
|---------|----------------------------------------------------|----|-------------|
| FEAT-002| Cambio de contraseña con confirmación 2FA — análisis + HLD | 5 | Could Have |

Flujo natural post-2FA: el usuario quiere cambiar su contraseña y el sistema debe exigir confirmación 2FA (OTP) para operaciones críticas de credenciales. Alineado con PCI-DSS 4.0 req. 8.3.

---

### Resumen del backlog Sprint 02

| Categoría              | Items | SP   | Prioridad   |
|------------------------|-------|------|-------------|
| Seguridad (deuda)      | 2     | 13   | Must Have   |
| Calidad/tooling (deuda)| 4     | 7    | Should Have |
| Tests E2E + A11y       | 2     | 13   | Must Have   |
| Nueva feature análisis | 1     | 5    | Could Have  |
| **TOTAL**              | **9** | **38** |           |

---

## 5. Desglose de tasks por semana

### Semana 1 (2026-03-25 → 2026-04-01) — Seguridad + tooling

| Task   | Item     | Descripción                                           | Rol          | SP  |
|--------|----------|-------------------------------------------------------|--------------|-----|
| T-S2-01| DEBT-001 | Docker Compose: servicio Redis + config Spring Data   | Backend Dev  | 1   |
| T-S2-02| DEBT-001 | `RedisRateLimiterService` impl + puerto actualizado   | Backend Dev  | 3   |
| T-S2-03| DEBT-001 | Tests: race condition simulada + integración Redis    | Backend Dev  | 2   |
| T-S2-04| DEBT-002 | `OtpReplayCache` puerto + `RedisOtpReplayCacheAdapter`| Backend Dev  | 2   |
| T-S2-05| DEBT-002 | `VerifyOtpUseCase` + `ConfirmEnrollment`: cache check | Backend Dev  | 2   |
| T-S2-06| DEBT-002 | Tests unitarios anti-replay (mock cache)              | Backend Dev  | 1   |
| T-S2-07| DEBT-003 | JaCoCo 0.8.13+ en pom.xml + validar CI               | Backend Dev  | 1   |
| T-S2-08| RV-001   | TestBed tests auth.interceptor.ts con store mockeado  | Frontend Dev | 3   |
| T-S2-09| RV-002   | PUBLIC_PATHS: startsWith + URL.pathname               | Frontend Dev | 1   |
| T-S2-10| RV-003   | ngOnDestroy: clearTimeout en RecoveryCodesComponent   | Frontend Dev | 1   |
| **S1** |          |                                                       |              | **17** |

### Semana 2 (2026-04-01 → 2026-04-08) — E2E + A11y + FEAT-002 análisis

| Task   | Item     | Descripción                                           | Rol          | SP  |
|--------|----------|-------------------------------------------------------|--------------|-----|
| T-S2-11| L6       | Setup Playwright: config + helpers + fixtures         | QA/Frontend  | 2   |
| T-S2-12| L6       | E2E Flujo 1: enrolamiento completo (US-001)           | QA/Frontend  | 2   |
| T-S2-13| L6       | E2E Flujo 2: login OTP (US-002)                       | QA/Frontend  | 1   |
| T-S2-14| L6       | E2E Flujo 3: recovery code (US-002/003)               | QA/Frontend  | 1   |
| T-S2-15| L6       | E2E Flujo 4: desactivar 2FA (US-004)                  | QA/Frontend  | 2   |
| T-S2-16| L4       | Auditoría contraste + foco (axe-core + manual)        | QA           | 2   |
| T-S2-17| L4       | NVDA + Firefox: flujos críticos US-001..004            | QA           | 3   |
| T-S2-18| FEAT-002 | Análisis requisitos: cambio password + 2FA            | Req Analyst  | 2   |
| T-S2-19| FEAT-002 | HLD FEAT-002: flujo, contratos API, modelo datos      | Architect    | 3   |
| **S2** |          |                                                       |              | **18** |

| **TOTAL SPRINT 02** | | | | **38 SP** |

---

## 6. WIP Limits — Sprint 02

| Columna         | Límite | Notas                                              |
|-----------------|--------|----------------------------------------------------|
| READY           | 5      | Sin cambios                                        |
| IN PROGRESS     | 3      | 1 item activo por desarrollador                    |
| CODE REVIEW     | 2      | Revisar antes de jalar nueva tarea                 |
| QA              | 2      | QA prioriza E2E Playwright antes de A11y runtime   |
| WAITING APPROVAL| ∞      | SLA 24h US / 48h HLD                               |

---

## 7. Definition of Done — Sprint 02 (actualizada)

Una User Story / Debt item se marca **DONE** cuando:

- [ ] Código implementado en `feature/FEAT-002-seguridad-calidad-sprint02`
- [ ] `git status --short` limpio antes de cualquier commit de feature ← **nuevo**
- [ ] Todos los tests del use case afectado completos antes de QA sign-off ← **nuevo**
- [ ] Cobertura de tests ≥ 80% (línea y rama — JaCoCo)
- [ ] Code review aprobado
- [ ] Sin NCs críticas o altas abiertas
- [ ] QA sign-off emitido

---

## 8. Risk Register — Sprint 02

| ID    | Riesgo                                              | Prob | Impacto | Exposición | Plan de respuesta                                       |
|-------|-----------------------------------------------------|------|---------|------------|---------------------------------------------------------|
| R-007 | Redis no disponible en entorno local de desarrollo  | M    | A       | **A**      | Docker Compose con healthcheck; fallback in-process si compose falla |
| R-008 | NVDA + Firefox: comportamiento AT inconsistente     | M    | M       | M          | Acotar a NVDA 2024.x + Firefox ESR; documentar variantes |
| R-009 | Anti-replay cache introduce latencia en /verify     | B    | M       | B          | TTL configurable; benchmark con k6 antes del merge      |
| R-010 | Playwright flaky tests por timing OTP (30 s)        | A    | M       | **A**      | `OtpTestHelper` con clock mock; no usar OTPs reales en E2E |

---

## 9. Trazabilidad CMMI Nivel 3

| Área de proceso CMMI | Evidencia                                                              |
|----------------------|------------------------------------------------------------------------|
| PP                   | Capacidad calculada con velocidad establecida Sprint 01 (40 SP)        |
| PMC                  | Retrospectiva entradas → ajustes DoD + proceso                         |
| RSKM                 | Risk Register actualizado (R-007..010)                                 |
| CM                   | Nueva rama `feature/FEAT-002-*` desde `main` post-merge FEAT-001       |
| VER                  | DoD actualizado con gates nuevos (git status, tests completos)         |
| VAL                  | E2E Playwright + A11y runtime = validación de comportamiento en prod   |
| REQM                 | FEAT-002 análisis trazado a Sprint 02 Could Have                       |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · Sprint 02 · 2026-03-14*
