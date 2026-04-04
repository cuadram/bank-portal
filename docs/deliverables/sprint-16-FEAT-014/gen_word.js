'use strict';
// SOFIA Documentation Agent — gen_word_arch.js
// Sprint 16 — FEAT-014: Notificaciones Push & In-App
// Genera: SRS.docx · HLD.docx · LLD-Backend.docx · LLD-Frontend.docx
// Auto-ejecutado por .git/hooks/post-commit
// BankPortal — Banco Meridian — 2026-03-24

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, LevelFormat, TabStopType, PageBreak
} = require('docx');
const fs   = require('fs');
const path = require('path');

const WORD_DIR = path.join(__dirname, 'word');
if (!fs.existsSync(WORD_DIR)) fs.mkdirSync(WORD_DIR, { recursive: true });

// ── Paleta Experis ──────────────────────────────────────────────────────────
const C = {
  BLUE:'1B3A6B', MED:'2E5F9E', LT:'4A7EC2', VL:'EBF3FB',
  WHITE:'FFFFFF', GRAY:'CCCCCC', GREEN:'C6EFCE', RED:'FFCCCC',
  YEL:'FFEB9C', GDK:'E2EFDA',
};
const bd   = { style: BorderStyle.SINGLE, size: 1, color: C.GRAY };
const BORD = { top: bd, bottom: bd, left: bd, right: bd };

// ── Helpers ─────────────────────────────────────────────────────────────────
const H = (text, lv) => new Paragraph({
  heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][lv - 1],
  children: [new TextRun({ text, font:'Arial', size:[32,26,22][lv-1], bold:true, color:C.BLUE })],
  spacing: { before: lv===1?360:lv===2?240:160, after: lv===1?120:80 },
});
const P = (text, bold=false, color='000000') => new Paragraph({
  children: [new TextRun({ text, font:'Arial', size:20, bold, color })],
  spacing: { after: 80 },
});
const BL = (text) => new Paragraph({
  numbering: { reference:'bullets', level:0 },
  children: [new TextRun({ text, font:'Arial', size:20 })],
  spacing: { after:60 },
});
const SP = () => new Paragraph({ children:[new TextRun('')], spacing:{after:80} });
const PB = () => new Paragraph({ children:[new PageBreak()] });

const HC = (text, w) => new TableCell({
  width:{ size:w, type:WidthType.DXA },
  shading:{ fill:C.BLUE, type:ShadingType.CLEAR },
  margins:{ top:80, bottom:80, left:120, right:120 },
  verticalAlign:VerticalAlign.CENTER, borders:BORD,
  children:[new Paragraph({ children:[new TextRun({ text, font:'Arial', size:19, bold:true, color:C.WHITE })] })],
});
const DC = (text, w, fill=C.WHITE, bold=false) => new TableCell({
  width:{ size:w, type:WidthType.DXA },
  shading:{ fill, type:ShadingType.CLEAR },
  margins:{ top:60, bottom:60, left:120, right:120 },
  borders:BORD,
  children:[new Paragraph({ children:[new TextRun({ text:String(text??''), font:'Arial', size:19, bold })] })],
});

const MT = (rows) => new Table({
  width:{ size:9026, type:WidthType.DXA }, columnWidths:[2800,6226],
  rows: rows.map(([k,v],i) => new TableRow({
    children:[
      DC(k, 2800, i%2===0?C.VL:C.WHITE, true),
      DC(v, 6226, i%2===0?C.VL:C.WHITE),
    ],
  })),
});

const mkHDR = (proj) => ({ default: new Header({ children:[new Paragraph({
  border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:C.BLUE, space:1 } },
  children:[
    new TextRun({ text:'EXPERIS  |  SOFIA Software Factory', font:'Arial', size:18, bold:true, color:C.BLUE }),
    new TextRun({ text:`\t${proj}`, font:'Arial', size:18, color:'444444' }),
  ],
  tabStops:[{ type:TabStopType.RIGHT, position:9026 }],
})]})});

const mkFTR = (date) => ({ default: new Footer({ children:[new Paragraph({
  border:{ top:{ style:BorderStyle.SINGLE, size:6, color:C.BLUE, space:1 } },
  children:[
    new TextRun({ text:'Confidencial — Experis', font:'Arial', size:16, color:'666666' }),
    new TextRun({ text:'\tPágina ', font:'Arial', size:16, color:'666666' }),
    new TextRun({ children:[PageNumber.CURRENT], font:'Arial', size:16, color:'666666' }),
    new TextRun({ text:`\t${date}`, font:'Arial', size:16, color:'666666' }),
  ],
  tabStops:[{ type:TabStopType.CENTER, position:4513 },{ type:TabStopType.RIGHT, position:9026 }],
})]})});

const mkDoc = (proj, date, children) => new Document({
  styles:{
    default:{ document:{ run:{ font:'Arial', size:22 } } },
    paragraphStyles:[
      { id:'Heading1', name:'Heading 1', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{ font:'Arial', size:32, bold:true, color:C.BLUE },
        paragraph:{ spacing:{ before:360, after:120 }, outlineLevel:0 } },
      { id:'Heading2', name:'Heading 2', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{ font:'Arial', size:26, bold:true, color:C.MED },
        paragraph:{ spacing:{ before:240, after:80 }, outlineLevel:1 } },
      { id:'Heading3', name:'Heading 3', basedOn:'Normal', next:'Normal', quickFormat:true,
        run:{ font:'Arial', size:22, bold:true, color:C.LT },
        paragraph:{ spacing:{ before:160, after:60 }, outlineLevel:2 } },
    ],
  },
  numbering:{ config:[{ reference:'bullets', levels:[{
    level:0, format:LevelFormat.BULLET, text:'•', alignment:AlignmentType.LEFT,
    style:{ paragraph:{ indent:{ left:720, hanging:360 } } },
  }]}]},
  sections:[{
    properties:{ page:{ size:{ width:11906, height:16838 }, margin:{ top:1270, right:1270, bottom:1270, left:1270 } } },
    headers: mkHDR(proj), footers: mkFTR(date), children,
  }],
});

const save = async (doc, fname) => {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(WORD_DIR, fname), buf);
  console.log('  ✅', fname);
};

// ── SRS — FEAT-014 ──────────────────────────────────────────────────────────
async function genSRS() {
  const rows_us = [
    ['DEBT-023', '1 SP', 'Alta',  'KycAuthorizationFilter período de gracia usuarios pre-existentes'],
    ['DEBT-024', '1 SP', 'Baja',  'KycReviewResponse tipado — record explícito'],
    ['US-1401',  '2 SP', 'Alta',  'Modelo preferencias de notificación + Flyway V16'],
    ['US-1402',  '3 SP', 'Alta',  'Centro de notificaciones backend (historial, paginación, read/unread)'],
    ['US-1403',  '2 SP', 'Alta',  'Stream SSE extendido — filtro por categoría + Last-Event-ID replay'],
    ['US-1404',  '5 SP', 'Alta',  'Web Push (VAPID) — suscripción y envío cifrado'],
    ['US-1405',  '3 SP', 'Alta',  'Alertas transaccionales (transfer, payment, bill)'],
    ['US-1406',  '3 SP', 'Media', 'Alertas de seguridad (nuevo dispositivo, contraseña, 2FA)'],
    ['US-1407',  '4 SP', 'Alta',  'Frontend Angular — Notification Bell + drawer + settings'],
  ];
  const rnf = [
    ['RNF-014-01', 'Rendimiento',    '≥ 500 conexiones SSE simultáneas · latencia evento→browser < 500ms'],
    ['RNF-014-02', 'Entrega push',   'Push en < 3s desde evento · disponibilidad ≥ 99.5%'],
    ['RNF-014-03', 'Seguridad push', 'ECDH P-256 + AES-128-GCM · VAPID keys en ENV · rotación anual'],
    ['RNF-014-04', 'Compatibilidad', 'Chrome ≥60, Firefox ≥67, Safari ≥16.4 push; todos con SSE fallback'],
    ['RNF-014-05', 'RGPD Art.7',     'Consentimiento explícito requestPermission() antes de suscripción push'],
    ['RNF-014-06', 'RGPD Art.32',    'Payload push cifrado end-to-end'],
    ['RNF-014-07', 'PSD2 RTS Art.97','Alerta inmediata en operaciones > 1.000€ (threshold configurable)'],
  ];
  const doc = mkDoc('BankPortal — SRS FEAT-014', '2026-03-24', [
    H('SRS — Sistema de Notificaciones Push & In-App', 1),
    MT([
      ['Documento',  'SRS-FEAT-014 v1.0'],
      ['Proyecto',   'BankPortal — Banco Meridian'],
      ['Sprint',     '16 · 2026-03-25 → 2026-04-08'],
      ['Feature',    'FEAT-014 — Notificaciones Push & In-App'],
      ['Estado',     '✅ APPROVED — Product Owner'],
      ['Normativa',  'RGPD Art.7 · RGPD Art.32 · PSD2 RTS Art.97'],
      ['Autor',      'SOFIA Requirements Analyst Agent — Experis'],
    ]),
    SP(), H('1. Alcance', 2),
    P('FEAT-014 extiende la infraestructura de notificaciones existente (FEAT-007) con:'),
    BL('Web Push VAPID — notificaciones fuera de sesión activa'),
    BL('Centro de notificaciones — historial completo con filtros y marcado de lectura'),
    BL('Preferencias por canal — email / push / in-app por tipo de evento (modelo opt-out)'),
    BL('Alertas transaccionales — transfer, payment, bill con importes'),
    BL('Alertas de seguridad — nuevo dispositivo, cambio de contraseña, 2FA fallido'),
    BL('SSE extendido — filtro por categoría + replay Last-Event-ID sin pérdida de eventos'),
    BL('Frontend Angular — NotificationBell + drawer + settings accesibles WCAG 2.1 AA'),
    SP(), H('2. User Stories', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA },
      columnWidths:[1200, 800, 800, 6226],
      rows:[
        new TableRow({ children:[ HC('ID',1200), HC('SP',800), HC('Prioridad',800), HC('Descripción',6226) ] }),
        ...rows_us.map(([id,sp,pr,desc],i) => new TableRow({ children:[
          DC(id,1200, i%2===0?C.VL:C.WHITE, true),
          DC(sp,800,  i%2===0?C.VL:C.WHITE),
          DC(pr,800,  i%2===0?C.VL:C.WHITE),
          DC(desc,6226, i%2===0?C.VL:C.WHITE),
        ]})),
        new TableRow({ children:[
          DC('TOTAL',1200,C.BLUE,true).constructor === TableCell
            ? new TableCell({ width:{size:1200,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR},
                borders:BORD, children:[new Paragraph({ children:[new TextRun({text:'TOTAL',font:'Arial',size:19,bold:true,color:C.WHITE})] })] })
            : HC('TOTAL',1200),
          new TableCell({ width:{size:800,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR},
            borders:BORD, children:[new Paragraph({ children:[new TextRun({text:'24 SP',font:'Arial',size:19,bold:true,color:C.WHITE})] })] }),
          new TableCell({ width:{size:800,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR},
            borders:BORD, children:[new Paragraph({ children:[new TextRun({text:'',font:'Arial',size:19,color:C.WHITE})] })] }),
          new TableCell({ width:{size:6226,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR},
            borders:BORD, children:[new Paragraph({ children:[new TextRun({text:'',font:'Arial',size:19,color:C.WHITE})] })] }),
        ]}),
      ],
    }),
    SP(), H('3. Requisitos No Funcionales', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA },
      columnWidths:[1200, 1600, 6226],
      rows:[
        new TableRow({ children:[ HC('ID',1200), HC('Categoría',1600), HC('Requisito',6226) ] }),
        ...rnf.map(([id,cat,req],i) => new TableRow({ children:[
          DC(id,1200,   i%2===0?C.VL:C.WHITE, true),
          DC(cat,1600,  i%2===0?C.VL:C.WHITE),
          DC(req,6226,  i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
    SP(), H('4. Normativa aplicable', 2),
    P('RGPD Art.7 — Consentimiento opt-out para notificaciones: preferencias granulares por tipo de evento.'),
    P('RGPD Art.32 — Seguridad: payload push cifrado ECDH P-256 + AES-128-GCM (VAPID estándar W3C).'),
    P('PSD2 RTS Art.97 — Alertas de operaciones sospechosas: alerta inmediata en transferencias > 1.000€ (threshold configurable).'),
  ]);
  await save(doc, 'SRS-FEAT-014.docx');
}

// ── HLD — FEAT-014 ──────────────────────────────────────────────────────────
async function genHLD() {
  const servicios = [
    ['NotificationHub',          'NUEVO',   'Orquestador multicanal @Async', '8080', 'REST interno'],
    ['NotificationPreferenceCtrl','NUEVO',  'GET/PATCH preferencias canal',  '8080', 'REST'],
    ['NotificationHistoryCtrl',  'NUEVO',   'Historial paginado + mark-read','8080', 'REST'],
    ['NotificationStreamCtrl',   'NUEVO',   'SSE filtrado + Last-Event-ID',  '8080', 'SSE'],
    ['PushSubscriptionCtrl',     'NUEVO',   'CRUD suscripciones VAPID',      '8080', 'REST'],
    ['TransactionAlertService',  'NUEVO',   '@TransactionalEventListener',   '—',    'Spring Events'],
    ['SecurityAlertService',     'NUEVO',   '@TransactionalEventListener',   '—',    'Spring Events'],
    ['WebPushService',           'NUEVO',   'VAPID P-256 + AES-128-GCM',    '—',    'HTTPS RFC 8292'],
    ['SseEmitterRegistry',       'MOD',     'Filtro categorías + replay',    '—',    'SSE interno'],
    ['NotificationService(email)','REUTILIZ','Canal email existente FEAT-007','—',    'SMTP TLS'],
  ];
  const decisiones = [
    ['ADR-025', 'VAPID puro sin Firebase', 'Aceptado', 'Sin dependencia Google · RGPD más simple'],
    ['—',       'Severidad HIGH ignora preferencias email/in-app', 'Principio de diseño', 'SECURITY_* siempre entregado'],
    ['—',       'Flyway V16 — solo cambios aditivos', 'Restricción', 'Sin breaking change en user_notifications'],
    ['—',       'SSE backward-compatible FEAT-007', 'Principio de diseño', 'Sin categories = todos los eventos'],
  ];
  const doc = mkDoc('BankPortal — HLD FEAT-014', '2026-03-24', [
    H('HLD — Notificaciones Push & In-App', 1),
    MT([
      ['Feature',   'FEAT-014 — Notificaciones Push & In-App'],
      ['Proyecto',  'BankPortal — Banco Meridian'],
      ['Sprint',    '16 · 2026-03-25 → 2026-04-08'],
      ['Stack',     'Java 21 · Spring Boot 3.3 · Angular 17'],
      ['Estado',    '✅ APPROVED — Tech Lead'],
      ['ADRs',      'ADR-025 — VAPID vs FCM'],
      ['Autor',     'SOFIA Architect Agent — Experis'],
    ]),
    SP(), H('1. Análisis de impacto', 2),
    P('Todos los cambios de FEAT-014 son aditivos. Ningún contrato existente se rompe.'),
    BL('NotificationService (FEAT-007) — reutilizado como canal email; no se modifica su interfaz'),
    BL('SseEmitterRegistry (FEAT-007) — extendido con filtro por categoría y replay Redis (backward-compatible)'),
    BL('user_notifications — extensión aditiva con columnas nuevas vía Flyway V16 (IF NOT EXISTS)'),
    BL('SecurityConfig — whitelist /api/v1/notifications/stream (SSE no compatible con CSRF token)'),
    BL('Redis — nuevo bucket sse:replay:{userId} TTL 5 min sin afectar buckets existentes'),
    SP(), H('2. Servicios nuevos y modificados', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA },
      columnWidths:[2200, 900, 2200, 800, 1926],
      rows:[
        new TableRow({ children:[ HC('Servicio',2200), HC('Acción',900), HC('Responsabilidad',2200), HC('Puerto',800), HC('Protocolo',1926) ] }),
        ...servicios.map(([svc,acc,resp,port,prot],i) => new TableRow({ children:[
          DC(svc,2200,  i%2===0?C.VL:C.WHITE, true),
          DC(acc,900,   i%2===0?C.VL:C.WHITE),
          DC(resp,2200, i%2===0?C.VL:C.WHITE),
          DC(port,800,  i%2===0?C.VL:C.WHITE),
          DC(prot,1926, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
    SP(), H('3. Flujo de entrega de notificación', 2),
    P('El flujo completo desde evento de negocio hasta entrega multicanal:'),
    BL('1. Evento de negocio publicado (TransferCompletedEvent, DeviceRegisteredEvent, etc.)'),
    BL('2. TransactionAlertService / SecurityAlertService reciben el evento (@TransactionalEventListener AFTER_COMMIT)'),
    BL('3. Dispatch a NotificationHub con NotificationEvent(userId, type, severity, title, body, metadata)'),
    BL('4. Hub consulta preferencias del usuario para el tipo de evento'),
    BL('5. Severidad HIGH fuerza entrega in-app y email independientemente de preferencias'),
    BL('6. Despacho paralelo a tres canales: PUSH (WebPushService) · IN-APP (SseEmitterRegistry) · EMAIL (NotificationService)'),
    BL('7. Persistencia en user_notifications con category, severity y metadata'),
    SP(), H('4. Contrato de integración Backend ↔ Frontend', 2),
    P('Base URL: /api/v1/notifications   ·   Auth: Bearer JWT'),
    new Table({
      width:{ size:9026, type:WidthType.DXA },
      columnWidths:[900, 3000, 5126],
      rows:[
        new TableRow({ children:[ HC('Método',900), HC('Ruta',3000), HC('Descripción',5126) ] }),
        ...([
          ['GET',    '/preferences',              'Preferencias de canal del usuario autenticado'],
          ['PATCH',  '/preferences',              'Actualiza preferencia para un tipo de evento'],
          ['GET',    '/',                          'Historial paginado filtrable por categoría'],
          ['GET',    '/unread-count',              'Contador de no leídas'],
          ['PATCH',  '/{id}/read',                'Marca notificación individual como leída'],
          ['POST',   '/mark-all-read',             'Marca todas como leídas'],
          ['DELETE', '/{id}',                      'Elimina notificación del historial'],
          ['GET',    '/stream?categories=',        'SSE en tiempo real con filtro + Last-Event-ID'],
          ['POST',   '/push/subscribe',            'Registra suscripción Web Push VAPID'],
          ['DELETE', '/push/subscribe/{id}',       'Cancela suscripción Web Push'],
        ]).map(([m,r,d],i) => new TableRow({ children:[
          DC(m,900,  i%2===0?C.VL:C.WHITE, true),
          DC(r,3000, i%2===0?C.VL:C.WHITE),
          DC(d,5126, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
    SP(), H('5. Decisiones de arquitectura', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA },
      columnWidths:[800, 2400, 1600, 4226],
      rows:[
        new TableRow({ children:[ HC('ADR',800), HC('Decisión',2400), HC('Estado',1600), HC('Consecuencia',4226) ] }),
        ...decisiones.map(([adr,dec,est,cons],i) => new TableRow({ children:[
          DC(adr,800,  i%2===0?C.VL:C.WHITE, true),
          DC(dec,2400, i%2===0?C.VL:C.WHITE),
          DC(est,1600, i%2===0?C.VL:C.WHITE),
          DC(cons,4226,i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
  ]);
  await save(doc, 'HLD-FEAT-014.docx');
}

// ── LLD Backend ──────────────────────────────────────────────────────────────
async function genLLDBackend() {
  const paquetes = [
    ['notifications/api/', 'NotificationPreferenceController, NotificationHistoryController, NotificationStreamController, PushSubscriptionController'],
    ['notifications/application/usecase/', 'ManagePreferencesUseCase, GetNotificationsUseCase, MarkReadUseCase, ManagePushSubscriptionUseCase'],
    ['notifications/application/service/', 'NotificationHub (@Async), TransactionAlertService, SecurityAlertService'],
    ['notifications/application/dto/', 'NotificationDto, NotificationPreferenceDto, PreferencePatchRequest, PushSubscribeRequest, NotificationEvent'],
    ['notifications/domain/model/', 'UserNotification (JPA), NotificationPreference (JPA), PushSubscription (JPA), NotificationCategory (Enum), NotificationSeverity (Enum), NotificationEventType (Enum)'],
    ['notifications/domain/repository/', 'NotificationPreferenceRepository, PushSubscriptionRepository, NotificationRepository'],
    ['notifications/infrastructure/push/', 'WebPushService (nl.martijndwars:web-push, VAPID, backoff 429, cleanup 410)'],
    ['notifications/infrastructure/sse/', 'SseEmitterRegistry (extendido: filtro categorías + Last-Event-ID + heartbeat 30s)'],
    ['resources/db/migration/', 'V16__notification_preferences.sql'],
  ];
  const envVars = [
    ['VAPID_PUBLIC_KEY',            'Clave pública VAPID (Base64 URL-safe)',         'BEl62iUYg...'],
    ['VAPID_PRIVATE_KEY',           'Clave privada VAPID (Base64 URL-safe)',          '(secret)'],
    ['VAPID_SUBJECT',               'Subject VAPID — email de contacto',             'mailto:no-reply@bancomeridian.es'],
    ['VAPID_TTL_SECONDS',           'TTL de push notifications en segundos',          '86400'],
    ['NOTIFICATION_THRESHOLD_ALERT','Importe mínimo para alerta email en transacción','1000'],
    ['SSE_REPLAY_TTL_SECONDS',      'TTL buffer replay Redis para reconexión SSE',   '300'],
  ];
  const flyway = [
    ['notification_preferences', 'NUEVA', 'id, user_id, event_type, email_enabled, push_enabled, in_app_enabled, updated_at'],
    ['push_subscriptions',       'NUEVA', 'id, user_id, endpoint(UNIQUE), p256dh, auth, user_agent, created_at, last_used_at'],
    ['user_notifications',       'ALTER', 'ADD: category, severity, metadata (JSONB), read_at, title (IF NOT EXISTS)'],
  ];
  const doc = mkDoc('BankPortal — LLD Backend FEAT-014', '2026-03-24', [
    H('LLD Backend — Notificaciones Push & In-App', 1),
    MT([
      ['Servicio',   'backend-2fa — módulo notifications'],
      ['Stack',      'Java 21 · Spring Boot 3.3 · Spring Security'],
      ['Feature',    'FEAT-014'],
      ['Versión',    '1.0'],
      ['Estado',     '✅ APPROVED — Tech Lead'],
      ['Autor',      'SOFIA Architect Agent — Experis'],
    ]),
    SP(), H('1. Estructura de paquetes', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA }, columnWidths:[3000, 6026],
      rows:[
        new TableRow({ children:[ HC('Paquete',3000), HC('Clases principales',6026) ] }),
        ...paquetes.map(([pkg,cls],i) => new TableRow({ children:[
          DC(pkg,3000, i%2===0?C.VL:C.WHITE, true),
          DC(cls,6026, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
    SP(), H('2. Lógica de despacho — NotificationHub', 2),
    P('El NotificationHub orquesta la entrega multicanal con las siguientes reglas:'),
    BL('1. Persiste siempre en user_notifications (historial garantizado)'),
    BL('2. Consulta preferencias del usuario; si no existen, asume todos los canales habilitados (opt-out)'),
    BL('3. Severidad HIGH (SECURITY_*): fuerza entrega in-app y email; solo pushEnabled es opcional'),
    BL('4. Canal PUSH: WebPushService envía a todas las suscripciones activas del usuario (max 5)'),
    BL('5. Canal IN-APP: SseEmitterRegistry.broadcast() solo a emitters con la categoría del evento'),
    BL('6. Canal EMAIL: NotificationService legacy (FEAT-007) — sin cambios en su interfaz'),
    SP(), H('3. Flyway V16 — Cambios de base de datos', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA }, columnWidths:[2400, 900, 5726],
      rows:[
        new TableRow({ children:[ HC('Tabla',2400), HC('Tipo',900), HC('Campos',5726) ] }),
        ...flyway.map(([t,tp,f],i) => new TableRow({ children:[
          DC(t,2400, i%2===0?C.VL:C.WHITE, true),
          DC(tp,900, i%2===0?C.VL:C.WHITE),
          DC(f,5726, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
    P('Índices: idx_notif_prefs_user · idx_push_sub_user · idx_notif_user_cat · idx_notif_user_unread (partial WHERE read=false) · idx_notif_user_created'),
    SP(), H('4. WebPushService — VAPID', 2),
    P('Librería: nl.martijndwars:web-push:5.1.2 · Cifrado: ECDH P-256 + AES-128-GCM · RFC 8292'),
    BL('Claves VAPID inyectadas por ENV (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)'),
    BL('HTTP 410 Gone → eliminar push_subscription automáticamente de base de datos'),
    BL('HTTP 429 Too Many Requests → backoff exponencial 3 reintentos (1s, 4s, 16s)'),
    BL('Máximo 5 suscripciones activas por usuario (multi-device)'),
    BL('Payload máximo 4 KB; TTL configurable por VAPID_TTL_SECONDS'),
    SP(), H('5. SSE extendido — Cambios sobre FEAT-007', 2),
    BL('FilteredEmitter — emitter registrado con Set<NotificationCategory>; broadcast() filtra por match'),
    BL('Last-Event-ID — al reconectar, replayMissed() lee Redis LRANGE sse:replay:{userId} y reenvía los perdidos'),
    BL('Heartbeat — ": heartbeat" cada 30 segundos para proxies con idle-timeout'),
    BL('Backward-compatible — sin parámetro categories, recibe todos los eventos (igual que FEAT-007)'),
    SP(), H('6. Variables de entorno', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA }, columnWidths:[2800, 3500, 2726],
      rows:[
        new TableRow({ children:[ HC('Variable',2800), HC('Descripción',3500), HC('Ejemplo',2726) ] }),
        ...envVars.map(([v,d,e],i) => new TableRow({ children:[
          DC(v,2800, i%2===0?C.VL:C.WHITE, true),
          DC(d,3500, i%2===0?C.VL:C.WHITE),
          DC(e,2726, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
  ]);
  await save(doc, 'LLD-FEAT-014-backend.docx');
}

// ── LLD Frontend ─────────────────────────────────────────────────────────────
async function genLLDFrontend() {
  const componentes = [
    ['NotificationBellComponent', 'app-notification-bell', 'Header del Dashboard', 'Icono campana + badge unreadCount$ reactivo'],
    ['NotificationPanelComponent','app-notification-panel','Drawer lateral',       'Historial + filtros categoría + infinite scroll + mark-read'],
    ['NotificationSettingsComponent','app-notification-settings','/settings/notifications','Toggles preferencias por canal y tipo de evento'],
  ];
  const servicios = [
    ['NotificationService',      'features/notifications/services/', 'SSE EventSource + REST historial + mark-read + preferencias'],
    ['PushRegistrationService',  'core/services/',                   'VAPID subscribe · requestPermission() · flag localStorage'],
  ];
  const accesibilidad = [
    ['Panel lateral (drawer)', 'role="complementary"',       '<aside role="complementary" aria-label="Notificaciones">'],
    ['Badge contador',         'aria-label dinámico',        'aria-label="3 notificaciones no leídas"'],
    ['Botón campana',          'aria-expanded + teclado',    '<button> nativo con aria-expanded'],
    ['Lista notificaciones',   'role="list"',                '<ul role="list"> + <li role="listitem">'],
    ['Filtros categoría',      'role="tablist"',             'Tabs con aria-selected'],
    ['Tiempo relativo',        '<time datetime="">',         'datetime="ISO" con texto "hace 5 min"'],
    ['No leída',               'Contraste ≥ 4.5:1',         'Fondo diferenciado en ítems no leídos'],
  ];
  const doc = mkDoc('BankPortal — LLD Frontend FEAT-014', '2026-03-24', [
    H('LLD Frontend Angular — Notificaciones Push & In-App', 1),
    MT([
      ['Aplicación', 'frontend-portal — módulo notifications'],
      ['Stack',      'Angular 17 · TypeScript · @angular/service-worker'],
      ['Feature',    'FEAT-014'],
      ['Versión',    '1.0'],
      ['Estado',     '✅ APPROVED — Tech Lead'],
      ['Autor',      'SOFIA Architect Agent — Experis'],
    ]),
    SP(), H('1. Estructura del módulo', 2),
    P('features/notifications/ (lazy-loaded — cargado al entrar en /settings/notifications)'),
    BL('notifications.module.ts + notifications-routing.module.ts'),
    BL('services/notification.service.ts — SSE EventSource + REST + unreadCount$ BehaviorSubject'),
    BL('components/notification-bell/ — NotificationBellComponent (header)'),
    BL('components/notification-panel/ — NotificationPanelComponent (drawer)'),
    BL('components/notification-settings/ — NotificationSettingsComponent (página settings)'),
    BL('models/notification.model.ts — interfaces TypeScript completas'),
    BL('core/services/push-registration.service.ts — singleton VAPID subscription'),
    BL('Service Worker: push-event-handler.ts para evento push → showNotification()'),
    SP(), H('2. Componentes', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA }, columnWidths:[2200, 1800, 1600, 3426],
      rows:[
        new TableRow({ children:[ HC('Componente',2200), HC('Selector',1800), HC('Ubicación',1600), HC('Responsabilidad',3426) ] }),
        ...componentes.map(([c,s,u,r],i) => new TableRow({ children:[
          DC(c,2200, i%2===0?C.VL:C.WHITE, true),
          DC(s,1800, i%2===0?C.VL:C.WHITE),
          DC(u,1600, i%2===0?C.VL:C.WHITE),
          DC(r,3426, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
    SP(), H('3. Servicios Angular', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA }, columnWidths:[2400, 2000, 4626],
      rows:[
        new TableRow({ children:[ HC('Servicio',2400), HC('Ubicación',2000), HC('Responsabilidad',4626) ] }),
        ...servicios.map(([s,u,r],i) => new TableRow({ children:[
          DC(s,2400, i%2===0?C.VL:C.WHITE, true),
          DC(u,2000, i%2===0?C.VL:C.WHITE),
          DC(r,4626, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
    SP(), H('4. Web Push — Service Worker', 2),
    P('La entrega push fuera de sesión se gestiona mediante Angular Service Worker (ngsw-worker.js):'),
    BL('PushRegistrationService.requestAndSubscribe() → Notification.requestPermission() → pushManager.subscribe()'),
    BL('Clave pública VAPID inyectada como environment.vapidPublicKey'),
    BL('Flag localStorage push_permission_asked — solicitar permiso solo la primera vez'),
    BL('push-event-handler.ts registra self.addEventListener("push") → self.registration.showNotification()'),
    BL('notificationclick event → clients.openWindow("/notifications") o focus tab activo'),
    BL('postMessage al Angular App si está activo → NotificationService.onPushReceived() actualiza unreadCount$'),
    SP(), H('5. Accesibilidad WCAG 2.1 AA', 2),
    new Table({
      width:{ size:9026, type:WidthType.DXA }, columnWidths:[2000, 2000, 5026],
      rows:[
        new TableRow({ children:[ HC('Elemento',2000), HC('Requisito',2000), HC('Implementación',5026) ] }),
        ...accesibilidad.map(([el,req,imp],i) => new TableRow({ children:[
          DC(el,2000,  i%2===0?C.VL:C.WHITE, true),
          DC(req,2000, i%2===0?C.VL:C.WHITE),
          DC(imp,5026, i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }),
  ]);
  await save(doc, 'LLD-FEAT-014-frontend.docx');
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n📄 SOFIA Documentation Agent — Step 3b — Sprint 16 FEAT-014');
  console.log('   Generando documentos de arquitectura...\n');
  await genSRS();
  await genHLD();
  await genLLDBackend();
  await genLLDFrontend();
  console.log('\n✅ Documentos de arquitectura completados');
  console.log('   Directorio: docs/deliverables/sprint-16-FEAT-014/word/\n');
})().catch(e => { console.error('❌ ERROR:', e.message); process.exit(1); });
