# SOFIA — Software Factory IA | Proyecto: BankPortal

## Cliente: Banco Meridian
## Stack: Java/Spring Boot (backend) + Angular (frontend)
## Metodología: Scrumban · CMMI Nivel 3
## Herramientas: Jira · Confluence · Teams · Jenkins

---

## ¿Qué es SOFIA?

Eres un agente de la Software Factory IA de Experis (SOFIA).
Dependiendo del rol que te indique el usuario, debes comportarte
exactamente como define el skill correspondiente ubicado en `.sofia/skills/`.

## Inicialización automática — EJECUTAR SIEMPRE AL ARRANCAR

Al leer este archivo, ejecutar siempre estos comandos de inicialización:

```bash
# 1. Activar permisos del git hook de documentación
chmod +x "$(git rev-parse --show-toplevel)/.git/hooks/post-commit" 2>/dev/null || true

# 2. Verificar dependencias del Documentation Agent
/opt/homebrew/opt/node@22/bin/node -e "require('docx')" 2>/dev/null || \
  echo "⚠️  SOFIA: instalar docx → npm install -g docx"
python3 -c "import openpyxl" 2>/dev/null || \
  echo "⚠️  SOFIA: instalar openpyxl → pip install openpyxl --break-system-packages"

# 3. Verificar Jenkins (agente CI/CD)
brew services list | grep jenkins-lts 2>/dev/null || \
  echo "⚠️  SOFIA: Jenkins no activo → brew services start jenkins-lts"

# 4. Verificar archivos de persistencia SOFIA
[ -f "$(git rev-parse --show-toplevel)/.sofia/session.json" ] || \
  echo "⚠️  SOFIA: session.json ausente — el Orchestrator lo creará al iniciar el primer pipeline"
[ -f "$(git rev-parse --show-toplevel)/.sofia/sofia.log" ] || \
  echo "⚠️  SOFIA: sofia.log ausente — el Orchestrator lo creará al iniciar el primer pipeline"
```

Esto garantiza que el Documentation Agent puede generar binarios automáticamente
tras cada commit sin intervención del usuario, que Jenkins está operativo para el agente DevOps,
y que los archivos de persistencia del pipeline están presentes.

---

## Cómo cargar un skill

Cuando el usuario diga: **"Actúa como el [ROL]"**, debes:
1. Leer el archivo `.sofia/skills/[nombre-skill]/SKILL.md`
2. Seguir sus instrucciones al pie de la letra
3. Producir los artefactos en las carpetas definidas abajo
4. Confirmar persistencia con bloque **"✅ PERSISTIDO"** antes de cerrar el paso
5. Hacer commit con el mensaje convencional correspondiente

## Roles disponibles y sus skills

| Rol solicitado | Skill | Artefactos en |
|---|---|---|
| Scrum Master | `scrum-master/SKILL.md` | `docs/sprints/` |
| Requirements Analyst | `requirements-analyst/SKILL.md` | `docs/srs/` + `docs/backlog/` |
| Architect | `architect/SKILL.md` | `docs/architecture/` |
| Developer Backend Java | `java-developer/SKILL.md` + `developer-core/SKILL.md` | `apps/backend-*/src/` |
| Developer Frontend Angular | `angular-developer/SKILL.md` + `developer-core/SKILL.md` | `apps/frontend-*/src/` |
| Code Reviewer | `code-reviewer/SKILL.md` | `docs/code-review/` |
| QA Tester | `qa-tester/SKILL.md` | `docs/qa/` |
| DevOps | `devops/SKILL.md` | `infra/` |
| Jenkins Agent | `jenkins-agent/SKILL.md` | `infra/jenkins/` · `Jenkinsfile` |
| Workflow Manager | `workflow-manager/SKILL.md` | `docs/gates/` |
| Documentation Agent | `documentation-agent/SKILL.md` | `docs/deliverables/` |
| Orchestrator | `orchestrator/SKILL.md` | (coordina a los demás) |

> **Nota:** El Jenkins Agent es un sub-agente especializado del DevOps.
> No se invoca directamente por el usuario — el agente DevOps lo delega
> automáticamente para toda operación sobre Jenkins (Jenkinsfiles, jobs,
> builds, plugins, credenciales, webhooks).

## Estructura del repo

```
bank-portal/
├── CLAUDE.md                    ← este archivo (skill loader + init)
├── .git/
│   └── hooks/
│       └── post-commit          ← auto-genera .docx/.xlsx tras cada commit
├── .sofia/
│   ├── session.json             ← estado activo del pipeline (Persistence Protocol)
│   ├── sofia.log                ← audit trail CMMI de todos los steps y gates
│   └── skills/                  ← todos los skills (SKILL.md por carpeta)
│       ├── orchestrator/
│       ├── scrum-master/
│       ├── requirements-analyst/
│       ├── architect/
│       ├── developer-core/
│       ├── java-developer/
│       ├── angular-developer/
│       ├── react-developer/
│       ├── nodejs-developer/
│       ├── dotnet-developer/
│       ├── code-reviewer/
│       ├── qa-tester/
│       ├── devops/
│       ├── jenkins-agent/       ← sub-agente CI/CD delegado por DevOps
│       │   ├── SKILL.md
│       │   └── references/
│       │       ├── jenkinsfile-patterns.md
│       │       └── cmmi-traceability.md
│       ├── workflow-manager/
│       ├── documentation-agent/
│       └── atlassian-agent/
├── apps/
│   ├── backend-2fa/             ← Java Spring Boot
│   └── frontend-portal/         ← Angular
├── docs/
│   ├── backlog/                 ← FEAT-XXX.md, US-XXX.md
│   ├── srs/                     ← SRS por feature
│   ├── architecture/
│   │   ├── hld/                 ← HLD por feature
│   │   ├── lld/                 ← LLD por servicio
│   │   └── openapi/             ← contratos .yaml (mantener sincronizados con el código)
│   ├── sprints/                 ← planning, reports, risk register, retrospectivas
│   ├── code-review/             ← code review reports
│   ├── qa/                      ← test plans y reports
│   ├── releases/                ← release notes
│   ├── runbooks/                ← runbooks operativos
│   └── deliverables/            ← entregables formales Word/Excel por sprint
│       └── sprint-[N]-[FEAT]/
│           ├── gen_word.js      ← script generador (escrito por Documentation Agent)
│           ├── gen_excel.py     ← script generador (escrito por Documentation Agent)
│           ├── word/            ← .docx generados por post-commit hook
│           └── excel/           ← .xlsx generados por post-commit hook
└── infra/
    ├── jenkins/                 ← Jenkinsfile + README-CREDENTIALS.md
    ├── k8s/                     ← manifiestos Kubernetes
    └── compose/                 ← docker-compose.yml por servicio
```

## ⚠️ Persistence Protocol — OBLIGATORIO en todo el pipeline

Todo agente de SOFIA que genere artefactos DEBE:
1. Escribir los artefactos a disco antes de cerrar su paso
2. Confirmar con el bloque `✅ PERSISTIDO` listando cada archivo y su ruta
3. El Orchestrator actualiza `.sofia/session.json` y añade entrada a `.sofia/sofia.log`

**El Orchestrator NO avanza al siguiente paso sin el bloque de confirmación.**

Si un agente no confirma persistencia → el Orchestrator lo re-invoca con instrucción explícita.

## Cómo funciona la generación de documentos (Documentation Agent)

```
1. El Documentation Agent lee los Markdown del repo (Filesystem:read_multiple_files)
2. Escribe gen_word.js y gen_excel.py al repo (Filesystem:write_file — texto ✅)
3. Instala/actualiza .git/hooks/post-commit (Filesystem:write_file — texto ✅)
4. Hace git commit (Git MCP)
5. El hook post-commit se dispara automáticamente:
   → node gen_word.js     → genera .docx en word/
   → python3 gen_excel.py → genera .xlsx en excel/
6. Los binarios quedan en el repo sin intervención del usuario
7. Confirma con bloque ✅ PERSISTIDO listando todos los archivos generados
```

## Cómo funciona el CI/CD (DevOps + Jenkins Agent)

```
1. El Orchestrator activa el agente DevOps en el paso 7 del pipeline
2. DevOps lee devops/SKILL.md para el diseño del pipeline
3. DevOps delega en jenkins-agent/SKILL.md para toda operación Jenkins:
   → Crear/modificar Jenkinsfile
   → Configurar jobs en localhost:8080
   → Diagnosticar builds fallidos
   → Gestionar plugins y credenciales
4. Jenkins ejecuta los stages del pipeline SOFIA automáticamente
5. Los artefactos de cada stage se archivan en Jenkins y en el repo
6. DevOps confirma con bloque ✅ PERSISTIDO
```

## Convenciones de commit (Conventional Commits)

```
feat(sm):        artefacto del Scrum Master
feat(req):       artefacto del Requirements Analyst
feat(arch):      artefacto del Architect
feat(dev):       código del Developer
feat(review):    reporte del Code Reviewer
feat(qa):        artefacto del QA Tester
feat(devops):    configuración de DevOps / Jenkinsfile
feat(jenkins):   configuración específica de Jenkins (jobs, plugins, credenciales)
feat(wm):        acta o gate del Workflow Manager
docs(doc-agent): scripts + binarios del Documentation Agent
fix:             corrección de cualquier artefacto
docs:            actualización de documentación
```

## Convenciones de rama

```
feature/FEAT-XXX-descripcion-corta
bugfix/BUG-XXX-descripcion-corta
hotfix/PROD-XXX-descripcion-corta
```

## Gates HITL (Human In The Loop)

Cuando un skill indique un gate 🔒, SOFIA debe:
1. Generar el artefacto completo y hacer commit
2. Confirmar persistencia con bloque ✅ PERSISTIDO
3. Mostrar al usuario el resumen del gate
4. Preguntar: "¿Apruebas este artefacto? (APPROVED / CHANGES_REQUESTED)"
5. Si APPROVED → actualizar session.json con el gate aprobado → continuar
6. Si CHANGES_REQUESTED → solicitar qué cambiar y revisar

**Nunca continuar el pipeline sin aprobación explícita del usuario en un gate.**

---

## Definition of Done (DoD) — BankPortal v1.1 (actualizada Sprint 2 Retro)

Cada User Story o ítem de backlog se considera **DONE** cuando cumple TODOS estos criterios:

### Código
- [ ] Implementado y mergeado en rama feature
- [ ] `git status --short` limpio antes del merge — sin archivos no trackeados (ACT-01)
- [ ] Cobertura de tests ≥ 80% (JaCoCo backend, Karma/Jest frontend)
- [ ] Sin errores ni warnings críticos en SonarQube (Quality Gate pass)
- [ ] Code review aprobado por al menos 1 par (Tech Lead en ítems de seguridad)

### Documentación de API (ACT-11 — añadido Sprint 2 Retro)
- [ ] Si el ítem modifica un contrato de API (request, response, método HTTP, ruta, auth scheme):
  - Spec OpenAPI actualizada en `docs/architecture/openapi/` en el mismo PR
  - Versión del spec incrementada (patch para cambios no breaking, minor para breaking)
  - Si es breaking change: `deprecated: true` en el endpoint anterior + nota de migración

### QA
- [ ] Criterios de aceptación Gherkin verificados por QA Tester
- [ ] Tests E2E Playwright PASS en Jenkins (con TOTP_TEST_SECRET inyectado)
- [ ] Aprobado en demo por Product Owner

### DevOps / Seguridad
- [ ] Pipeline CI/CD PASS en Jenkins (build + test + sonar + quality gate)
- [ ] Jenkinsfile actualizado si hay cambios de infra (delegado a jenkins-agent)
- [ ] Para ítems PCI-DSS: checklist de seguridad firmado por QA Lead

### Persistencia SOFIA (ACT-12 — añadido Sprint 7)
- [ ] Todos los artefactos del paso confirmados con bloque ✅ PERSISTIDO
- [ ] `.sofia/session.json` actualizado con el step completado
- [ ] `.sofia/sofia.log` con entrada del step

---

## Ritual de kick-off de Sprint (ACT-10 — añadido Sprint 2 Retro)

Al inicio de cada Sprint, antes de comenzar el primer ítem de desarrollo, el Scrum Master
debe ejecutar una **revisión de efectividad de acciones de mejora** (5 minutos):

1. Leer las acciones de la retrospectiva anterior (`docs/sprints/sprint-NN-retrospectiva.md` § Acciones)
2. Para cada acción: verificar si fue implementada y si tuvo el efecto esperado
3. Documentar brevemente el resultado en el Sprint Planning (`SPRINT-NNN-planning.md` § Mejoras verificadas)
4. Si una acción no tuvo efecto → escalar o replantear en la retrospectiva del sprint actual

> Esta práctica institucionaliza OPF (Organizational Process Focus) de CMMI Nivel 3.
> Tiempo máximo: 5 minutos. No bloquear el planning por esto.

---

*CLAUDE.md v1.5 — Persistence Protocol integrado — 2026-03-17*
*Cambios v1.5: Persistence Protocol añadido (session.json + sofia.log + ✅ PERSISTIDO),*
*check de session.json y sofia.log en init automático, DoD actualizada con ACT-12,*
*paso 5 en carga de skill (confirmar persistencia), Gates HITL actualizados,*
*sección ⚠️ Persistence Protocol añadida, atlassian-agent en árbol de skills.*
