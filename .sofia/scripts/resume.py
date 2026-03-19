#!/usr/bin/env python3
"""
SOFIA v1.6 — resume.py (US-904)
Detecta pipelines interrumpidos y genera el prompt de recuperación
para que el Orchestrator lo presente al usuario.

Uso directo:  python3 resume.py [repo_path]
Uso desde Orchestrator: importar check_session() al inicio de cada sesión.

Salida:
  - EXIT 0 + JSON en stdout  → pipeline activo detectado
  - EXIT 1                   → sin pipeline activo (status idle/done/None)
  - EXIT 2                   → error (session.json inválido o no existe)
"""

import os, sys, json, datetime

REPO = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/proyectos/bank-portal")
SESSION = os.path.join(REPO, ".sofia", "session.json")
LOG     = os.path.join(REPO, ".sofia", "sofia.log")
SNAPS   = os.path.join(REPO, ".sofia", "snapshots")

GREEN  = "\033[0;32m"; YELLOW = "\033[1;33m"; RED = "\033[0;31m"
BLUE   = "\033[0;34m"; BOLD   = "\033[1m";    RESET  = "\033[0m"
CYAN   = "\033[0;36m"

# ── Pasos del pipeline ────────────────────────────────────────────────────────
PIPELINE_STEPS = {
    "1":   ("Scrum Master",          "docs/backlog/"),
    "2":   ("Requirements Analyst",  "docs/requirements/"),
    "3":   ("Architect",             "docs/architecture/"),
    "3b":  ("Documentation Agent",   "docs/deliverables/"),
    "4":   ("Developer",             "src/"),
    "5":   ("Code Reviewer",         "docs/quality/"),
    "5b":  ("Security Agent",        "docs/security/"),
    "6":   ("QA Tester",             "docs/quality/"),
    "7":   ("DevOps",                "infra/"),
    "8":   ("Documentation Agent",   "docs/deliverables/"),
    "9":   ("Workflow Manager",      ".sofia/"),
}

ORDERED_STEPS = ["1","2","3","3b","4","5","5b","6","7","8","9"]

def step_label(step):
    name, _ = PIPELINE_STEPS.get(str(step), (f"Step {step}", ""))
    return f"Step {step} — {name}"

def next_step(completed):
    for s in ORDERED_STEPS:
        if s not in [str(c) for c in completed]:
            return s
    return None

def artifact_count(artifacts):
    return sum(len(v) if isinstance(v, list) else 1 for v in artifacts.values())

def format_ts(ts):
    if not ts:
        return "desconocido"
    try:
        dt = datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
        return dt.strftime("%d/%m/%Y %H:%M UTC")
    except:
        return ts

def load_session():
    if not os.path.isfile(SESSION):
        return None, "session.json no encontrado"
    try:
        with open(SESSION) as f:
            return json.load(f), None
    except json.JSONDecodeError as e:
        return None, f"JSON inválido: {e}"

def list_snapshots():
    if not os.path.isdir(SNAPS):
        return []
    snaps = sorted([
        f for f in os.listdir(SNAPS)
        if f.startswith("step-") and f.endswith(".json")
    ], reverse=True)
    return snaps[:10]  # últimos 10

def show_artifacts(artifacts):
    if not artifacts:
        print(f"    (ninguno registrado)")
        return
    for step, paths in sorted(artifacts.items()):
        step_name, _ = PIPELINE_STEPS.get(str(step), (f"Step {step}", ""))
        if isinstance(paths, list):
            for p in paths:
                exists = "✅" if os.path.exists(os.path.join(REPO, p)) else "⚠️ "
                print(f"    {exists} [{step}] {p}")
        else:
            print(f"    [{step}] {paths}")

def save_session(data):
    data["updated_at"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(SESSION, "w") as f:
        json.dump(data, f, indent=2)

def write_log(entry):
    if os.path.isfile(LOG):
        with open(LOG, "a") as f:
            ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            f.write(f"[{ts}] [RESUME] [resume.py] {entry}\n")

# ── Modo JSON (para consumo programático desde el Orchestrator) ───────────────
def json_mode(session):
    status = session.get("status", "idle")
    completed = [str(c) for c in session.get("completed_steps", [])]
    nxt = next_step(completed)
    result = {
        "has_active_pipeline": status in ("in_progress", "gate_pending", "paused"),
        "status": status,
        "project": session.get("project", ""),
        "feature": session.get("feature", ""),
        "sprint": session.get("sprint"),
        "pipeline_type": session.get("pipeline_type"),
        "last_skill": session.get("last_skill"),
        "current_step": session.get("pipeline_step"),
        "completed_steps": completed,
        "next_step": nxt,
        "next_step_label": step_label(nxt) if nxt else None,
        "artifact_count": artifact_count(session.get("artifacts", {})),
        "updated_at": session.get("updated_at"),
        "gates": session.get("gates", {}),
        "security": session.get("security", {}),
    }
    print(json.dumps(result, indent=2))
    return 0 if result["has_active_pipeline"] else 1

# ── Modo interactivo (para ejecutar directamente en terminal) ─────────────────
def interactive_mode(session):
    status = session.get("status", "idle")

    if status not in ("in_progress", "gate_pending", "paused"):
        print(f"\n  {GREEN}✅ Sin pipeline activo{RESET} — status: {status}")
        print(f"  SOFIA lista para iniciar un nuevo pipeline.\n")
        return 1

    completed = [str(c) for c in session.get("completed_steps", [])]
    nxt       = next_step(completed)
    project   = session.get("project") or "desconocido"
    feature   = session.get("feature") or "desconocido"
    sprint    = session.get("sprint")  or "?"
    last      = session.get("last_skill") or "desconocido"
    updated   = format_ts(session.get("updated_at"))
    art_count = artifact_count(session.get("artifacts", {}))
    gate_info = ""
    if status == "gate_pending":
        gates = session.get("gates", {})
        pending = [k for k,v in gates.items() if isinstance(v,dict) and v.get("status") == "pending"]
        if pending:
            gate_info = f" — gate pendiente en step(s): {', '.join(pending)}"

    print()
    print(f"{BOLD}╔══════════════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}║   SOFIA v1.6 — Pipeline interrumpido detectado          ║{RESET}")
    print(f"{BOLD}╚══════════════════════════════════════════════════════════╝{RESET}")
    print()
    print(f"  {BOLD}Proyecto:{RESET}  {CYAN}{project}{RESET}")
    print(f"  {BOLD}Feature:{RESET}   {feature}   Sprint: {sprint}")
    print(f"  {BOLD}Estado:{RESET}    {YELLOW}{status}{RESET}{gate_info}")
    print(f"  {BOLD}Último skill:{RESET} {last}   ({updated})")
    print(f"  {BOLD}Completados:{RESET} {', '.join(completed) if completed else 'ninguno'}")
    print(f"  {BOLD}Artefactos:{RESET}  {art_count} fichero(s) registrado(s)")
    print()

    if nxt:
        nxt_label = step_label(nxt)
        print(f"  Siguiente paso pendiente: {BOLD}{nxt_label}{RESET}")
    print()

    # Mostrar artefactos si los hay
    artifacts = session.get("artifacts", {})
    if artifacts:
        print(f"  {BOLD}Artefactos generados:{RESET}")
        show_artifacts(artifacts)
        print()

    # Opciones
    print(f"  {BOLD}¿Qué deseas hacer?{RESET}")
    if nxt:
        print(f"  {GREEN}[A]{RESET} Retomar desde {nxt_label}")
        print(f"  {YELLOW}[B]{RESET} Re-ejecutar último step completado ({completed[-1] if completed else '—'})")
    print(f"  {BLUE}[C]{RESET} Reiniciar pipeline completo")
    print(f"  {BLUE}[D]{RESET} Ver resumen detallado de artefactos")
    snaps = list_snapshots()
    if snaps:
        print(f"  {BLUE}[E]{RESET} Restaurar desde snapshot ({len(snaps)} disponibles)")
    print(f"  {RED}[X]{RESET} Cancelar (mantener estado actual)")
    print()

    choice = input("  Selección [A/B/C/D/E/X]: ").strip().upper()
    print()

    if choice == "A" and nxt:
        session["status"] = "in_progress"
        save_session(session)
        write_log(f"RESUME_A → retomando desde step {nxt} ({nxt_label})")
        print(f"  {GREEN}✅ Pipeline retomado desde {nxt_label}{RESET}")
        print()
        print(f"  {BOLD}Prompt para el Orchestrator:{RESET}")
        print(f"  ─────────────────────────────────────────────────────")
        print(f"  Retoma el pipeline de {feature} (sprint {sprint}).")
        print(f"  Steps completados: {', '.join(completed) if completed else 'ninguno'}.")
        print(f"  Continúa desde {nxt_label}.")
        if artifacts:
            print(f"  Artefactos disponibles en session.json.artifacts.")
        print(f"  ─────────────────────────────────────────────────────")

    elif choice == "B" and completed:
        last_step = completed[-1]
        last_label = step_label(last_step)
        if last_step in completed:
            session["completed_steps"] = [c for c in completed if c != last_step]
        session["status"] = "in_progress"
        save_session(session)
        write_log(f"RESUME_B → re-ejecutando step {last_step} ({last_label})")
        print(f"  {YELLOW}⚠️  Step {last_step} marcado para re-ejecución{RESET}")
        print()
        print(f"  {BOLD}Prompt para el Orchestrator:{RESET}")
        print(f"  ─────────────────────────────────────────────────────")
        print(f"  Re-ejecuta el step {last_label} de {feature} (sprint {sprint}).")
        print(f"  El output anterior puede estar en {PIPELINE_STEPS.get(last_step, ('', ''))[1]}.")
        print(f"  ─────────────────────────────────────────────────────")

    elif choice == "C":
        confirm = input(f"  {RED}¿Confirmar reinicio completo? Se perderá el estado actual [s/N]: {RESET}").strip().lower()
        if confirm == "s":
            session["status"] = "idle"
            session["completed_steps"] = []
            session["artifacts"] = {}
            session["gates"] = {}
            session["pipeline_step"] = 0
            session["pipeline_step_name"] = None
            session["last_skill"] = None
            save_session(session)
            write_log("RESUME_C → pipeline reiniciado (reset completo)")
            print(f"  {GREEN}✅ Pipeline reiniciado{RESET}")
        else:
            print(f"  Cancelado — estado sin cambios")

    elif choice == "D":
        print(f"  {BOLD}Detalle completo de artefactos:{RESET}")
        show_artifacts(artifacts)
        if not artifacts:
            print(f"  (ninguno registrado en session.json)")

    elif choice == "E" and snaps:
        print(f"  {BOLD}Snapshots disponibles:{RESET}")
        for i, s in enumerate(snaps[:5]):
            print(f"  [{i+1}] {s}")
        idx = input("  Número de snapshot a restaurar: ").strip()
        try:
            snap_file = snaps[int(idx)-1]
            snap_path = os.path.join(SNAPS, snap_file)
            with open(snap_path) as f:
                snap_data = json.load(f)
            save_session(snap_data)
            write_log(f"RESUME_E → restaurado desde snapshot {snap_file}")
            print(f"  {GREEN}✅ session.json restaurado desde {snap_file}{RESET}")
        except (ValueError, IndexError):
            print(f"  {RED}Selección inválida{RESET}")

    elif choice == "X" or choice == "":
        write_log("RESUME_X → usuario canceló, sin cambios")
        print(f"  Estado sin cambios.")

    else:
        print(f"  {YELLOW}Opción no reconocida — sin cambios{RESET}")

    print()
    return 0

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    session, err = load_session()
    if err:
        if "--json" not in sys.argv:
            print(f"\n  {RED}❌ {err}{RESET}\n")
        sys.exit(2)

    if "--json" in sys.argv:
        sys.exit(json_mode(session))
    else:
        sys.exit(interactive_mode(session))

if __name__ == "__main__":
    main()
