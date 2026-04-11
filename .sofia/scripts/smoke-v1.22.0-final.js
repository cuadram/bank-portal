'use strict';
var http = require('http');
var fs   = require('fs');
var TOKEN = fs.readFileSync('.sofia/scripts/token.txt','utf8').trim();
var AUTH  = {'Authorization':'Bearer '+TOKEN};
var BASE  = 'http://localhost:8081';
var FRONT = 'http://localhost:4201';
var ts    = new Date().toISOString();
var J     = JSON.stringify;
var OK=0, FAIL=0, SKIP=0;
var results=[];

function req(url, opts) {
  opts = opts || {};
  return new Promise(function(resolve){
    var o = Object.assign({}, require('url').parse(url), opts);
    var r = http.request(o, function(res){
      var b='';
      res.on('data', function(d){ b+=d; });
      res.on('end',  function(){ resolve({code:res.statusCode, body:b}); });
    });
    r.on('error', function(){ resolve({code:null, body:'ERR'}); });
    r.setTimeout(8000, function(){ r.destroy(); resolve({code:null, body:'TIMEOUT'}); });
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

function chk(id, desc, exp, actual, note) {
  note = note || '';
  var ok = (actual === exp);
  console.log(ok ? '  [PASS]' : '  [FAIL]', id, desc, 'HTTP:'+actual + (note?' ('+note+')':''));
  if (!ok) console.log('         esperado:'+exp);
  ok ? OK++ : FAIL++;
  results.push({id:id, desc:desc, expected:exp, actual:actual, ok:ok, note:note});
}

function chkRange(id, desc, validCodes, actual, body) {
  var ok = validCodes.indexOf(actual) !== -1;
  console.log(ok ? '  [PASS]' : '  [FAIL]', id, desc, 'HTTP:'+actual, ok?'':'BODY:'+body.substring(0,120));
  ok ? OK++ : FAIL++;
  results.push({id:id, desc:desc, expected:validCodes.join('|'), actual:actual, ok:ok});
}

function skp(id, desc, why) {
  console.log('  [SKIP]', id, desc, '-', why);
  SKIP++;
  results.push({id:id, desc:desc, ok:'SKIP', why:why});
}

Promise.resolve().then(async function(){

  console.log('\n========================================================');
  console.log('  SMOKE TEST DEFINITIVO v1.22.0 —', ts);
  console.log('  Sprint 22 · FEAT-020 · Gestión de Préstamos Personales');
  console.log('  Usuario: adelacuadra (a.delacuadra@nemtec.es)');
  console.log('========================================================\n');

  // ── B1: INFRAESTRUCTURA ───────────────────────────────────
  console.log('[B1] INFRAESTRUCTURA');
  var h  = await req(BASE+'/actuator/health');
  chk('ST-01','Health backend UP',200,h.code);
  try{ var hd=JSON.parse(h.body); console.log('  status:',hd.status); }catch(e){}

  var fe = await req(FRONT+'/');
  chk('ST-02','Frontend Angular accesible',200,fe.code);

  var mh = await req('http://localhost:8025/');
  chk('ST-03','MailHog UI accesible',200,mh.code);

  // ── B2: AUTH ──────────────────────────────────────────────
  console.log('\n[B2] AUTH');
  var l0 = await req(BASE+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:J({})});
  chk('ST-04','Login body vacío → 400 (validación @Valid)',400,l0.code);

  var l1 = await req(BASE+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:J({email:'noexiste@banktest.com',password:'WrongPassword123!'})});
  chk('ST-05','Login creds incorrectas → 401',401,l1.code);

  // ── B3: SEGURIDAD sin JWT ─────────────────────────────────
  console.log('\n[B3] SEGURIDAD — endpoints protegidos sin JWT → 401');
  var sec=[
    ['ST-06','GET /api/v1/loans sin JWT',BASE+'/api/v1/loans','GET',null],
    ['ST-07','POST /loans/simulate sin JWT',BASE+'/api/v1/loans/simulate','POST',J({importe:10000,plazo:24,finalidad:'CONSUMO'})],
    ['ST-08','POST /loans/applications sin JWT',BASE+'/api/v1/loans/applications','POST',J({importe:5000,plazo:12,finalidad:'CONSUMO',otpCode:'123456'})],
    ['ST-09','GET /profile/notifications sin JWT',BASE+'/api/v1/profile/notifications','GET',null],
  ];
  for (var i=0;i<sec.length;i++){
    var s=sec[i];
    var hdr={'Content-Type':'application/json'};
    var ro=await req(s[2],{method:s[3],headers:hdr,body:s[4]||undefined});
    chk(s[0],s[1]+' → 401',401,ro.code);
  }

  // ── B4: FEAT-020 LOANS con JWT ────────────────────────────
  console.log('\n[B4] FEAT-020 — GESTIÓN DE PRÉSTAMOS (JWT válido)');

  // ST-10: Lista préstamos paginada
  var loansR = await req(BASE+'/api/v1/loans',{headers:AUTH});
  chk('ST-10','GET /loans → 200 (lista paginada RN-F020-01)',200,loansR.code);
  var loanId = null;
  if (loansR.code===200) {
    try{
      var ld=JSON.parse(loansR.body);
      console.log('  totalElements:',ld.totalElements,'| content.length:',ld.content?ld.content.length:0,'| pageable: OK');
      if (ld.content && ld.content.length>0) loanId = ld.content[0].id;
    }catch(e){}
  }

  // ST-11: Simulación préstamo — ADR-034 (BigDecimal HALF_EVEN, método francés)
  var simR = await req(BASE+'/api/v1/loans/simulate',{
    method:'POST',
    headers:Object.assign({},AUTH,{'Content-Type':'application/json'}),
    body:J({importe:15000,plazo:36,finalidad:'CONSUMO'})
  });
  chk('ST-11','POST /loans/simulate → 200 (cálculo amortización ADR-034)',200,simR.code);
  if (simR.code===200) {
    try{
      var sd=JSON.parse(simR.body);
      var coherente = Math.abs(sd.costeTotal - (sd.cuotaMensual*36)) < 1;
      console.log('  cuotaMensual:',sd.cuotaMensual,'EUR | TAE:',sd.tae,'% | costeTotal:',sd.costeTotal,'EUR');
      console.log('  schedule rows:',sd.schedule?sd.schedule.length:0,'| coherencia aritmética:',coherente?'OK':'INCOHERENTE');
      console.log('  interesesTotales:',sd.interesesTotales,'EUR');
      // Verificar primera fila del cuadro de amortización
      if (sd.schedule && sd.schedule.length>0) {
        var f=sd.schedule[0];
        console.log('  fila[0]: n='+f.n+' capital='+f.capital+' intereses='+f.intereses+' cuota='+f.cuotaTotal+' saldo='+f.saldoPendiente);
      }
    }catch(e){ console.log('  parse error:', e.message); }
  }

  // ST-12: Apply sin OTP → 400 (validación @NotBlank @Size(6,6))
  var a400 = await req(BASE+'/api/v1/loans/applications',{
    method:'POST',
    headers:Object.assign({},AUTH,{'Content-Type':'application/json'}),
    body:J({importe:5000,plazo:24,finalidad:'CONSUMO'})
  });
  chk('ST-12','POST /loans/applications sin OTP → 400 (RN-F020-08)',400,a400.code,'otpCode @NotBlank requerido');

  // ST-13: Apply con OTP inválido → 401 (BUG-STG-022-002 FIX)
  var aBad = await req(BASE+'/api/v1/loans/applications',{
    method:'POST',
    headers:Object.assign({},AUTH,{'Content-Type':'application/json'}),
    body:J({importe:5000,plazo:24,finalidad:'CONSUMO',otpCode:'000000'})
  });
  chk('ST-13','POST /loans/applications OTP inválido → 401 (BUG-STG-022-002 fix)',401,aBad.code,'InvalidOtpException → 401 OWASP-A07');
  if (aBad.code===401) {
    try{ var bd=JSON.parse(aBad.body); console.log('  error:',bd.error,'| msg:',bd.message); }catch(e){}
  }

  // ST-14/15: Detalle + cuadro amortización (requiere préstamo seed V24)
  if (loanId) {
    var detR = await req(BASE+'/api/v1/loans/'+loanId,{headers:AUTH});
    chk('ST-14','GET /loans/{id} → 200 (detalle RN-F020-02)',200,detR.code);
    if (detR.code===200){ try{var dd=JSON.parse(detR.body);console.log('  id:',dd.id,'| estado:',dd.estado,'| importe:',dd.importe);}catch(e){} }

    var amortR = await req(BASE+'/api/v1/loans/'+loanId+'/amortization',{headers:AUTH});
    chk('ST-15','GET /loans/{id}/amortization → 200 (RN-F020-17)',200,amortR.code);
    if (amortR.code===200){ try{var ar=JSON.parse(amortR.body);console.log('  filas amortización:',Array.isArray(ar)?ar.length:'?');}catch(e){} }
  } else {
    skp('ST-14','GET /loans/{id}','Sin préstamos seed para adelacuadra — usar V24 seed data');
    skp('ST-15','GET /loans/{id}/amortization','Depende de ST-14');
  }

  // ── B5: PERFIL / DEBT-043 ─────────────────────────────────
  console.log('\n[B5] PERFIL — DEBT-043 (ProfileController.getNotifications)');
  var notifR = await req(BASE+'/api/v1/profile/notifications',{headers:AUTH});
  chk('ST-16','GET /profile/notifications → 200 (DEBT-043 cerrado)',200,notifR.code);
  if (notifR.code===200) {
    try{ var nr=JSON.parse(notifR.body); console.log('  notificaciones en BD:',Array.isArray(nr)?nr.length:JSON.stringify(nr).substring(0,60)); }catch(e){}
  }

  // ── B6: FLYWAY V24 ────────────────────────────────────────
  console.log('\n[B6] FLYWAY — migración V24__loans_and_applications.sql');
  var fwR = await req(BASE+'/actuator/flyway',{headers:AUTH});
  if (fwR.code===200) {
    try{
      var fd=JSON.parse(fwR.body);
      var ctx=Object.values(fd.contexts||{})[0];
      var migs=(ctx&&ctx.flywayBeans&&ctx.flywayBeans.flyway)?ctx.flywayBeans.flyway.migrations:[];
      var totalOk=migs.filter(function(m){return m.state==='SUCCESS';}).length;
      var v24=migs.find(function(m){return m.script&&m.script.indexOf('V24')===0;});
      console.log('  total migraciones SUCCESS:',totalOk,'/ '+migs.length);
      if (v24) {
        var ok24=(v24.state==='SUCCESS');
        console.log(ok24?'  [PASS]':'  [FAIL]','ST-17 V24__loans_and_applications.sql estado:',v24.state,'| installedOn:',v24.installedOn);
        ok24?OK++:FAIL++;
        results.push({id:'ST-17',desc:'Flyway V24',ok:ok24,v24State:v24.state,installedOn:v24.installedOn,totalSuccess:totalOk,totalMigs:migs.length});
      } else {
        console.log('  [FAIL] ST-17 V24 NOT FOUND en lista de migraciones');
        FAIL++;
        results.push({id:'ST-17',ok:false,note:'V24 NOT FOUND',totalSuccess:totalOk});
      }
    } catch(e) {
      console.log('  [FAIL] ST-17 parse error:',e.message);
      FAIL++;
    }
  } else {
    console.log('  [FAIL] ST-17 /actuator/flyway HTTP:',fwR.code);
    FAIL++;
  }

  // ── RESUMEN ───────────────────────────────────────────────
  var total=OK+FAIL+SKIP;
  var result=FAIL===0?'PASS':'FAIL';
  var verdict=FAIL===0
    ? 'SMOKE TEST PASS — v1.22.0 VERIFICADO — APTO PARA APROBACIÓN G-9'
    : 'SMOKE TEST FAIL — '+FAIL+' checks fallidos';

  console.log('\n========================================================');
  console.log('  RESULTADO FINAL: '+OK+' PASS | '+FAIL+' FAIL | '+SKIP+' SKIP');
  console.log('  Total checks: '+total);
  console.log(FAIL===0?'  ✅ [OK]':'  ❌ [KO]', verdict);
  console.log('========================================================\n');

  // Persistir evidencia en docs/qa/
  var logObj={
    version:'v1.22.0', sprint:22, feature:'FEAT-020',
    executed_at:ts, executor:'SOFIA-STG-Verification-Sprint22',
    user_tested:'adelacuadra (a.delacuadra@nemtec.es)',
    stack:{backend:'localhost:8081',frontend:'localhost:4201',mailhog:'localhost:8025'},
    bug_fixed:'BUG-STG-022-002 — InvalidOtpException → 401 (LoanExceptionHandler)',
    summary:{total:total, ok:OK, fail:FAIL, skip:SKIP, result:result},
    verdict:verdict,
    checks:results
  };
  var fname='docs/qa/SMOKE-TEST-v1.22.0-DEFINITIVO-'+ts.replace(/[:.]/g,'-').slice(0,19)+'.log';
  fs.writeFileSync(fname, J(logObj,null,2));
  console.log('📄 Evidencia persistida:', fname);

  process.exit(FAIL>0?1:0);
});
