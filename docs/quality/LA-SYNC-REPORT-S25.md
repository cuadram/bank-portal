# LA-SYNC Report — Sprint 25

| Campo | Valor |
|---|---|
| Timestamp | 2026-04-16T21:24:02.198Z |
| Proyecto | bank-portal |
| SOFIA-CORE versión | 2.6.52 |
| LAs CORE disponibles | 62 |
| LAs nuevas importadas | 15 |
| Skills actualizados | 0 |
| Modo | DELTA |

## LAs Importadas

### LA-023-01 · frontend
- **Descripción:** desde bank-portal Sprint 23 — [href] nativo en Angular Router causa full page reload. REGLA: router.navigateByUrl() o [r
- **Compliance check:** COMPLIANT: No se encontró [href] en componentes Angular

### LA-CORE-017 · analysis
- **Descripción:** ORG baseline: leer SOFIA_ORG_PATH canonico, nunca snapshot local del proyecto
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-018 · governance
- **Descripción:** HITL obligatorio antes de persistir cualquier LA: aprobacion PO explicita
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-033 · governance
- **Descripción:** desde bank-portal Sprint 23 — Al ejecutar la-sync.js (GR-CORE-029), el Orchestrator aplicó el sync solo en los
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-048 · process/governance
- **Descripción:** Gate persistencia atomica session.json + validate-fa-index CHECK 8 usa session.current_feature + FA feat field obligator
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-050 · ux/process
- **Descripción:** PASO 0 herencia prototipo sprint-a-sprint obligatoria; cp archivo anterior + verificacion token portal real bloqueante G
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-025-01 · process/governance
- **Descripción:** desde bank-portal Sprint 25 — Gate G-2 Sprint 25 aprobado explícitamente por el PO pero no persistido en sessi
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-025-02 · process/fa-agent
- **Descripción:** desde bank-portal Sprint 25 — Step 2b debe invocar gen-fa-document.py para actualizar el FA Word consolidado a
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-025-03 · ux/process
- **Descripción:** desde bank-portal Sprint 25 — UX/UI Designer Agent generó PROTO-FEAT-023-sprint25 desde el scaffold genérico d
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-025-04 · process/governance
- **Descripción:** desde bank-portal Sprint 25 — current_step en session.json no se actualizaba al avanzar entre steps — quedó en
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-053 · backend/jdbc
- **Descripción:** schema-drift-sql-native: verificar nombres de columna de tablas previas con \d tabla o Flyway migration antes de escribi
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-054 · backend/jdbc
- **Descripción:** instant-timestamptz-binding: JdbcClient no puede bindear Instant directo a TIMESTAMPTZ. Usar Timestamp.from(instant). GR
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-055 · frontend/angular
- **Descripción:** sign-contract-backend: backend devuelve CARGO con signo negativo; frontend aplica Math.abs() en todos los mapeos. Docume
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-056 · frontend/process
- **Descripción:** prototype-fidelity-visual-review: 36 bugs por no leer prototipo pantalla a pantalla. Checklist fidelidad BLOQUEANTE en G
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-057 · frontend/angular
- **Descripción:** select-twoway-binding-reset: (change) unidireccional no sincroniza DOM en reset programático. Usar [(ngModel)] + FormsMo
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

---
_GR-CORE-029: este reporte es evidencia obligatoria de ejecución de la-sync en Step 1._
