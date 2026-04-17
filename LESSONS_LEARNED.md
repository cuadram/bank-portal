# LESSONS LEARNED — bank-portal

> Generado: 2026-04-17T12:53:43.964Z | Total: 19 LAs
> LAs proyecto: 4 | LAs SOFIA-CORE integradas: 15
> Sprint 25 CERRADO — FEAT-023 Mi Dinero (PFM) — v1.25.0

## LAs del Proyecto

### LA-025-09 · process/tooling

**dashboard-script-completed-steps-schema-mismatch**

**Descripción:** .sofia/scripts/gen-global-dashboard.js espera session.completed_steps como Array (calls .includes), pero el session.json lo persiste como objeto {sprint, feature, steps:[]}. Al ejecutar directamente el script falla con TypeError: completedSteps.includes is not a function. Workaround actual: wrapper Node que normaliza el campo antes de invocar, restaura el formato objeto después. Bloquea la regeneracion automatica del Dashboard Global en cada Gate (GR-DASH-001 incumplida). Bug cosmetico adicional: el banner del gate concatena GATE-${GP.step} cuando GP.step ya es G-8, resultando en GATE-G-8.

**Corrección:** Refactorizar gen-global-dashboard.js para: (a) aceptar ambos formatos con normalizacion al cargar session.json — const completedSteps = Array.isArray(S.completed_steps) ? S.completed_steps : (S.completed_steps?.steps || []); (b) corregir la concatenacion del banner: gateLabel debe usar GP.step tal cual sin prefijo GATE- si ya contiene G-. Tests de regresion con ambos schemas. Promover a SOFIA-CORE como LA-CORE-058 y actualizar gen-global-dashboard.js en todos los proyectos registrados.

**Guardrail propuesto:** GR-DASH-002: dashboard script debe tolerar ambos schemas de completed_steps

> Candidata a SOFIA-CORE

_Registrada: 2026-04-17T12:08:33.479Z · HITL aprobada por product-owner_

---

### LA-025-08 · frontend/angular

**select-twoway-binding-reset**

**Descripción:** select con (change) unidireccional no sincroniza DOM al resetear la variable programaticamente. Filtro de categorias no quedaba marcado y el reset no funcionaba.

**Corrección:** [(ngModel)] + FormsModule para bidireccional. NUNCA (change) solo en controles con reset programatico.

> Candidata a SOFIA-CORE

_Registrada: 2026-04-16T20:34:14.884Z · HITL aprobada por product-owner_

---

### LA-025-07 · frontend/process

**prototype-fidelity-not-verified-g4-g5**

**Descripción:** 36 bugs por no leer el prototipo pantalla a pantalla. LA-CORE-041 y LA-CORE-043 no aplicadas. Developer implemento de memoria sin comparar con el HTML del prototipo aprobado.

**Corrección:** Checklist fidelidad BLOQUEANTE en G-4: verificar cada elemento del prototipo contra el componente Angular. PO hace screenshot comparison antes de aprobar G-4b.

> Candidata a SOFIA-CORE

_Registrada: 2026-04-16T20:34:14.884Z · HITL aprobada por product-owner_

---

### LA-025-06 · frontend/angular

**sign-contract-backend**

**Descripción:** Backend devuelve CARGO con signo negativo. Frontend debe aplicar Math.abs() antes de renderizar. Contrato no documentado en LLD/SRS. Corrompe porcentajes, semaforo y variaciones.

**Corrección:** Math.abs() en todos los mapeos de amount/spent/percentConsumed. Documentar en LLD. Tests con valores negativos en mocks CARGO.

> Candidata a SOFIA-CORE

_Registrada: 2026-04-16T20:34:14.884Z · HITL aprobada por product-owner_

---

## LAs SOFIA-CORE Integradas

> Estas LAs han sido promovidas desde otros proyectos y aprobadas por el PO.

### LA-023-01 · frontend

**Descripción:** desde bank-portal Sprint 23 — [href] nativo en Angular Router causa full page reload. REGLA: router.navigateByUrl() o [routerLink] siempre

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-025-01 · process/governance

**Descripción:** desde bank-portal Sprint 25 — Gate G-2 Sprint 25 aprobado explícitamente por el PO pero no persistido en sessi

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-025-02 · process/fa-agent

**Descripción:** desde bank-portal Sprint 25 — Step 2b debe invocar gen-fa-document.py para actualizar el FA Word consolidado a

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-025-03 · ux/process

**Descripción:** desde bank-portal Sprint 25 — UX/UI Designer Agent generó PROTO-FEAT-023-sprint25 desde el scaffold genérico d

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-025-04 · process/governance

**Descripción:** desde bank-portal Sprint 25 — current_step en session.json no se actualizaba al avanzar entre steps — quedó en

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-017 · analysis

**Descripción:** ORG baseline: leer SOFIA_ORG_PATH canonico, nunca snapshot local del proyecto

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-018 · governance

**Descripción:** HITL obligatorio antes de persistir cualquier LA: aprobacion PO explicita

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-033 · governance

**Descripción:** desde bank-portal Sprint 23 — Al ejecutar la-sync.js (GR-CORE-029), el Orchestrator aplicó el sync solo en los

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-048 · process/governance

**Descripción:** Gate persistencia atomica session.json + validate-fa-index CHECK 8 usa session.current_feature + FA feat field obligatorio

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-050 · ux/process

**Descripción:** PASO 0 herencia prototipo sprint-a-sprint obligatoria; cp archivo anterior + verificacion token portal real bloqueante G-2c

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-053 · backend/jdbc

**Descripción:** schema-drift-sql-native: verificar nombres de columna de tablas previas con \d tabla o Flyway migration antes de escribir queries SQL nativas. GR-SQL-001 en G-4b.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-054 · backend/jdbc

**Descripción:** instant-timestamptz-binding: JdbcClient no puede bindear Instant directo a TIMESTAMPTZ. Usar Timestamp.from(instant). GR-JDBC-001 en G-4b. Complementa LA-019-13.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-055 · frontend/angular

**Descripción:** sign-contract-backend: backend devuelve CARGO con signo negativo; frontend aplica Math.abs() en todos los mapeos. Documentar en LLD. Mocks con valores negativos. GR-API-001 en G-4b.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-056 · frontend/process

**Descripción:** prototype-fidelity-visual-review: 36 bugs por no leer prototipo pantalla a pantalla. Checklist fidelidad BLOQUEANTE en G-4 para cada pantalla. PO hace screenshot comparison antes de G-4b. Refuerza LA-CORE-041/043.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---

### LA-CORE-057 · frontend/angular

**Descripción:** select-twoway-binding-reset: (change) unidireccional no sincroniza DOM en reset programático. Usar [(ngModel)] + FormsModule en controles con reset. GR-ANGULAR-001 en G-4.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.52_

---
