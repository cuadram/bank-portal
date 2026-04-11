'use strict';
const { Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,Header,Footer,HeadingLevel,AlignmentType,BorderStyle,WidthType,ShadingType,PageNumber,PageBreak } = require('docx');
const fs2=require('fs'), path=require('path');
const OUT=path.join(__dirname,'word'); if(!fs2.existsSync(OUT))fs2.mkdirSync(OUT,{recursive:true});

const C={BLUE:'1B3A6B',MED:'2E5F9E',WHITE:'FFFFFF',GRAY:'CCCCCC',GREEN:'C6EFCE',RED:'FFCCCC',YEL:'FFEB9C'};
const bd={style:BorderStyle.SINGLE,size:1,color:C.GRAY};
const BORD={top:bd,bottom:bd,left:bd,right:bd};
const H=(text,lv)=>new Paragraph({heading:[HeadingLevel.HEADING_1,HeadingLevel.HEADING_2,HeadingLevel.HEADING_3][lv-1],children:[new TextRun({text,color:lv===1?C.BLUE:lv===2?C.MED:'333333',bold:true})]});
const P=(text)=>new Paragraph({children:[new TextRun({text,size:22})]});
const BR=()=>new Paragraph({children:[new PageBreak()]});
const SP=()=>new Paragraph({children:[new TextRun('')]});
const cell=(text,opts={})=>new TableCell({borders:BORD,shading:opts.hdr?{fill:C.BLUE,type:ShadingType.CLEAR}:opts.fill?{fill:opts.fill,type:ShadingType.CLEAR}:undefined,margins:{top:80,bottom:80,left:120,right:120},width:opts.w?{size:opts.w,type:WidthType.DXA}:undefined,children:[new Paragraph({children:[new TextRun({text:String(text),size:20,color:opts.hdr?C.WHITE:'222222',bold:!!opts.hdr})]})]});
const tbl=(headers,rows,colW)=>new Table({width:{size:9026,type:WidthType.DXA},columnWidths:colW,rows:[new TableRow({tableHeader:true,children:headers.map((h,i)=>cell(h,{hdr:true,w:colW[i]}))}), ...rows.map(r=>new TableRow({children:r.map((v,i)=>{const s=String(v);const fill=s==='OK'?C.GREEN:undefined;return cell(v,{w:colW[i],fill});})})) ]});
const mkH=(title,sub)=>({default:new Header({children:[new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.BLUE}},children:[new TextRun({text:title,bold:true,color:C.BLUE,size:22}),new TextRun({text:'    '+sub,color:C.MED,size:18})]})]})});
const mkF=(label)=>({default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:label+'  |  SOFIA v1.9  |  BankPortal  |  Sprint 17  |  Pag. ',size:18,color:'888888'}),new TextRun({children:[PageNumber.CURRENT],size:18,color:'888888'})]})]})});
const STYLES={default:{document:{run:{font:'Arial',size:22}}},paragraphStyles:[{id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:36,bold:true,font:'Arial',color:C.BLUE},paragraph:{spacing:{before:360,after:200},outlineLevel:0}},{id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:28,bold:true,font:'Arial',color:C.MED},paragraph:{spacing:{before:280,after:140},outlineLevel:1}}]};
const PAGE={size:{width:11906,height:16838},margin:{top:1000,bottom:1000,left:1200,right:1200}};

async function genHLD(){
  const doc=new Document({styles:STYLES,sections:[{properties:{page:PAGE},headers:mkH('HLD FEAT-015: Transferencias Programadas','Sprint 17 v1.17.0'),footers:mkF('HLD-FEAT-015'),children:[
    SP(),new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'HIGH LEVEL DESIGN',bold:true,size:48,color:C.BLUE})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-015 Transferencias Programadas y Recurrentes',size:28,color:C.MED})]}),SP(),
    tbl(['Campo','Valor'],[['Proyecto','BankPortal Banco Meridian'],['Feature','FEAT-015'],['Sprint','17'],['Release','v1.17.0'],['Estado','APROBADO'],['Autor','SOFIA Architect Agent'],['Fecha','2026-03-24']],[3000,6026]),
    BR(),H('1. Objetivo',1),SP(),P('FEAT-015 permite programar transferencias unicas a fecha futura y recurrentes (semanal, quincenal, mensual). Motor automatizado con notificacion push+email en cada ciclo.'),SP(),
    H('1.1 User Stories',2),
    tbl(['US','Titulo','SP'],[['US-1501','Modelo datos + Flyway V17','2'],['US-1502','Transferencia a fecha futura','4'],['US-1503','Recurrentes + NextExecutionDateCalculator','4'],['US-1504','Scheduler + idempotencia','4'],['US-1505','Frontend Angular','3'],['DEBT-028','Cifrar push_subscriptions auth AES-256-GCM','3']],[1300,5300,1426 + 0]),
    SP(),H('2. Capas',1),SP(),
    tbl(['Capa','Componente','Responsabilidad'],[['Domain','ScheduledTransfer (AR)','Invariantes, ciclo de vida, estado'],['Domain','NextExecutionDateCalculator','Calculo fecha siguiente (pure function)'],['Application','CreateScheduledTransferUseCase','Crear y validar propiedad de cuenta'],['Application','ExecuteScheduledTransferUseCase','Ejecucion, idempotencia, reintentos +2h'],['Application','ScheduledTransferJobService','Job diario dispara ejecuciones vencidas'],['Infrastructure','JpaScheduledTransferRepository','Adaptador JPA PostgreSQL'],['API','ScheduledTransferController','6 endpoints REST']],[1800,3200,4026]),
    SP(),H('3. Flujo diario',1),SP(),P('1. 06:00 ScheduledTransferJobService.runDailyJob()'),P('2. findDueTransfers(today) lista PENDING/ACTIVE con nextExecutionDate <= today'),P('3. ExecuteScheduledTransferUseCase.execute(id, today, isRetry=false)'),P('4. Verificacion idempotencia si existe Execution SUCCESS hoy return inmediato'),P('5. CoreTransferPort.execute() SUCCESS / INSUFFICIENT_FUNDS / ERROR'),P('6. Actualizar transfer + guardar Execution + notificar'),SP(),
    H('4. Modelo de Datos',1),SP(),
    tbl(['Tabla','Columnas clave','Notas'],[['scheduled_transfers','id, user_id, source_account_id, type, status, next_execution_date','PENDING ACTIVE PAUSED COMPLETED FAILED CANCELLED'],['scheduled_transfer_executions','scheduled_transfer_id, scheduled_date, status, retried','UNIQUE (transfer_id, scheduled_date) idempotencia'],['push_subscriptions V17b','auth cifrado, p256dh cifrado, encryption_version','DEBT-028 migracion en caliente']],[2400,3800,2826]),
    SP(),H('5. API',1),SP(),
    tbl(['Metodo','Endpoint','Funcion'],[['POST','/v1/scheduled-transfers','Crear'],['GET','/v1/scheduled-transfers','Listar'],['GET','/{id}','Detalle'],['PATCH','/{id}/pause','Pausar'],['PATCH','/{id}/resume','Reanudar'],['DELETE','/{id}','Cancelar'],['GET','/{id}/executions','Historial']],[800,3200,5026]),
    SP(),H('6. ADRs y Riesgos',1),SP(),
    tbl(['ADR','Decision'],[['ADR-026','ShedLock diferido S18. Single instance S17.'],['ADR-027','No edicion importe en recurrente activa. PSD2 Art.94.'],['DEBT-028','Cifrar auth/p256dh AES-256-GCM. CVSS 4.1 MUST S17.']]  ,[2000,7026]),
  ]}]});
  const buf=await Packer.toBuffer(doc);
  fs2.writeFileSync(path.join(OUT,'HLD-FEAT-015-Sprint17.docx'),buf);
  console.log('OK HLD-FEAT-015-Sprint17.docx');
}

async function genLLDBackend(){
  const doc=new Document({styles:STYLES,sections:[{properties:{page:PAGE},headers:mkH('LLD Backend FEAT-015','Sprint 17 Java 21 Spring Boot 3.x'),footers:mkF('LLD-FEAT-015-Backend'),children:[
    SP(),new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'LOW LEVEL DESIGN BACKEND',bold:true,size:48,color:C.BLUE})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-015 Transferencias Programadas y Recurrentes',size:28,color:C.MED})]}),SP(),
    tbl(['Campo','Valor'],[['Servicio','bankportal-backend'],['Stack','Java 21 Spring Boot 3.x PostgreSQL 15'],['Feature','FEAT-015'],['Sprint','17'],['Fecha','2026-03-24']],[2800,6226]),
    BR(),H('1. Estructura de modulo',1),SP(),P('com.experis.sofia.bankportal.scheduled/'),
    tbl(['Paquete','Fichero','Rol'],[
      ['domain','ScheduledTransfer.java','Aggregate root'],['domain','ScheduledTransferExecution.java','Registro ejecucion'],
      ['domain','ScheduledTransferType.java','Enum ONCE WEEKLY BIWEEKLY MONTHLY'],['domain','ScheduledTransferStatus.java','Enum PENDING ACTIVE PAUSED COMPLETED FAILED CANCELLED'],
      ['domain','ExecutionStatus.java','Enum SUCCESS FAILED_RETRYING SKIPPED CANCELLED'],['domain','NextExecutionDateCalculator.java','Servicio puro calculo fechas'],
      ['domain','ScheduledTransferRepository.java','Puerto salida interface'],['domain','ScheduledTransferExecutionRepository.java','Puerto salida interface'],
      ['application/usecase','CreateScheduledTransferUseCase.java','Crear + validar'],['application/usecase','UpdateScheduledTransferUseCase.java','pause resume cancel'],
      ['application/usecase','GetScheduledTransfersUseCase.java','Consultas por userId'],['application/usecase','ExecuteScheduledTransferUseCase.java','Ejecucion idempotencia reintentos'],
      ['application/usecase','GetScheduledTransferExecutionsUseCase.java','Historial'],['application/usecase','AccountOwnershipPort.java','Puerto pertenencia cuenta'],
      ['application/usecase','CoreTransferPort.java','Puerto core bancario'],['application/usecase','RetrySchedulerPort.java','Puerto reintento +2h'],
      ['application/scheduler','ScheduledTransferJobService.java','Job diario POJO puro'],['api','ScheduledTransferController.java','6 endpoints REST POJO'],
    ],[2500,3500,3026]),
    SP(),H('2. Flyway Migrations',1),SP(),H('2.1 V17 DDL',2),
    P('scheduled_transfers: id UUID PK, user_id FK, source_account_id FK, destination_iban, amount NUMERIC CHECK >0, type, status DEFAULT PENDING, scheduled_date, next_execution_date, end_date, max_executions, executions_count DEFAULT 0.'),
    P('scheduled_transfer_executions: id UUID PK, scheduled_transfer_id FK, transfer_id FK nullable, scheduled_date, executed_at, status, amount, failure_reason, retried BOOLEAN.'),
    P('Indices: idx_sched_transfers_due (next_execution_date, status WHERE PENDING ACTIVE), UNIQUE idx_exec_transfer_date (transfer_id, scheduled_date), idx_sched_transfers_user (user_id, status).'),
    SP(),H('2.2 V17b DEBT-028',2),P('Renombra auth -> auth_plain, p256dh -> p256dh_plain. Anade auth y p256dh TEXT cifrados AES-256-GCM. Anade encryption_version SMALLINT DEFAULT 1. Migracion en caliente al arranque via PushSubscriptionMigrationService.'),
    SP(),H('3. NextExecutionDateCalculator',1),SP(),
    tbl(['Tipo','Logica','Edge case'],[['ONCE','Devuelve null','No hay siguiente'],['WEEKLY','from.plusWeeks(1)','Cruce mes/ano automatico'],['BIWEEKLY','from.plusWeeks(2)','Idem'],['MONTHLY','nextMonthly(originalDay, from)','Feb/28 Feb/29 dia 31 en mes 30d']],[1400,3500,4126]),
    SP(),P('nextMonthly: Math.min(originalDay, YearMonth.of(next).lengthOfMonth()). Ejemplo dia 31 agosto -> septiembre = 30.'),
    SP(),H('4. Flujos ExecuteScheduledTransferUseCase',1),SP(),
    tbl(['Escenario','Accion'],[['Execution SUCCESS today existe','Return idempotente'],['PAUSED','Execution SKIPPED sin notificacion'],['SUCCESS','incrementExecutions(next). Execution SUCCESS. notifySuccess.'],['INSUFF_FUNDS 1er','Execution FAILED_RETRYING. retry +2h. notifyFailure.'],['INSUFF_FUNDS retry','Execution SKIPPED retried=true. ONCE->FAILED. notifyFailure definitivo.']],[2800,6226]),
    SP(),H('5. Variables entorno',1),SP(),
    tbl(['Variable','Default','Requerida'],[['SCHEDULER_ENABLED','true','No'],['SCHEDULER_CRON','0 0 6 * * *','No'],['SCHEDULER_RETRY_DELAY_HOURS','2','No'],['PUSH_ENCRYPTION_KEY','—','SI DEBT-028']],[3000,3500,2526]),
    SP(),H('6. Plan de Tests',1),SP(),
    tbl(['Clase','Tests','Objetivo'],[['NextExecutionDateCalculatorTest','11','100% branch feb/28 feb/29 mes 30d'],['ScheduledTransferTest','10','Invariantes dominio ciclo de vida'],['CreateScheduledTransferUseCaseTest','5','Validaciones pertenencia fecha'],['ExecuteScheduledTransferUseCaseTest','7','SUCCESS INSUFF_FUNDS retry PAUSED idempotencia'],['ScheduledTransferJobServiceTest IT','2','Doble ejecucion = 1 resultado']],[3200,800,5026]),
  ]}]});
  const buf=await Packer.toBuffer(doc);
  fs2.writeFileSync(path.join(OUT,'LLD-FEAT-015-Backend-Sprint17.docx'),buf);
  console.log('OK LLD-FEAT-015-Backend-Sprint17.docx');
}

async function genLLDFrontend(){
  const doc=new Document({styles:STYLES,sections:[{properties:{page:PAGE},headers:mkH('LLD Frontend FEAT-015','Sprint 17 Angular 17+ TypeScript'),footers:mkF('LLD-FEAT-015-Frontend'),children:[
    SP(),new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'LOW LEVEL DESIGN FRONTEND',bold:true,size:48,color:C.BLUE})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-015 US-1505 Gestion Angular de Transferencias Programadas',size:28,color:C.MED})]}),SP(),
    tbl(['Campo','Valor'],[['Modulo','scheduled-transfers'],['Stack','Angular 17+ TypeScript Angular Material'],['Feature','FEAT-015 US-1505'],['Sprint','17'],['Fecha','2026-03-24']],[2800,6226]),
    BR(),H('1. Estructura del modulo',1),SP(),P('src/app/features/scheduled-transfers/'),
    tbl(['Fichero','Tipo','Descripcion'],[
      ['scheduled-transfers.module.ts','NgModule','Lazy-loaded con routing propio'],
      ['components/scheduled-list/','Component','Lista filtros por estado acciones inline'],
      ['components/scheduled-wizard/','Component','Wizard 3 pasos tipo->datos->confirmacion'],
      ['components/scheduled-detail/','Component','Detalle completo + historial ejecuciones'],
      ['services/scheduled-transfer.service.ts','Service','HTTP client /v1/scheduled-transfers'],
      ['models/scheduled-transfer.model.ts','Interface','ScheduledTransfer Execution Request DTOs'],
      ['store/scheduled-transfer.store.ts','Signal Store','Estado reactivo NgRx Signals'],
    ],[3200,1400,4426]),
    SP(),H('2. Wizard — Crear transferencia',1),SP(),
    P('Paso 1 Tipo: selector visual ONCE WEEKLY BIWEEKLY MONTHLY con descripcion de cada recurrencia.'),
    P('Paso 2 Datos: cuenta origen dropdown, IBAN destino con validacion, nombre titular, importe 0.01-50000 EUR, concepto, fecha primera ejecucion DatePicker minimo manana, fecha fin y max ejecuciones opcionales.'),
    P('Paso 3 Confirmacion: resumen completo. OTP-challenge si importe supera limite (integracion FEAT-008 2FA).'),
    SP(),H('3. Servicio HTTP',1),SP(),
    tbl(['Metodo','HTTP','Endpoint'],[['create(req)','POST','/v1/scheduled-transfers'],['getAll(status?)','GET','/v1/scheduled-transfers'],['getById(id)','GET','/:id'],['pause(id)','PATCH','/:id/pause'],['resume(id)','PATCH','/:id/resume'],['cancel(id)','DELETE','/:id'],['getExecutions(id)','GET','/:id/executions']],[2000,1000,6026]),
    SP(),H('4. Validaciones',1),SP(),
    tbl(['Campo','Validadores','Mensaje'],[['Cuenta origen','required','Selecciona una cuenta origen'],['IBAN destino','required + ibanValidator','IBAN espanol invalido'],['Importe','required min(0.01) max(50000)','Importe entre 0.01 EUR y 50000 EUR'],['Fecha ejecucion','required minDate(tomorrow)','La fecha debe ser futura'],['Fecha fin','optional after(scheduledDate)','Debe ser posterior a primera ejecucion'],['Max ejecuciones','optional min(2)','Minimo 2 si se especifica']],[2200,2800,4026]),
    SP(),H('5. Accesibilidad WCAG 2.1 AA',1),SP(),
    P('OK Stepper aria-label en cada paso y botones prev/next'),P('OK Tabla aria-live polite en contenedor resultados'),P('OK DatePicker aria-describedby con formato esperado'),P('OK Dialogos aria-modal=true y gestion de foco'),P('OK Badges aria-label descriptivo no solo color'),
  ]}]});
  const buf=await Packer.toBuffer(doc);
  fs2.writeFileSync(path.join(OUT,'LLD-FEAT-015-Frontend-Sprint17.docx'),buf);
  console.log('OK LLD-FEAT-015-Frontend-Sprint17.docx');
}

Promise.all([genHLD(),genLLDBackend(),genLLDFrontend()])
  .then(()=>console.log('Step 3b COMPLETO'))
  .catch(e=>{console.error('ERROR:',e.message);process.exit(1);});
