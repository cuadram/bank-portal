
'use strict';
const http = require('http');
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJiODRjNTcyNC04NzAzLTQzZmYtYTdkNC0yMDQ3OTY5ZDliYjYiLCJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZGVsYWN1YWRyYSIsImlhdCI6MTc3NTE2MjE5NCwiZXhwIjoxNzc1MTkwOTk0fQ.7Fdj7hKq1SToFKLn5-rMPEtKcq6ssYzGjJVLecpU_AQ';
const AUTH={'Authorization':'Bearer '+TOKEN};
const BASE='http://localhost:8081';
const ts=new Date().toISOString();
let OK=0,FAIL=0,SKIP=0; const results=[];
const J=JSON.stringify;
const req=(url,opts)=>new Promise(resolve=>{
  opts=opts||{};
  var o=Object.assign({},require('url').parse(url),opts);
  var r=http.request(o,function(res){var b='';res.on('data',function(d){b+=d;});res.on('end',function(){resolve({code:res.statusCode,body:b});});});
  r.on('error',function(){resolve({code:null,body:'ERR'});});
  r.setTimeout(7000,function(){r.destroy();resolve({code:null,body:'TIMEOUT'});});
  if(opts.body)r.write(opts.body);r.end();
});
const chk=function(id,desc,exp,actual,note){
  note=note||'';
  var ok=actual===exp;
  console.log(ok?'  [PASS]':'  [FAIL]',id,desc,'HTTP:'+actual+(note?' ('+note+')':''));
  ok?OK++:FAIL++; results.push({id:id,desc:desc,expected:exp,actual:actual,ok:ok,note:note});
};
const skp=function(id,desc,why){console.log('  [SKIP]',id,desc,'-',why);SKIP++;results.push({id:id,desc:desc,ok:'SKIP',why:why});};

Promise.resolve().then(async function(){
  console.log('');
  console.log('=== SMOKE TEST FINAL v1.22.0 ===');
  console.log('=== Sprint 22 FEAT-020 ===',ts);
  console.log('');
  
  console.log('[B1] INFRAESTRUCTURA');
  var h=await req(BASE+'/actuator/health');
  chk('ST-01','Health backend UP',200,h.code);
  var fe=await req('http://localhost:4201/');
  chk('ST-02','Frontend accesible',200,fe.code);
  var mh=await req('http://localhost:8025/');
  chk('ST-03','MailHog UI',200,mh.code);

  console.log('[B2] AUTH');
  var l0=await req(BASE+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:J({})});
  chk('ST-04','Login body vacio 400',400,l0.code);
  var l1=await req(BASE+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:J({email:'x@banktest.com',password:'WrongPassword123!'})});
  chk('ST-05','Login creds incorrectas 401',401,l1.code);

  console.log('[B3] SEGURIDAD sin JWT');
  var sec=[['ST-06','GET /loans sin JWT',BASE+'/api/v1/loans','GET'],['ST-07','POST /simulate sin JWT',BASE+'/api/v1/loans/simulate','POST'],['ST-08','POST /applications sin JWT',BASE+'/api/v1/loans/applications','POST'],['ST-09','GET /notifications sin JWT',BASE+'/api/v1/profile/notifications','GET']];
  for(var i=0;i<sec.length;i++){var s=sec[i];var r=await req(s[2],{method:s[3],headers:{'Content-Type':'application/json'},body:s[3]==='POST'?J({}):'dummy'});chk(s[0],s[1]+' 401',401,r.code);}

  console.log('[B4] FEAT-020 LOANS con JWT');
  var loans=await req(BASE+'/api/v1/loans',{headers:AUTH});
  chk('ST-10','GET /loans 200',200,loans.code);
  var loanId=null;
  if(loans.code===200){try{var ld=JSON.parse(loans.body);var cnt=ld.content?ld.content.length:Array.isArray(ld)?ld.length:'?';console.log('  prestamos BD:',cnt);if(ld.content&&ld.content.length>0)loanId=ld.content[0].id;}catch(e){}}

  var sim=await req(BASE+'/api/v1/loans/simulate',{method:'POST',headers:Object.assign({},AUTH,{'Content-Type':'application/json'}),body:J({importe:15000,plazo:36,finalidad:'CONSUMO'})});
  chk('ST-11','POST /simulate 200 ADR-034',200,sim.code);
  if(sim.code===200){try{var sd=JSON.parse(sim.body);console.log('  cuota:',sd.cuotaMensual,'EUR TAE:',sd.tae,'% total:',sd.costeTotal,'EUR schedule:',sd.schedule?sd.schedule.length:0,'filas coherencia:',Math.abs(sd.costeTotal-(sd.cuotaMensual*36))<1?'OK':'INCOHERENTE');}catch(e){}}

  var a400=await req(BASE+'/api/v1/loans/applications',{method:'POST',headers:Object.assign({},AUTH,{'Content-Type':'application/json'}),body:J({importe:5000,plazo:24,finalidad:'CONSUMO'})});
  chk('ST-12','POST /applications sin OTP 400 RN-F020-08',400,a400.code,'otpCode obligatorio');

  var aBad=await req(BASE+'/api/v1/loans/applications',{method:'POST',headers:Object.assign({},AUTH,{'Content-Type':'application/json'}),body:J({importe:5000,plazo:24,finalidad:'CONSUMO',otpCode:'000000'})});
  var otp4xx=[400,401,422,403].includes(aBad.code);
  console.log(otp4xx?'  [PASS]':'  [FAIL]','ST-13 OTP invalido 4xx HTTP:'+aBad.code,otp4xx?'':'RESP:'+aBad.body.substring(0,100));
  otp4xx?OK++:FAIL++; results.push({id:'ST-13',ok:otp4xx,actual:aBad.code,body:aBad.body.substring(0,200)});

  if(loanId){
    var det=await req(BASE+'/api/v1/loans/'+loanId,{headers:AUTH});
    chk('ST-14','GET /loans/{id} 200',200,det.code);
    var amort=await req(BASE+'/api/v1/loans/'+loanId+'/amortization',{headers:AUTH});
    chk('ST-15','GET /amortization 200',200,amort.code);
    if(amort.code===200){try{var ad=JSON.parse(amort.body);console.log('  filas:',Array.isArray(ad)?ad.length:'?');}catch(e){}}
  }else{skp('ST-14','GET /loans/{id}','sin seed loans');skp('ST-15','GET /amortization','dep ST-14');}

  console.log('[B5] PERFIL DEBT-043');
  var notif=await req(BASE+'/api/v1/profile/notifications',{headers:AUTH});
  chk('ST-16','GET /notifications 200 DEBT-043',200,notif.code);
  if(notif.code===200)console.log('  resp:',notif.body.substring(0,80));

  console.log('[B6] FLYWAY V24');
  var fw=await req(BASE+'/actuator/flyway',{headers:AUTH});
  if(fw.code===200){
    try{
      var fd=JSON.parse(fw.body);
      var ctx=Object.values(fd.contexts||{})[0];
      var migs=(ctx&&ctx.flywayBeans&&ctx.flywayBeans.flyway)?ctx.flywayBeans.flyway.migrations:[];
      var succ=migs.filter(function(m){return m.state==='SUCCESS';}).length;
      var v24=migs.find(function(m){return m.script&&m.script.startsWith('V24');});
      console.log('  total SUCCESS:',succ,'migrations');
      if(v24){var ok24=v24.state==='SUCCESS';console.log(ok24?'  [PASS]':'  [FAIL]','ST-17 V24__loans_and_applications.sql estado:',v24.state);ok24?OK++:FAIL++;results.push({id:'ST-17',ok:ok24,v24State:v24.state,installedOn:v24.installedOn,totalSuccess:succ});}
      else{console.log('  [FAIL] ST-17 V24 NOT FOUND');FAIL++;results.push({id:'ST-17',ok:false});}
    }catch(e){console.log('  [FAIL] ST-17 parse:',e.message);FAIL++;}
  }else{console.log('  [FAIL] ST-17 flyway HTTP:',fw.code);FAIL++;}

  var total=OK+FAIL+SKIP;
  var verdict=FAIL===0?'SMOKE TEST PASS - v1.22.0 APTO PARA G-9':'SMOKE TEST FAIL - '+FAIL+' checks fallidos';
  console.log('');
  console.log('========================================================');
  console.log('  RESULTADO FINAL: '+OK+' PASS | '+FAIL+' FAIL | '+SKIP+' SKIP | Total: '+total);
  console.log(FAIL===0?'  [OK]':'  [KO]',verdict);
  console.log('========================================================');
  
  var logObj={version:'v1.22.0',sprint:22,feature:'FEAT-020',executed_at:ts,executor:'SOFIA-STG-Verification',user_tested:'adelacuadra (a.delacuadra@nemtec.es)',stack:{backend:'localhost:8081',frontend:'localhost:4201',mailhog:'localhost:8025'},summary:{total:total,ok:OK,fail:FAIL,skip:SKIP,result:FAIL===0?'PASS':'FAIL'},verdict:verdict,checks:results};
  var fname='docs/qa/SMOKE-TEST-v1.22.0-FINAL-'+ts.replace(/[:.]/g,'-').slice(0,19)+'.log';
  require('fs').writeFileSync(fname,J(logObj,null,2));
  console.log('  LOG:', fname);
  process.exit(FAIL>0?1:0);
});
