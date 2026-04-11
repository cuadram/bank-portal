#!/usr/bin/env python3
"""
sofia-wizard.py -- SOFIA v2.6.11
Setup wizard interactivo. Crea SOFIA_REPO con estructura canonica y FA-Agent listo.

Uso:
  python3 sofia-wizard.py                   <- nuevo proyecto
  python3 sofia-wizard.py ~/ruta/proyecto   <- path explicito
  python3 sofia-wizard.py ~/ruta/X --update <- actualizar existente

LA-CORE-002: realpath -- nunca aliases Finder macOS.
LA-CORE-003: SOFIA_REPO explicito en CLAUDE.md y session.json.
LA-CORE-004: repo-template copiado al crear proyecto -- estructura canonica desde inicio.
LA-CORE-008: gen-fa-document.py y fa-index.json inicializados en onboarding.
             El error de FA por sprint nunca puede ocurrir en proyectos nuevos.
             Verificacion post-instalacion bloqueante si el script no existe o es incorrecto.
"""

import os, sys, json, datetime, shutil

SOFIA_CORE   = os.path.realpath(os.path.expanduser("~/OneDrive/WIP/SOFIA-CORE"))
ONEDRIVE_WIP = os.path.realpath(os.path.expanduser("~/OneDrive/WIP"))

_repo_arg = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None
UPDATE    = "--update" in sys.argv
REPO      = os.path.realpath(os.path.expanduser(_repo_arg)) if _repo_arg else None
CFG       = None
SESSION   = None
REGISTRY  = os.path.expanduser("~/.sofia/projects.json")

GREEN  = "\033[0;32m"; YELLOW = "\033[1;33m"; RED   = "\033[0;31m"
BLUE   = "\033[0;34m"; BOLD   = "\033[1m";    RESET = "\033[0m"

def ask(prompt, default="", required=False):
    hint = (" [" + default + "]") if default else ""
    while True:
        val = input("  " + prompt + hint + ": ").strip()
        if not val and default: return default
        if val: return val
        if not required: return ""
        print("  " + RED + "Campo obligatorio." + RESET)

def ask_list(prompt, options, default=None):
    print("  " + prompt)
    for i, opt in enumerate(options, 1):
        marker = " <-- defecto (Enter)" if opt == default else ""
        print("    [" + str(i) + "] " + opt + marker)
    raw = input("  Seleccion (numero/s, ej: 2 o 1 3): ").strip()
    if not raw:
        selected = [default] if default else [options[0]]
        print("  -> Usando defecto: " + ", ".join(selected))
        return selected
    choices = raw.split()
    result = []
    for c in choices:
        try:
            idx = int(c)
            if 1 <= idx <= len(options): result.append(options[idx - 1])
        except ValueError: pass
    if not result:
        selected = [default] if default else [options[0]]
        print("  -> Entrada invalida, usando defecto: " + ", ".join(selected))
        return selected
    print("  -> Seleccionado: " + ", ".join(result))
    return result

def ask_yn(prompt, default=True):
    hint = " [S/n]" if default else " [s/N]"
    val = input("  " + prompt + hint + ": ").strip().lower()
    if not val: return default
    return val in ("s", "si", "y", "yes")

def section(title):
    print(); print(BOLD + "  --- " + title + " ---" + RESET)

def now():
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

if not os.path.isdir(SOFIA_CORE):
    print(RED + "ERROR: SOFIA-CORE no encontrado en " + SOFIA_CORE + RESET)
    sys.exit(1)

print()
print(BOLD + "==========================================================" + RESET)
print(BOLD + "   SOFIA v2.6.11 -- Setup Wizard                        " + RESET)
print(BOLD + "==========================================================" + RESET)
print("  SOFIA-CORE: " + BLUE + SOFIA_CORE + RESET)
print("  Base WIP:   " + BLUE + ONEDRIVE_WIP + RESET)
print()

section("1. Proyecto")
_default_name = os.path.basename(REPO) if REPO else ""
project     = ask("Nombre del proyecto", _default_name, required=True)
client      = ask("Cliente / empresa", "Experis", required=True)
description = ask("Descripcion breve", "")

# SOFIA_REPO canonico (LA-CORE-002 + LA-CORE-003)
if REPO is None:
    REPO = os.path.join(ONEDRIVE_WIP, project.lower().replace(" ", "-"))
REPO    = os.path.realpath(REPO)
CFG     = os.path.join(REPO, ".sofia", "sofia-config.json")
SESSION = os.path.join(REPO, ".sofia", "session.json")
os.makedirs(REPO, exist_ok=True)
print("  -> SOFIA_REPO: " + GREEN + REPO + RESET)

existing = {}
if UPDATE and CFG and os.path.isfile(CFG):
    try:
        existing = json.load(open(CFG))
        print(YELLOW + "  Modo actualizacion" + RESET)
    except Exception: pass

section("2. Stack tecnologico")
ex_stack = existing.get("stack", {})
print("  Backend:")
backend_opts = ["java", "dotnet", "nodejs", "python", "go"]
backend = ask_list("Selecciona backend(s):", backend_opts,
                   ex_stack.get("backend", ["java"])[0] if ex_stack.get("backend") else "java")
print(); print("  Frontend:")
frontend_opts = ["angular", "react", "vue", "none"]
frontend = ask_list("Selecciona frontend(s):", frontend_opts,
                    ex_stack.get("frontend", ["angular"])[0] if ex_stack.get("frontend") else "none")
frontend = [f for f in frontend if f != "none"]
print(); print("  Base de datos:")
db_opts = ["postgresql", "mysql", "mongodb", "redis", "sqlserver", "oracle"]
database = ask_list("Selecciona BD(s):", db_opts,
                    ex_stack.get("database", ["postgresql"])[0] if ex_stack.get("database") else "postgresql")
print(); print("  Infraestructura:")
infra_opts = ["docker", "jenkins", "kubernetes", "github-actions", "gitlab-ci"]
infra = ask_list("Selecciona infra:", infra_opts,
                 ex_stack.get("infra", ["docker"])[0] if ex_stack.get("infra") else "docker")

section("3. Atlassian (Jira + Confluence)")
ex_jira = existing.get("jira", {}); ex_conf = existing.get("confluence", {})
jira_key  = ask("Jira project key (ej: XTRK, SCRUM, BP)", ex_jira.get("project_key", ""), required=True)
cloud_id  = ask("Atlassian Cloud ID (UUID)", ex_jira.get("cloud_id", ""))
space_key = ask("Confluence space key", ex_conf.get("space_key", project.upper().replace("-","")[:12]))
space_id  = ask("Confluence space ID (numerico)", str(ex_conf.get("space_id", "")))
parent_id = ask("Confluence parent page ID", str(ex_conf.get("parent_page_id", "")))
atl_sync  = ask_yn("Activar sincronizacion automatica Jira/Confluence?",
                    existing.get("pipeline", {}).get("atlassian_sync", True))

section("4. Roles del equipo (Enter para omitir)")
ex_roles = existing.get("team_roles", {})
roles = {
    "product_owner":   ask("Product Owner",    ex_roles.get("product_owner", "")),
    "tech_lead":       ask("Tech Lead",        ex_roles.get("tech_lead", "")),
    "scrum_master":    ask("Scrum Master",     ex_roles.get("scrum_master", "")),
    "qa_lead":         ask("QA Lead",          ex_roles.get("qa_lead", "")),
    "release_manager": ask("Release Manager",  ex_roles.get("release_manager", "")),
    "pm":              ask("Project Manager",  ex_roles.get("pm", "")),
    "security_team":   ask("Security Team",    ex_roles.get("security_team", "security-team")),
    "client_contact":  ask("Contacto cliente", ex_roles.get("client_contact", "")),
}

section("5. Metodologia")
ex_meth = existing.get("methodology", {})
sprint_len = int(ask("Duracion sprint (dias)", str(ex_meth.get("sprint_length_days", 14))) or "14")
vel_ref    = int(ask("Velocidad referencia (SP/sprint)", str(ex_meth.get("velocity_reference_sp", 24))) or "24")
cov_thr    = int(ask("Cobertura minima tests (%)", str(existing.get("quality", {}).get("coverage_threshold", 80))) or "80")

section("6. Pipeline y agentes")
ex_pipe = existing.get("pipeline", {})
gates_on    = ask_yn("Activar gate enforcement?",             ex_pipe.get("gates_enabled", True))
security_on = ask_yn("Activar Security Agent (step 5b)?",    ex_pipe.get("optional_steps", {}).get("5b", True))
perf_on     = ask_yn("Activar Performance Agent (step 7b)?", ex_pipe.get("optional_steps", {}).get("performance", False))
fa_on       = ask_yn("Activar FA-Agent (steps 2b, 3b, 8b)?", ex_pipe.get("fa_agent_enabled", True))
auto_dash   = ask_yn("Dashboard global en cada gate?",        ex_pipe.get("auto_dashboard", True))

ts = now()
config = {
    "_comment": "SOFIA v2.6.11 -- SOFIA_REPO=" + REPO,
    "sofia_version": "2.6",
    "project": project, "client": client, "project_description": description,
    "sofia_repo": REPO,
    "created_at": existing.get("created_at", ts), "updated_at": ts,
    "stack": {"backend": backend, "frontend": frontend, "database": database,
              "messaging": ex_stack.get("messaging", []), "infra": infra},
    "methodology": {"type": "scrumban", "sprint_length_days": sprint_len,
                    "velocity_reference_sp": vel_ref, "estimation_unit": "story_points"},
    "team_roles": roles,
    "jira": {"project_key": jira_key, "cloud_id": cloud_id,
             "sprint_board_id": ex_jira.get("sprint_board_id"),
             "gate_label": "sofia-gate", "nc_label": "sofia-nc"},
    "confluence": {"space_key": space_key,
                   "space_id": int(space_id) if space_id.isdigit() else space_id,
                   "parent_page_id": int(parent_id) if parent_id.isdigit() else parent_id},
    "pipeline": {
        "active_steps": ["1","2","2b","2c","3","3b","4","5","5b","6","7","8","8b","9"],
        "optional_steps": {"5b": security_on, "performance": perf_on, "5c": False, "7b": perf_on},
        "gates_enabled": gates_on, "atlassian_sync": atl_sync,
        "auto_dashboard": auto_dash, "fa_agent_enabled": fa_on, "pipeline_steps_total": 17
    },
    "quality": {"coverage_threshold": cov_thr, "max_cve_high": 3,
                "max_cve_critical": 0, "cmmi_level": 3},
    "paths": {"repo": REPO, "node": "/opt/homebrew/opt/node@22/bin/node",
              "npx": "/opt/homebrew/opt/node@22/bin/npx", "python3": "/usr/bin/python3",
              "uvx": "uvx", "docs": "docs", "src": "src", "infra": "infra",
              "deliverables": "docs/deliverables",
              "functional_analysis": "docs/functional-analysis"},
    "document_style": {"language": "es", "corporate_color": "1B3A6B",
                       "font": "Arial", "paper": "A4"},
    "dashboard": {"generator": ".sofia/scripts/gen-global-dashboard.js",
                  "output": "docs/dashboard/global-dashboard.html",
                  "gate_pending_normalize": True, "parsearg_supports_equals": True},
    "fa_agent": {"enabled": fa_on, "skill_version": "2.6", "generator": "python-docx",
                 "script": ".sofia/scripts/gen-fa-document.py",
                 "output_dir": "docs/functional-analysis", "index_file": "fa-index.json",
                 "toc_clickable": True, "toc_mechanism": "w:hyperlink+w:anchor",
                 "pattern": "LA-FA-INCR+LA-TOC-CLICK", "core_version": "2.6.11",
                 "gates": ["2b", "3b", "8b"]},
    "workflow_directives": {
        "version": ts[:10], "persist_all_artifacts": True,
        "read_disk_on_continue": True, "gates_explicit_approval": True,
        "gates_jira_confluence_sync": True, "test_evidence_logs_required": True,
        "dashboard_standard": "SOFIA-v1.9+", "all_deliverables_mandatory": True,
        "dashboard_on_every_gate": auto_dash, "lessons_learned_mandatory": True,
        "step_3b_mandatory_post_g3": True, "doc_agent_binaries_required": True,
        "sofia_repo_explicit_in_claude_md": True, "gr_core_003_project_isolation": True,
        "canonical_structure_from_template": True
    },
    "agents": {"total": 23, "active_skills": 21},
    "guardrails": {"version": "1.4", "script": ".sofia/scripts/guardrail-pre-gate.js",
                   "checks_total": 13,
                   "gr_core_001": "MCP merge -- nunca sobreescribir claude_desktop_config.json",
                   "gr_core_002": "realpath en paths MCP -- nunca aliases macOS",
                   "gr_core_003": "SOFIA_REPO verificado en INIT -- nunca escribir fuera"},
    "sofia_core": SOFIA_CORE
}

print()
print(BOLD + "  --- Resumen ---" + RESET)
print("  Proyecto:    " + client + " / " + project)
print("  SOFIA_REPO:  " + BLUE + REPO + RESET)
print("  Backend:     " + ", ".join(backend))
print("  Frontend:    " + (", ".join(frontend) if frontend else "ninguno"))
print("  BD:          " + ", ".join(database))
print("  Jira:        " + jira_key + "  |  Confluence: " + space_key)
print("  Sprint:      " + str(sprint_len) + " dias  |  Velocidad: " + str(vel_ref) + " SP")
print()

confirm = ask_yn("Guardar configuracion e instalar skills?", True)
if not confirm:
    print(YELLOW + "  Cancelado." + RESET); sys.exit(0)

# -- Guardar sofia-config.json -------------------------------------------------
os.makedirs(os.path.join(REPO, ".sofia"), exist_ok=True)
if os.path.isfile(CFG): shutil.copy2(CFG, CFG + ".bak")
with open(CFG, "w") as f: json.dump(config, f, indent=2, ensure_ascii=False)
print(GREEN + "  OK sofia-config.json guardado" + RESET)

# -- Inicializar session.json --------------------------------------------------
if not os.path.isfile(SESSION):
    tpl = os.path.join(SOFIA_CORE, "repo-template", ".sofia", "session.json")
    if os.path.isfile(tpl):
        s = json.load(open(tpl))
        s["project"] = project; s["client"] = client; s["sofia_repo"] = REPO
        s["updated_at"] = ts
        with open(SESSION, "w") as f: json.dump(s, f, indent=2)
        print(GREEN + "  OK session.json inicializado (sofia_repo=" + REPO + ")" + RESET)
else:
    try:
        s = json.load(open(SESSION))
        s["project"] = project; s["client"] = client
        s["sofia_version"] = "2.6"; s["sofia_repo"] = REPO; s["updated_at"] = ts
        with open(SESSION, "w") as f: json.dump(s, f, indent=2)
        print(GREEN + "  OK session.json actualizado (sofia_repo=" + REPO + ")" + RESET)
    except Exception as e:
        print(YELLOW + "  WARN session.json: " + str(e) + RESET)

# -- Copiar estructura canonica desde repo-template (LA-CORE-004) -------------
# Replica estructura BankPortal S22 ANTES del Sprint 1
repo_tpl = os.path.join(SOFIA_CORE, "repo-template")
if os.path.isdir(repo_tpl):
    copied_dirs = 0
    for root, dirs, files in os.walk(repo_tpl):
        dirs[:] = [d for d in dirs if d != ".git"]
        rel = os.path.relpath(root, repo_tpl)
        if rel.startswith(".sofia"): continue  # .sofia lo gestiona el wizard
        dst_dir = os.path.join(REPO, rel) if rel != "." else REPO
        os.makedirs(dst_dir, exist_ok=True)
        for fname in files:
            if fname == ".gitkeep": continue  # no copiar markers
            src_f = os.path.join(root, fname)
            dst_f = os.path.join(dst_dir, fname)
            if not os.path.exists(dst_f):  # no sobreescribir
                shutil.copy2(src_f, dst_f)
        copied_dirs += 1
    print(GREEN + "  OK estructura canonica BankPortal S22 copiada (" + str(copied_dirs) + " dirs)" + RESET)
else:
    print(YELLOW + "  WARN repo-template no encontrado -- creando estructura minima" + RESET)
    for d in ["docs/sprints","docs/architecture","docs/functional-analysis",
              "docs/requirements","docs/code-review","docs/qa","docs/releases",
              "docs/runbooks","docs/dashboard","docs/deliverables","docs/ux-ui/prototypes",
              "docs/security","docs/backlog","infra","src"]:
        os.makedirs(os.path.join(REPO, d), exist_ok=True)
    print(GREEN + "  OK estructura minima creada" + RESET)

# -- Instalar skills desde SOFIA-CORE ------------------------------------------
skills_src = os.path.join(SOFIA_CORE, "skills")
skills_dst = os.path.join(REPO, ".sofia", "skills")
ok_s = 0
for skill in os.listdir(skills_src):
    src = os.path.join(skills_src, skill, "SKILL.md")
    dst_skill = os.path.join(skills_dst, skill)
    if os.path.isfile(src):
        os.makedirs(dst_skill, exist_ok=True)
        shutil.copy2(src, os.path.join(dst_skill, "SKILL.md"))
        ok_s += 1
print(GREEN + "  OK " + str(ok_s) + "/21 skills instalados" + RESET)

# -- Instalar scripts desde SOFIA-CORE (LA-CORE-008) --------------------------
# CRITICO: gen-fa-document.py debe instalarse siempre — error estructural si falta.
# Sin este script el FA-Agent genera markdowns por sprint en lugar del documento
# unico incremental con indice clickable (LA-FA-INCR + LA-TOC-CLICK).
scripts_src = os.path.join(SOFIA_CORE, "scripts")
scripts_dst = os.path.join(REPO, ".sofia", "scripts")
os.makedirs(scripts_dst, exist_ok=True)

# Scripts criticos que deben existir y verificarse explicitamente
CRITICAL_SCRIPTS = {
    "gen-fa-document.py": {
        "markers": ["add_toc_hyperlink", "w:anchor", "_next_bid"],
        "desc": "FA-Agent: documento unico incremental con indice clickable (LA-FA-INCR+LA-TOC-CLICK)",
        "min_size": 30000,
    },
    "gen-global-dashboard.js": {
        "markers": ["buildFullHistory"],
        "desc": "Dashboard global dinamico (GR-011)",
        "min_size": 10000,
    },
    "guardrail-pre-gate.js": {
        "markers": ["GR-013", "verify-persistence"],
        "desc": "Guardrails pre-gate (GR-001..013)",
        "min_size": 10000,
    },
    "validate-fa-index.js": {
        "markers": ["total_functionalities", "total_business_rules"],
        "desc": "Validador fa-index.json (LA-021-01)",
        "min_size": 3000,
    },
    "verify-persistence.js": {
        "markers": ["GR-013", "PIPELINE BLOQUEADO"],
        "desc": "Verificacion persistencia en disco (GR-013)",
        "min_size": 5000,
    },
}

ok_sc = 0; warn_sc = []
for script in sorted(os.listdir(scripts_src)):
    src = os.path.join(scripts_src, script)
    if not os.path.isfile(src): continue
    dst = os.path.join(scripts_dst, script)
    shutil.copy2(src, dst)
    ok_sc += 1

    # Verificacion de scripts criticos
    if script in CRITICAL_SCRIPTS:
        meta = CRITICAL_SCRIPTS[script]
        size = os.path.getsize(dst)
        content = open(dst, errors="replace").read()
        all_markers = all(m in content for m in meta["markers"])
        size_ok = size >= meta["min_size"]
        if all_markers and size_ok:
            print(GREEN + "  ✓ " + script + " (" + str(size) + "B) -- " + meta["desc"] + RESET)
        else:
            warn_sc.append(script)
            missing = [m for m in meta["markers"] if m not in content]
            print(YELLOW + "  ⚠ " + script + " (" + str(size) + "B) -- marcadores faltantes: " + str(missing) + RESET)

print(GREEN + "  OK " + str(ok_sc) + " scripts instalados" + RESET)
if warn_sc:
    print(YELLOW + "  WARN scripts con advertencias: " + ", ".join(warn_sc) + RESET)
    print(YELLOW + "       Actualizar SOFIA-CORE y re-ejecutar el wizard." + RESET)

# Verificacion bloqueante: gen-fa-document.py es obligatorio (LA-CORE-008)
fa_script_dst = os.path.join(scripts_dst, "gen-fa-document.py")
if not os.path.isfile(fa_script_dst):
    print(RED + "  ERROR CRITICO: gen-fa-document.py no encontrado en SOFIA-CORE/scripts/" + RESET)
    print(RED + "  El FA-Agent no puede funcionar sin este script. Abortando." + RESET)
    print(RED + "  Verificar: ls " + scripts_src + RESET)
    import sys as _sys; _sys.exit(1)
fa_content = open(fa_script_dst, errors="replace").read()
if "add_toc_hyperlink" not in fa_content:
    print(YELLOW + "  WARN: gen-fa-document.py instalado pero sin soporte TOC clickable." + RESET)
    print(YELLOW + "        Actualizar SOFIA-CORE a v2.6.11+ antes de iniciar el primer sprint." + RESET)

# -- FA-Agent: inicializar fa-index.json vacio (LA-CORE-008) ------------------
# Garantia: el documento FA siempre arranca con el indice correcto.
# Sin esta inicializacion, el FA-Agent genera documentos por sprint
# en lugar del documento unico incremental (LA-FA-INCR).
if fa_on:
    fa_dir = os.path.join(REPO, "docs", "functional-analysis")
    os.makedirs(fa_dir, exist_ok=True)
    fa_index_path = os.path.join(fa_dir, "fa-index.json")
    if not os.path.isfile(fa_index_path):
        fa_index_init = {
            "project":    project,
            "client":     client,
            "version":    "2.0",
            "doc_version": "0.0",
            "document":   "FA-" + project + "-" + client + ".docx",
            "doc_path":   "docs/functional-analysis/FA-" + project + "-" + client + ".docx",
            "last_sprint": 0,
            "last_feat":  None,
            "generated_at": ts,
            "updated_at":   ts,
            "skill_version": "2.6",
            "pattern":    "LA-FA-INCR+LA-TOC-CLICK",
            "toc_clickable": True,
            "total_functionalities": 0,
            "total_business_rules":  0,
            "functionalities": [],
            "business_rules":  [],
            "actors": [],
            "regulations": [],
            "glossary": [],
            "doc_history": [],
            "description": (
                project + " es un sistema desarrollado para " + client +
                " bajo la metodologia SOFIA v2.6 con CMMI Nivel 3 y Scrumban. "
                "El desarrollo sigue ciclos de " + str(sprint_len) + " dias con "
                "pipeline de calidad automatizado (17 steps, 9 gates HITL)."
            ),
        }
        with open(fa_index_path, "w") as f:
            json.dump(fa_index_init, f, indent=2, ensure_ascii=False)
        print(GREEN + "  ✓ fa-index.json inicializado (FA-Agent listo desde Sprint 1)" + RESET)
    else:
        print(GREEN + "  OK fa-index.json ya existia -- no sobreescrito" + RESET)

    # Verificacion final FA-Agent
    fa_script = os.path.join(REPO, ".sofia", "scripts", "gen-fa-document.py")
    fa_index  = os.path.join(REPO, "docs", "functional-analysis", "fa-index.json")
    fa_ok = os.path.isfile(fa_script) and os.path.isfile(fa_index)
    if fa_ok:
        print(GREEN + "  ✓ FA-Agent setup completo: script=" + str(os.path.getsize(fa_script)) +
              "B | fa-index.json=OK" + RESET)
    else:
        missing = []
        if not os.path.isfile(fa_script): missing.append("gen-fa-document.py")
        if not os.path.isfile(fa_index):  missing.append("fa-index.json")
        print(YELLOW + "  WARN FA-Agent: faltan " + ", ".join(missing) + RESET)

# -- Copiar LESSONS_LEARNED desde Core -----------------------------------------
ll_src = os.path.join(SOFIA_CORE, "LESSONS_LEARNED_CORE.md")
ll_dst = os.path.join(REPO, "LESSONS_LEARNED.md")
if os.path.isfile(ll_src) and not os.path.isfile(ll_dst):
    shutil.copy2(ll_src, ll_dst)
    print(GREEN + "  OK LESSONS_LEARNED.md copiado" + RESET)

# -- Generar CLAUDE.md con SOFIA_REPO explicito (GR-CORE-003) -----------------
backend_skill  = ("dotnet-developer" if "dotnet"  in backend else
                  "nodejs-developer" if "nodejs"  in backend else "java-developer")
frontend_skill = ("react-developer"   if "react"   in frontend else
                  "angular-developer" if "angular" in frontend else "")
skill_lines = "- Backend:  " + backend_skill
if frontend_skill: skill_lines += "\n- Frontend: " + frontend_skill

claude_md = (
    "# SOFIA v2.6 -- Software Factory IA de Experis\n"
    "# Proyecto: " + project + " | Cliente: " + client + "\n\n"
    "## IDENTIDAD DEL PROYECTO -- LEER PRIMERO\n\n"
    "SOFIA_REPO=" + REPO + "\n\n"
    "**REGLA ABSOLUTA GR-CORE-003:** Cualquier fichero que SOFIA genere o modifique\n"
    "DEBE tener una ruta que empiece por SOFIA_REPO.\n"
    "Si una ruta destino NO empieza por SOFIA_REPO:\n"
    "  -> DETENER inmediatamente\n"
    "  -> Mostrar: 'AISLAMIENTO VIOLADO: [ruta] fuera de SOFIA_REPO=" + REPO + "'\n"
    "  -> No ejecutar la escritura. Pedir confirmacion explicita.\n"
    "Sin excepciones. Nunca escribir en otro proyecto.\n\n"
    "## INIT -- Ejecutar al abrir este proyecto\n\n"
    "1. Leer CLAUDE.md -- SOFIA_REPO=" + REPO + "\n"
    "2. Leer " + REPO + "/.sofia/session.json\n"
    "3. Verificar session.json.sofia_repo == '" + REPO + "'\n"
    "   Si no coincide -> DETENER: 'CONFLICTO SOFIA_REPO'\n"
    "4. Leer " + REPO + "/.sofia/sofia-config.json\n"
    "5. Verificar sofia-config.json.sofia_repo == '" + REPO + "'\n"
    "   Si no coincide -> DETENER: 'CONFLICTO sofia-config.json'\n"
    "6. Si status == in_progress -> RESUME PROTOCOL\n"
    "7. Si status == idle -> esperar solicitud\n"
    "8. Confirmar: 'SOFIA v2.6 activo -- " + project + " | SOFIA_REPO verificado'\n\n"
    "## Stack\n\n"
    "- Backend:  " + ", ".join(backend) + "\n"
    "- Frontend: " + (", ".join(frontend) if frontend else "ninguno") + "\n"
    "- BD:       " + ", ".join(database) + "\n"
    "- Jira:     " + jira_key + " | Confluence: " + space_key + "\n"
    "- Cloud ID: " + cloud_id + "\n\n"
    "## Skills activos\n\n" + skill_lines + "\n\n"
    "## Pipeline v2.6 -- 17 steps -- 21 agentes -- CMMI L3\n\n"
    "1  Scrum Master     G-1 (PO)\n"
    "2  Requirements     G-2 (PO)    2b FA-Agent (AUTO)   2c UX/UI (HITL-PO-TL)\n"
    "3  Architect        G-3 (TL)    3b FA-Agent+Docs (AUTO)\n"
    "4  Developer        G-4b (build verificado)\n"
    "5  Code Reviewer    G-5 (TL)    5b Security (AUTO)\n"
    "6  QA Tester        G-6 (QA+PO)\n"
    "7  DevOps           G-7 (RM)\n"
    "8  Documentation    G-8 (PM) -- 17 DOCX + 3 XLSX\n"
    "   8b FA-Agent (AUTO)\n"
    "9  Workflow Manager G-9 -- Jira+Confluence+Dashboard\n\n"
    "## Estructura canonica del proyecto\n\n"
    "Ver: " + REPO + "/ESTRUCTURA.md\n"
    "Directorios pre-creados desde repo-template SOFIA-CORE (LA-CORE-004).\n"
    "Step 1 escribe en docs/sprints/. Step 8 en docs/deliverables/sprint-N-FEAT-XXX/.\n\n"
    "## Guardrails\n\n"
    "GR-CORE-001: MCP merge -- nunca sobreescribir claude_desktop_config.json\n"
    "GR-CORE-002: realpath -- nunca aliases Finder macOS\n"
    "GR-CORE-003: SOFIA_REPO verificado en INIT y antes de cada escritura\n"
    "GR-010:      G-9 deuda CVSS>=4.0 vencida\n"
    "GR-011:      ALL dashboard freshness en cada gate\n"
    "GR-012:      G-4 step 3b en completed_steps\n\n"
    "## Reglas criticas\n\n"
    "- Nunca auto-aprobar gate HITL\n"
    "- Dashboard regenerar en cada gate (GR-011)\n"
    "- Doc Agent: .docx reales en docs/deliverables/sprint-N-FEAT-XXX/word/ (LA-022-08)\n"
    "- FA-Agent: validate-fa-index.js bloqueante en 2b/3b/8b (LA-021-01)\n"
    "- Step 3b: OBLIGATORIO post G-3 (LA-022-07)\n"
    "- CVSS>=4.0: resolver en el mismo sprint (LA-020-02)\n"
    "- G-9 BLOQUEANTE: verificar docs/sprints/SPRINT-NNN-*.md|json en disco (LA-CORE-004)\n"
    "- sofia-shell: verificar cwd ANTES de usar (GR-014/LA-CORE-009)\n"
    "  Comando: python3 -c \\\"import os,json; print(os.getcwd(), json.load(open('.sofia/session.json')).get('project'))\\\"\"\n"
    "  cwd debe ser ruta absoluta del SOFIA_REPO activo\n\n"
    "## FA-Agent -- Análisis Funcional\n\n"
    "El FA-Agent mantiene UN UNICO documento Word incremental por proyecto.\n"
    "Patron LA-FA-INCR + LA-TOC-CLICK (SOFIA v2.6.11):\n"
    "- Documento: docs/functional-analysis/FA-" + project + "-" + client + ".docx\n"
    "- Indice: docs/functional-analysis/fa-index.json (versionado)\n"
    "- Script: .sofia/scripts/gen-fa-document.py (TOC clickable via w:hyperlink+w:anchor)\n"
    "- Ejecutar en Gate 8b: python3 .sofia/scripts/gen-fa-document.py\n"
    "- Verificacion bloqueante: tamanio > 10KB + mtime < 120s\n"
    "- NUNCA generar FA por sprint -- siempre el documento unico acumulativo.\n\n"
    "## SOFIA-CORE\n\n"
    "Framework: " + SOFIA_CORE + "\n"
    "Contribuir LA: python3 " + SOFIA_CORE + "/scripts/sofia-contribute.py --la LA-XXX\n"
)

with open(os.path.join(REPO, "CLAUDE.md"), "w") as f: f.write(claude_md)
print(GREEN + "  OK CLAUDE.md generado con SOFIA_REPO + LA-CORE-004" + RESET)

# -- Registrar en ~/.sofia/projects.json ---------------------------------------
os.makedirs(os.path.dirname(REGISTRY), exist_ok=True)
reg = {"projects": {}, "active": None}
if os.path.isfile(REGISTRY):
    try: reg = json.load(open(REGISTRY))
    except Exception: pass
alias = project.lower().replace(" ", "_").replace("-", "_")[:12]
reg["projects"][alias] = REPO
if not reg.get("active"): reg["active"] = alias
with open(REGISTRY, "w") as f: json.dump(reg, f, indent=2)
print(GREEN + "  OK Proyecto '" + alias + "' registrado" + RESET)

# -- sofia.log -----------------------------------------------------------------
log_path = os.path.join(REPO, ".sofia", "sofia.log")
with open(log_path, "a") as f:
    f.write("[" + ts + "] [WIZARD] COMPLETED -> " + project + " / " + client +
            " | SOFIA_REPO=" + REPO + " | v2.6.11 | LA-CORE-003+004+008 | FA-Agent=ready\n")

print()
print(GREEN + BOLD + "  SOFIA v2.6.11 configurado." + RESET)
print("  SOFIA_REPO: " + BLUE + REPO + RESET)
print()
print(BOLD + "  Proximos pasos:" + RESET)
print("  1. bash .sofia/scripts/setup-sofia-mac.sh " + REPO)
print("  2. Sube " + REPO + "/CLAUDE.md al Project de Claude Desktop")
print("  3. Reiniciar Claude Desktop")
print("  4. Primer sprint: 'nueva feature FEAT-001 -- descripcion'")
print()
