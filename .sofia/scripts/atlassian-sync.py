#!/usr/bin/env python3
"""
SOFIA v1.7 — atlassian-sync.py (US-1002)
Sincronización bidireccional con Jira y Confluence al completar cada step.
Se invoca desde el Orchestrator después del POST-STEP VALIDATION.

Uso: python3 atlassian-sync.py [repo_path] [step] [feature] [status]
     python3 atlassian-sync.py ~/proyectos/bank-portal 5b FEAT-005 completed

El script genera el prompt que el atlassian-agent debe ejecutar via MCP.
También puede operar en modo --dry-run para previsualizar las acciones.
"""

import os, sys, json, datetime

REPO    = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/proyectos/bank-portal")
STEP    = sys.argv[2] if len(sys.argv) > 2 else None
FEATURE = sys.argv[3] if len(sys.argv) > 3 else None
STATUS  = sys.argv[4] if len(sys.argv) > 4 else "completed"
DRY_RUN = "--dry-run" in sys.argv

SESSION    = os.path.join(REPO, ".sofia", "session.json")
LOG        = os.path.join(REPO, ".sofia", "sofia.log")
CFG        = os.path.join(REPO, ".sofia", "sofia-config.json")

GREEN  = "\033[0;32m"; YELLOW = "\033[1;33m"; RED = "\033[0;31m"
BOLD   = "\033[1m";    RESET  = "\033[0m";    BLUE = "\033[0;34m"

# ── Configuración del proyecto ────────────────────────────────────────────────
def load_config():
    defaults = {
        "project": "bank-portal",
        "client": "Experis",
        "jira_project_key": "BP",
        "confluence_space": "BANKPORTAL",
        "sprint_length": 14,
    }
    if os.path.isfile(CFG):
        try:
            d = json.load(open(CFG))
            defaults.update(d)
        except: pass
    return defaults

def load_session():
    if os.path.isfile(SESSION):
        try: return json.load(open(SESSION))
        except: pass
    return {}

# ── Mapeo step → acciones Jira/Confluence ─────────────────────────────────────
STEP_ACTIONS = {
    "1": {
        "jira_transition": "In Progress",
        "jira_comment": "Sprint planning completado. Backlog item creado por SOFIA.",
        "confluence_page": "Sprint Planning",
        "confluence_section": "Backlog",
        "artifacts_label": "backlog",
    },
    "2": {
        "jira_transition": "Requirements Review",
        "jira_comment": "User Stories y criterios de aceptación generados por SOFIA Requirements Analyst.",
        "confluence_page": "Requirements",
        "confluence_section": "User Stories",
        "artifacts_label": "requirements",
    },
    "3": {
        "jira_transition": "Architecture Review",
        "jira_comment": "HLD y LLD generados por SOFIA Architect. Pendiente aprobación tech-lead.",
        "confluence_page": "Architecture",
        "confluence_section": "HLD/LLD",
        "artifacts_label": "architecture",
    },
    "3b": {
        "jira_transition": None,  # Sin transición — step automático
        "jira_comment": "Diagramas de arquitectura y documentos Word generados por SOFIA Documentation Agent.",
        "confluence_page": "Architecture",
        "confluence_section": "Diagrams",
        "artifacts_label": "deliverables",
    },
    "4": {
        "jira_transition": "In Review",
        "jira_comment": "Implementación completada por SOFIA Developer. Listo para Code Review.",
        "confluence_page": "Development",
        "confluence_section": "Implementation",
        "artifacts_label": "src",
    },
    "5": {
        "jira_transition": "Code Review",
        "jira_comment": "Code Review completado por SOFIA Code Reviewer.",
        "confluence_page": "Quality",
        "confluence_section": "Code Review",
        "artifacts_label": "quality",
    },
    "5b": {
        "jira_transition": "Security Review",
        "jira_comment": "Security scan completado. Ver SecurityReport adjunto.",
        "confluence_page": "Security",
        "confluence_section": "Security Report",
        "artifacts_label": "security",
    },
    "6": {
        "jira_transition": "QA",
        "jira_comment": "QA Testing completado por SOFIA QA Tester. Pendiente aceptación product-owner.",
        "confluence_page": "Quality",
        "confluence_section": "Test Results",
        "artifacts_label": "quality",
    },
    "7": {
        "jira_transition": "Ready for Release",
        "jira_comment": "Pipeline CI/CD configurado por SOFIA DevOps. Release notes generadas.",
        "confluence_page": "DevOps",
        "confluence_section": "CI/CD",
        "artifacts_label": "infra",
    },
    "8": {
        "jira_transition": "Documentation Review",
        "jira_comment": "Paquete de documentación cliente generado por SOFIA Documentation Agent.",
        "confluence_page": "Deliverables",
        "confluence_section": "Client Package",
        "artifacts_label": "deliverables",
    },
    "9": {
        "jira_transition": "Done",
        "jira_comment": "Feature completada y aceptada por el cliente. Pipeline SOFIA cerrado.",
        "confluence_page": "Sprint Review",
        "confluence_section": "Acceptance",
        "artifacts_label": "all",
    },
}

def get_artifacts_for_step(session, step):
    artifacts = session.get("artifacts", {})
    return artifacts.get(str(step), [])

def build_jira_prompt(cfg, session, step, feature, status):
    """Genera el prompt para que atlassian-agent ejecute las acciones Jira."""
    action = STEP_ACTIONS.get(str(step), {})
    artifacts = get_artifacts_for_step(session, step)
    sprint    = session.get("sprint", "?")
    project   = cfg["jira_project_key"]

    # Buscar la US correspondiente al feature en Jira
    jql = f'project = {project} AND labels = "{feature}" AND sprint in openSprints()'

    lines = [
        f"# SOFIA Atlassian Sync — Step {step} — {feature}",
        "",
        "## Acción requerida en Jira",
        "",
        f"Buscar issues con JQL: `{jql}`",
        "",
    ]

    if action.get("jira_transition"):
        lines += [
            f"Para cada issue encontrado:",
            f"1. Transicionar a estado: **{action['jira_transition']}**",
            f"2. Añadir comentario:",
            f"   ```",
            f"   {action['jira_comment']}",
        ]
        if artifacts:
            lines.append("   Artefactos generados:")
            for a in artifacts[:5]:
                lines.append(f"   · {a}")
        lines += [
            f"   Generado por SOFIA v1.7 — Sprint {sprint} — {datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}",
            f"   ```",
        ]
    else:
        lines += [
            f"Añadir comentario (sin cambio de estado):",
            f"```",
            f"{action.get('jira_comment', 'Step completado por SOFIA.')}",
            f"```",
        ]

    # Gate actions
    gates = session.get("gates", {})
    gate  = gates.get(str(step), {})
    if gate.get("status") == "approved":
        lines += [
            "",
            f"3. Registrar aprobación de gate:",
            f"   Aprobado por: {gate.get('by', '—')} · {gate.get('at', '—')}",
        ]
    elif gate.get("status") == "rejected":
        lines += [
            "",
            f"3. Registrar RECHAZO de gate — crear subtask NC:",
            f"   Rechazado por: {gate.get('by', '—')}",
            f"   Acción: crear issue de tipo Bug con label NC-{feature}",
        ]

    return "\n".join(lines)

def build_confluence_prompt(cfg, session, step, feature):
    """Genera el prompt para que atlassian-agent actualice Confluence."""
    action    = STEP_ACTIONS.get(str(step), {})
    artifacts = get_artifacts_for_step(session, step)
    space     = cfg["confluence_space"]
    sprint    = session.get("sprint", "?")
    page      = action.get("confluence_page", f"Sprint {sprint}")
    section   = action.get("confluence_section", f"Step {step}")

    lines = [
        f"## Acción requerida en Confluence",
        "",
        f"Espacio: **{space}**",
        f"Página: **Sprint {sprint} — {page}**",
        "",
        f"Buscar o crear la página 'Sprint {sprint} — {page}' en el espacio {space}.",
        f"Añadir o actualizar la sección '{section}' con:",
        "",
        f"| Campo | Valor |",
        f"|-------|-------|",
        f"| Feature | {feature} |",
        f"| Step | {step} |",
        f"| Estado | {session.get('status', '—')} |",
        f"| Completado | {datetime.datetime.utcnow().strftime('%d/%m/%Y %H:%M')} |",
    ]

    if artifacts:
        lines += ["", "**Artefactos adjuntos:**"]
        for a in artifacts[:8]:
            fname = os.path.basename(a)
            full  = os.path.join(REPO, a)
            exists = "✅" if os.path.isfile(full) else "⚠️"
            lines.append(f"- {exists} [{fname}]({a})")

    sec = session.get("security", {})
    if step == "5b" and sec.get("scan_status") == "completed":
        lines += [
            "",
            "**Resultado Security Scan:**",
            f"- Semáforo: {sec.get('semaphore', '—').upper()}",
            f"- CVE críticos: {sec.get('cve_critical', 0)}",
            f"- CVE altos: {sec.get('cve_high', 0)}",
            f"- Secrets encontrados: {sec.get('secrets_found', 0)}",
        ]

    return "\n".join(lines)

def write_log(msg):
    if os.path.isfile(LOG):
        ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(LOG, "a") as f:
            f.write(f"[{ts}] [SYNC] [atlassian-sync.py] {msg}\n")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    cfg     = load_config()
    session = load_session()

    # Si no se pasaron args, usar la sesión actual
    step    = STEP    or str(session.get("pipeline_step", "1"))
    feature = FEATURE or session.get("feature", "FEAT-XXX")

    print()
    print(f"{BOLD}╔══════════════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}║   SOFIA v1.7 — Atlassian Sync                          ║{RESET}")
    print(f"{BOLD}╚══════════════════════════════════════════════════════════╝{RESET}")
    print(f"  Proyecto: {cfg['project']} · Step: {step} · Feature: {feature}")
    if DRY_RUN:
        print(f"  {YELLOW}[DRY RUN — sin cambios reales]{RESET}")
    print()

    jira_prompt       = build_jira_prompt(cfg, session, step, feature, STATUS)
    confluence_prompt = build_confluence_prompt(cfg, session, step, feature)

    # Guardar prompts en .sofia/ para que el Orchestrator los pase al atlassian-agent
    out_dir = os.path.join(REPO, ".sofia", "sync")
    os.makedirs(out_dir, exist_ok=True)

    ts_short = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    jira_file = os.path.join(out_dir, f"jira-sync-step{step}-{ts_short}.md")
    conf_file = os.path.join(out_dir, f"confluence-sync-step{step}-{ts_short}.md")

    if not DRY_RUN:
        with open(jira_file, "w") as f:
            f.write(jira_prompt)
        with open(conf_file, "w") as f:
            f.write(confluence_prompt)
        write_log(f"SYNC_GENERATED → step={step} feature={feature} jira={jira_file}")
        print(f"  {GREEN}✅{RESET} Prompts generados:")
        print(f"     · {jira_file}")
        print(f"     · {conf_file}")
    else:
        print(f"  {BLUE}Jira prompt preview:{RESET}")
        print("-" * 60)
        print(jira_prompt)
        print()
        print(f"  {BLUE}Confluence prompt preview:{RESET}")
        print("-" * 60)
        print(confluence_prompt)

    # Instrucción al Orchestrator
    print()
    print(f"{BOLD}  Instrucción para el Orchestrator:{RESET}")
    print(f"  ─────────────────────────────────────────────────────────")
    print(f"  Pasar los archivos de .sofia/sync/ al atlassian-agent")
    print(f"  con instrucción:")
    print(f"  'Ejecuta las acciones descritas en estos archivos usando")
    print(f"   las herramientas MCP de Jira y Confluence disponibles.'")
    print(f"  ─────────────────────────────────────────────────────────")
    print()

if __name__ == "__main__":
    main()
