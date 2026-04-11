#!/usr/bin/env python3
"""
validate-fa-completeness.py — SOFIA v2.6 FA-Agent Gate 8b
Valida el Análisis Funcional contra la historia completa del proyecto
y genera un Informe de No Conformidad (NC) para el Product Owner.

Uso:
  python3 .sofia/scripts/validate-fa-completeness.py [--sprint N] [--output path]

Salidas:
  - docs/quality/NC-FA-Sprint{N}-{fecha}.md   (siempre)
  - stdout con resumen ejecutivo
  - session.json: fa_agent.nc_report actualizado
  - EXIT 0: sin NCs bloqueantes
  - EXIT 1: hay NCs bloqueantes — PO debe decidir antes de cerrar Gate 8b

Checks realizados (15 en total):
  NC-FA-01: Sprints cerrados sin funcionalidades en FA
  NC-FA-02: Funcionalidades PLANNED en sprints ya cerrados
  NC-FA-03: Actores del sistema incompletos o ausentes
  NC-FA-04: Funcionalidades sin reglas de negocio
  NC-FA-05: total_functionalities / total_business_rules desincronizados
  NC-FA-06: Sprints en sprint_history sin cobertura en FA
  NC-FA-07: Descripción del proyecto ausente o genérica
  NC-FA-08: Glosario vacío o insuficiente (< 5 términos)
  NC-FA-09: Regulaciones/marco normativo ausente
  NC-FA-10: User Stories del sprint sin FA asociada
  NC-FA-11: FA sin campo 'source' (trazabilidad al sprint)
  NC-FA-12: Doc history desincronizado con número de sprints
  NC-FA-13: Business rules duplicadas (mismo id en varios FA)
  NC-FA-14: FA del sprint actual no marcadas DELIVERED
  NC-FA-15: Sprint 2+ sin funcionalidades propias (solo modificaciones)
"""

import json, os, sys, re, datetime
from pathlib import Path
from collections import defaultdict

# ── Rutas ─────────────────────────────────────────────────────────────────────
_SCRIPT_DIR  = Path(__file__).parent
PROJECT_ROOT = Path(os.path.realpath(_SCRIPT_DIR / '..' / '..')).resolve()

FA_INDEX     = PROJECT_ROOT / 'docs' / 'functional-analysis' / 'fa-index.json'
SESSION      = PROJECT_ROOT / '.sofia' / 'session.json'
QUALITY_DIR  = PROJECT_ROOT / 'docs' / 'quality'
LOG          = PROJECT_ROOT / '.sofia' / 'sofia.log'

# ── Severidades ───────────────────────────────────────────────────────────────
SEV_BLOCKER  = 'BLOQUEANTE'   # PO debe resolver antes de cerrar Gate 8b
SEV_MAJOR    = 'MAYOR'        # PO debe decidir: aceptar deuda o corregir
SEV_MINOR    = 'MENOR'        # Recomendación de mejora

SEV_ICON = {
    SEV_BLOCKER: '🔴',
    SEV_MAJOR:   '🟡',
    SEV_MINOR:   '🔵',
}


def load_data():
    if not FA_INDEX.exists():
        print(f'ERROR: fa-index.json no encontrado en {FA_INDEX}')
        sys.exit(2)
    if not SESSION.exists():
        print(f'ERROR: session.json no encontrado en {SESSION}')
        sys.exit(2)

    fa  = json.loads(FA_INDEX.read_text())
    s   = json.loads(SESSION.read_text())
    return fa, s


def sprint_sort_key(sp):
    try: return int(str(sp).split('-')[0])
    except: return 999


# ── Checks ────────────────────────────────────────────────────────────────────

def check_nc_fa_01(fa, s, ncs):
    """Sprints cerrados sin ninguna funcionalidad en FA."""
    history = s.get('sprint_history', {})
    fa_sprints = set(str(f.get('sprint','?')) for f in fa.get('functionalities',[]))
    for k, h in history.items():
        if h.get('status') != 'completed': continue
        sp_num = k.replace('sprint_','')
        if sp_num not in fa_sprints:
            ncs.append({
                'id': 'NC-FA-01', 'sev': SEV_BLOCKER,
                'title': f'Sprint {sp_num} ({h.get("feature","?")}) sin funcionalidades en FA',
                'detail': f'El sprint {sp_num} está cerrado en sprint_history (rel={h.get("rel","?")}) '
                          f'pero no tiene ninguna funcionalidad documentada en fa-index.json.',
                'accion': f'Documentar las funcionalidades del Sprint {sp_num} en fa-index.json '
                          f'o registrar justificación de exclusión.',
            })


def check_nc_fa_02(fa, s, ncs):
    """Funcionalidades PLANNED en sprints ya cerrados."""
    history = s.get('sprint_history', {})
    closed_sprints = {k.replace('sprint_','') for k,h in history.items()
                      if h.get('status') == 'completed'}
    current = str(s.get('current_sprint', 9999))

    for f in fa.get('functionalities', []):
        sp = str(f.get('sprint','?'))
        if sp in closed_sprints and sp != current:
            status = f.get('status','')
            if status != 'DELIVERED':
                ncs.append({
                    'id': 'NC-FA-02', 'sev': SEV_BLOCKER,
                    'title': f'{f["id"]} en Sprint {sp} (cerrado) con status={status}',
                    'detail': f'La funcionalidad {f["id"]} — "{f.get("name",f.get("title","?"))}" '
                              f'pertenece al Sprint {sp} que ya está cerrado pero su status '
                              f'es "{status}" en lugar de "DELIVERED".',
                    'accion': 'Marcar como DELIVERED o eliminar del FA si nunca se implementó.',
                })


def check_nc_fa_03(fa, s, ncs):
    """Actores del sistema incompletos o ausentes."""
    actors = fa.get('actors', [])
    if not actors:
        ncs.append({
            'id': 'NC-FA-03', 'sev': SEV_BLOCKER,
            'title': 'Sección Actores del Sistema vacía (2.2)',
            'detail': 'fa-index.json.actors[] está vacío. La sección 2.2 del documento FA '
                      'no puede generarse sin actores definidos.',
            'accion': 'Añadir los actores del sistema a fa-index.json.actors[] con campos: '
                      'rol, desc, acceso.',
        })
        return

    # Detectar roles mencionados en RN pero no declarados como actores
    actor_roles = {a.get('rol','').lower() for a in actors}
    roles_en_rn = set()
    for rn in fa.get('business_rules', []):
        desc = rn.get('desc', rn.get('description','')).lower()
        for rol in ['consultor','manager','admin','administrador','sistema',
                    'usuario','supervisor','director','cliente']:
            if rol in desc:
                roles_en_rn.add(rol)

    sin_declarar = roles_en_rn - actor_roles
    if sin_declarar:
        ncs.append({
            'id': 'NC-FA-03', 'sev': SEV_MAJOR,
            'title': f'Roles mencionados en RN no declarados como actores: {sin_declarar}',
            'detail': f'Los roles {sin_declarar} aparecen en las reglas de negocio '
                      f'pero no están declarados en fa-index.json.actors[].',
            'accion': 'Añadir los roles faltantes a fa-index.json.actors[] '
                      'o verificar si los nombres difieren (ej: "admin" vs "Administrador").',
        })


def check_nc_fa_04(fa, s, ncs):
    """Funcionalidades sin reglas de negocio."""
    for f in fa.get('functionalities', []):
        rns = f.get('business_rules', [])
        if not rns:
            ncs.append({
                'id': 'NC-FA-04', 'sev': SEV_MAJOR,
                'title': f'{f["id"]} sin reglas de negocio',
                'detail': f'La funcionalidad {f["id"]} — "{f.get("name",f.get("title","?"))}" '
                          f'no tiene ninguna regla de negocio asociada.',
                'accion': 'Añadir al menos una regla de negocio o justificar la ausencia.',
            })


def check_nc_fa_05(fa, s, ncs):
    """Totales desincronizados."""
    tf = fa.get('total_functionalities', 0)
    rf = len(fa.get('functionalities', []))
    tr = fa.get('total_business_rules', 0)
    rr = len(fa.get('business_rules', []))

    if tf != rf:
        ncs.append({
            'id': 'NC-FA-05', 'sev': SEV_BLOCKER,
            'title': f'total_functionalities={tf} ≠ len(functionalities)={rf}',
            'detail': 'El campo total_functionalities en fa-index.json no coincide con '
                      'el número real de funcionalidades en el array.',
            'accion': f'Corregir: total_functionalities = {rf}',
        })
    if tr != rr:
        ncs.append({
            'id': 'NC-FA-05', 'sev': SEV_BLOCKER,
            'title': f'total_business_rules={tr} ≠ len(business_rules)={rr}',
            'detail': 'El campo total_business_rules en fa-index.json no coincide con '
                      'el número real de reglas en el array.',
            'accion': f'Corregir: total_business_rules = {rr}',
        })


def check_nc_fa_06(fa, s, ncs):
    """Sprints en sprint_history sin cobertura de feature en FA."""
    history = s.get('sprint_history', {})
    fa_features = {f.get('feature', f.get('feat','?')) for f in fa.get('functionalities',[])}

    for k, h in history.items():
        if h.get('status') != 'completed': continue
        feat = h.get('feature','?')
        if feat not in fa_features and feat != '?':
            ncs.append({
                'id': 'NC-FA-06', 'sev': SEV_MAJOR,
                'title': f'Feature {feat} (Sprint {k}) no referenciada en FA',
                'detail': f'El sprint_history registra {feat} como completada pero ninguna '
                          f'funcionalidad en fa-index.json referencia esta feature.',
                'accion': f'Añadir funcionalidades para {feat} o verificar el campo '
                          f'"feature" en fa-index.functionalities[].',
            })


def check_nc_fa_07(fa, s, ncs):
    """Descripción del proyecto ausente o genérica."""
    desc = fa.get('description', '')
    project = fa.get('project', 'Proyecto')
    generic_markers = [
        'es un sistema desarrollado', 'bajo la metodología sofia',
        'descripcion del proyecto', ''
    ]
    is_generic = not desc or any(m in desc.lower() for m in generic_markers[:3])
    if is_generic or len(desc) < 80:
        ncs.append({
            'id': 'NC-FA-07', 'sev': SEV_MINOR,
            'title': 'Descripción del proyecto genérica o insuficiente',
            'detail': f'fa-index.json.description tiene {len(desc)} caracteres y parece '
                      f'genérica. Debe describir el propósito de negocio del sistema.',
            'accion': 'Añadir una descripción específica del proyecto en fa-index.json.description '
                      'con al menos 150 caracteres explicando el valor de negocio.',
        })


def check_nc_fa_08(fa, s, ncs):
    """Glosario vacío o insuficiente."""
    glossary = fa.get('glossary', [])
    min_terms = 5
    if len(glossary) < min_terms:
        ncs.append({
            'id': 'NC-FA-08', 'sev': SEV_MINOR,
            'title': f'Glosario insuficiente: {len(glossary)} términos (mínimo {min_terms})',
            'detail': f'fa-index.json.glossary tiene {len(glossary)} términos. '
                      f'El glosario es acumulativo y debe crecer con cada sprint.',
            'accion': f'Añadir al menos {min_terms - len(glossary)} términos del dominio '
                      f'del proyecto a fa-index.json.glossary[].',
        })


def check_nc_fa_09(fa, s, ncs):
    """Regulaciones/marco normativo ausente."""
    regs = fa.get('regulations', [])
    # Si hay RN con lenguaje regulatorio pero no hay regulations declaradas
    reg_keywords = ['gdpr', 'rgpd', 'psd2', 'pci', 'sepa', 'aml', 'kyc',
                    'ley ', 'reglamento', 'directiva', 'normativa', 'lopd']
    rn_text = ' '.join(rn.get('desc', rn.get('description','')) for rn in fa.get('business_rules',[])).lower()
    has_reg_in_rn = any(kw in rn_text for kw in reg_keywords)

    if has_reg_in_rn and not regs:
        ncs.append({
            'id': 'NC-FA-09', 'sev': SEV_MAJOR,
            'title': 'Referencias normativas en RN sin marco regulatorio declarado',
            'detail': 'Las reglas de negocio referencian normativas/regulaciones pero '
                      'fa-index.json.regulations[] está vacío.',
            'accion': 'Declarar las regulaciones aplicables en fa-index.json.regulations[].',
        })


def check_nc_fa_10(fa, s, ncs):
    """User Stories del sprint actual sin FA asociada."""
    current_sprint = s.get('current_sprint', 0)
    # Buscar US en los artifacts del sprint
    us_declared = set()
    for step, items in s.get('artifacts', {}).items():
        if not isinstance(items, list): continue
        for item in items:
            # Buscar patrones US-NNN en los artefactos
            found = re.findall(r'US-\d+', str(item))
            us_declared.update(found)

    if not us_declared:
        return  # No hay info de US, no podemos validar

    # US referenciadas en FA del sprint actual
    fa_us = set()
    for f in fa.get('functionalities', []):
        if str(f.get('sprint','')) == str(current_sprint):
            fa_us.update(f.get('us', []))

    us_sin_fa = us_declared - fa_us
    if us_sin_fa:
        ncs.append({
            'id': 'NC-FA-10', 'sev': SEV_MAJOR,
            'title': f'User Stories sin FA asociada: {sorted(us_sin_fa)}',
            'detail': f'Las US {sorted(us_sin_fa)} están declaradas en los artefactos '
                      f'del sprint {current_sprint} pero no están referenciadas en '
                      f'ninguna funcionalidad del FA.',
            'accion': 'Añadir las US faltantes al campo "us" de las funcionalidades '
                      'correspondientes en fa-index.json.',
        })


def check_nc_fa_11(fa, s, ncs):
    """FA sin campo 'source' (trazabilidad)."""
    sin_source = []
    for f in fa.get('functionalities', []):
        if not f.get('source') and not f.get('src'):
            sin_source.append(f['id'])
    if sin_source:
        ncs.append({
            'id': 'NC-FA-11', 'sev': SEV_MINOR,
            'title': f'{len(sin_source)} funcionalidades sin campo source: {sin_source[:5]}',
            'detail': 'El campo "source" indica el origen de trazabilidad (SPRINT-N, '
                      'RECONSTRUIDO, Jira issue). Su ausencia rompe la trazabilidad CMMI.',
            'accion': 'Añadir campo "source" a cada funcionalidad indicando el sprint '
                      'o artefacto de origen.',
        })


def check_nc_fa_12(fa, s, ncs):
    """Doc history desincronizado con sprints cerrados."""
    history = s.get('sprint_history', {})
    n_closed = sum(1 for h in history.values() if h.get('status') == 'completed')
    doc_hist  = fa.get('doc_history', [])

    if n_closed > 0 and len(doc_hist) == 0:
        ncs.append({
            'id': 'NC-FA-12', 'sev': SEV_MINOR,
            'title': f'doc_history vacío con {n_closed} sprints cerrados',
            'detail': 'El historial de versiones del documento FA está vacío aunque '
                      'hay sprints cerrados. No hay trazabilidad de evolución del documento.',
            'accion': 'Ejecutar gen-fa-document.py para regenerar el documento y '
                      'poblar doc_history automáticamente.',
        })


def check_nc_fa_13(fa, s, ncs):
    """Business rules con IDs duplicados entre distintas FA."""
    rn_ids = defaultdict(list)
    for rn in fa.get('business_rules', []):
        rn_ids[rn.get('id','')].append(rn.get('fa', rn.get('module','?')))
    dups = {rn_id: fas for rn_id, fas in rn_ids.items() if len(fas) > 1}
    if dups:
        ncs.append({
            'id': 'NC-FA-13', 'sev': SEV_BLOCKER,
            'title': f'IDs de business rules duplicados: {list(dups.keys())[:5]}',
            'detail': f'Los IDs {list(dups.keys())} aparecen más de una vez en '
                      f'fa-index.json.business_rules[]. validate-fa-index.js bloqueará.',
            'accion': 'Renombrar los IDs duplicados con sufijos únicos (ej: -01, -02).',
        })


def check_nc_fa_14(fa, s, ncs):
    """FA del sprint actual no marcadas DELIVERED."""
    current_sprint = str(s.get('current_sprint', 9999))
    sprint_closed  = s.get('sprint_closed', False)

    if not sprint_closed:
        return  # Solo aplica si el sprint está en proceso de cierre (Gate 8b)

    not_delivered = [
        f['id'] for f in fa.get('functionalities', [])
        if str(f.get('sprint','')) == current_sprint
        and f.get('status','') != 'DELIVERED'
    ]
    if not_delivered:
        ncs.append({
            'id': 'NC-FA-14', 'sev': SEV_BLOCKER,
            'title': f'FA del Sprint {current_sprint} no marcadas DELIVERED: {not_delivered}',
            'detail': f'El sprint está cerrándose pero {not_delivered} aún tienen '
                      f'status distinto de DELIVERED.',
            'accion': 'Marcar como DELIVERED si se implementaron, o eliminar y registrar '
                      'deuda técnica si quedaron pendientes.',
        })


def check_nc_fa_15(fa, s, ncs):
    """Sprint 2+ sin funcionalidades propias (solo aparecen como modified_sprint)."""
    history = s.get('sprint_history', {})
    closed_sprints = sorted(
        [int(k.replace('sprint_','')) for k,h in history.items()
         if h.get('status')=='completed' and k.replace('sprint_','').isdigit()],
    )

    if len(closed_sprints) < 2:
        return  # Solo aplica desde el 2do sprint

    fa_by_sprint = defaultdict(list)
    for f in fa.get('functionalities', []):
        try: fa_by_sprint[int(str(f.get('sprint','0')))].append(f['id'])
        except: pass

    for sp in closed_sprints[1:]:  # Desde Sprint 2 en adelante
        if sp not in fa_by_sprint or not fa_by_sprint[sp]:
            ncs.append({
                'id': 'NC-FA-15', 'sev': SEV_MAJOR,
                'title': f'Sprint {sp} sin funcionalidades propias en FA',
                'detail': f'El Sprint {sp} está cerrado pero no tiene funcionalidades '
                          f'propias en fa-index.json (sprint={sp}). Puede que las '
                          f'funcionalidades estén registradas como "modified_sprintN" '
                          f'en las de Sprint 1 en lugar de tener sus propias entradas.',
                'accion': f'Añadir funcionalidades propias para Sprint {sp} o '
                          f'verificar si se asignaron al sprint correcto.',
            })


# ── Generar informe NC ────────────────────────────────────────────────────────

def generate_report(fa, s, ncs):
    now      = datetime.datetime.utcnow()
    now_str  = now.strftime('%Y-%m-%dT%H:%M:%SZ')
    date_str = now.strftime('%Y-%m-%d')
    sprint   = s.get('current_sprint', '?')
    project  = fa.get('project', s.get('project', 'Proyecto'))
    client   = fa.get('client',  s.get('client',  'Cliente'))
    feature  = s.get('current_feature', '?')
    doc_ver  = fa.get('doc_version', '?')

    blockers = [nc for nc in ncs if nc['sev'] == SEV_BLOCKER]
    majors   = [nc for nc in ncs if nc['sev'] == SEV_MAJOR]
    minors   = [nc for nc in ncs if nc['sev'] == SEV_MINOR]

    verdict = '✅ CONFORME' if not blockers else '🔴 NO CONFORME — REQUIERE ACCIÓN PO'

    lines = [
        f'# Informe de No Conformidad — Análisis Funcional',
        f'## {project} · {client} · Sprint {sprint} · {feature}',
        '',
        f'| Campo | Valor |',
        f'|---|---|',
        f'| Fecha | {date_str} |',
        f'| Sprint | {sprint} |',
        f'| Feature | {feature} |',
        f'| FA versión | v{doc_ver} |',
        f'| Funcionalidades | {fa.get("total_functionalities",0)} |',
        f'| Reglas de Negocio | {fa.get("total_business_rules",0)} |',
        f'| Generado por | FA-Agent Gate 8b — SOFIA v2.6 |',
        '',
        f'## Veredicto: {verdict}',
        '',
        f'| Severidad | Nº NCs |',
        f'|---|---|',
        f'| 🔴 Bloqueante | {len(blockers)} |',
        f'| 🟡 Mayor | {len(majors)} |',
        f'| 🔵 Menor | {len(minors)} |',
        f'| **Total** | **{len(ncs)}** |',
        '',
    ]

    if not ncs:
        lines += [
            '> ✅ El Análisis Funcional está completo y consistente con la historia del proyecto.',
            '> No se han detectado no conformidades.',
            '',
        ]
    else:
        lines += [
            '---',
            '',
            '## No Conformidades Detectadas',
            '',
            '> **Instrucciones para el Product Owner:**',
            '> - 🔴 **Bloqueante**: debe resolverse antes de aprobar Gate 8b',
            '> - 🟡 **Mayor**: PO decide si corregir ahora o registrar como deuda FA',
            '> - 🔵 **Menor**: recomendación, puede diferirse al siguiente sprint',
            '',
        ]

        for sev_label, group in [
            (SEV_BLOCKER, blockers),
            (SEV_MAJOR,   majors),
            (SEV_MINOR,   minors),
        ]:
            if not group: continue
            icon = SEV_ICON[sev_label]
            lines.append(f'### {icon} {sev_label}S ({len(group)})')
            lines.append('')
            for nc in group:
                lines += [
                    f'#### {nc["id"]} — {nc["title"]}',
                    f'**Detalle:** {nc["detail"]}',
                    f'**Acción requerida:** {nc["accion"]}',
                    '',
                ]

    # Sección de decisión del PO
    if ncs:
        lines += [
            '---',
            '',
            '## Decisión del Product Owner',
            '',
            '> Completar esta sección antes de aprobar Gate 8b.',
            '',
            '| NC ID | Decisión | Responsable | Plazo |',
            '|---|---|---|---|',
        ]
        for nc in ncs:
            lines.append(f'| {nc["id"]} | ☐ Corregir ahora / ☐ Deuda FA-{sprint+1} / ☐ Aceptar | | |')
        lines += [
            '',
            '**Firma PO:** _______________  **Fecha:** _______________',
            '',
        ]

    lines += [
        '---',
        f'*Generado automáticamente por FA-Agent Gate 8b — SOFIA v2.6 — {now_str}*',
        f'*Script: .sofia/scripts/validate-fa-completeness.py*',
    ]

    return '\n'.join(lines)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--sprint', type=int, default=None)
    parser.add_argument('--output', type=str, default=None)
    args = parser.parse_args()

    fa, s = load_data()
    sprint = args.sprint or s.get('current_sprint', 0)
    now_str = datetime.datetime.utcnow().strftime('%Y%m%d')

    print(f'Validando FA contra historia del proyecto...')
    print(f'  Proyecto: {fa.get("project","?")} · Sprint {sprint}')
    print(f'  FA: {fa.get("total_functionalities",0)} func | {fa.get("total_business_rules",0)} RN | v{fa.get("doc_version","?")}')
    print()

    ncs = []
    checks = [
        check_nc_fa_01, check_nc_fa_02, check_nc_fa_03,
        check_nc_fa_04, check_nc_fa_05, check_nc_fa_06,
        check_nc_fa_07, check_nc_fa_08, check_nc_fa_09,
        check_nc_fa_10, check_nc_fa_11, check_nc_fa_12,
        check_nc_fa_13, check_nc_fa_14, check_nc_fa_15,
    ]
    for check in checks:
        check(fa, s, ncs)

    # Resumen
    blockers = [nc for nc in ncs if nc['sev'] == SEV_BLOCKER]
    majors   = [nc for nc in ncs if nc['sev'] == SEV_MAJOR]
    minors   = [nc for nc in ncs if nc['sev'] == SEV_MINOR]

    for nc in ncs:
        icon = SEV_ICON[nc['sev']]
        print(f'  {icon} [{nc["id"]}] {nc["title"]}')

    print()
    print(f'Resultado: {len(blockers)} bloqueantes | {len(majors)} mayores | {len(minors)} menores')

    # Generar informe
    report = generate_report(fa, s, ncs)
    QUALITY_DIR.mkdir(parents=True, exist_ok=True)

    out_path = args.output or str(
        QUALITY_DIR / f'NC-FA-Sprint{sprint}-{now_str}.md'
    )
    Path(out_path).write_text(report)
    print(f'OK Informe NC: {out_path}')

    # Actualizar session.json
    if SESSION.exists():
        try:
            s2 = json.loads(SESSION.read_text())
            if 'fa_agent' not in s2: s2['fa_agent'] = {}
            s2['fa_agent']['nc_report'] = out_path.replace(str(PROJECT_ROOT)+'/', '')
            s2['fa_agent']['nc_blockers'] = len(blockers)
            s2['fa_agent']['nc_majors']   = len(majors)
            s2['fa_agent']['nc_minors']   = len(minors)
            s2['fa_agent']['nc_verdict']  = 'CONFORME' if not blockers else 'NO_CONFORME'
            s2['updated_at'] = datetime.datetime.utcnow().isoformat()+'Z'
            SESSION.write_text(json.dumps(s2, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f'WARN: session.json no actualizado: {e}')

    # Log
    if LOG.exists():
        with open(str(LOG), 'a') as f:
            f.write(f'[{datetime.datetime.utcnow().isoformat()}Z] [FA-VALIDATE-NC] '
                    f'Sprint {sprint} | bloqueantes={len(blockers)} mayores={len(majors)} '
                    f'menores={len(minors)} | {out_path}\n')

    # Exit code
    if blockers:
        print()
        print('🔴 HAY NCs BLOQUEANTES — Gate 8b pendiente de aprobación PO')
        print(f'   Ver informe: {out_path}')
        sys.exit(1)
    else:
        print()
        print('✅ Sin NCs bloqueantes — Gate 8b puede aprobarse')
        sys.exit(0)


if __name__ == '__main__':
    main()
