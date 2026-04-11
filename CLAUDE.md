# SOFIA v2.6 — Software Factory IA de Experis
# Proyecto: bank-portal | Cliente: Banco Meridian
# SOFIA_REPO=/Users/cuadram/proyectos/bank-portal

---

## IDENTIDAD DEL PROYECTO — LEER PRIMERO

**SOFIA_REPO=/Users/cuadram/proyectos/bank-portal**

**REGLA ABSOLUTA GR-CORE-003:** Todo fichero generado o modificado DEBE empezar por SOFIA_REPO.
Si no → DETENER y pedir confirmación explícita.

---

## INIT — Ejecutar SIEMPRE al abrir este proyecto

```
PASO 0 — GR-014: verificar que sofia-shell apunta a este proyecto
  sofia-shell:run_command(
    command="python3 -c \"import os,json; s=json.load(open('.sofia/session.json')); print('PROYECTO:',s.get('project')); print('CWD:',os.getcwd())\"",
    cwd="/Users/cuadram/proyectos/bank-portal"
  )
  Resultado esperado: PROYECTO: bank-portal | CWD: /Users/cuadram/proyectos/bank-portal
  Si no coincide → DETENER. No continuar hasta resolver.

PASO 1 — Leer estado desde DISCO (LA-018-01 — NUNCA desde memoria)
  sofia-shell:run_command(
    command="python3 -c \"import json; s=json.load(open('.sofia/session.json')); print(json.dumps({k:s[k] for k in ['project','status','current_sprint','current_feature','current_step','completed_steps','pending_steps','gate_pending']}, indent=2))\"",
    cwd="/Users/cuadram/proyectos/bank-portal"
  )

PASO 2 — Verificar coherencia SOFIA_REPO
  session.json.sofia_repo == SOFIA_REPO
  sofia-config.json.sofia_repo == SOFIA_REPO
  Si no coinciden → DETENER: 'CONFLICTO SOFIA_REPO'

PASO 3 — Decidir flujo según status en disco
  status == "in_progress"   → RESUME PROTOCOL (ver abajo)
  status == "sprint_closed" → Informar estado y esperar solicitud de Sprint N+1
  status == "idle"          → Esperar solicitud del usuario
```

## RESUME PROTOCOL — status == in_progress

```
1. Leer session.json desde disco (ya hecho en INIT)
2. Reportar estado exacto:
   - Sprint N | Feature FEAT-XXX | Step actual: [X]
   - Steps completados: [lista] / Steps pendientes: [lista]
   - Gate pendiente: [gate o null]
   - FA: doc_version, nc_verdict
3. Si gate_pending != null → solicitar aprobación antes de avanzar
4. NO asumir estado desde contexto de sesión anterior — siempre disco
```

---

## Stack

- Backend:  Java 21 / Spring Boot 3.3.4
- Frontend: Angular 17
- BD:       PostgreSQL 16 / Redis 7
- Jira:     SCRUM | Confluence: SOFIA (spaceId: 393220)
- Cloud ID: 8898340d-94ed-45c2-8831-395d407a4e77
- Paquete raíz Java: **com.experis.sofia.bankportal** (nunca es.meridian)

## Skills activos

- Backend:  java-developer
- Frontend: angular-developer

---

## Pipeline v2.6 — 17 steps — 21 agentes — CMMI L3

```
1  Scrum Master     G-1 (PO)
2  Requirements     G-2 (PO)    2b FA-Agent (AUTO)   2c UX/UI (HITL-PO-TL)
3  Architect        G-3 (TL)    3b FA-Agent+Docs (AUTO)
4  Developer        G-4b (mvn build + ng build verificados)
5  Code Reviewer    G-5 (TL)    5b Security (AUTO)
6  QA Tester        G-6 (QA+PO)
7  DevOps           G-7 (RM)
8  Documentation    G-8 (PM) — 17 DOCX + 3 XLSX
   8b FA-Agent (AUTO)
9  Workflow Manager G-9 — Jira+Confluence+Dashboard+LESSONS_LEARNED
```

---

## ⚠️ PROTOCOLO OBLIGATORIO — STEP 8b (FA-Agent Gate 8b)

**NUNCA ejecutar Step 8b sin seguir estos 5 pasos en orden estricto.**
Leer .sofia/skills/fa-agent/SKILL.md para detalle completo.

```
PASO 1 — validate-fa-index.js (BLOQUEANTE)
  sofia-shell:run_command(
    command="node .sofia/scripts/validate-fa-index.js",
    cwd="/Users/cuadram/proyectos/bank-portal"
  )
  EXIT != 0 → corregir antes de continuar. No avanzar.

PASO 2 — Marcar FA del sprint como DELIVERED
  En fa-index.json: status de todas las FA del sprint actual PLANNED → DELIVERED
  Verificar: fa-index.total_business_rules == len(fa-index.business_rules)

PASO 3 — Generar documento Word
  sofia-shell:run_command(
    command="python3 .sofia/scripts/gen-fa-document.py",
    cwd="/Users/cuadram/proyectos/bank-portal"
  )
  Verificar post-ejecución (BLOQUEANTE):
    sofia-shell:run_command(
      command="python3 -c \"import os,time; p='docs/functional-analysis/FA-BankPortal-Banco-Meridian.docx'; print('OK' if os.path.exists(p) and os.path.getsize(p)>10240 and time.time()-os.path.getmtime(p)<120 else 'FAIL')\"",
      cwd="/Users/cuadram/proyectos/bank-portal"
    )

PASO 4 — validate-fa-completeness.py (SIEMPRE OBLIGATORIO — nunca omitir)
  sofia-shell:run_command(
    command="python3 .sofia/scripts/validate-fa-completeness.py",
    cwd="/Users/cuadram/proyectos/bank-portal"
  )
  Genera: docs/quality/NC-FA-Sprint{N}-{fecha}.md
  EXIT 0 → sin bloqueantes → Gate 8b puede aprobarse
  EXIT 1 → PRESENTAR INFORME NC AL PO y esperar decisión antes de continuar

PASO 5 — Actualizar session.json
  fa_agent.last_gate = "8b"
  fa_agent.docx_verified = true
  fa_agent.doc_version = [versión generada]
  fa_agent.docx_size_kb = [tamaño]
  fa_agent.nc_verdict = [CONFORME|NO_CONFORME]
  fa_agent.nc_report = "docs/quality/NC-FA-Sprint{N}-{fecha}.md"
  completed_steps: añadir "8b"
  pending_steps: eliminar "8b"
```

### Bloque ✅ obligatorio Gate 8b

```
✅ PERSISTENCE CONFIRMED — FA_AGENT GATE-8b
- validate-fa-index.js: PASS 8/8 ✅
- FA-XXX..YYY: PLANNED → DELIVERED ✅
- gen-fa-document.py: EXIT 0 ✅
  · doc_version: [X.Y] · docx_size_kb: [X.X] · mtime_reciente: true
- validate-fa-completeness.py: EXIT [0|1]
  · NCs bloqueantes: [N] · NCs mayores: [N] · NCs menores: [N]
  · Informe NC: docs/quality/NC-FA-Sprint{N}-{fecha}.md
  · Decisión PO: [CONFORME | DEUDA-FA-{N+1} | ACEPTADO]
- session.json actualizado: fa_agent.last_gate=8b, nc_verdict=[...] ✅
```

---

## ⚠️ PROTOCOLO OBLIGATORIO — STEP 9 (Workflow Manager)

```
PASO 1 — Regenerar LESSONS_LEARNED.md
  sofia-shell:run_command(command="python3 .sofia/scripts/gen-lessons-learned.py", cwd="SOFIA_REPO")

PASO 2 — Regenerar Dashboard global
  sofia-shell:run_command(command="node .sofia/scripts/gen-global-dashboard.js --gate G-9 --step 9", cwd="SOFIA_REPO")

PASO 3 — Sincronizar Jira: issues del sprint → Finalizada
  Atlassian MCP: transicionar cada issue SCRUM-XXX → {'id':'31'}

PASO 4 — Publicar resultados en Confluence
  Crear/actualizar página Sprint N Resultados (parentId: 98309)

PASO 5 — Cerrar sprint en session.json
  status="sprint_closed", sprint_closed=true, completed_steps+="9", pending_steps=[]
```

---

## Uso de sofia-shell

cwd por defecto es este proyecto (bank-portal). Para comandos cortos se puede omitir cwd:

```
sofia-shell:run_command(command="<comando>")
```

## Guardrails activos

- GR-CORE-003: SOFIA_REPO verificado en INIT y antes de cada escritura
- GR-014: sofia-shell verify-before-use — paso 0 de cada sesión
- GR-010: CVSS>=4.0 vencido bloquea G-9
- GR-011: Dashboard regenerado en cada gate (gen-global-dashboard.js)
- GR-012: Step 3b OBLIGATORIO post G-3
- GR-013: verify-persistence.js BLOQUEANTE en cada step
- GR-016: Application handlers NO importan Infrastructure (Clean Architecture)

## Reglas críticas

- Nunca auto-aprobar un gate HITL
- Leer session.json desde DISCO en cada sesión (LA-018-01) — nunca desde memoria
- Gate 8b: 5 pasos OBLIGATORIOS — nunca omitir validate-fa-completeness.py
- Doc Agent: 17 DOCX + 3 XLSX REALES (nunca .md — LA-022-08)
- Paquete raíz Java: com.experis.sofia.bankportal (nunca es.meridian — LA-020-09)
- forkJoin + catchError: SIEMPRE of([]) nunca EMPTY (LA-STG-001)
- Angular: route + nav item en mismo step que el módulo (LA-FRONT-001)
- Flyway seeds con UUIDs: ON CONFLICT (id) DO NOTHING (LA-022-09)

## FA-Agent

```
Documento: docs/functional-analysis/FA-BankPortal-Banco-Meridian.docx
Índice:    docs/functional-analysis/fa-index.json
Skills:    .sofia/skills/fa-agent/SKILL.md (leer para detalle completo)
```

## SOFIA-CORE

Framework: /Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE
