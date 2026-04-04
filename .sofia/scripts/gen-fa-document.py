#!/usr/bin/env python3
"""
gen-fa-document.py — FA-Agent SOFIA v2.3
Genera el Analisis Funcional BankPortal con python-docx (100% compatible con Word)

Uso:
  python3 .sofia/scripts/gen-fa-document.py

Dependencias:
  pip install python-docx
"""
import json
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ── Rutas ─────────────────────────────────────────────────────────────────────
PROJECT_ROOT = '/Users/cuadram/proyectos/bank-portal'
FA_DIR       = f'{PROJECT_ROOT}/docs/functional-analysis'
OUT_PATH     = f'{FA_DIR}/FA-BankPortal-Banco-Meridian.docx'
SESSION_PATH = f'{PROJECT_ROOT}/.sofia/session.json'
LOG_PATH     = f'{PROJECT_ROOT}/.sofia/sofia.log'

# ── Colores ───────────────────────────────────────────────────────────────────
BLUE_DARK  = RGBColor(0x1B, 0x3A, 0x6B)
BLUE_MID   = RGBColor(0x45, 0x69, 0x9E)
ORANGE     = RGBColor(0xC8, 0x4A, 0x14)
GREEN_SOFT = RGBColor(0x5B, 0x88, 0x78)
AMBER      = RGBColor(0xB4, 0x53, 0x09)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
GRAY_TEXT  = RGBColor(0x33, 0x33, 0x33)
GRAY_SUB   = RGBColor(0x66, 0x66, 0x66)

def set_cell_bg(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_borders(cell, color='D9DDE8'):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side in ['top','left','bottom','right']:
        border = OxmlElement(f'w:{side}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')
        border.set(qn('w:color'), color)
        tcBorders.append(border)
    tcPr.append(tcBorders)

def add_header_row(table, texts, widths_cm):
    row = table.rows[0]
    for i, (cell, text) in enumerate(zip(row.cells, texts)):
        cell.width = Cm(widths_cm[i])
        set_cell_bg(cell, '1B3A6B')
        set_cell_borders(cell, '45699E')
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(9)
        run.font.name = 'Arial'

def add_data_row(table, texts, widths_cm, alt=False, highlight=False):
    row = table.add_row()
    bg = 'EFF6FF' if highlight else ('F5F7FA' if alt else 'FFFFFF')
    for i, (cell, text) in enumerate(zip(row.cells, texts)):
        cell.width = Cm(widths_cm[i])
        set_cell_bg(cell, bg)
        set_cell_borders(cell, 'D9DDE8')
        p = cell.paragraphs[0]
        run = p.add_run(str(text))
        run.font.size = Pt(9)
        run.font.name = 'Arial'
        run.font.color.rgb = GRAY_TEXT


def add_bookmark(paragraph, bookmark_id, text=None):
    '''Añade un bookmark a un párrafo existente para referencia interna.'''
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    # Si hay runs existentes, envolver el primero en el bookmark
    # Si no, añadir un run vacío
    p = paragraph._p
    bookmarkStart = OxmlElement('w:bookmarkStart')
    bookmarkStart.set(qn('w:id'), str(abs(hash(bookmark_id)) % 1000000))
    bookmarkStart.set(qn('w:name'), bookmark_id)
    bookmarkEnd = OxmlElement('w:bookmarkEnd')
    bookmarkEnd.set(qn('w:id'), str(abs(hash(bookmark_id)) % 1000000))
    # Insert at beginning of paragraph
    p.insert(0, bookmarkStart)
    p.append(bookmarkEnd)

def toc_entry(doc, text, anchor, level=1, is_sprint=False):
    '''Crea una entrada de índice con dot leader y hiperlink interno.'''
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    from docx.shared import Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1 if level > 1 else 4)
    p.paragraph_format.space_after  = Pt(1 if level > 1 else 4)

    # Indent según nivel
    indent_left = 400 if level == 1 else 800
    pPr = p._p.get_or_add_pPr()
    ind = OxmlElement('w:ind')
    ind.set(qn('w:left'), str(indent_left))
    pPr.append(ind)

    # Tab stop con dot leader a la derecha
    tabs_el = OxmlElement('w:tabs')
    tab = OxmlElement('w:tab')
    tab.set(qn('w:val'), 'right')
    tab.set(qn('w:leader'), 'dot')
    tab.set(qn('w:pos'), '8500')
    tabs_el.append(tab)
    pPr.append(tabs_el)

    # Crear hiperlink interno al bookmark
    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('w:anchor'), anchor)

    r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rFonts = OxmlElement('w:rFonts')
    rFonts.set(qn('w:ascii'), 'Arial')
    rFonts.set(qn('w:hAnsi'), 'Arial')
    rPr.append(rFonts)
    sz = OxmlElement('w:sz')
    sz.set(qn('w:val'), '20' if level == 1 else '18')  # 10pt o 9pt
    rPr.append(sz)
    if level == 1:
        bold = OxmlElement('w:b')
        rPr.append(bold)
    color = OxmlElement('w:color')
    color.set(qn('w:val'), '1B3A6B' if level == 1 else '45699E')
    rPr.append(color)
    # Underline estilo hiperlink
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rPr.append(u)
    r.append(rPr)

    t = OxmlElement('w:t')
    t.set(qn('xml:space'), 'preserve')
    t.text = text
    r.append(t)
    hyperlink.append(r)

    # Tab + número de página placeholder ('—' porque python-docx no calcula páginas)
    r2 = OxmlElement('w:r')
    rPr2 = OxmlElement('w:rPr')
    rFonts2 = OxmlElement('w:rFonts')
    rFonts2.set(qn('w:ascii'), 'Arial')
    rFonts2.set(qn('w:hAnsi'), 'Arial')
    rPr2.append(rFonts2)
    sz2 = OxmlElement('w:sz')
    sz2.set(qn('w:val'), '20' if level == 1 else '18')
    rPr2.append(sz2)
    color2 = OxmlElement('w:color')
    color2.set(qn('w:val'), '666666')
    rPr2.append(color2)
    r2.append(rPr2)
    t2 = OxmlElement('w:t')
    t2.set(qn('xml:space'), 'preserve')
    t2.text = '	'
    r2.append(t2)
    hyperlink.append(r2)

    p._p.append(hyperlink)
    return p

def heading1(doc, text, bookmark_id=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), '1B3A6B')
    pPr.append(shd)
    ind = OxmlElement('w:ind')
    ind.set(qn('w:left'), '200')
    pPr.append(ind)
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(14)
    run.font.name = 'Arial'
    run.font.color.rgb = WHITE
    if bookmark_id:
        add_bookmark(p, bookmark_id)
    return p

def heading2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(5)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '4')
    bottom.set(qn('w:color'), 'C84A14')
    pBdr.append(bottom)
    pPr.append(pBdr)
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = 'Arial'
    run.font.color.rgb = BLUE_DARK
    return p

def heading3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(9)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(11)
    run.font.name = 'Arial'
    run.font.color.rgb = BLUE_MID
    return p

def body(doc, text, italic=False, color=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(text)
    run.font.size = Pt(10)
    run.font.name = 'Arial'
    run.font.color.rgb = color or GRAY_TEXT
    run.italic = italic
    return p

def bullet_item(doc, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text)
    run.font.size = Pt(10)
    run.font.name = 'Arial'
    run.font.color.rgb = GRAY_TEXT
    return p

# ── Datos de sprints ──────────────────────────────────────────────────────────
SPRINTS = [
  {'n':'1-2','feat':'FEAT-001','title':'Autenticacion de Doble Factor TOTP','ver':'v1.2.0','date':'2026-02-xx','src':'RECONSTRUIDO',
   'intro':'Modulo fundacional: autenticacion TOTP (RFC 6238) con secreto cifrado AES-256-CBC, codigos de recuperacion BCrypt y registro de auditoria inmutable (PCI-DSS Req. 10).',
   'funcs':[
    ('FA-001-A','Registro y Activacion del Segundo Factor TOTP','El cliente activa 2FA desde su perfil. BankPortal genera un secreto TOTP cifrado (AES-256-CBC) que el cliente vincula escaneando un QR con su app autenticadora.',['RN-F001-01: El secreto TOTP se almacena siempre cifrado (AES-256-CBC); nunca en claro','RN-F001-02: OTP valido 30 segundos; margen de +/-1 periodo']),
    ('FA-001-B','Codigos de Recuperacion','Al activar 2FA se generan codigos de recuperacion de un solo uso para acceso de emergencia.',['RN-F001-03: Codigos hasheados con BCrypt (cost=10); nunca en claro','RN-F001-04: Cada codigo solo puede usarse una unica vez']),
    ('FA-001-C','Registro de Auditoria Inmutable','Cada evento de autenticacion queda registrado de forma inmutable (INSERT-only). Retencion minima 12 meses.',['RN-F001-05: El audit_log es inmutable: no se permiten UPDATE ni DELETE','RN-F001-06: Registros incluyen IP, user-agent, timestamp UTC y resultado']),
  ]},
  {'n':3,'feat':'FEAT-002','title':'Gestion Avanzada de Sesiones','ver':'v1.3.0','date':'2026-04-14','src':'RECONSTRUIDO',
   'intro':'Control total del cliente sobre accesos activos: consulta, cierre remoto e invalidacion por enlace de email ante accesos no reconocidos.',
   'funcs':[
    ('FA-002-A','Consulta de Sesiones Activas','Listado de sesiones activas con dispositivo, navegador, IP enmascarada y ultimo acceso.',['RN-F002-01: IPs siempre enmascaradas','RN-F002-02: Token almacenado solo como hash SHA-256']),
    ('FA-002-B','Cierre Remoto de Sesion','Cierre inmediato e irreversible de cualquier sesion activa desde el panel de seguridad.',['RN-F002-03: Cierre irreversible e inmediato','RN-F002-04: El cliente no puede cerrar su sesion actual desde el gestor']),
    ('FA-002-C','Invalidacion por Enlace de Email','Enlace one-time enviado por email para denegar accesos sospechosos.',['RN-F002-05: Enlace de un solo uso con TTL de 1 hora','RN-F002-06: Timeout de inactividad configurable entre 5 y 60 minutos']),
  ]},
  {'n':4,'feat':'FEAT-003','title':'Dispositivos de Confianza','ver':'v1.4.0','date':'2026-04-28','src':'RECONSTRUIDO',
   'intro':'Permite omitir el OTP en logins desde dispositivos habituales verificados. Token de confianza vinculado criptograficamente al dispositivo (cookie HttpOnly, TTL 30 dias).',
   'funcs':[
    ('FA-003-A','Registro de Dispositivo de Confianza','Tras login exitoso con OTP el cliente registra su dispositivo. Token unico como cookie HttpOnly, TTL 30 dias renovable.',['RN-F003-01: Token como cookie HttpOnly; nunca en localStorage','RN-F003-02: TTL 30 dias renovable en cada uso','RN-F003-03: Cambio sustancial de red requiere re-verificacion OTP']),
    ('FA-003-B','Login sin OTP desde Dispositivo de Confianza','Si el dispositivo y la huella coinciden con un token valido el paso OTP se omite automaticamente.',['RN-F003-04: Maximo 5 dispositivos de confianza activos por usuario']),
    ('FA-003-C','Revocacion de Dispositivos de Confianza','El cliente revoca dispositivos individualmente o todos a la vez desde el panel de seguridad.',['RN-F003-05: Dispositivo revocado requiere OTP en el siguiente login','RN-F003-06: Revocacion masiva disponible en una unica accion']),
  ]},
  {'n':'5+8','feat':'FEAT-004','title':'Centro de Notificaciones de Seguridad','ver':'v1.8.0','date':'2026-05-12 / 2026-06-23','src':'RECONSTRUIDO',
   'intro':'Centraliza notificaciones de seguridad con historial, gestion leido/no leido, acciones directas y configuracion de canales. Dos sprints (v1 + refactoring multicanal).',
   'funcs':[
    ('FA-004-A','Historial de Notificaciones de Seguridad','Listado cronologico de alertas con contexto (dispositivo, IP enmascarada, fecha) y enlace de accion. Retencion 90 dias.',['RN-F004-01: Retencion 90 dias','RN-F004-02: Notificaciones ALTA no pueden desactivarse por el cliente']),
    ('FA-004-B','Gestion de Notificaciones (Leidas/No Leidas)','Badge de no leidas en tiempo real. Marcar como leida no afecta al audit_log.',['RN-F004-03: Marcar como leida NO elimina el registro de auditoria','RN-F004-04: Badge actualizado en tiempo real']),
    ('FA-004-C','Acciones Directas desde Notificacion','Notificaciones criticas incluyen accion directa (revocar sesion, reportar fraude).',['RN-F004-05: Acciones directas requieren sesion activa del cliente']),
    ('FA-004-D','Preferencias de Notificacion por Canal','El cliente configura canales habilitados (email, push, in-app) por tipo de evento.',['RN-F004-06: ACCOUNT_LOCKED y LOGIN_NEW_CONTEXT_DETECTED no desactivables','RN-F004-07: Configuracion independiente por tipo de evento y canal']),
  ]},
  {'n':6,'feat':'FEAT-005','title':'Login en Tiempo Real y Contexto Geografico','ver':'v1.6.0','date':'2026-05-26','src':'RECONSTRUIDO',
   'intro':'Notificaciones en tiempo real via SSE y deteccion de logins desde contextos de red o geograficos inusuales.',
   'funcs':[
    ('FA-005-A','Notificaciones de Seguridad en Tiempo Real (SSE)','Canal SSE activo mientras la app esta abierta. Eventos de seguridad aparecen instantaneamente.',['RN-F005-01: Canal SSE se cierra al expirar la sesion','RN-F005-02: Maximo 500 conexiones SSE simultaneas']),
    ('FA-005-B','Deteccion de Login desde Contexto Inusual','El sistema registra subredes IP habituales. Logins desde subredes desconocidas generan alerta.',['RN-F005-03: Subred conocida solo tras confirmacion explicita del cliente','RN-F005-04: Logins desde subredes desconocidas siempre generan notificacion']),
  ]},
  {'n':7,'feat':'FEAT-006','title':'Bloqueo de Cuenta y Autenticacion Contextual','ver':'v1.7.0','date':'2026-06-09','src':'RECONSTRUIDO',
   'intro':'Proteccion anti-fuerza bruta: bloqueo automatico tras intentos fallidos de OTP, desbloqueo seguro por email con token HMAC one-time.',
   'funcs':[
    ('FA-006-A','Bloqueo Automatico por Intentos Fallidos','Superado el maximo de intentos de OTP en 24h la cuenta se bloquea en todos los canales.',['RN-F006-01: Contador se resetea al login exitoso o al desbloquear','RN-F006-02: Cuenta bloqueada sin acceso hasta desbloqueo']),
    ('FA-006-B','Desbloqueo de Cuenta por Email','Enlace seguro HMAC one-time (TTL 1h). Al hacer clic la cuenta se reactiva.',['RN-F006-03: Token de desbloqueo de unico uso expira en 1 hora','RN-F006-04: No requiere que el cliente recuerde su contrasena']),
    ('FA-006-C','Autenticacion Contextual por Subred IP','Accesos desde subredes desconocidas generan alerta de seguridad no desactivable.',['RN-F006-05: Las alertas de acceso inusual no pueden desactivarse por preferencias']),
  ]},
  {'n':9,'feat':'FEAT-007','title':'Consulta de Cuentas y Movimientos','ver':'v1.9.0','date':'2026-06-23','src':'RECONSTRUIDO',
   'intro':'Integracion con Core Banking para consulta de saldos y movimientos en tiempo real. Historial de 13 meses con busqueda full-text y categorizacion automatica de gastos.',
   'funcs':[
    ('FA-007-A','Consulta de Cuentas y Saldos','Listado de cuentas con saldo disponible y retenido separados, actualizado en tiempo real.',['RN-F007-01: Saldo disponible y retenido siempre separados','RN-F007-02: IBAN en formato estandar europeo']),
    ('FA-007-B','Historial de Movimientos','Historial paginado y filtrable (tipo, fecha, concepto) con cobertura de 13 meses.',['RN-F007-03: Negativos = cargos; positivos = abonos','RN-F007-04: Historial minimo de 13 meses (normativa EU)']),
    ('FA-007-C','Busqueda por Concepto de Movimiento','Busqueda full-text tolerante a erratas sobre el concepto de los ultimos 13 meses.',['RN-F007-05: Busqueda opera sobre los ultimos 13 meses']),
    ('FA-007-D','Categorizacion Automatica de Gastos','Cada movimiento recibe automaticamente una categoria de gasto.',['RN-F007-06: Categorizacion automatica; el cliente puede corregirla manualmente']),
  ]},
  {'n':10,'feat':'FEAT-008','title':'Transferencias Bancarias','ver':'v1.10.0','date':'2026-07-07','src':'RECONSTRUIDO',
   'intro':'Modulo de transferencias con SCA para importes elevados, libreta de beneficiarios y limites operativos configurados por el banco.',
   'funcs':[
    ('FA-008-A','Transferencia Bancaria Inmediata','Transferencia a cuenta propia o de tercero con validacion de IBAN, limites y SCA.',['RN-F008-01: Importes siempre DECIMAL(15,2); nunca con punto flotante','RN-F008-02: Transferencias sobre el limite requieren 2FA (SCA)','RN-F008-03: Limites: 2.000 EUR/op, 3.000 EUR/dia, 10.000 EUR/mes']),
    ('FA-008-B','Libreta de Beneficiarios','Alta, consulta y baja logica de beneficiarios frecuentes.',['RN-F008-04: No pueden existir dos beneficiarios activos con el mismo IBAN','RN-F008-05: Baja es soft delete; historial conservado']),
    ('FA-008-C','Limites de Transferencia','Validacion de limites por operacion, diario y mensual. Acumulado diario en Redis.',['RN-F008-06: Limites establecidos por el banco; el cliente no puede modificarlos','RN-F008-07: Acumulado diario se resetea a medianoche UTC']),
  ]},
  {'n':11,'feat':'FEAT-009','title':'Pagos de Recibos y Facturas','ver':'v1.11.0','date':'2026-07-21','src':'RECONSTRUIDO',
   'intro':'Consulta y pago de recibos domiciliados y pagos ad-hoc por referencia con cargo en tiempo real al Core Banking.',
   'funcs':[
    ('FA-009-A','Consulta de Recibos Pendientes','Listado de recibos pendientes ordenados por fecha de vencimiento.',['RN-F009-01: Ordenados por fecha de vencimiento (mas proximos primero)','RN-F009-02: Recibo CANCELLED no puede volver a pagarse']),
    ('FA-009-B','Pago de Recibo Domiciliado','Seleccion de recibo y cuenta cargo; ejecucion en Core Banking.',['RN-F009-03: Requiere saldo disponible suficiente','RN-F009-04: El cliente elige la cuenta cargo entre sus cuentas activas']),
    ('FA-009-C','Pago Ad-hoc por Referencia','Pago espontaneo por referencia del emisor sin domiciliacion previa.',['RN-F009-05: Referencia comunicada al emisor para conciliacion']),
  ]},
  {'n':12,'feat':'FEAT-010','title':'Dashboard Analitico de Gastos','ver':'v1.12.0','date':'2026-08-04','src':'RECONSTRUIDO',
   'intro':'Vision analitica de gastos e ingresos por categoria y periodo con comparativa mensual y alertas de presupuesto proactivas.',
   'funcs':[
    ('FA-010-A','Resumen de Gastos por Categoria','Desglose del mes actual por categoria con evolucion respecto al mes anterior.',['RN-F010-01: Calculo asincrono; desfase maximo 5 minutos','RN-F010-02: Movimientos sin categoria en la categoria Otros']),
    ('FA-010-B','Evolucion Mensual de Gastos e Ingresos','Grafico de evolucion en los ultimos 12 meses con comparativa entre periodos.',['RN-F010-03: Comparativa cubre los ultimos 12 periodos completos']),
    ('FA-010-C','Alertas de Presupuesto Mensual','El cliente define un presupuesto mensual. Notificacion al alcanzar el umbral (80% por defecto).',['RN-F010-04: Presupuesto establecido por el cliente; sin valor predeterminado','RN-F010-05: Solo una alerta por periodo y umbral']),
  ]},
  {'n':13,'feat':'FEAT-011','title':'Exportacion de Informes Financieros PDF y Excel','ver':'v1.13.0','date':'2026-08-18','src':'RECONSTRUIDO',
   'intro':'Generacion de extractos en PDF (OpenPDF) y Excel (Apache POI): movimientos detallados y resumen analitico para uso fiscal.',
   'funcs':[
    ('FA-011-A','Exportacion de Movimientos a PDF','Extracto oficial con cabecera del banco, tabla de movimientos y pie legal.',['RN-F011-01: PDF incluye datos del titular y periodo exacto','RN-F011-02: Puede cubrir hasta 13 meses (normativa EU)']),
    ('FA-011-B','Exportacion de Movimientos a Excel','Fichero .xlsx con hoja de movimientos y hoja resumen por categoria.',['RN-F011-03: Excel incluye hoja de movimientos y hoja resumen por categoria','RN-F011-04: Importes en formato numerico para calculos directos']),
    ('FA-011-C','Exportacion del Informe Analitico de Gastos','Exportacion del resumen del dashboard en PDF o Excel para periodos completos.',['RN-F011-05: Solo exporta periodos completos (no el mes en curso parcial)']),
  ]},
  {'n':14,'feat':'FEAT-012','title':'Gestion de Perfil de Usuario','ver':'v1.14.0','date':'2026-09-01','src':'RECONSTRUIDO',
   'intro':'Actualizacion de datos personales, cambio de contrasena con historial de las ultimas 3, preferencias de comunicacion y revocacion de tokens JWT.',
   'funcs':[
    ('FA-012-A','Consulta y Actualizacion de Datos Personales','El cliente actualiza telefono, direccion y pais. El email no puede modificarse desde la app.',['RN-F012-01: Email no modificable desde BankPortal; requiere tramite presencial','RN-F012-02: Telefono movil debe verificarse antes de usar para 2FA por SMS']),
    ('FA-012-B','Cambio de Contrasena con Historial','Cambio con validacion de politica. Revoca todas las sesiones excepto la actual.',['RN-F012-03: Nueva contrasena no puede coincidir con ninguna de las 3 anteriores','RN-F012-04: Cambio revoca todas las sesiones activas excepto la actual']),
    ('FA-012-C','Gestion de Preferencias de Comunicacion','Configuracion de canales habilitados por tipo de evento. Aplica a todos los modulos.',['RN-F012-05: Preferencias aplican a todos los modulos de BankPortal','RN-F012-06: Desactivar canal push no cancela la suscripcion VAPID']),
    ('FA-012-D','Revocacion de Tokens JWT Activos','Revocacion inmediata en Redis O(1) con registro en BD para audit trail PCI-DSS.',['RN-F012-07: JWTs revocados verificados en Redis O(1); BD como registro de auditoria']),
  ]},
  {'n':15,'feat':'FEAT-013','title':'Onboarding KYC y Verificacion de Identidad','ver':'v1.15.0','date':'2026-09-15','src':'RECONSTRUIDO',
   'intro':'Proceso digital de verificacion de identidad (KYC) obligatorio para servicios de pago de alto riesgo. Documentos cifrados AES-256 en reposo.',
   'funcs':[
    ('FA-013-A','Inicio del Proceso KYC','Flujo guiado de onboarding para clientes sin KYC verificado. Requerido para activar transferencias.',['RN-F013-01: Transferencias y pagos requieren KYC aprobado','RN-F013-02: El proceso puede interrumpirse y retomarse antes de enviar']),
    ('FA-013-B','Carga de Documentos de Identidad','Subida cifrada de DNI/NIE/Pasaporte (anverso y reverso). Hash SHA-256 verificado.',['RN-F013-03: Documentos cifrados AES-256; nunca en claro en BD (ADR-023)','RN-F013-04: Hash SHA-256 verificado al subir','RN-F013-05: Tipos aceptados: DNI, NIE, Pasaporte']),
    ('FA-013-C','Revision y Resolucion KYC','El equipo de cumplimiento aprueba o rechaza con motivo. El cliente recibe notificacion.',['RN-F013-06: El rechazo siempre incluye motivo comunicado al cliente','RN-F013-07: KYC aprobado no caduca mientras el documento este vigente']),
  ]},
  {'n':16,'feat':'FEAT-014','title':'Notificaciones Push VAPID','ver':'v1.16.0','date':'24/03/2026','src':'EVIDENCIA-DIRECTA',
   'intro':'Notificaciones push protocolo VAPID (RFC 8292) con suscripcion multidevice (max. 5), envio en tiempo real de movimientos y preferencias multicanal bajo consentimiento GDPR.',
   'funcs':[
    ('FA-014-001','Suscripcion a Notificaciones Push VAPID','El cliente activa notificaciones push. BankPortal registra el dispositivo con token VAPID unico (max. 5, TTL 12 meses sin actividad).',['RN-001: Solo dispositivos con token VAPID registrado activo reciben notificaciones','RN-002: Maximo 5 dispositivos registrados por cliente','RN-003: Registro VAPID expira a los 12 meses sin actividad']),
    ('FA-014-002','Envio de Notificaciones de Movimientos en Tiempo Real','Evento del Core Banking → notificacion push en maximo 30 segundos con tipo, importe y saldo.',['RN-004: Notificaciones en tiempo real, maximo 30 segundos tras el evento','RN-005: Movimientos bajo el umbral no generan notificacion por defecto']),
    ('FA-014-003','Gestion de Preferencias de Notificacion Multicanal','El cliente configura categorias por canal. La categoria Seguridad siempre activa.',['RN-006: El cliente puede desactivar categorias; la categoria Seguridad siempre activa']),
  ]},
  {'n':17,'feat':'FEAT-015','title':'Transferencias Programadas y Recurrentes','ver':'v1.17.0','date':'22/04/2026','src':'EVIDENCIA-DIRECTA',
   'intro':'Automatizacion de pagos periodicos: transferencias unicas en fecha futura y recurrentes (WEEKLY/BIWEEKLY/MONTHLY) con gestion completa del ciclo de vida. Incluye resolucion DEBT-027/028/029.',
   'funcs':[
    ('FA-015-A','Programacion de Transferencia Unica (ONCE)','Transferencia programada para fecha futura ejecutada automaticamente. Si no hay fondos marcar FAILED y notificar.',['RN-F015-01: Cancelable hasta el dia anterior a la ejecucion','RN-F015-02: Sin fondos en la fecha de ejecucion FAILED + notificacion']),
    ('FA-015-B','Transferencias Recurrentes WEEKLY/BIWEEKLY/MONTHLY','Ciclos periodicos con fecha fin o maximo de ejecuciones. Meses cortos = ultimo dia habil.',['RN-F015-03: Una recurrente puede pausarse y reanudarse','RN-F015-04: Cancelacion no afecta a ejecuciones ya completadas','RN-F015-05: Dias inexistentes = ultimo dia habil del mes']),
    ('FA-015-C','Consulta y Gestion de Transferencias Programadas','Listado con todos los estados e historial inmutable de ejecuciones.',['RN-F015-06: No se puede editar el IBAN destino de una recurrente activa','RN-F015-07: Historial de ejecuciones es inmutable']),
  ]},
  {'n':18,'feat':'FEAT-016','title':'Gestion Completa de Tarjetas','ver':'v1.18.0','date':'25/03/2026','src':'EVIDENCIA-DIRECTA',
   'intro':'Modulo integral de gestion de tarjetas bajo PCI DSS v4.0: consulta con PAN masking, bloqueo/desbloqueo con SCA condicional, cambio de PIN cifrado, limites, historial 13 meses y notificaciones.',
   'funcs':[
    ('FA-016-007','Consulta de Tarjetas del Cliente','Listado de tarjetas con tipo, estado y ultimos 4 digitos. PAN completo nunca visible.',['RN-012: Solo tarjetas de la identidad verificada en Core Banking','RN-013: Numero de tarjeta siempre enmascarado (ultimos 4 digitos)']),
    ('FA-016-008','Bloqueo y Desbloqueo de Tarjeta','Bloqueo inmediato en todos los canales. Desbloqueo requiere 2FA tras 60 min. Tarjetas del banco no desbloqueables.',['RN-014: Bloqueo inmediato en todos los canales (TPV, cajero, e-commerce)','RN-015: Desbloqueo requiere 2FA tras 60 minutos','RN-016: Tarjetas bloqueadas por el banco no desbloqueables por el cliente']),
    ('FA-016-009','Cambio de PIN de Tarjeta','PIN cifrado en el dispositivo y transmitido directamente al Core Banking.',['RN-017: Requiere 2FA; no puede coincidir con los 3 PINs anteriores','RN-018: PIN no almacenado en BankPortal; transmision cifrada a Core Banking']),
    ('FA-016-010','Gestion de Limites de Tarjeta','Modificacion de limites diarios acotados por maximos contractuales. Efectivo el siguiente dia habil.',['RN-019: Limites acotados por maximos del contrato; no pueden superarse','RN-020: Cambio efectivo el siguiente dia habil bancario']),
    ('FA-016-011','Notificaciones Push de Operaciones con Tarjeta','Alertas de cargos, abonos y cargos rechazados para deteccion de fraude.',['RN-021: Notificaciones tambien para cargos rechazados']),
    ('FA-016-012','Historial de Transacciones de Tarjeta','13 meses de historial con importe original y tipo de cambio para divisas extranjeras.',['RN-022: Historial de 13 meses (normativa EU)','RN-023: Divisa extranjera: importe original + tipo de cambio aplicado']),
  ]},
  {'n':19,'feat':'FEAT-017','title':'Domiciliaciones y Recibos SEPA Direct Debit','ver':'v1.19.0','date':'27/03/2026','src':'FA-FEAT-017-sprint19.md',
   'intro':'Gestion completa del ciclo de vida de domiciliaciones SEPA DD Core: alta de mandatos con firma digital, consulta y cancelacion con bloqueo PSD2 D-2, procesamiento automatico de cobros y notificaciones push por cada evento. Cumplimiento SEPA DD Core Rulebook v3.4 y PSD2 Arts. 77 y 80.',
   'funcs':[
    ('FA-053','Modelo de datos de mandatos y recibos SEPA','Entidades debit_mandates y direct_debits con ciclo de vida completo. UMR unico BNK-{userId6}-{timestamp}.',['RN-053-01: Mandato pertenece a un cliente y una cuenta bancaria','RN-053-02: Un cliente puede tener multiples mandatos activos con distintos acreedores','RN-053-03: No pueden coexistir dos mandatos ACTIVE con mismo acreedor e IBAN','RN-053-04: UMR unico en todo el sistema, generado por BankPortal']),
    ('FA-054','Consulta de domiciliaciones y recibos','Vista de mandatos activos/cancelados y historial cronologico de recibos con filtros y paginacion.',['RN-054-01: Aislamiento estricto por usuario — solo ve sus propios mandatos','RN-054-02: Recibos en orden cronologico descendente','RN-054-03: Paginacion obligatoria, maximo 50 recibos por pagina','RN-054-04: Sin domiciliaciones muestra pantalla vacia amigable']),
    ('FA-055','Alta de domiciliacion con mandato SEPA','Proceso de 3 pasos: datos acreedor + validacion IBAN ISO 13616 + confirmacion OTP 2FA (SCA PSD2).',['RN-055-01: Solo mandatos SEPA DD CORE en v1.19.0 (B2B reservado)','RN-055-02: IBAN acreedor: ISO 13616, 34 paises SEPA','RN-055-03: No duplicados activos mismo acreedor+IBAN','RN-055-04: OTP 2FA obligatorio e inomitible','RN-055-05: UMR generado por sistema, no por el cliente','RN-055-06: Audit log MANDATE_CREATED con usuario, cuenta, acreedor, IP']),
    ('FA-056','Anulacion y revocacion de mandato domiciliado','Cancelacion con bloqueo regulatorio PSD2 D-2 si existe recibo PENDING inminente. OTP obligatorio.',['RN-056-01: Solo el titular puede cancelar el mandato','RN-056-02: OTP 2FA obligatorio en cancelacion','RN-056-03: Bloqueo PSD2 D-2 si hay recibo PENDING en proximos 2 dias habiles','RN-056-04: Mandato CANCELLED no reactivable — requiere nuevo alta','RN-056-05: Audit log MANDATE_CANCELLED con usuario, mandato_id, acreedor, IP']),
    ('FA-057','Notificaciones push en eventos de cobro y devolucion','Push en tiempo real para DEBIT_CHARGED, DEBIT_RETURNED y DEBIT_REJECTED. PSD2 Art.80.',['RN-057-01: Push opcional si el cliente no tiene token de dispositivo registrado (graceful degradation)','RN-057-02: Audit log registrado independientemente del resultado del push','RN-057-03: Tiempo maximo evento-notificacion: 30 segundos']),
    ('FA-058','Interfaz Angular — Gestion de domiciliaciones','Lista, detalle, wizard alta (3 pasos) y confirmacion cancelacion. WCAG 2.1 AA. Lazy-loaded.',['RN-058-01: Validacion IBAN en frontend antes de llamar al backend','RN-058-02: Codificacion visual de estados consistente en toda la app','RN-058-03: Cumple WCAG 2.1 AA (0 violaciones axe-core)','RN-058-04: Modulo lazy-loaded sin impacto en bundle principal','RN-058-05: Mensajes de error en lenguaje comprensible para el cliente']),
  ]},
  {'n':20,'feat':'FEAT-018','title':'Exportacion de Movimientos Bancarios (PDF/CSV)','ver':'v1.20.0','date':'30/03/2026','src':'FA-FEAT-018-sprint20.md',
   'intro':'Exportacion de historial de movimientos bancarios en formato PDF oficial y CSV europeo para cumplimiento PSD2 Art.47 (acceso al historial de pagos). PDF con cabecera corporativa, hash SHA-256 y PAN enmascarado. CSV UTF-8 BOM compatible con Excel. Audit log GDPR+PCI-DSS con retencion 7 anos.',
   'funcs':[
    ('FA-059','Generacion de extracto PDF de movimientos','PDF oficial con cabecera Banco Meridian, hash SHA-256, PAN enmascarado (PCI-DSS Req.3.4). < 3s p95 para 500 registros.',['RN-F018-01: Rango maximo exportable: 12 meses (PSD2 Art.47)','RN-F018-02: PAN enmascarado — solo ultimos 4 digitos visibles (PCI-DSS Req.3.4)','RN-F018-03: Hash SHA-256 en pie de pagina para integridad y no repudio','RN-F018-04: Maximo 500 registros por exportacion']),
    ('FA-060','Generacion de extracto CSV de movimientos','CSV europeo: UTF-8 BOM, separador ";", coma decimal, compatible con Excel espanol.',['RN-F018-05: UTF-8 BOM para compatibilidad Excel en espanol','RN-F018-06: Separador ";" y decimal con coma (estandar europeo)','RN-F018-07: PAN no incluido en ninguna columna del CSV','RN-F018-08: Primera fila con nombres de columna en espanol']),
    ('FA-061','Filtrado multicriteria previo a exportacion','Filtros: tipo movimiento, rango fechas, cuenta/IBAN. Preview count antes de confirmar. Limite 500 registros.',['RN-F018-09: Fecha minima seleccionable: 12 meses atras','RN-F018-10: Preview count > 500 bloquea exportacion con aviso al usuario','RN-F018-11: Filtros aplicados registrados en export_audit_log (trazabilidad GDPR)']),
    ('FA-062','Audit log de exportaciones — GDPR Art.15 + PCI-DSS','Registro asincrono fire-and-forget de cada exportacion. Campos: userId, IBAN, filtros, formato, num_registros, IP, hash SHA-256. Retencion 7 anos.',['RN-F018-12: Audit log asincrono — su fallo no interrumpe la exportacion','RN-F018-13: Retencion 7 anos (GDPR Art.17 y PCI-DSS Req.10.7)','RN-F018-14: Solo ADMIN puede consultar el audit log completo','RN-F018-15: Hash SHA-256 del PDF almacenado para verificacion posterior']),
    ('FA-063','Notificacion RETURNED via CoreBanking webhook (DEBT-035)','Handler para estado RETURNED con R-codes R01-R10. Push notification al usuario con descripcion legible del motivo de devolucion.',['RN-DEBT035-01: Mandato actualizado a estado RETURNED con R-code y motivo','RN-DEBT035-02: Push notification con descripcion legible del R-code (ej: R01=Fondos insuficientes)','RN-DEBT035-03: Evento RETURNED registrado en audit trail con timestamp, mandato_id y R-code']),
  ]},
  {'n':21,'feat':'FEAT-019','title':'Centro de Privacidad y Perfil de Usuario','ver':'v1.21.0','date':'31/03/2026','src':'FA-FEAT-019-sprint21.md',
   'intro':'Centro de Privacidad GDPR y gestion del perfil de usuario. Permite al cliente consultar y actualizar sus datos personales, gestionar sesiones activas, administrar consentimientos GDPR y ejercer sus derechos de portabilidad (Art.20) y supresion (Art.17). Cierra DEBT-039 (ProfileController sin implementar desde S14). Regulacion: GDPR Arts. 7, 12, 15, 16, 17, 20 y PSD2-SCA.',
   'funcs':[
    ('FA-019-A','Consulta de datos personales desde perfil','GET /api/v1/profile. Datos del titular con telefono enmascarado, email solo lectura, estado KYC. Si kycStatus=PENDING todos los campos son solo lectura (HTTP 423).',['RN-F019-01: Email solo lectura — no modificable desde la app, requiere tramite presencial','RN-F019-02: Telefono enmascarado en consulta (primeros digitos ocultos)','RN-F019-03: Si kycStatus=PENDING todos los campos son solo lectura','RN-F019-04: Respuesta < 1 segundo bajo carga normal']),
    ('FA-019-B','Actualizacion de datos personales','PATCH /api/v1/profile. Nombre, apellidos, direccion actualizables directamente. Cambio de telefono requiere OTP SMS al numero actual (SCA PSD2 Art.97). Todos los cambios auditados.',['RN-F019-05: Cambio de telefono requiere OTP al numero actual (SCA PSD2 Art.97)','RN-F019-06: Email no modificable bajo ninguna circunstancia desde la API','RN-F019-07: KYC PENDING bloquea actualizacion con HTTP 423 Locked','RN-F019-08: Todos los cambios registrados en audit_log con valores anterior/nuevo','RN-F019-09: Nombre y apellidos longitud minima 2 caracteres, no pueden quedar vacios']),
    ('FA-019-C','Gestion de sesiones activas y cierre remoto','GET /api/v1/profile/sessions lista sesiones con dispositivo e IP enmascarada. DELETE /sessions/{id} invalida el JWT inmediatamente en Redis blacklist (reutiliza TokenService S20).',['RN-F019-10: Sesion actual (isCurrent=true) no puede cerrarse — HTTP 409 Conflict','RN-F019-11: Cierre remoto invalida JWT inmediatamente via Redis blacklist (TokenService S20)','RN-F019-12: IP mostrada siempre enmascarada (hereda RN-F002-01)','RN-F019-13: Maximo 5 sesiones simultaneas por usuario (hereda RN-F003-04)','RN-F019-14: Cierre remoto registrado en audit_log con sessionId y IP']),
    ('FA-019-D','Gestion de consentimientos GDPR con historial','GET/PATCH /api/v1/privacy/consents. Cuatro categorias: Marketing, Analitica, Comunicaciones, Seguridad. Seguridad no desactivable. Cada cambio genera registro inmutable en consent_history. Sincronizacion con preferencias de notificacion (FEAT-014).',['RN-F019-15: Consentimiento SECURITY no desactivable — HTTP 422 (hereda RN-F004-06)','RN-F019-16: Cada cambio genera registro inmutable en consent_history (userId, tipo, valores, IP, timestamp)','RN-F019-17: COMMUNICATIONS sincroniza con preferencias de notificacion FEAT-014 transaccionalmente','RN-F019-18: Historial consent_history es solo lectura para el usuario']),
    ('FA-019-E','Portabilidad de datos — descarga JSON firmado','POST /api/v1/privacy/data-export inicia generacion asincrona (@Async). JSON con perfil, consentimientos, sesiones y audit log propio. SHA-256 firmado. Push notification cuando listo. Enlace descarga 48h TTL.',['RN-F019-19: Solo un export activo simultaneo por usuario — HTTP 409 si ya existe','RN-F019-20: Generacion asincrona @Async — SLA maximo 24 horas','RN-F019-21: JSON firmado con SHA-256 para integridad (patron FEAT-018)','RN-F019-22: Push notification cuando export disponible (NotificationService FEAT-014)','RN-F019-23: Enlace de descarga expira en 48 horas — HTTP 410 Gone','RN-F019-24: Solicitud registrada en gdpr_requests (PENDING, sla=+30 dias)']),
    ('FA-019-F','Derecho al olvido — eliminacion de cuenta','POST /deletion-request con OTP 2FA + confirmacion email (enlace 24h TTL). Cuenta suspendida inmediatamente. Borrado logico en 30 dias (soft delete + anonimizacion PII). Conserva audit logs por obligacion legal GDPR Art.17 par.3.b.',['RN-F019-25: Requiere OTP 2FA valido (SCA aplicado por seguridad)','RN-F019-26: Enlace email confirmacion de un solo uso con TTL 24 horas','RN-F019-27: Cuenta suspendida inmediatamente tras confirmacion email','RN-F019-28: Borrado logico: nombre anonimizado, email hasheado, telefono y direccion null','RN-F019-29: Audit_log y gdpr_requests conservados por obligacion legal GDPR Art.17 par.3.b','RN-F019-30: Webhook a CoreBanking fire-and-forget — si falla registra DEBT-040 sin bloquear','RN-F019-31: SLA GDPR: borrado logico completo en 30 dias desde confirmacion','RN-F019-32: Usuario recibe email de inicio y email de completado del borrado']),
    ('FA-019-G','Log de derechos GDPR — panel administracion','GET /api/v1/admin/gdpr-requests (solo ADMIN). Tabla gdpr_requests con estados PENDING/IN_PROGRESS/COMPLETED/REJECTED. Alerta automatica cuando SLA < 5 dias. Retencion 6 anos.',['RN-F019-33: Solo usuarios con rol ADMIN pueden acceder al panel','RN-F019-34: SLA respuesta GDPR: 30 dias desde la solicitud (GDPR Art.12 par.3)','RN-F019-35: Alerta automatica a ADMIN cuando SLA < 5 dias y estado != COMPLETED','RN-F019-36: Retencion del log: 6 anos (GDPR Art.17 par.3.b + obligacion legal contable)','RN-F019-37: Log gdpr_requests append-only — no se permiten UPDATE ni DELETE']),
  ]},
]

BUSINESS_RULES = {
    'Autenticacion y Seguridad': [
        ('RN-F001-01','authentication','El secreto TOTP se almacena siempre cifrado (AES-256-CBC); nunca en claro'),
        ('RN-F001-02','authentication','El OTP es valido durante 30 segundos; se admite un margen de +/-1 periodo'),
        ('RN-F001-03','authentication','Los codigos de recuperacion se almacenan hasheados con BCrypt (cost=10)'),
        ('RN-F001-04','authentication','Cada codigo de recuperacion solo puede usarse una unica vez'),
        ('RN-F001-05','audit','El audit_log es inmutable: no se permiten UPDATE ni DELETE'),
        ('RN-F001-06','audit','Registros incluyen IP, user-agent, timestamp UTC y resultado (SUCCESS/FAILURE/BLOCKED)'),
        ('RN-F002-01','session','Las IPs se muestran siempre enmascaradas en la vista de sesiones'),
        ('RN-F002-02','session','El token de sesion se almacena solo como hash SHA-256'),
        ('RN-F002-03','session','El cierre remoto de sesion es irreversible e inmediato'),
        ('RN-F002-04','session','El cliente no puede cerrar su sesion actual desde el gestor de sesiones'),
        ('RN-F002-05','session','El enlace de denegacion de sesion es de un solo uso con TTL de 1 hora'),
        ('RN-F002-06','session','Timeout de inactividad configurable entre 5 y 60 minutos (maximo PCI-DSS)'),
        ('RN-F003-01','trusteddevice','El token de confianza se almacena como cookie HttpOnly; nunca en localStorage'),
        ('RN-F003-02','trusteddevice','El token de confianza expira a los 30 dias; se renueva en cada uso'),
        ('RN-F003-03','trusteddevice','Cambio sustancial de red requiere re-verificacion con OTP'),
        ('RN-F003-04','trusteddevice','Maximo 5 dispositivos de confianza activos por usuario'),
        ('RN-F003-05','trusteddevice','Dispositivo revocado debe completar OTP en el siguiente login'),
        ('RN-F003-06','trusteddevice','Revocacion masiva de todos los dispositivos disponible en una unica accion'),
        ('RN-F005-01','authentication','El canal SSE se cierra automaticamente si la sesion expira'),
        ('RN-F005-02','authentication','El sistema soporta maximo 500 conexiones SSE simultaneas'),
        ('RN-F005-03','authentication','Subred considerada conocida solo tras confirmacion explicita del cliente'),
        ('RN-F005-04','authentication','Logins desde subredes desconocidas siempre generan notificacion sin excepcion'),
        ('RN-F006-01','authentication','El contador de intentos se resetea al login exitoso o al desbloquear la cuenta'),
        ('RN-F006-02','authentication','La cuenta bloqueada no puede acceder a ningun servicio de BankPortal hasta desbloqueo'),
        ('RN-F006-03','authentication','El token de desbloqueo por email es de unico uso y expira en 1 hora'),
        ('RN-F006-04','authentication','El desbloqueo por email no requiere que el cliente recuerde su contrasena'),
        ('RN-F006-05','authentication','Las alertas de acceso desde ubicacion inusual no pueden desactivarse por preferencias'),
    ],
    'Notificaciones': [
        ('RN-F004-01','notification','Las notificaciones de seguridad se retienen durante 90 dias'),
        ('RN-F004-02','notification','Notificaciones de severidad ALTA no pueden desactivarse por el cliente'),
        ('RN-F004-03','notification','Marcar como leida NO elimina el registro del audit_log'),
        ('RN-F004-04','notification','El badge de notificaciones no leidas se actualiza en tiempo real'),
        ('RN-F004-05','notification','Las acciones directas desde notificacion requieren sesion activa del cliente'),
        ('RN-F004-06','notification','ACCOUNT_LOCKED y LOGIN_NEW_CONTEXT_DETECTED no pueden desactivarse'),
        ('RN-F004-07','notification','Configuracion independiente por tipo de evento y canal (email/push/in-app)'),
        ('RN-001','notifications','Solo dispositivos con token VAPID registrado activo reciben notificaciones'),
        ('RN-002','notifications','Un cliente puede registrar hasta 5 dispositivos simultaneamente'),
        ('RN-003','notifications','El registro VAPID expira a los 12 meses sin actividad'),
        ('RN-004','notifications','Las notificaciones de movimientos se envian en tiempo real, maximo 30 segundos'),
        ('RN-005','notifications','Los movimientos bajo el umbral configurado no generan notificacion por defecto'),
        ('RN-006','notifications','El cliente puede desactivar categorias; la categoria Seguridad siempre activa'),
    ],
    'Cuentas, Transferencias y Pagos': [
        ('RN-F007-01','account','El saldo disponible y el saldo retenido se muestran siempre separados'),
        ('RN-F007-02','account','El IBAN se muestra en formato estandar europeo'),
        ('RN-F007-03','account','Los movimientos negativos representan cargos; los positivos representan abonos'),
        ('RN-F007-04','account','El historial disponible cubre al menos los ultimos 13 meses (normativa EU)'),
        ('RN-F007-05','account','La busqueda por concepto opera sobre los ultimos 13 meses de movimientos'),
        ('RN-F007-06','account','La categorizacion es automatica; el cliente puede corregirla manualmente'),
        ('RN-F008-01','transfer','El importe se opera siempre en precision DECIMAL(15,2); nunca con punto flotante'),
        ('RN-F008-02','transfer','Las transferencias que superan el limite por operacion requieren 2FA (SCA)'),
        ('RN-F008-03','transfer','Limites predeterminados: 2.000 EUR/op, 3.000 EUR/dia, 10.000 EUR/mes'),
        ('RN-F008-04','transfer','No pueden existir dos beneficiarios activos con el mismo IBAN para un mismo usuario'),
        ('RN-F008-05','transfer','La baja de beneficiario es soft delete; el historial de transferencias se conserva'),
        ('RN-F008-06','transfer','Los limites de transferencia son establecidos por el banco; el cliente no puede modificarlos'),
        ('RN-F008-07','transfer','El acumulado diario se calcula en UTC y se resetea a medianoche'),
        ('RN-F009-01','bill','Los recibos se muestran ordenados por fecha de vencimiento (mas proximos primero)'),
        ('RN-F009-02','bill','Un recibo en estado CANCELLED no puede volver a pagarse'),
        ('RN-F009-03','bill','El pago de un recibo requiere saldo disponible suficiente en la cuenta origen'),
        ('RN-F009-04','bill','El cliente puede elegir la cuenta cargo entre sus cuentas activas'),
        ('RN-F009-05','bill','El numero de referencia del pago ad-hoc se comunica al emisor para conciliacion'),
        ('RN-F015-01','scheduled','Una transferencia programada puede cancelarse hasta el dia anterior a la ejecucion'),
        ('RN-F015-02','scheduled','Sin fondos en la fecha de ejecucion FAILED + notificacion al cliente'),
        ('RN-F015-03','scheduled','Una transferencia recurrente puede pausarse temporalmente y reanudarse'),
        ('RN-F015-04','scheduled','La cancelacion de una recurrente no afecta a las ejecuciones ya completadas'),
        ('RN-F015-05','scheduled','Las recurrentes mensuales en dias inexistentes se ejecutan el ultimo dia habil del mes'),
        ('RN-F015-06','scheduled','No se puede editar el IBAN destino de una recurrente activa; hay que cancelar y crear nueva'),
        ('RN-F015-07','scheduled','El historial de ejecuciones de transferencias programadas es inmutable'),
    ],
    'Dashboard y Perfil': [
        ('RN-F010-01','dashboard','Los gastos se calculan de forma asincrona; desfase maximo 5 minutos'),
        ('RN-F010-02','dashboard','Los movimientos sin categoria asignada aparecen en la categoria Otros'),
        ('RN-F010-03','dashboard','La comparativa mensual cubre los ultimos 12 periodos completos'),
        ('RN-F010-04','dashboard','El presupuesto mensual es establecido por el cliente; no tiene valor predeterminado'),
        ('RN-F010-05','dashboard','Solo se genera una alerta de presupuesto por periodo y umbral (sin repeticiones)'),
        ('RN-F011-01','dashboard','El PDF de extracto incluye siempre los datos del titular y el periodo exacto'),
        ('RN-F011-02','dashboard','El extracto PDF puede cubrir hasta 13 meses (normativa EU)'),
        ('RN-F011-03','dashboard','El fichero Excel incluye hoja de movimientos y hoja resumen por categoria'),
        ('RN-F011-04','dashboard','Los importes en Excel usan formato numerico (no texto) para calculos directos'),
        ('RN-F011-05','dashboard','El informe analitico solo exporta periodos completos (no el mes en curso parcial)'),
        ('RN-F012-01','profile','El email del cliente no puede modificarse desde BankPortal; requiere tramite presencial'),
        ('RN-F012-02','profile','El telefono movil debe verificarse antes de ser usado para 2FA por SMS'),
        ('RN-F012-03','profile','La nueva contrasena no puede coincidir con ninguna de las 3 anteriores'),
        ('RN-F012-04','profile','El cambio de contrasena revoca automaticamente todas las sesiones excepto la actual'),
        ('RN-F012-05','profile','Las preferencias de comunicacion se aplican a todos los modulos de BankPortal'),
        ('RN-F012-06','profile','Desactivar el canal push no cancela la suscripcion VAPID; solo deja de recibir notificaciones'),
        ('RN-F012-07','profile','Los JWTs revocados se verifican en O(1) mediante Redis blacklist; la BD es el registro de auditoria'),
    ],
    'KYC y Tarjetas': [
        ('RN-F013-01','kyc','El acceso a transferencias y servicios de pago requiere KYC aprobado'),
        ('RN-F013-02','kyc','El proceso KYC puede interrumpirse y retomarse en cualquier momento antes de enviar'),
        ('RN-F013-03','kyc','Los documentos se almacenan cifrados (AES-256); nunca en claro en base de datos'),
        ('RN-F013-04','kyc','Se verifica el hash SHA-256 del documento al subir para detectar ficheros corruptos'),
        ('RN-F013-05','kyc','Tipos de documento aceptados: DNI, NIE, Pasaporte'),
        ('RN-F013-06','kyc','El rechazo KYC debe incluir siempre un motivo que se comunica al cliente'),
        ('RN-F013-07','kyc','Un KYC aprobado no caduca mientras los documentos de identidad esten vigentes'),
        ('RN-012','cards','El cliente solo visualiza tarjetas vinculadas a su identidad verificada en Core Banking'),
        ('RN-013','cards','El numero de tarjeta se muestra enmascarado (ultimos 4 digitos visibles)'),
        ('RN-014','cards','El bloqueo de tarjeta es inmediato; inoperativa en todos los canales'),
        ('RN-015','cards','El desbloqueo requiere 2FA si han transcurrido mas de 60 minutos desde el bloqueo'),
        ('RN-016','cards','Una tarjeta bloqueada por el banco no puede ser desbloqueada por el cliente desde la app'),
        ('RN-017','cards','El cambio de PIN requiere 2FA obligatorio y no puede coincidir con los ultimos 3 PINs'),
        ('RN-018','cards','El PIN no se almacena en BankPortal; se transmite cifrado directamente al Core Banking'),
        ('RN-019','cards','Los limites de tarjeta estan acotados por los maximos del contrato con el banco'),
        ('RN-020','cards','El cambio de limites tiene efecto en el siguiente dia habil bancario'),
        ('RN-021','cards','Las notificaciones de tarjeta se disparan tambien para cargos rechazados'),
        ('RN-022','cards','El historial de transacciones cubre los ultimos 13 meses (normativa EU)'),
        ('RN-023','cards','Las transacciones en divisa extranjera muestran importe original y tipo de cambio aplicado'),
    ],
    'Domiciliaciones SEPA DD (FEAT-017)': [
        ('RN-053-01','mandatos','Cada mandato pertenece a exactamente un cliente y una cuenta bancaria'),
        ('RN-053-02','mandatos','Un cliente puede tener multiples mandatos activos con distintos acreedores'),
        ('RN-053-03','mandatos','No pueden coexistir dos mandatos ACTIVE con mismo acreedor e IBAN para el mismo cliente'),
        ('RN-053-04','mandatos','UMR unico en todo el sistema, formato: BNK-{userId6}-{unixTimestamp}'),
        ('RN-054-01','consulta','Aislamiento estricto por usuario — solo ve sus propios mandatos y recibos'),
        ('RN-054-02','consulta','Recibos en orden cronologico descendente (mas reciente primero)'),
        ('RN-054-03','consulta','Paginacion obligatoria, maximo 50 recibos por pagina'),
        ('RN-055-01','alta','Solo mandatos SEPA DD CORE en v1.19.0 (B2B reservado para version posterior)'),
        ('RN-055-02','alta','IBAN acreedor: ISO 13616, 34 paises SEPA'),
        ('RN-055-03','alta','No duplicados activos con mismo acreedor e IBAN'),
        ('RN-055-04','alta','OTP 2FA obligatorio e inomitible en alta de mandato (SCA PSD2)'),
        ('RN-055-06','alta','Audit log MANDATE_CREATED con usuario, cuenta, acreedor, IBAN, timestamp, IP'),
        ('RN-056-01','cancelacion','Solo el titular del mandato puede cancelarlo'),
        ('RN-056-02','cancelacion','OTP 2FA obligatorio en cancelacion de mandato'),
        ('RN-056-03','cancelacion','Bloqueo PSD2 D-2: no se puede cancelar si hay recibo PENDING en proximos 2 dias habiles SEPA'),
        ('RN-056-04','cancelacion','Mandato CANCELLED no reactivable — requiere nuevo proceso de alta'),
        ('RN-057-01','notificaciones','Push opcional si no hay token de dispositivo registrado (graceful degradation)'),
        ('RN-057-03','notificaciones','Tiempo maximo entre evento y notificacion push: 30 segundos'),
    ],
    'Exportacion de Movimientos (FEAT-018)': [
        ('RN-F018-01','pdf','Rango maximo exportable: 12 meses desde fecha de solicitud (PSD2 Art.47 §2)'),
        ('RN-F018-02','pdf','PAN enmascarado en PDF — solo ultimos 4 digitos visibles (PCI-DSS Req.3.4)'),
        ('RN-F018-03','pdf','Hash SHA-256 en pie de pagina como garantia de integridad y no repudio'),
        ('RN-F018-04','pdf','Maximo 500 registros por exportacion. Superarlo bloquea la exportacion con aviso'),
        ('RN-F018-05','csv','UTF-8 BOM obligatorio para compatibilidad con Excel en espanol'),
        ('RN-F018-06','csv','Separador de campos ";" y decimal con coma (estandar europeo)'),
        ('RN-F018-07','csv','PAN no incluido en ninguna columna del CSV (PCI-DSS)'),
        ('RN-F018-09','filtros','Fecha minima seleccionable: 12 meses atras desde la fecha actual'),
        ('RN-F018-10','filtros','Preview count > 500 bloquea exportacion hasta que el usuario reduzca el rango'),
        ('RN-F018-11','filtros','Filtros aplicados registrados en export_audit_log para trazabilidad GDPR'),
        ('RN-F018-12','audit','Audit log asincrono fire-and-forget — su fallo no interrumpe la exportacion'),
        ('RN-F018-13','audit','Retencion obligatoria del audit log: 7 anos (GDPR Art.17 y PCI-DSS Req.10.7)'),
        ('RN-F018-14','audit','Solo usuarios ADMIN pueden consultar el audit log completo'),
        ('RN-DEBT035-01','devolucion','Mandato actualizado a RETURNED con R-code y motivo al recibir webhook CoreBanking'),
        ('RN-DEBT035-02','devolucion','Push notification con descripcion legible del R-code (R01=Fondos insuficientes, etc.)'),
        ('RN-DEBT035-03','devolucion','Evento RETURNED registrado en audit trail con timestamp, mandato_id y R-code'),
    ],
}

def generate(out_path):
    doc = Document()
    for section in doc.sections:
        section.page_width  = Cm(21)
        section.page_height = Cm(29.7)
        section.left_margin = section.right_margin = Cm(2)
        section.top_margin  = section.bottom_margin = Cm(2)

    # PORTADA
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(60)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('ANALISIS FUNCIONAL')
    r.bold = True; r.font.size = Pt(28); r.font.name = 'Arial'; r.font.color.rgb = BLUE_DARK

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('BANKPORTAL')
    r.bold = True; r.font.size = Pt(22); r.font.name = 'Arial Black'; r.font.color.rgb = ORANGE

    doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('Cliente: Banco Meridian')
    r.font.size = Pt(14); r.font.name = 'Arial'; r.font.color.rgb = BLUE_MID

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('Elaborado por: Experis - SOFIA Software Factory')
    r.font.size = Pt(11); r.font.name = 'Arial'; r.font.color.rgb = GRAY_SUB

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('Version 3.0  |  Marzo 2026  |  CMMI Nivel 3  |  Sprints 1-21')
    r.font.size = Pt(10); r.font.name = 'Arial'; r.font.color.rgb = GRAY_SUB

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('NOTA: Funcionalidades S1-S15 reconstruidas desde codigo fuente (migraciones Flyway, use cases, pom.xml)')
    r.font.size = Pt(9); r.font.name = 'Arial'; r.font.color.rgb = AMBER; r.italic = True

    doc.add_page_break()

    # ── INDICE (Tabla de Contenidos) ─────────────────────────────────────────
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('INDICE')
    r.bold = True; r.font.size = Pt(16); r.font.name = 'Arial'; r.font.color.rgb = BLUE_DARK
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after  = Pt(16)

    # Línea decorativa bajo el título
    p2 = doc.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after  = Pt(14)
    from docx.oxml import OxmlElement as OE
    from docx.oxml.ns import qn as qname
    pPrIdx = p2._p.get_or_add_pPr()
    pBdrIdx = OE('w:pBdr')
    bottom = OE('w:bottom')
    bottom.set(qname('w:val'), 'single')
    bottom.set(qname('w:sz'), '6')
    bottom.set(qname('w:color'), 'C84A14')
    pBdrIdx.append(bottom)
    pPrIdx.append(pBdrIdx)

    # Entradas del índice
    toc_entry(doc, '1. Resumen Ejecutivo', 'sec1', level=1)
    toc_entry(doc, '2. Contexto de Negocio', 'sec2', level=1)
    toc_entry(doc, '3. Arquitectura Funcional', 'sec3', level=1)
    toc_entry(doc, '4. Catalogo de Funcionalidades', 'sec4', level=1)
    # Sub-entradas del catálogo (una por sprint)
    for _toc_idx, sp in enumerate(SPRINTS, start=1):
        n = sp['n']
        feat = sp['feat']
        title_short = sp['title'][:50] + ('...' if len(sp['title']) > 50 else '')
        anchor_id = f'sprintidx{_toc_idx}'
        toc_entry(doc, f'  4.{str(n).replace("+","/")} {feat} - {title_short}', anchor_id, level=2)
    toc_entry(doc, '5. Reglas de Negocio Consolidadas', 'sec5', level=1)
    toc_entry(doc, '6. Glosario del Dominio', 'sec6', level=1)
    toc_entry(doc, '7. Matriz de Cobertura Funcional', 'sec7', level=1)
    toc_entry(doc, '8. Historial de Cambios', 'sec8', level=1)

    # Nota al pie del índice
    p_note = doc.add_paragraph()
    p_note.paragraph_format.space_before = Pt(20)
    r_note = p_note.add_run('Nota: Los titulos del indice son hiperlinks navegables. Haga clic para saltar a cada seccion.')
    r_note.font.size = Pt(8); r_note.font.name = 'Arial'; r_note.italic = True
    r_note.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
    p_note.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_page_break()

    # ── FIN INDICE ────────────────────────────────────────────────────────────


    # 1. RESUMEN EJECUTIVO
    heading1(doc, '1. RESUMEN EJECUTIVO', bookmark_id='sec1')
    heading2(doc, '1.1 Proposito del documento')
    body(doc, 'Este documento recoge el Analisis Funcional completo de BankPortal, la solucion de banca digital desarrollada por Experis para Banco Meridian. Describe en lenguaje de negocio las 70 funcionalidades implementadas en los 21 sprints del proyecto, sus flujos de proceso, reglas de negocio y marco regulatorio.')
    body(doc, 'Las funcionalidades de los Sprints 1-15 han sido reconstruidas a partir de migraciones Flyway, use cases y pom.xml. Las funcionalidades de los Sprints 16-18 estan documentadas con evidencias directas de entrega.')

    heading2(doc, '1.2 Estado consolidado del proyecto')
    sw = [1.5, 3.5, 2.0, 2.2, 1.0, 1.0, 1.0]
    t = doc.add_table(rows=1, cols=7)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    add_header_row(t, ['Sprint','Feature / Modulo','Version','Fecha','SP','Tests','Cob.'], sw)
    sprint_summary = [
        ('S1-2','FEAT-001 - 2FA TOTP + Auditoria','v1.2.0','2026-02-xx','48','~70','80%',False),
        ('S3','FEAT-002 - Gestion Sesiones','v1.3.0','2026-04-14','24','~105','80%',False),
        ('S4','FEAT-003 - Dispositivos Confianza','v1.4.0','2026-04-28','24','~140','81%',False),
        ('S5+8','FEAT-004 - Centro Notif. Seguridad','v1.8.0','2026-05/06','48','~210','82%',False),
        ('S6','FEAT-005 - SSE + Contexto Geografico','v1.6.0','2026-05-26','24','~185','81%',False),
        ('S7','FEAT-006 - Bloqueo de Cuenta','v1.7.0','2026-06-09','24','~220','82%',False),
        ('S9','FEAT-007 - Cuentas y Movimientos','v1.9.0','2026-06-23','24','~260','82%',False),
        ('S10','FEAT-008 - Transferencias Bancarias','v1.10.0','2026-07-07','24','~295','83%',False),
        ('S11','FEAT-009 - Pagos de Recibos','v1.11.0','2026-07-21','24','~320','83%',False),
        ('S12','FEAT-010 - Dashboard Analitico','v1.12.0','2026-08-04','24','~345','83%',False),
        ('S13','FEAT-011 - Exportacion PDF/Excel','v1.13.0','2026-08-18','24','~365','83%',False),
        ('S14','FEAT-012 - Gestion de Perfil','v1.14.0','2026-09-01','24','~385','84%',False),
        ('S15','FEAT-013 - KYC Onboarding','v1.15.0','2026-09-15','24','~408','84%',False),
        ('S16','FEAT-014 - Push VAPID [VERIFICADO]','v1.16.0','24/03/2026','24','553','84%',True),
        ('S17','FEAT-015 - Transf. Programadas [VERIFICADO]','v1.17.0','22/04/2026','24','615','85%',True),
        ('S18','FEAT-016 - Gestion Tarjetas [VERIFICADO]','v1.18.0','25/03/2026','24','677','86%',True),
        ('S19','FEAT-017 - Domiciliaciones SEPA DD [VERIFICADO]','v1.19.0','27/03/2026','24','708','87%',False),
    ('S20','FEAT-018 - Exportacion Movimientos PDF/CSV [VERIFICADO]','v1.20.0','30/03/2026','24','524*','88%',False),
    ('S21','FEAT-019 - Centro Privacidad y Perfil [EN CURSO]','v1.21.0','31/03/2026','24','---','>= 88%',True),
    ('TOTAL','19 features - 70 funcionalidades','---','21 sprints','473 SP','708+','88%',True),
    ]
    for i, row_data in enumerate(sprint_summary):
        add_data_row(t, list(row_data[:7]), sw, alt=(i%2==1), highlight=row_data[7])

    doc.add_page_break()

    # 2. CONTEXTO DE NEGOCIO
    heading1(doc, '2. CONTEXTO DE NEGOCIO', bookmark_id='sec2')
    heading2(doc, '2.1 Descripcion del negocio')
    body(doc, 'Banco Meridian es una entidad financiera que opera en el mercado europeo, sujeta a PSD2, PCI DSS v4.0, SEPA, GDPR y la normativa AML/KYC. BankPortal es la plataforma de banca digital integrada con el Core Banking del banco en tiempo real.')
    heading2(doc, '2.2 Actores del sistema')
    aw = [3.0, 4.5, 7.2]
    t = doc.add_table(rows=1, cols=3)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    add_header_row(t, ['Actor','Descripcion','Operaciones principales'], aw)
    actors = [
        ('Cliente Banco','Usuario final titular de productos financieros','Login 2FA, consulta cuentas/tarjetas, transferencias, pagos, KYC, perfil, notificaciones'),
        ('Core Banking','Sistema central del banco (CoreBankingAdapter)','Fuente de datos master de cuentas y tarjetas; ejecutor de operaciones financieras'),
        ('Revisor KYC','Equipo de cumplimiento del banco','Revision y resolucion de documentos de identidad de clientes en proceso de onboarding'),
        ('Sistema Push','Infraestructura VAPID','Entrega cifrada de notificaciones push a dispositivos registrados del cliente'),
    ]
    for i, a in enumerate(actors):
        add_data_row(t, list(a), aw, alt=(i%2==1))
    heading2(doc, '2.3 Marco regulatorio')
    rw = [3.0, 6.0, 5.7]
    t = doc.add_table(rows=1, cols=3)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    add_header_row(t, ['Regulacion','Descripcion','Modulos afectados'], rw)
    regs = [
        ('PSD2 Art. 97 (SCA)','Autenticacion Reforzada del Cliente para operaciones de riesgo','2FA, Transferencias, Tarjetas, Programadas'),
        ('PSD2 Art. 67 (AIS)','Acceso a informacion de cuentas - historial 13 meses','Cuentas, Tarjetas'),
        ('PCI DSS v4.0','Seguridad en tratamiento de datos de tarjetas y contrasenas','Autenticacion, Tarjetas, Perfil'),
        ('GDPR','Proteccion de datos personales, consentimiento y portabilidad','Notificaciones, KYC, Perfil, Dashboard'),
        ('SEPA / SEPA DD Core','Estandar de pagos en euros y domiciliaciones','Transferencias, Programadas, Domiciliaciones'),
        ('AML/KYC (UE 2015/849)','Verificacion de identidad del cliente (Know Your Customer)','KYC Onboarding'),
    ]
    for i, r in enumerate(regs):
        add_data_row(t, list(r), rw, alt=(i%2==1))

    doc.add_page_break()

    # 3. ARQUITECTURA FUNCIONAL
    heading1(doc, '3. ARQUITECTURA FUNCIONAL', bookmark_id='sec3')
    heading2(doc, '3.1 Modulos del sistema')
    mw = [2.8, 4.5, 2.5, 1.8, 3.1]
    t = doc.add_table(rows=1, cols=5)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    add_header_row(t, ['Modulo','Descripcion','Estado','Sprints','Regulacion'], mw)
    mods = [
        ('Autenticacion/2FA','TOTP, recovery codes, audit, bloqueo, SSE, contexto','ENTREGADO','S1-7','PSD2/PCI-DSS'),
        ('Sesiones','Gestion avanzada, cierre remoto, deny-link','ENTREGADO','S3','PCI-DSS'),
        ('Dispositivos Confianza','Trust token, skip-OTP, revocacion','ENTREGADO','S4','PSD2/PCI-DSS'),
        ('Notif. Seguridad','Centro notificaciones, preferencias multicanal','ENTREGADO','S5+8','GDPR/PCI-DSS'),
        ('Cuentas','Saldos, movimientos, categorizacion, busqueda','ENTREGADO','S9','PSD2-AIS'),
        ('Transferencias','Inmediatas, beneficiarios, limites','ENTREGADO','S10','PSD2/SEPA'),
        ('Pagos/Recibos','Recibos domiciliados, pago ad-hoc','ENTREGADO','S11','PSD2/SEPA-DD'),
        ('Dashboard','Analitica gastos, alertas presupuesto, exportacion','ENTREGADO','S12-13','GDPR'),
        ('Perfil','Datos personales, contrasena, tokens JWT','ENTREGADO','S14','GDPR/PCI-DSS'),
        ('KYC','Onboarding verificacion identidad, docs cifrados','ENTREGADO','S15','AML-KYC/GDPR'),
        ('Notif. Push','VAPID multidevice, preferencias multicanal','ENTREGADO','S16','GDPR'),
        ('Transf. Programadas','ONCE/WEEKLY/BIWEEKLY/MONTHLY, ShedLock','ENTREGADO','S17','PSD2/SEPA'),
        ('Tarjetas','Consulta, bloqueo, PIN, limites, historial, notif.','ENTREGADO','S18','PCI-DSS/GDPR'),
        ('Domiciliaciones','SEPA DD Core: alta, consulta, baja, notif. push, webhook RETURNED','ENTREGADO','S19','SEPA-DD/PSD2'),
    ('Perfil y Privacidad','Perfil usuario: datos personales, sesiones, OTP. Centro Privacidad GDPR: consentimientos, portabilidad, supresion, log derechos','EN DESARROLLO','S21','GDPR/PSD2-SCA'),
    ]
    for i, m in enumerate(mods):
        add_data_row(t, list(m), mw, alt=(i%2==1))

    doc.add_page_break()

    # 4. CATALOGO DE FUNCIONALIDADES
    heading1(doc, '4. CATALOGO DE FUNCIONALIDADES', bookmark_id='sec4')
    p = doc.add_paragraph()
    r = p.add_run('NOTA: Secciones 4.1 a 4.15 (Sprints 1-15) reconstruidas desde artefactos de codigo fuente. Las metricas exactas de tests/cobertura son estimaciones. Las funcionalidades y reglas de negocio son fieles al codigo.')
    r.font.size = Pt(9); r.font.name = 'Arial'; r.font.color.rgb = AMBER; r.italic = True

    for idx, sprint in enumerate(SPRINTS):
        src_label = '[RECONSTRUIDO - evidencia: migraciones Flyway, use cases]' if sprint['src'] == 'RECONSTRUIDO' else '[EVIDENCIA DIRECTA - artefactos de entrega verificados]'
        src_color = AMBER if sprint['src'] == 'RECONSTRUIDO' else GREEN_SOFT
        _h2p = heading2(doc, f"4.{idx+1}  Sprint {sprint['n']} - {sprint['title']}  |  {sprint['ver']}  |  {sprint['date']}")
        add_bookmark(_h2p, f'sprintidx{idx+1}')
        p = doc.add_paragraph()
        r = p.add_run(src_label)
        r.font.size = Pt(8); r.font.name = 'Arial'; r.font.color.rgb = src_color; r.italic = True
        body(doc, sprint['intro'], italic=True, color=RGBColor(0x55,0x55,0x55))
        for fid, ftitle, fdesc, frules in sprint['funcs']:
            heading3(doc, f'{fid} - {ftitle}')
            body(doc, fdesc)
            p = doc.add_paragraph()
            r = p.add_run('Reglas de negocio:')
            r.bold = True; r.font.size = Pt(10); r.font.name = 'Arial'; r.font.color.rgb = BLUE_MID
            for rule in frules:
                bullet_item(doc, rule)
        if idx < len(SPRINTS) - 1:
            doc.add_page_break()

    doc.add_page_break()

    # 5. REGLAS DE NEGOCIO CONSOLIDADAS
    heading1(doc, '5. REGLAS DE NEGOCIO CONSOLIDADAS', bookmark_id='sec5')
    rnw = [2.0, 2.8, 9.9]
    for group_name, rules in BUSINESS_RULES.items():
        heading2(doc, f'  {group_name}')
        t = doc.add_table(rows=1, cols=3)
        t.alignment = WD_TABLE_ALIGNMENT.LEFT
        add_header_row(t, ['ID','Modulo','Regla de Negocio'], rnw)
        for i, (rid, mod, desc) in enumerate(rules):
            add_data_row(t, [rid, mod, desc], rnw, alt=(i%2==1))
        doc.add_paragraph()

    doc.add_page_break()

    # 6. GLOSARIO
    heading1(doc, '6. GLOSARIO DEL DOMINIO', bookmark_id='sec6')
    glossary = [
        ('2FA','Autenticacion de Doble Factor. Verificacion mediante dos elementos de autenticacion independientes.'),
        ('AES-256-CBC','Advanced Encryption Standard 256-bit en modo CBC. Usado para secretos TOTP y documentos KYC.'),
        ('AML/KYC','Anti-Money Laundering / Know Your Customer. Marco regulatorio de verificacion de identidad.'),
        ('BCrypt','Algoritmo de hash adaptativo para contrasenas y codigos de recuperacion. Cost factor = 10.'),
        ('Core Banking','Sistema central de gestion bancaria de Banco Meridian. Fuente de datos master.'),
        ('GDPR','General Data Protection Regulation. Reglamento europeo de proteccion de datos (UE 2016/679).'),
        ('IBAN','International Bank Account Number. Estandar europeo para identificar cuentas bancarias.'),
        ('KYC','Know Your Customer. Proceso de verificacion de identidad obligatorio por normativa AML.'),
        ('OTP','One-Time Password. Contrasena de un solo uso, valida por tiempo limitado.'),
        ('PAN','Primary Account Number. Numero completo de tarjeta. Siempre enmascarado en BankPortal.'),
        ('PCI DSS','Payment Card Industry Data Security Standard v4.0. Estandar de seguridad para datos de tarjetas.'),
        ('PIN','Personal Identification Number. Codigo secreto del cliente para operaciones con tarjeta.'),
        ('PSD2','Payment Services Directive 2. Directiva EU de servicios de pago que obliga a la SCA.'),
        ('Redis','Base de datos en memoria para JWT blacklist O(1), limites de transferencia y SSE pub/sub.'),
        ('SCA','Strong Customer Authentication. Autenticacion con dos factores independientes (PSD2 Art. 97).'),
        ('SEPA','Single Euro Payments Area. Area unificada de pagos en euros en Europa.'),
        ('SEPA DD Core','SEPA Direct Debit Core. Esquema de domiciliaciones bancarias en zona SEPA.'),
        ('ShedLock','Mecanismo anti-duplicacion para transferencias programadas en entornos distribuidos.'),
        ('SSE','Server-Sent Events. Notificaciones push unidireccionales del servidor al cliente.'),
        ('TOTP','Time-based One-Time Password (RFC 6238). Algoritmo de OTP basado en tiempo.'),
        ('VAPID','Voluntary Application Server Identification for Web Push (RFC 8292). Push sin brokers propietarios.'),
    ]
    gw = [3.0, 11.7]
    t = doc.add_table(rows=1, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    add_header_row(t, ['Termino','Definicion'], gw)
    for i, (term, defn) in enumerate(glossary):
        add_data_row(t, [term, defn], gw, alt=(i%2==1))

    doc.add_page_break()

    # 7. MATRIZ DE COBERTURA
    heading1(doc, '7. MATRIZ DE COBERTURA FUNCIONAL', bookmark_id='sec7')
    mxw = [1.8, 2.0, 4.0, 1.5, 1.8, 1.8, 1.8]
    t = doc.add_table(rows=1, cols=7)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    add_header_row(t, ['ID','Feature','Funcionalidad','Sprint','Version','Estado','Evidencia'], mxw)
    row_num = 0
    for sprint in SPRINTS:
        for fid, ftitle, _, _ in sprint['funcs']:
            hi = sprint['src'] == 'EVIDENCIA-DIRECTA'
            ev = 'Directa VERIFICADA' if hi else 'Reconstruido'
            add_data_row(t, [fid, sprint['feat'], ftitle, f"S{sprint['n']}", sprint['ver'], 'DELIVERED', ev],
                        mxw, alt=(row_num%2==1), highlight=hi)
            row_num += 1

    doc.add_page_break()

    # 8. HISTORIAL
    heading1(doc, '8. HISTORIAL DE CAMBIOS', bookmark_id='sec8')
    hw = [1.5, 2.0, 3.5, 7.7]
    t = doc.add_table(rows=1, cols=4)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    add_header_row(t, ['Version','Fecha','Sprint / Feature','Descripcion del cambio'], hw)
    add_data_row(t, ['1.0','26/03/2026','S16-S18 / FEAT-014,015,016',
        'Creacion inicial. FA-Agent activo. S16-S18 documentados con evidencia directa. 12 funcionalidades, 23 reglas de negocio.'], hw, alt=False)
    add_data_row(t, ['2.0','26/03/2026','S1-S18 completo',
        'Incorporacion S1-S15 reconstruidos desde codigo fuente. Total: 52 funcionalidades, 86 reglas de negocio, 14 modulos. Correccion Sprint 17: FEAT-015 = Transferencias Programadas.'], hw, alt=True)
    add_data_row(t, ['2.1','27/03/2026','S19 / FEAT-017 Domiciliaciones SEPA DD',
        'Sprint 19 cerrado. 6 funcionalidades (FA-053..058), 15 reglas SEPA DD Core. Total: 58 funcionalidades.'], hw, alt=False)
    add_data_row(t, ['2.2','30/03/2026','S20 / FEAT-018 Exportacion Movimientos PDF/CSV',
        'Sprint 20 cerrado. 5 funcionalidades (FA-059..063). Total: 63 funcionalidades, 141 reglas.'], hw, alt=True)
    add_data_row(t, ['3.0','31/03/2026','S21 / FEAT-019 Centro de Privacidad y Perfil',
        'Sprint 21 iniciado. 7 funcionalidades FA-019-A..G, 37 reglas GDPR. FA-Agent v2.3. Total: 70 funcionalidades, 166 reglas.'], hw, alt=False)

    doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run('Documento generado por FA-Agent - SOFIA Software Factory v2.3')
    r.font.size = Pt(8); r.font.name = 'Arial'; r.font.color.rgb = RGBColor(0xAA,0xAA,0xAA)

    doc.save(out_path)
    print(f'Guardado: {out_path}')

    # Actualizar session.json y sofia.log
    import os, json
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    if os.path.exists(SESSION_PATH):
        with open(SESSION_PATH) as f:
            s = json.load(f)
        if 'fa_agent' not in s:
            s['fa_agent'] = {}
        s['fa_agent']['last_gate'] = 'full-rebuild'
        s['fa_agent']['last_updated'] = now
        s['fa_agent']['doc_version'] = '3.0'
        s['fa_agent']['functionalities'] = 52
        s['fa_agent']['business_rules'] = 86
        s['fa_agent']['generator'] = 'python-docx'
        s['updated_at'] = now
        with open(SESSION_PATH, 'w') as f:
            json.dump(s, f, indent=2)
        with open(LOG_PATH, 'a') as f:
            f.write(f'[{now}] [FA-AGENT] [FULL-REBUILD] COMPLETED → FA-BankPortal-Banco-Meridian.docx v2.0 | python-docx | 63 func | 130+ RN\n')
        print('session.json + sofia.log actualizados')

if __name__ == '__main__':
    generate(OUT_PATH)
