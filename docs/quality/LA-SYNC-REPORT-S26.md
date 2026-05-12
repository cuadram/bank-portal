# LA-SYNC Report — Sprint 26

| Campo | Valor |
|---|---|
| Timestamp | 2026-05-12T18:14:22.149Z |
| Proyecto | bank-portal |
| SOFIA-CORE versión | 2.7.21 |
| LAs CORE disponibles | 94 |
| LAs nuevas importadas | 94 |
| Skills actualizados | 0 |
| Modo | FULL |

## LAs Importadas

### LA-CORE-001 · process
- **Descripción:** MCP config merge sin sobreescribir claude_desktop_config.json
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-002 · devops
- **Descripción:** realpath() en paths MCP, nunca aliases macOS
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-003 · process
- **Descripción:** SOFIA_REPO en CLAUDE.md + GR-CORE-003
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-004 · process
- **Descripción:** repo-template estructura canónica docs/ en onboarding
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-005 · process
- **Descripción:** verify-persistence.js BLOQUEANTE, GR-013
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-006 · process
- **Descripción:** FA documento único incremental, LA-FA-INCR
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-007 · ux
- **Descripción:** TOC clickable con w:hyperlink+w:anchor, LA-TOC-CLICK
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-008 · onboarding
- **Descripción:** wizard v2.6.11 verifica scripts críticos + inicializa FA-Agent
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-009 · ux
- **Descripción:** Prototipo incremental, GR-014
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-010 · process
- **Descripción:** Patch First ante correcciones, GR-015
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-011 · ux
- **Descripción:** Verificar matriz de roles antes de construir navegación
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-012 · infrastructure
- **Descripción:** sofia-shell PROJECT_ROOT dinámico por llamada (v2.0)
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-013 · architecture
- **Descripción:** Application handlers NO importan Infrastructure, GR-016
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-014 · infrastructure
- **Descripción:** MCP SDK en SOFIA-CORE, no en proyectos cliente (setup-shell-mcp.js)
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-015 · infrastructure
- **Descripción:** sofia-shell aislamiento: registrar SOFIA-CORE como entry especial en projects.json
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-016 · dashboard
- **Descripción:** org-baseline.json invisible en command center: leer en runtime, no hardcodear
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-017 · analysis
- **Descripción:** ORG baseline: leer SOFIA_ORG_PATH canonico, nunca snapshot local del proyecto
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-018 · governance
- **Descripción:** HITL obligatorio antes de persistir cualquier LA: aprobacion PO explicita
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-019 · governance
- **Descripción:** COMPAT-001: clasificacion PATCH/MINOR/MAJOR obligatoria antes de aplicar cualquier cambio SOFIA-CORE
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-020 · governance
- **Descripción:** COMPAT-002: session.json append-only; sin eliminacion ni cambio de tipo en campos existentes
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-021 · governance
- **Descripción:** COMPAT-003: nuevos guardrails NO se activan en proyectos existentes sin upgrade explicito
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-022 · governance
- **Descripción:** COMPAT-004: org-baseline.json con schema_version versionado; lector backward-compatible
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-023 · governance/takeover
- **Descripción:** DTS obligatorio para toda documentacion cliente antes de T-3 FA Reverse; GR-CORE-023
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-024 · governance/takeover
- **Descripción:** triangulacion obligatoria contra codigo para afirmaciones con DTS < 0.8; GR-CORE-024
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-025 · governance/takeover
- **Descripción:** Gate GT-3 BLOQUEANTE hasta resolucion documentada de todos los flags DISCREPANCY; GR-CORE-025
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-026 · governance
- **Descripción:** CONTEXT-ISOLATION: sesion SOFIA-CORE vs proyectos gobernados son contextos mutuamente excluyentes. GR-CORE-026
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-027 · takeover/planning
- **Descripción:** T-5 reconcilia con T-4: items S1 postpuestos documentados explicitamente con justificacion antes de cerrar GT-5
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-028 · takeover/process
- **Descripción:** NEEDS-VALIDATION de T-3 generan entradas estructuradas en session.json.needs_validation[] con sprint_target y assignee
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-029 · takeover/process
- **Descripción:** BUILD_UNKNOWN en T-2 genera DEBT-TK automatico verify-build-day1 (0.5 SP, sprint S1, mandatory:true)
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-030 · takeover/process
- **Descripción:** T-5 cierre Sprint 0 sigue checklist BLOQUEANTE: sprint_closed → log → dashboard. GR-CORE-027
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-031 · takeover/governance
- **Descripción:** cmmi_l3_sprint_estimated calculado mecanicamente desde PA_scores de T-4; T-5 consume el valor, nunca lo recalcula indepe
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-032 · takeover/governance
- **Descripción:** open_debts incluye campo compliance:true para deudas legales/regulatorias (AEAT, GDPR, PCI-DSS); activa logica diferente
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-033 · governance
- **Descripción:** desde bank-portal Sprint 23 — Al ejecutar la-sync.js (GR-CORE-029), el Orchestrator aplicó el sync solo en los
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-034 · governance
- **Descripción:** CONTEXT-ISOLATION enforcement: en sesion SOFIA-CORE Continuar=framework; NUNCA leer session.json proyectos; contexto amb
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-035 · governance/git
- **Descripción:** branching model SOFIA no aplicado desde inicio de proyecto -- deuda acumulada en BankPortal (11 ramas huerfanas), Experi
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-036 · infrastructure
- **Descripción:** Binarios generados en contenedor Claude: flujo canonico = generate → present_files → operador descarga → deposita en SOF
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-037 · dashboard
- **Descripción:** datos del dashboard SIEMPRE desde session.json en disco de cada proyecto registrado; nunca desde memoria o conversación 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-038 · testing/configuration
- **Descripción:** Audit @Value sin default obligatorio antes de crear perfil IT; grep exhaustivo previo a primera ejecucion
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-039 · testing/design
- **Descripción:** Fixtures idempotentes ON CONFLICT DO NOTHING con UUIDs fijos para ITs con FK constraints; patron BizumIntegrationTestBas
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-040 · testing/jpa
- **Descripción:** Bulk JPQL UPDATE bypassa Hibernate first-level cache; em.flush()+em.clear() obligatorio antes de findById() en tests @Tr
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-041 · process/frontend
- **Descripción:** Developer Agent debe leer prototipo HTML pantalla a pantalla ANTES de escribir template Angular; verificación previa, no
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-042 · process/frontend
- **Descripción:** Auditar model.ts + service.ts + component.ts antes de escribir template Angular; solo referenciar lo que existe en el .t
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-043 · process/governance
- **Descripción:** LA-023-02 fidelidad prototipo aplica en G-4 como checklist BLOQUEANTE de entrada, no como corrección reactiva tras despl
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-044 · process/devops
- **Descripción:** DevOps Agent Step 7 debe publicar Runbook MD en docs/runbooks/ como entrega BLOQUEANTE en G-7
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-045 · process/documentation
- **Descripción:** Documentation Agent Step 8 debe sincronizar MD fuente a rutas canonicas docs/releases/ y docs/runbooks/; audit CMMI L3 o
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-046 · process/governance
- **Descripción:** Step 9 Workflow Manager: sincronizacion Jira con JQL completo del sprint, nunca rango fijo de keys; checklist G-9 bloque
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-047 · process/dashboard
- **Descripción:** Orchestrator invoca gen-global-dashboard.js tras CADA gate como parte atomica del protocolo de aprobacion; GR-011 bloque
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-048 · process/governance
- **Descripción:** Gate persistencia atomica session.json + validate-fa-index CHECK 8 usa session.current_feature + FA feat field obligator
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-049 · process/fa-agent
- **Descripción:** Step 2b gen-fa-document.py OBLIGATORIO actualizacion FA Word consolidado cada sprint; G-2b bloqueante sin docx
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-050 · ux/process
- **Descripción:** PASO 0 herencia prototipo sprint-a-sprint obligatoria; cp archivo anterior + verificacion token portal real bloqueante G
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-051 · process/governance
- **Descripción:** current_step y pipeline_step escritura atomica obligatoria en cada gate; gate_pending solo valores canonicos GATE_ROLES 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-052 · process/governance
- **Descripción:** Orchestrator no puede auto-aprobar LAs en session.json — la-promote.js + sofia-contribute.py --accept son BLOQUEANTES an
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

### LA-CORE-058 · infrastructure/governance
- **Descripción:** repo-redundancy-via-github-not-onedrive: sistemas críticos SOFIA no pueden depender de OneDrive como única copia redunda
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-059 · process/tooling
- **Descripción:** dashboard-completed-steps-schema: gen-global-dashboard.js asume Array en session.completed_steps pero el schema real es 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-060 · process/tooling
- **Descripción:** mcp-atlassian-sprint-lifecycle-gap: las herramientas MCP Atlassian (searchJiraIssues, transitionJiraIssue) no exponen en
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-061 · process/governance/git
- **Descripción:** working-tree-git-divergence-undetected: Orchestrator arrancó sesión completa sin detectar 842 ficheros borrados del work
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-062 · process/tooling
- **Descripción:** El campo `sprint_history` de `.sofia/session.json` presenta dos schemas incompatibles en el portfolio: dict con keys `sp
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-063 · process/tooling
- **Descripción:** Durante la generacion del dashboard FacturaFlow en FASE 3 de estabilizacion se detectaron dos bugs defensivos relacionad
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-064 · qa/devops/process
- **Descripción:** smoke-test-references-non-existent-endpoint: smoke test aprobado en G-7 con check contra PUT /api/v1/pfm/budgets/{id}/al
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-065 · process/governance/audit
- **Descripción:** gate-history-mixes-pending-and-approved: gate_history mezcla gates HITL aprobados con marcadores -pending del dashboard.
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-066 · process/governance/cmmi
- **Descripción:** cmmi-process-areas-incomplete-declaration: session.cmmi declaraba 9 PAs vs 16 canonicas L3. Schema obligatorio {project:
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-067 · tooling/mcp/recovery
- **Descripción:** mcp-shell-stdio-buffer-limit-large-payloads: MCP shell timeout en payloads >16KB como argumento. Patron: fs.appendFileSy
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-068 · frontend/angular
- **Descripción:** En componentes Angular, usar `[href]` nativo en enlaces internos causa full page reload: el ShellComponent desaparece y 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-070 · takeover/process
- **Descripción:** T-3 FA Reverse Agent produce únicamente artefactos internos del pipeline (fa-index.json, T3-FA-DRAFT.md, T3-FA-GAPS.md).
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-071 · process/governance
- **Descripción:** desde SOFIA-CORE Sprint 1 (orig LA-001-09) — En Sprint S01 Mini A Step 9, el Orchestrator ejecuto la secuencia de cierre
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-072 · process/tooling
- **Descripción:** desde SOFIA-CORE Sprint 1 (orig LA-001-03) — En Sprint S01 Mini A Step 6 Fase 2 (propagacion de LAs reformateadas H3->H2
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-073 · process/atomicity
- **Descripción:** desde SOFIA-CORE Sprint 1 (orig LA-001-04) — En Sprint S01 Mini A Step 6, tras transicionar las issues SC-13 y SC-14 a e
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-075 · governance / tooling / process-isolation
- **Descripción:** create-file-tool-no-persiste-en-disco-real-en-sesiones-sofia-core: Durante la verificación independiente del sub-paso 1.
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-076 · governance/tooling/idempotency
- **Descripción:** Durante el sub-paso 1.2-bis del Sprint S02 Mini B-full Step 1 (registro de LA candidate LA-CORE-075), el entorno de tool
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-077 · governance/decision-archive
- **Descripción:** D3 firmada en S01 cierre acordó archivar Claude Agent SDK como base operativa de SOFIA-CORE.
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-078 · governance/propagation
- **Descripción:** En Sprint S01 Mini A Step 9 (cierre formal G-9), tras ejecutar el merge `feature/sprint-arq-S01-mini-a → develop` (PR #1
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-079 · process/tooling
- **Descripción:** regex-headers-markdown-debe-ser-anchor-explicito-con-negative-lookahead: toda regex sobre artefactos markdown que preten
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-084 · process/protocol/i18n
- **Descripción:** En sesión Step 1 post-G-1 del sprint S02 (2026-04-26), múltiples casos de fricción operativa con Atlassian fueron causad
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-085 · process/protocol/sprint-close
- **Descripción:** Lectura de `.sofia/session.json` al reanudar Step 2 del sprint S02 en chat fresh (2026-04-26T09:40Z) detectó que el cier
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-086 · technical/operational
- **Descripción:** mcp-schema-doc-drift-fallback-to-enum-authoritative: cuando un schema MCP rechaza un valor que la description inline ind
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-087 · process/protocol+workaround
- **Descripción:** Drift estructural conocido del MCP Atlassian para Claude: implementa principalmente la API de Jira Platform (issues) per
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-090 · governance/verification-discipline
- **Descripción:** En sesión Claude del 2026-04-30 (post G-4 sub_bloque_3 cerrado), el PO inicia reflexión meta-protocolo sobre la cantidad
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-091 · process/protocol · meta-regla
- **Descripción:** toda-alteracion-de-LA-debe-usar-flujo-canonico-contributions-JSON: Durante la ejecución de SC-35 (rescate de 3 LAs huérf
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-092 · governance / schema-evolution
- **Descripción:** gr-core-029-scope-clarification-not-applicable-in-core-sessions: Al arrancar Sprint S02 Mini B-full · Step 1 INIT, se de
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-093 · governance/quality-assurance/process-protocol
- **Descripción:** Durante la verificación pre-diseño SC-30 sub-paso 2.3 Step 2 S02 (2026-04-26 ~14:00Z), se descubrió un patrón de DEBT si
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-094 · governance/agent-tier-model/phase-2
- **Descripción:** LA-CORE-074 Fase 1 (Tier A · 6 agentes Opus 4.7) cerrada en SC-41 S03 con persistencia material en MANIFEST.agent_model_
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-095 · governance/quality-assurance/canonical-promotion
- **Descripción:** LA-CORE-093 (S02) define que toda LA promovida al corpus canónico SOFIA-CORE debe estar en 3 lugares sincronizados: (a) 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-096 · technical/operational/macos-pipe-buf
- **Descripción:** Durante SC-39 apply #1 (Step 3 S03 sub-paso 3.3), check post-apply ejecutó subprocess.run(['node','scripts/validate-mani
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-097 · process/governance
- **Descripción:** desde bank-portal Sprint 26 (orig LA-026-04) — MANIFEST.la_core_index acumuló 8 entradas espurias con prefijo de ID loca
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-098 · process/governance/snapshots
- **Descripción:** desde bank-portal Sprint 26 (orig LA-026-05) — El patron 'snapshot pre-update' establecido por phaseABC se trato como ob
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-099 · tooling/testcontainers/docker
- **Descripción:** desde bank-portal Sprint 26 (orig LA-026-08) — Hallazgo lateral durante F.4. Consecuencia mas grave: TODOS los ITs del p
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-100 · tooling/spring-boot/config
- **Descripción:** desde bank-portal Sprint 26 (orig LA-026-07) — El comportamiento Spring Boot YAML profile-specific es no-intuitivo. Docu
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-101 · process/governance/audit
- **Descripción:** desde bank-portal Sprint 26 (orig LA-026-06) — Patron de auditoria insuficiente: grep en archivo objetivo del analisis s
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-102 · governance/configuration-management
- **Descripción:** manifest-scripts-must-stay-bidirectional-with-disk: durante verificación pre-diseño SC-28 sub-paso 2.1 Step 2 S02 (2026-
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

---
_GR-CORE-029: este reporte es evidencia obligatoria de ejecución de la-sync en Step 1._
