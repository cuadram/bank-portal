#!/usr/bin/env python3
"""
SOFIA v1.7 — gate-check.py (US-1003)
Consulta el estado de un gate en Jira y actualiza session.json.

El Orchestrator llama a este script ANTES de continuar al siguiente step.
Si el gate está pendiente, el pipeline permanece bloqueado.

Uso:
  python3 gate-check.py [repo_path] [step] [feature]
  python3 gate-check.py ~/proyectos/bank-portal 3 FEAT-005
  python3 gate-check.py ~/proyectos/bank-portal 3 FEAT-005 --json

Salida (--json):
  {"gate_status": "approved|rejected|pending", "by": "...", "comment": "..."}

Exit codes:
  0 → gate APROBADO — el Orchestrator puede continuar
  1 → gate PENDIENTE — el Orchestrator debe esperar
  2 → gate RECHAZADO — el Orchestrator debe gestionar NC
  3 → error (Jira no disponible, issue no encontrado)
"""

import os, sys, json, datetime, subprocess

REPO    = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/proyectos/bank-portal")
STEP    = sys.argv[2] if len(sys.argv) > 2 else None
FEATURE = sys.argv[3] if len(sys.argv) > 3 else None
JSON_MODE = "--json" in sys.argv

SESSION = os.path.join(REPO, ".sofia", "session.json")
LOG     = os.path.join(REPO, ".sofia", "sofia.log")
CFG     = os.path.join(REPO, ".sofia", "sofia-config.json")
GATES_DIR = os.path.join(REPO, ".sofia", "gates")

GREEN = "\033[0;32m"; YELLOW = "\033[1;33m"; RED = "\033[0;31m"
BOLD  = "\033[1m";   RESET  = "\033[0m"

# ── Configuración ─────────────────────────────────────────────────────────────
def load_config():
    defaults = {"project": "bank-portal", "jira_project_key": "BP"}
    if os.path.isfile(CFG):
        try:
            defaults.update(json.load(open(CFG)))
        except Exception:
            pass
    return defaults

def load_session():
    if os.path.isfile(SESSION):
        try:
            return json.load(open(SESSION))
        except Exception:
            pass
    return {}

def save_session(data):
    data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(SESSION, "w") as f:
        json.dump(data, f, indent=2)

def write_log(msg):
    if os.path.isfile(LOG):
        ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(LOG, "a") as f:
            f.write("[" + ts + "] [GATE] [gate-check.py] " + msg + "\n")

# ── Gestión local de gates (fallback sin Jira) ────────────────────────────────
os.makedirs(GATES_DIR, exist_ok=True)

def gate_file_path(step, feature):
    return os.path.join(GATES_DIR, "gate-step" + str(step) + "-" + str(feature) + ".json")

def read_local_gate(step, feature):
    path = gate_file_path(step, feature)
    if os.path.isfile(path):
        try:
            return json.load(open(path))
        except Exception:
            pass
    return None

def write_local_gate(step, feature, status, by="", comment="", issue_key=""):
    path = gate_file_path(step, feature)
    data = {
        "step": step,
        "feature": feature,
        "status": status,
        "by": by,
        "comment": comment,
        "jira_issue_key": issue_key,
        "created_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    return data

# ── Nombres de gate por step ──────────────────────────────────────────────────
GATE_NAMES = {
    "1":  ("Aprobación inclusión en sprint", "product-owner"),
    "2":  ("Aprobación User Stories",        "product-owner"),
    "3":  ("Aprobación HLD/LLD",             "tech-lead"),
    "5":  ("Aprobación Code Review (NCs)",   "tech-lead"),
    "5b": ("Aprobación Security Gate",       "security-team"),
    "6":  ("Aprobación QA",                  "qa-lead"),
    "7":  ("Go/No-Go Release",               "release-manager"),
    "8":  ("Aprobación paquete cliente",     "pm"),
    "9":  ("Aceptación cliente",             "client"),
}

JIRA_GATE_TRANSITIONS = {
    "pending":  "Pending Approval",
    "approved": "Approved",
    "rejected": "Rejected",
}

# ── Generar el prompt MCP para crear el issue de gate en Jira ─────────────────
def build_gate_creation_prompt(cfg, step, feature, sprint, gate_name, approver):
    key = cfg.get("jira_project_key", "BP")
    summary = "[GATE] Sprint " + str(sprint) + " — " + str(feature) + " — Step " + str(step) + ": " + gate_name
    description = (
        "Gate de aprobación generado automáticamente por SOFIA v1.7.\n\n"
        "**Proyecto:** " + cfg.get("project", "") + "\n"
        "**Feature:** " + str(feature) + "\n"
        "**Sprint:** " + str(sprint) + "\n"
        "**Step:** " + str(step) + "\n"
        "**Gate:** " + gate_name + "\n"
        "**Responsable de aprobación:** " + approver + "\n\n"
        "## Acción requerida\n"
        "Revisar los artefactos del step " + str(step) + " y transicionar este issue a:\n"
        "- **Approved** → si los artefactos cumplen los criterios\n"
        "- **Rejected** → si hay observaciones que requieren corrección\n\n"
        "El pipeline de SOFIA está **BLOQUEADO** hasta que se complete esta acción.\n\n"
        "Generado: " + datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    )

    prompt = (
        "## Crear issue de gate en Jira\n\n"
        "Usar createJiraIssue con:\n"
        "- cloudId: [obtener de getAccessibleAtlassianResources]\n"
        "- projectKey: " + key + "\n"
        "- issueTypeName: Task\n"
        "- summary: " + summary + "\n"
        "- description: (ver abajo)\n"
        "- labels: [\"gate\", \"sofia-gate\", \"" + str(feature) + "\"]\n"
        "- priority: High\n\n"
        "Descripción del issue:\n" + description + "\n\n"
        "Una vez creado, guardar el issue key (ej: BP-123) para el seguimiento."
    )
    return prompt, summary

# ── Generar prompt MCP para consultar estado del gate ─────────────────────────
def build_gate_status_prompt(cfg, step, feature, issue_key=None):
    key = cfg.get("jira_project_key", "BP")

    if issue_key:
        prompt = (
            "## Consultar estado del gate en Jira\n\n"
            "Usar getJiraIssue con issueIdOrKey: " + issue_key + "\n"
            "Extraer:\n"
            "- status.name (el estado actual del issue)\n"
            "- Comentarios recientes\n"
            "- Assignee\n\n"
            "Si status == 'Approved' → gate aprobado, el pipeline puede continuar\n"
            "Si status == 'Rejected' → gate rechazado, gestionar NC\n"
            "Si status == 'Pending Approval' o 'To Do' → gate pendiente, pipeline bloqueado\n"
        )
    else:
        jql = 'project = ' + key + ' AND labels = "sofia-gate" AND labels = "' + str(feature) + '" AND summary ~ "Step ' + str(step) + '" ORDER BY created DESC'
        prompt = (
            "## Buscar issue de gate en Jira\n\n"
            "Usar searchJiraIssuesUsingJql con JQL:\n"
            '`' + jql + '`\n\n'
            "Del primer resultado extraer:\n"
            "- key (ej: BP-123)\n"
            "- status.name\n"
            "- Comentarios\n\n"
            "Si no hay resultados → el gate no fue creado todavía\n"
        )
    return prompt

# ── Actualizar session.json con el resultado del gate ────────────────────────
def apply_gate_result(session, step, status, by, comment, issue_key):
    step_str = str(step)
    if "gates" not in session:
        session["gates"] = {}
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    session["gates"][step_str] = {
        "status": status,
        "by": by,
        "comment": comment,
        "jira_issue_key": issue_key,
        "at": now,
    }

    if status == "approved":
        session["status"] = "in_progress"
        # Añadir step a completed si no está
        completed = [str(c) for c in session.get("completed_steps", [])]
        if step_str not in completed:
            completed.append(step_str)
        session["completed_steps"] = completed
    elif status == "rejected":
        session["status"] = "gate_pending"
        # Crear NC
        nc_id = "NC-" + step_str + "-" + str(int(datetime.datetime.now().timestamp()))[-4:]
        if "ncs" not in session:
            session["ncs"] = {}
        session["ncs"][nc_id] = {
            "step": step_str,
            "description": comment or "Gate rechazado en step " + step_str,
            "severity": "mayor",
            "status": "open",
            "created_at": now,
        }
    elif status == "pending":
        session["status"] = "gate_pending"

    return session

# ── Modo interactivo — menú para gestión manual del gate ─────────────────────
def interactive_mode(cfg, session, step, feature):
    gate_name, approver = GATE_NAMES.get(str(step), ("Gate step " + str(step), "responsable"))
    sprint = session.get("sprint", "?")

    print()
    print(BOLD + "╔══════════════════════════════════════════════════════════╗" + RESET)
    print(BOLD + "║   SOFIA v1.7 — Gate Enforcement                        ║" + RESET)
    print(BOLD + "╚══════════════════════════════════════════════════════════╝" + RESET)
    print("  Step " + str(step) + " — " + gate_name)
    print("  Feature: " + str(feature) + "  Sprint: " + str(sprint))
    print("  Responsable: " + approver)
    print()

    # Verificar si hay gate local registrado
    local = read_local_gate(step, feature)
    if local:
        st = local.get("status", "pending")
        color = GREEN if st == "approved" else RED if st == "rejected" else YELLOW
        print("  Estado actual: " + color + st.upper() + RESET)
        if local.get("jira_issue_key"):
            print("  Jira issue: " + local["jira_issue_key"])
        print()

    # Verificar gates en session.json
    gate_in_session = session.get("gates", {}).get(str(step), {})
    if gate_in_session:
        print("  Registrado en session.json: " + str(gate_in_session.get("status", "—")))
        print()

    print(BOLD + "  Opciones:" + RESET)
    print("  " + GREEN + "[A]" + RESET + " Registrar aprobación del gate")
    print("  " + RED   + "[R]" + RESET + " Registrar rechazo del gate")
    print("  " + YELLOW + "[P]" + RESET + " Generar prompt para crear issue Jira")
    print("  " + YELLOW + "[C]" + RESET + " Generar prompt para consultar estado en Jira")
    print("  [S] Ver estado actual completo")
    print("  [X] Salir sin cambios")
    print()

    choice = input("  Selección [A/R/P/C/S/X]: ").strip().upper()
    print()

    if choice == "A":
        by = input("  Aprobado por (rol/nombre): ").strip() or approver
        comment = input("  Comentario (opcional): ").strip()
        issue_key = input("  Jira issue key (ej: BP-123, opcional): ").strip()
        gate_data = write_local_gate(step, feature, "approved", by, comment, issue_key)
        session = apply_gate_result(session, step, "approved", by, comment, issue_key)
        save_session(session)
        write_log("GATE_APPROVED → step=" + str(step) + " feature=" + str(feature) + " by=" + by)
        print("  " + GREEN + "✅ Gate aprobado — pipeline puede continuar al step siguiente" + RESET)
        print()
        print(BOLD + "  Prompt para el Orchestrator:" + RESET)
        print("  ─────────────────────────────────────────────────────────")
        print("  El gate del step " + str(step) + " ha sido aprobado por " + by + ".")
        print("  Continuar con el siguiente step del pipeline.")
        print("  ─────────────────────────────────────────────────────────")
        return 0

    elif choice == "R":
        by = input("  Rechazado por (rol/nombre): ").strip() or approver
        comment = input("  Motivo del rechazo: ").strip()
        issue_key = input("  Jira issue key (opcional): ").strip()
        gate_data = write_local_gate(step, feature, "rejected", by, comment, issue_key)
        session = apply_gate_result(session, step, "rejected", by, comment, issue_key)
        save_session(session)
        write_log("GATE_REJECTED → step=" + str(step) + " feature=" + str(feature) + " by=" + by + " reason=" + comment[:50])
        print("  " + RED + "❌ Gate rechazado — NC creada, pipeline bloqueado" + RESET)
        print()
        nc_keys = list(session.get("ncs", {}).keys())
        if nc_keys:
            nc_id = nc_keys[-1]
            print("  NC creada: " + nc_id)
            print()
        print(BOLD + "  Prompt para el Orchestrator:" + RESET)
        print("  ─────────────────────────────────────────────────────────")
        print("  Gate del step " + str(step) + " RECHAZADO por " + by + ".")
        if comment:
            print("  Motivo: " + comment)
        print("  Volver al step " + str(step) + " con el feedback del rechazo.")
        print("  NC registrada en session.json.")
        print("  ─────────────────────────────────────────────────────────")
        return 2

    elif choice == "P":
        prompt, summary = build_gate_creation_prompt(cfg, step, feature, sprint, gate_name, approver)
        gate_file = gate_file_path(step, feature)
        prompt_file = gate_file.replace(".json", "-create-prompt.md")
        with open(prompt_file, "w") as f:
            f.write("# Prompt crear gate Jira\n\n" + prompt)
        # Marcar como pendiente localmente
        write_local_gate(step, feature, "pending", "", "", "")
        session = apply_gate_result(session, step, "pending", "", "", "")
        save_session(session)
        write_log("GATE_PENDING → step=" + str(step) + " feature=" + str(feature) + " jira_prompt_generated")
        print("  " + YELLOW + "Prompt generado: " + prompt_file + RESET)
        print()
        print(BOLD + "  Pasar al atlassian-agent:" + RESET)
        print("  ─────────────────────────────────────────────────────────")
        print(prompt[:600] + ("..." if len(prompt) > 600 else ""))
        print("  ─────────────────────────────────────────────────────────")
        print()
        print("  Pipeline BLOQUEADO hasta recibir aprobación.")
        return 1

    elif choice == "C":
        issue_key = ""
        if local:
            issue_key = local.get("jira_issue_key", "")
        if not issue_key:
            issue_key = input("  Jira issue key (ej: BP-123): ").strip()
        prompt = build_gate_status_prompt(cfg, step, feature, issue_key)
        print()
        print(BOLD + "  Prompt para atlassian-agent:" + RESET)
        print("  ─────────────────────────────────────────────────────────")
        print(prompt)
        print("  ─────────────────────────────────────────────────────────")
        return 1

    elif choice == "S":
        print("  Gates en session.json:")
        for s, g in session.get("gates", {}).items():
            st = g.get("status", "—")
            color = GREEN if st == "approved" else RED if st == "rejected" else YELLOW
            print("  Step " + s + ": " + color + st + RESET + " — " + g.get("by", "") + " " + g.get("at", ""))
        print()
        print("  Gates en .sofia/gates/:")
        for f in sorted(os.listdir(GATES_DIR)):
            if f.endswith(".json") and not f.endswith("-prompt.md"):
                try:
                    d = json.load(open(os.path.join(GATES_DIR, f)))
                    st = d.get("status", "—")
                    color = GREEN if st == "approved" else RED if st == "rejected" else YELLOW
                    print("  " + f + " → " + color + st + RESET)
                except Exception:
                    pass
        return 1

    else:
        print("  Sin cambios.")
        return 1

# ── Modo JSON (consumo programático) ─────────────────────────────────────────
def json_output(status, by="", comment="", issue_key="", exit_code=1):
    result = {
        "gate_status": status,
        "by": by,
        "comment": comment,
        "jira_issue_key": issue_key,
        "checked_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    print(json.dumps(result, indent=2))
    sys.exit(exit_code)

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    cfg     = load_config()
    session = load_session()
    step    = STEP    or str(session.get("pipeline_step", "1"))
    feature = FEATURE or session.get("feature", "FEAT-XXX")

    # Comprobar si ya hay resultado en session.json
    gate_in_session = session.get("gates", {}).get(str(step), {})
    if gate_in_session.get("status") == "approved":
        if JSON_MODE:
            json_output("approved", gate_in_session.get("by",""), gate_in_session.get("comment",""),
                        gate_in_session.get("jira_issue_key",""), 0)
        print(GREEN + "  ✅ Gate step " + str(step) + " ya aprobado en session.json" + RESET)
        sys.exit(0)

    # Comprobar gate local
    local = read_local_gate(step, feature)
    if local:
        st = local.get("status", "pending")
        if JSON_MODE:
            ec = 0 if st=="approved" else 2 if st=="rejected" else 1
            json_output(st, local.get("by",""), local.get("comment",""), local.get("jira_issue_key",""), ec)

    if JSON_MODE:
        json_output("pending", "", "", "", 1)

    sys.exit(interactive_mode(cfg, session, step, feature))

if __name__ == "__main__":
    main()
