#!/usr/bin/env python3
"""
SOFIA v1.7 — sofia-wizard.py (US-1103)
Setup wizard interactivo. Genera sofia-config.json para un proyecto nuevo
o actualiza uno existente. Tiempo estimado: < 5 minutos.

Uso:
  python3 sofia-wizard.py                    ← nuevo proyecto en directorio actual
  python3 sofia-wizard.py ~/proyectos/nuevo  ← nuevo proyecto en path específico
  python3 sofia-wizard.py ~/proyectos/bank-portal --update  ← actualizar existente
"""

import os, sys, json, datetime, shutil, subprocess

REPO    = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") \
          else os.getcwd()
UPDATE  = "--update" in sys.argv
REPO    = os.path.expanduser(REPO)
CFG     = os.path.join(REPO, ".sofia", "sofia-config.json")
SESSION = os.path.join(REPO, ".sofia", "session.json")
CTX     = os.path.join(REPO, ".sofia", "sofia-context.md")

GREEN  = "\033[0;32m"; YELLOW = "\033[1;33m"; RED = "\033[0;31m"
BLUE   = "\033[0;34m"; BOLD   = "\033[1m";    RESET  = "\033[0m"; CYAN = "\033[0;36m"

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
        marker = " (recomendado)" if opt == default else ""
        print("    [" + str(i) + "] " + opt + marker)
    print("    [0] Ninguno / Otro")
    choices = input("  Selección (ej: 1 3): ").strip().split()
    result = []
    for c in choices:
        try:
            idx = int(c)
            if 1 <= idx <= len(options):
                result.append(options[idx-1])
        except ValueError:
            pass
    return result or ([default] if default else [])

def ask_yn(prompt, default=True):
    hint = " [S/n]" if default else " [s/N]"
    val = input("  " + prompt + hint + ": ").strip().lower()
    if not val: return default
    return val in ("s", "si", "sí", "y", "yes")

def section(title):
    print()
    print(BOLD + "  ─── " + title + " ───" + RESET)

# ── Cargar config existente si es update ─────────────────────────────────────
existing = {}
if UPDATE and os.path.isfile(CFG):
    try:
        existing = json.load(open(CFG))
        print(YELLOW + "  Modo actualización — cargando configuración existente" + RESET)
    except Exception:
        pass

print()
print(BOLD + "╔══════════════════════════════════════════════════════════╗" + RESET)
print(BOLD + "║   SOFIA v1.7 — Setup Wizard                            ║" + RESET)
print(BOLD + "╚══════════════════════════════════════════════════════════╝" + RESET)
print("  Proyecto: " + BLUE + REPO + RESET)
print("  Tiempo estimado: < 5 minutos")
print()

# ── 1. Información del proyecto ───────────────────────────────────────────────
section("1. Proyecto")
project     = ask("Nombre del proyecto", existing.get("project", os.path.basename(REPO)), required=True)
client      = ask("Cliente / empresa", existing.get("client", "Experis"), required=True)
description = ask("Descripción breve", existing.get("project_description", ""))

# ── 2. Stack tecnológico ──────────────────────────────────────────────────────
section("2. Stack tecnológico")

ex_stack = existing.get("stack", {})

print("  Backend:")
backend_opts = ["java", "dotnet", "nodejs", "python", "go"]
backend = ask_list("Selecciona backend(s):", backend_opts, ex_stack.get("backend", ["java"])[0] if ex_stack.get("backend") else "java")

print()
print("  Frontend:")
frontend_opts = ["angular", "react", "vue", "none"]
frontend = ask_list("Selecciona frontend(s):", frontend_opts, ex_stack.get("frontend", ["angular"])[0] if ex_stack.get("frontend") else "none")
frontend = [f for f in frontend if f != "none"]

print()
print("  Base de datos:")
db_opts = ["postgresql", "mysql", "mongodb", "redis", "sqlserver", "oracle"]
database = ask_list("Selecciona BD(s):", db_opts, ex_stack.get("database", ["postgresql"])[0] if ex_stack.get("database") else "postgresql")

# ── 3. Jira / Confluence ──────────────────────────────────────────────────────
section("3. Atlassian (Jira + Confluence)")
ex_jira = existing.get("jira", {})
ex_conf = existing.get("confluence", {})

jira_key    = ask("Jira project key (ej: BP, MYAPP)", ex_jira.get("project_key", project[:3].upper()), required=True)
conf_space  = ask("Confluence space key (ej: BANKPORTAL)", ex_conf.get("space_key", project.upper().replace("-","")[:12]))
atlassian_sync = ask_yn("¿Activar sincronía automática Jira/Confluence?", existing.get("pipeline", {}).get("atlassian_sync", True))

# ── 4. Equipo ─────────────────────────────────────────────────────────────────
section("4. Roles del equipo (opcional — pulsa Enter para omitir)")
ex_roles = existing.get("team_roles", {})
roles = {
    "product_owner":  ask("Product Owner", ex_roles.get("product_owner", "")),
    "tech_lead":      ask("Tech Lead",     ex_roles.get("tech_lead", "")),
    "scrum_master":   ask("Scrum Master",  ex_roles.get("scrum_master", "")),
    "qa_lead":        ask("QA Lead",       ex_roles.get("qa_lead", "")),
    "release_manager":ask("Release Manager", ex_roles.get("release_manager", "")),
    "pm":             ask("Project Manager", ex_roles.get("pm", "")),
    "security_team":  ask("Security Team", ex_roles.get("security_team", "security-team")),
    "client_contact": ask("Contacto cliente", ex_roles.get("client_contact", "")),
}

# ── 5. Metodología ────────────────────────────────────────────────────────────
section("5. Metodología")
ex_meth = existing.get("methodology", {})
sprint_len = ask("Duración del sprint (días)", str(ex_meth.get("sprint_length_days", 14)))
try: sprint_len = int(sprint_len)
except ValueError: sprint_len = 14
vel_ref = ask("Velocidad de referencia (SP/sprint)", str(ex_meth.get("velocity_reference_sp", 24)))
try: vel_ref = int(vel_ref)
except ValueError: vel_ref = 24

# ── 6. Pipeline ───────────────────────────────────────────────────────────────
section("6. Pipeline")
ex_pipe = existing.get("pipeline", {})
gates_enabled = ask_yn("¿Activar gate enforcement (bloqueo Jira)?", ex_pipe.get("gates_enabled", True))
security_step = ask_yn("¿Activar Security Agent (step 5b)?", ex_pipe.get("optional_steps", {}).get("5b", True))
perf_step     = ask_yn("¿Activar Performance Agent (step opcional)?", ex_pipe.get("optional_steps", {}).get("performance", False))
auto_dashboard = ask_yn("¿Generar dashboard automático tras cada sprint?", ex_pipe.get("auto_dashboard", True))

cov_threshold = ask("Cobertura mínima de tests (%)", str(existing.get("quality", {}).get("coverage_threshold", 80)))
try: cov_threshold = int(cov_threshold)
except ValueError: cov_threshold = 80

# ── Construir config ──────────────────────────────────────────────────────────
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

config = {
    "_comment": "SOFIA v1.7 — Configuración del proyecto. Editar con: python3 .sofia/scripts/sofia-wizard.py --update",
    "sofia_version": "1.7",
    "project": project,
    "client": client,
    "project_description": description,
    "created_at": existing.get("created_at", now),
    "updated_at": now,
    "stack": {
        "backend": backend,
        "frontend": frontend,
        "database": database,
        "messaging": ex_stack.get("messaging", []),
        "infra": ex_stack.get("infra", ["docker", "jenkins"]),
    },
    "methodology": {
        "type": "scrumban",
        "sprint_length_days": sprint_len,
        "velocity_reference_sp": vel_ref,
        "estimation_unit": "story_points",
    },
    "team_roles": roles,
    "jira": {
        "project_key": jira_key,
        "sprint_board_id": ex_jira.get("sprint_board_id"),
        "gate_label": "sofia-gate",
        "nc_label": "sofia-nc",
    },
    "confluence": {
        "space_key": conf_space,
        "parent_page_id": ex_conf.get("parent_page_id"),
    },
    "pipeline": {
        "active_steps": ["1","2","3","3b","4","5","5b","6","7","8","9"],
        "optional_steps": {"5b": security_step, "performance": perf_step},
        "gates_enabled": gates_enabled,
        "atlassian_sync": atlassian_sync,
        "auto_dashboard": auto_dashboard,
    },
    "quality": {
        "coverage_threshold": cov_threshold,
        "max_cve_high": 3,
        "max_cve_critical": 0,
        "cmmi_level": 3,
    },
    "paths": {
        "repo": REPO,
        "docs": "docs",
        "src": "src",
        "infra": "infra",
        "deliverables": "docs/deliverables",
    },
    "document_style": {
        "language": "es",
        "corporate_color": "1B3A6B",
        "font": "Arial",
        "paper": "A4",
    },
}

# ── Resumen antes de guardar ──────────────────────────────────────────────────
print()
print(BOLD + "  ─── Resumen de configuración ───" + RESET)
print("  Proyecto:   " + CYAN + project + RESET + " (" + client + ")")
print("  Backend:    " + ", ".join(backend))
print("  Frontend:   " + (", ".join(frontend) if frontend else "ninguno"))
print("  Jira:       " + jira_key + " | Confluence: " + conf_space)
print("  Sprint:     " + str(sprint_len) + " días | Velocidad ref: " + str(vel_ref) + " SP")
print("  Gates:      " + (GREEN + "activos" if gates_enabled else YELLOW + "desactivados") + RESET)
print("  Security:   " + (GREEN + "step 5b activo" if security_step else YELLOW + "desactivado") + RESET)
print("  Atlassian:  " + (GREEN + "sync activo" if atlassian_sync else YELLOW + "desactivado") + RESET)
print()

confirm = ask_yn("¿Guardar configuración?", True)
if not confirm:
    print("  " + YELLOW + "Cancelado — sin cambios." + RESET)
    sys.exit(0)

# ── Guardar ───────────────────────────────────────────────────────────────────
os.makedirs(os.path.join(REPO, ".sofia"), exist_ok=True)
if os.path.isfile(CFG):
    shutil.copy2(CFG, CFG + ".bak")

with open(CFG, "w") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

# Actualizar session.json con project y client
if os.path.isfile(SESSION):
    try:
        s = json.load(open(SESSION))
        s["project"] = project
        s["client"]  = client
        s["updated_at"] = now
        with open(SESSION, "w") as f:
            json.dump(s, f, indent=2)
    except Exception:
        pass

# Copiar sofia-context.md si no existe
ctx_src = os.path.join(os.path.dirname(__file__), "..", "sofia-context.md")
if not os.path.isfile(CTX) and os.path.isfile(ctx_src):
    shutil.copy2(ctx_src, CTX)

print()
print(GREEN + "  ✅ sofia-config.json guardado: " + CFG + RESET)
if os.path.isfile(CFG + ".bak"):
    print("  Backup anterior: " + CFG + ".bak")
print()
print(BOLD + "  Próximos pasos:" + RESET)
print("  1. Reiniciar Claude Desktop")
print("  2. python3 .sofia/scripts/resume.py")
print("  3. Empezar con: 'nueva feature FEAT-001 — [descripción]'")
print()
