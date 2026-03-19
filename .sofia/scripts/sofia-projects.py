#!/usr/bin/env python3
"""
SOFIA v1.7 — sofia-projects.py (US-1201)
Gestiona múltiples proyectos SOFIA en paralelo.
Cada proyecto tiene su propio .sofia/ independiente.

Uso:
  python3 sofia-projects.py list                    ← listar proyectos registrados
  python3 sofia-projects.py add ~/proyectos/nuevo   ← registrar nuevo proyecto
  python3 sofia-projects.py status                  ← estado de todos los proyectos
  python3 sofia-projects.py switch banco            ← cambiar proyecto activo
  python3 sofia-projects.py remove banco            ← eliminar registro (no borra el repo)
"""

import os, sys, json, datetime

# Registro global de proyectos — en el home del usuario
REGISTRY = os.path.expanduser("~/.sofia/projects.json")
os.makedirs(os.path.dirname(REGISTRY), exist_ok=True)

GREEN  = "\033[0;32m"; YELLOW = "\033[1;33m"; RED = "\033[0;31m"
BLUE   = "\033[0;34m"; BOLD   = "\033[1m";    RESET  = "\033[0m"; CYAN = "\033[0;36m"

PIPELINE_STEP_NAMES = {
    "0": "idle", "1": "scrum-master", "2": "requirements", "3": "architect",
    "3b": "docs", "4": "developer", "5": "code-reviewer",
    "5b": "security", "6": "qa", "7": "devops", "8": "docs-final", "9": "delivery"
}

def load_registry():
    if os.path.isfile(REGISTRY):
        try:
            return json.load(open(REGISTRY))
        except Exception:
            pass
    return {"projects": {}, "active": None}

def save_registry(reg):
    with open(REGISTRY, "w") as f:
        json.dump(reg, f, indent=2)

def load_project_data(repo_path):
    """Carga datos de un proyecto desde su .sofia/"""
    data = {"config": {}, "session": {}, "valid": False}
    cfg_path = os.path.join(repo_path, ".sofia", "sofia-config.json")
    ses_path = os.path.join(repo_path, ".sofia", "session.json")
    if os.path.isfile(cfg_path):
        try:
            data["config"] = json.load(open(cfg_path))
            data["valid"] = True
        except Exception:
            pass
    if os.path.isfile(ses_path):
        try:
            data["session"] = json.load(open(ses_path))
        except Exception:
            pass
    return data

def status_color(status):
    if status == "idle":         return GREEN + status + RESET
    if status == "in_progress":  return BLUE + status + RESET
    if status == "gate_pending": return YELLOW + status + RESET
    if status == "paused":       return YELLOW + status + RESET
    if status == "completed":    return GREEN + status + RESET
    return RESET + status + RESET

def cmd_list(reg):
    projects = reg.get("projects", {})
    active   = reg.get("active")
    if not projects:
        print("\n  " + YELLOW + "No hay proyectos registrados." + RESET)
        print("  Añadir con: python3 sofia-projects.py add ~/proyectos/mi-proyecto\n")
        return
    print()
    print(BOLD + "  Proyectos SOFIA registrados:" + RESET)
    print()
    for alias, repo in sorted(projects.items()):
        marker = " ◀ activo" if alias == active else ""
        d = load_project_data(repo)
        cfg = d["config"]
        name   = cfg.get("project", alias)
        client = cfg.get("client", "—")
        valid  = GREEN + "✅" + RESET if d["valid"] else RED + "❌" + RESET
        print("  " + valid + " " + BOLD + alias + RESET + marker)
        print("       " + BLUE + repo + RESET)
        print("       " + name + " · " + client)
        print()

def cmd_status(reg):
    projects = reg.get("projects", {})
    active   = reg.get("active")
    if not projects:
        print("\n  " + YELLOW + "No hay proyectos registrados.\n" + RESET)
        return
    print()
    print(BOLD + "  Estado de todos los proyectos SOFIA:" + RESET)
    print()

    # Header tabla
    print("  {:<16} {:<20} {:<12} {:<10} {:<14} {:<8}".format(
        "Alias", "Proyecto", "Estado", "Sprint", "Feature", "Step"))
    print("  " + "─"*80)

    for alias, repo in sorted(projects.items()):
        d = load_project_data(repo)
        cfg = d["config"]; ses = d["session"]
        name     = cfg.get("project", alias)[:19]
        status   = ses.get("status", "idle")
        sprint   = str(ses.get("sprint") or "—")
        feature  = str(ses.get("feature") or "—")[:13]
        step     = str(ses.get("pipeline_step") or "0")
        step_name = PIPELINE_STEP_NAMES.get(step, step)[:7]
        marker   = " ◀" if alias == active else ""

        st_color = GREEN if status in ("idle","completed") else BLUE if status=="in_progress" \
                   else YELLOW if "pending" in status or "paused" in status else RESET

        print("  {:<16} {:<20} ".format(alias+marker, name) +
              st_color + "{:<12}".format(status) + RESET +
              " {:<10} {:<14} {:<8}".format(sprint, feature, step_name))

        # Mostrar NCs abiertas si las hay
        ncs = ses.get("ncs", {})
        open_ncs = [k for k,v in ncs.items() if isinstance(v,dict) and v.get("status")=="open"]
        if open_ncs:
            print("  " + " "*16 + RED + "  ⚠ NCs abiertas: " + ", ".join(open_ncs) + RESET)
    print()

def cmd_add(reg, repo_path):
    repo_path = os.path.expanduser(repo_path)
    if not os.path.isdir(repo_path):
        print(RED + "  ❌ Directorio no existe: " + repo_path + RESET)
        sys.exit(1)

    d = load_project_data(repo_path)
    cfg = d["config"]
    project_name = cfg.get("project", os.path.basename(repo_path))

    # Sugerir alias
    default_alias = project_name.lower().replace(" ","_").replace("-","_")[:12]
    alias = input("  Alias para este proyecto [" + default_alias + "]: ").strip() or default_alias

    if alias in reg["projects"]:
        overwrite = input("  El alias '" + alias + "' ya existe. ¿Sobreescribir? [s/N]: ").strip().lower()
        if overwrite != "s":
            print("  Cancelado.")
            return

    reg["projects"][alias] = repo_path
    if not reg.get("active"):
        reg["active"] = alias

    # Inicializar .sofia/ si no existe
    sofia_dir = os.path.join(repo_path, ".sofia")
    if not os.path.isdir(sofia_dir):
        print("  " + YELLOW + ".sofia/ no encontrado. Ejecutar setup primero:" + RESET)
        print("  bash " + repo_path + "/.sofia/scripts/setup-sofia-mac.sh")
    else:
        if not d["valid"]:
            print("  " + YELLOW + "⚠ sofia-config.json no encontrado. Ejecutar:" + RESET)
            print("  python3 " + repo_path + "/.sofia/scripts/sofia-wizard.py")

    save_registry(reg)
    print(GREEN + "  ✅ Proyecto '" + alias + "' registrado: " + repo_path + RESET)
    if reg["active"] == alias:
        print("  Proyecto activo: " + alias)

def cmd_switch(reg, alias):
    if alias not in reg.get("projects", {}):
        print(RED + "  ❌ Proyecto '" + alias + "' no encontrado." + RESET)
        print("  Proyectos disponibles: " + ", ".join(reg.get("projects", {}).keys()))
        sys.exit(1)
    reg["active"] = alias
    save_registry(reg)
    repo = reg["projects"][alias]
    d = load_project_data(repo)
    cfg = d["config"]
    print(GREEN + "  ✅ Proyecto activo: " + alias + " (" + cfg.get("project", alias) + ")" + RESET)
    print("  Repo: " + BLUE + repo + RESET)

def cmd_remove(reg, alias):
    if alias not in reg.get("projects", {}):
        print(RED + "  ❌ Proyecto '" + alias + "' no encontrado." + RESET)
        sys.exit(1)
    confirm = input("  ¿Eliminar registro de '" + alias + "'? (el repo NO se borra) [s/N]: ").strip().lower()
    if confirm != "s":
        print("  Cancelado.")
        return
    del reg["projects"][alias]
    if reg.get("active") == alias:
        remaining = list(reg["projects"].keys())
        reg["active"] = remaining[0] if remaining else None
    save_registry(reg)
    print(YELLOW + "  Proyecto '" + alias + "' eliminado del registro." + RESET)
    if reg.get("active"):
        print("  Proyecto activo ahora: " + reg["active"])

def cmd_active_path(reg):
    """Retorna el path del proyecto activo (para scripts externos)."""
    active = reg.get("active")
    if active and active in reg.get("projects", {}):
        print(reg["projects"][active])
    else:
        print("")

def main():
    args = sys.argv[1:]
    reg  = load_registry()

    if not args or args[0] == "list":
        cmd_list(reg)
    elif args[0] == "status":
        cmd_status(reg)
    elif args[0] == "add" and len(args) > 1:
        cmd_add(reg, args[1])
    elif args[0] == "switch" and len(args) > 1:
        cmd_switch(reg, args[1])
    elif args[0] == "remove" and len(args) > 1:
        cmd_remove(reg, args[1])
    elif args[0] == "active-path":
        cmd_active_path(reg)
    else:
        print()
        print(BOLD + "  sofia-projects.py — Gestión multi-proyecto SOFIA" + RESET)
        print()
        print("  Uso:")
        print("  python3 sofia-projects.py list              ← listar proyectos")
        print("  python3 sofia-projects.py status            ← estado de todos")
        print("  python3 sofia-projects.py add ~/ruta/repo   ← registrar proyecto")
        print("  python3 sofia-projects.py switch alias      ← cambiar activo")
        print("  python3 sofia-projects.py remove alias      ← eliminar registro")
        print()

if __name__ == "__main__":
    main()
