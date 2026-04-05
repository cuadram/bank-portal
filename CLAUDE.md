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
   - Steps completados: [lista]
   - Steps pendientes: [lista]
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

## Skills activos

- Backend:  java-developer
- Frontend: angular-developer

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
   8b FA-Agent (AUTO) — validate-fa-index + gen-fa-document + validate-fa-completeness
9  Workflow Manager G-9 — Jira+Confluence+Dashboard+LESSONS_LEARNED
```

## Uso de sofia-shell

**SIEMPRE pasar cwd absoluto** de este proyecto (o sin cwd — es el proyecto por defecto):

```
sofia-shell:run_command(
  command="<comando>",
  cwd="/Users/cuadram/proyectos/bank-portal"
)
```

Comandos permitidos: node, npm, npx, python3, ls, cat, mkdir, cp, mv, rm, find, grep, echo

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
- FA-Agent Gate 8b: validate-fa-completeness.py OBLIGATORIO post-docx
- Doc Agent: 17 DOCX + 3 XLSX REALES (nunca .md como entregable — LA-022-08)
- Paquete raíz Java: com.experis.sofia.bankportal (nunca es.meridian)
- forkJoin + catchError: SIEMPRE of([]) nunca EMPTY (LA-STG-001)
- Angular: route + nav item en mismo step que el módulo (LA-FRONT-001)
- Flyway seeds con UUIDs: ON CONFLICT (id) DO NOTHING (LA-022-09)

## FA-Agent — Análisis Funcional

```
Documento único incremental: docs/functional-analysis/FA-BankPortal-Banco-Meridian.docx
Índice:   docs/functional-analysis/fa-index.json
Script:   .sofia/scripts/gen-fa-document.py
Validar:  node .sofia/scripts/validate-fa-index.js
NC Gate 8b: python3 .sofia/scripts/validate-fa-completeness.py
```

## SOFIA-CORE

Framework: /Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE
