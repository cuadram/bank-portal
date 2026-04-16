#!/usr/bin/env python3
"""
gen-lessons-learned.py — SOFIA v2.6 (GENERICO)
Regenera LESSONS_LEARNED.md desde session.json (LA-022-02).

REGLA DE PERSISTENCIA DE LAs (LA-LL-RULE):
  - session.json.lessons_learned[]  → fuente viva durante el pipeline
  - LESSONS_LEARNED.md              → generado SIEMPRE desde session.json (este script)
  - LESSONS_LEARNED_CORE.md         → copia READ-ONLY de SOFIA-CORE (nunca editar en proyecto)

Verificaciones incluidas:
  1. LESSONS_LEARNED_CORE.md == SOFIA-CORE version (warn si desincronizado)
  2. LESSONS_LEARNED.md nunca tiene LAs que no estén en session.json (detecta edición manual)
"""
import json, os, sys, re
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# Resolver ROOT desde la ubicacion del script (.sofia/scripts/)
_SCRIPT_DIR = Path(__file__).parent
ROOT    = _SCRIPT_DIR.parent.parent.resolve()
SESSION = ROOT / '.sofia' / 'session.json'
OUTPUT  = ROOT / 'LESSONS_LEARNED.md'
LOG     = ROOT / '.sofia' / 'sofia.log'

# Ruta a SOFIA-CORE (para verificar sincronía de LESSONS_LEARNED_CORE.md)
CORE_CANDIDATES = [
    _SCRIPT_DIR.parent.parent.parent / 'SOFIA-CORE',                     # OneDrive/WIP/SOFIA-CORE
    Path.home() / 'Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE',
    Path.home() / 'OneDrive/WIP/SOFIA-CORE',
]

def _find_core():
    for p in CORE_CANDIDATES:
        if p.exists():
            return p
    return None

def _read_project():
    cfg_path = ROOT / '.sofia' / 'sofia-config.json'
    ses_path = ROOT / '.sofia' / 'session.json'
    project, client = 'Proyecto', 'Cliente'
    for fpath in [cfg_path, ses_path]:
        if fpath.exists():
            try:
                d = json.loads(fpath.read_text())
                project = d.get('project', project)
                client  = d.get('client',  client)
                break
            except Exception: pass
    return project, client

PROJECT_NAME, CLIENT_NAME = _read_project()

TYPE_EMOJI = {
    'process': '🔄', 'testing': '🧪', 'backend': '☕', 'frontend': '🅰️',
    'architecture': '🏗️', 'security': '🔒', 'dashboard': '📊', 'devops': '🚀',
    'database': '🗄️', 'config': '⚙️', 'data': '📦', 'code-review': '👁️',
    'documentation': '📄', 'technical': '⚙️', 'infrastructure': '🖥️',
    'ux': '🎨', 'onboarding': '🚀',
}

PERMANENT_RULES_GENERIC = [
    ('LA-018-01', 'SIEMPRE leer session.json desde disco antes de actuar en continuacion de sesion'),
    ('LA-020-01', 'Jira transiciona en cada gate del pipeline sin instruccion explicita'),
    ('LA-020-02', 'CVSS >= 4.0 se resuelve en el mismo sprint — nunca diferir'),
    ('LA-020-07', 'Dashboard regenerado en cada gate (GR-011)'),
    ('LA-020-08', 'gen-fa-document.py obligatorio en Step 8b — verificacion blocking'),
    ('LA-020-09', 'Developer verifica package/namespace raiz ANTES de crear ficheros'),
    ('LA-020-10', 'Code Reviewer contrasta namespaces nuevos contra codebase real'),
    ('LA-020-11', 'Test de integracion BLOQUEANTE para G-4b — sin BUILD SUCCESS no hay gate'),
    ('LA-021-01', 'FA-Agent: total_business_rules dinamico — validate-fa-index en 2b/3b/8b'),
    ('LA-021-02', 'Base de tests declara TODOS los fixtures comunes (IDs, UUIDs, mocks)'),
    ('LA-021-03', 'Doc Agent: 17 DOCX + 3 XLSX REALES OBLIGATORIOS — bloqueante G-8'),
    ('LA-022-02', 'Step 9 regenera LESSONS_LEARNED.md desde session.json (este script)'),
    ('LA-022-05', 'Dashboard actualizado en CADA gate (GR-011 bloqueante)'),
    ('LA-022-07', 'Step 3b OBLIGATORIO post G-3 — verificar completed_steps antes de Step 4'),
    ('LA-022-08', 'Doc Agent genera BINARIOS REALES (.docx/.xlsx) — NUNCA .md como entregable'),
    ('LA-FRONT-001', 'Modulo/componente nuevo → ruta registrada + nav item en MISMO step'),
    ('LA-FRONT-004', 'Verificar endpoint backend existe ANTES de registrar ruta frontend'),
    ('LA-CORE-003', 'GR-CORE-003: SOFIA_REPO verificado en INIT y antes de cada escritura'),
    ('LA-CORE-004', 'Estructura canonica de directorios copiada desde repo-template al crear proyecto'),
]


def verify_core_sync():
    """
    Verifica que LESSONS_LEARNED_CORE.md del proyecto es la misma version que SOFIA-CORE.
    Imprime WARN si están desincronizados. No bloquea — es informativo.
    """
    core_dir = _find_core()
    if not core_dir:
        print('WARN: SOFIA-CORE no encontrado — no se puede verificar sincronía de LESSONS_LEARNED_CORE.md')
        return

    core_ll   = core_dir / 'LESSONS_LEARNED_CORE.md'
    local_ll  = ROOT / 'LESSONS_LEARNED_CORE.md'

    if not core_ll.exists():
        print(f'WARN: {core_ll} no existe en SOFIA-CORE')
        return
    if not local_ll.exists():
        print(f'WARN: LESSONS_LEARNED_CORE.md no existe en el proyecto — copiando desde CORE')
        import shutil
        shutil.copy2(str(core_ll), str(local_ll))
        print(f'OK LESSONS_LEARNED_CORE.md copiado desde CORE ({os.path.getsize(str(local_ll))}B)')
        return

    sz_core  = os.path.getsize(str(core_ll))
    sz_local = os.path.getsize(str(local_ll))
    if sz_core != sz_local:
        print(f'WARN: LESSONS_LEARNED_CORE.md desincronizado — CORE={sz_core}B local={sz_local}B')
        print(f'      Actualizando desde SOFIA-CORE...')
        import shutil
        shutil.copy2(str(core_ll), str(local_ll))
        print(f'OK LESSONS_LEARNED_CORE.md sincronizado ({sz_core}B)')
    else:
        print(f'OK LESSONS_LEARNED_CORE.md sincronizado con SOFIA-CORE ({sz_core}B)')


def verify_no_manual_edits(las):
    """
    Verifica que LESSONS_LEARNED.md no tenga LAs que no estén en session.json.
    Si las tiene → la MD fue editada manualmente (violación de la regla).
    Imprime WARN con los IDs afectados.
    """
    if not OUTPUT.exists():
        return  # Primera generación, no hay nada que verificar

    existing = OUTPUT.read_text()
    ids_in_md      = set(re.findall(r'### (LA-[\w-]+)', existing))
    ids_in_session = {la.get('id', '') for la in las}

    only_in_md = ids_in_md - ids_in_session - {'LA-018-01'}  # excluir permanentes genéricas
    # Filtrar IDs de reglas permanentes
    permanent_ids = {la_id for la_id, _ in PERMANENT_RULES_GENERIC}
    only_in_md -= permanent_ids

    if only_in_md:
        print(f'WARN: LAs en LESSONS_LEARNED.md que NO están en session.json (edición manual):')
        for la_id in sorted(only_in_md):
            print(f'      → {la_id}')
        print(f'      Acción requerida: migrar estas LAs a session.json.lessons_learned[]')
        print(f'      El .md será regenerado desde session.json (las LAs manuales se perderán)')


def main():
    if not SESSION.exists():
        print(f'ERROR: {SESSION} no encontrado')
        sys.exit(1)

    s   = json.loads(SESSION.read_text())
    las = s.get('lessons_learned', [])
    now = datetime.utcnow().strftime('%Y-%m-%d')

    # ── Verificaciones ────────────────────────────────────────────────────────
    print('Verificando consistencia de LAs...')
    verify_core_sync()
    verify_no_manual_edits(las)

    # ── Generar LESSONS_LEARNED.md ────────────────────────────────────────────
    lines = [
        f'# LESSONS LEARNED — {PROJECT_NAME} · SOFIA v{s.get("sofia_version","2.6")}',
        f'**Proyecto:** {PROJECT_NAME} · {CLIENT_NAME}',
        f'**Actualizado:** {now} | **Total:** {len(las)} lecciones',
        f'**Versión SOFIA:** {s.get("sofia_version","2.6")}',
        '',
        '> ⚠️ **ARCHIVO GENERADO AUTOMÁTICAMENTE — NO EDITAR DIRECTAMENTE**',
        '> **Fuente canónica:** `.sofia/session.json` campo `lessons_learned[]`',
        '> **Regenerar:** ejecutar `.sofia/scripts/gen-lessons-learned.py` en Step 9',
        '> **LAs del framework:** ver `LESSONS_LEARNED_CORE.md` (solo lectura, copia de SOFIA-CORE)',
        '',
        '---',
        '',
    ]

    by_sprint = defaultdict(list)
    for la in las:
        by_sprint[la.get('sprint', 'CORE')].append(la)

    for sp in sorted(by_sprint.keys(), key=lambda x: (0, x) if isinstance(x, str) else (1, x)):
        lines.append(f'## Sprint {sp}' if isinstance(sp, int) else f'## {sp}')
        lines.append('')
        for la in by_sprint[sp]:
            emoji = TYPE_EMOJI.get(la.get('type', ''), '📌')
            lines.append(f'### {la["id"]} — {emoji} [{la.get("type","").upper()}]')
            lines.append(f'**Descripción:** {la["description"]}')
            lines.append(f'**Corrección:** {la["correction"]}')
            if la.get('registered_at'):
                lines.append(f'**Registrado:** {la["registered_at"][:10]}')
            if la.get('core_la'):
                lines.append(f'**Consolidado en SOFIA-CORE:** {la["core_la"]}')
            lines.append('')

    lines += [
        '---',
        '',
        '## Índice por Tipo',
        '',
    ]
    by_type = defaultdict(list)
    for la in las:
        by_type[la.get('type','process')].append(la['id'])
    for t in sorted(by_type.keys()):
        lines.append(f'- **{t}:** {", ".join(by_type[t])}')
    lines.append('')
    lines += [
        '---',
        '',
        '## Reglas Permanentes Activas (SOFIA v2.6)',
        '',
        '| ID | Regla |',
        '|---|---|',
    ]
    for la_id, rule in PERMANENT_RULES_GENERIC:
        lines.append(f'| {la_id} | {rule} |')
    lines.append('')

    content = '\n'.join(lines)
    OUTPUT.write_text(content)

    # ── Log ───────────────────────────────────────────────────────────────────
    log_entry = (f'[{datetime.utcnow().isoformat()}Z] [gen-lessons-learned] '
                 f'LESSONS_LEARNED.md regenerado — {len(las)} LAs — '
                 f'{PROJECT_NAME}/{CLIENT_NAME}\n')
    try:
        with open(LOG, 'a') as f:
            f.write(log_entry)
    except Exception: pass

    print(f'OK LESSONS_LEARNED.md: {len(las)} LAs | {PROJECT_NAME} · {CLIENT_NAME} | {len(lines)} lineas')

if __name__ == '__main__':
    main()
