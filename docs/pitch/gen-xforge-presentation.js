const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'SOFIA by Experis';
pres.title = 'XFORGE — Factoría de Software IA — v2.2';

const NAVY="162E54",NAVY2="1B3A6B",ORANGE="C84A14",TEAL="2F6B61",SLATE="3D5A80",WHITE="FFFFFF",OFFWHITE="F4F7FA",LIGHTGREY="E8ECF0",DARKGREY="334155",MIDGREY="64748B",SUCCESS="22C55E",AMBER="F59E0B",CARD_BG="1C3452";
const makeShadow=()=>({type:"outer",blur:8,offset:3,angle:135,color:"000000",opacity:0.18});

function darkBg(s){s.background={color:NAVY};s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.07,fill:{color:ORANGE},line:{color:ORANGE,width:0}});}
function lightBg(s){s.background={color:OFFWHITE};s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.6,fill:{color:NAVY},line:{color:NAVY,width:0}});s.addShape(pres.shapes.RECTANGLE,{x:0,y:0,w:10,h:0.07,fill:{color:ORANGE},line:{color:ORANGE,width:0}});}
function addLightTitle(s,t){s.addText(t,{x:0.5,y:0.1,w:9,h:0.45,fontSize:22,bold:true,color:WHITE,fontFace:"Arial Black",margin:0});s.addText(">FORGE",{x:8.2,y:0.08,w:1.6,h:0.45,fontSize:14,bold:true,color:ORANGE,fontFace:"Arial Black",align:"right",margin:0});}
function statBox(s,x,y,w,h,num,label,sub,nc){s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});s.addShape(pres.shapes.RECTANGLE,{x,y,w,h:0.06,fill:{color:nc||ORANGE},line:{color:nc||ORANGE,width:0}});s.addText(num,{x,y:y+0.1,w,h:h*0.5,fontSize:36,bold:true,color:nc||ORANGE,fontFace:"Arial Black",align:"center",valign:"middle"});s.addText(label,{x,y:y+h*0.52,w,h:0.28,fontSize:11,bold:true,color:DARKGREY,fontFace:"Arial",align:"center"});if(sub)s.addText(sub,{x,y:y+h*0.72,w,h:0.22,fontSize:9,color:MIDGREY,fontFace:"Arial",align:"center"});}
function darkCard(s,x,y,w,h,title,tc,items){s.addShape(pres.shapes.RECTANGLE,{x,y,w,h,fill:{color:CARD_BG},line:{color:SLATE,width:1}});s.addShape(pres.shapes.RECTANGLE,{x,y,w,h:0.28,fill:{color:tc||SLATE},line:{color:tc||SLATE,width:0}});s.addText(title,{x:x+0.12,y,w:w-0.12,h:0.28,fontSize:9,bold:true,color:WHITE,fontFace:"Arial",valign:"middle",margin:0});s.addText(items.map(t=>({text:"● "+t,options:{breakLine:true}})),{x:x+0.12,y:y+0.32,w:w-0.2,h:h-0.36,fontSize:8.5,color:LIGHTGREY,fontFace:"Arial",valign:"top"});}

// SLIDE 1 — PORTADA
{const s=pres.addSlide();darkBg(s);
s.addShape(pres.shapes.OVAL,{x:6.2,y:1.0,w:5.2,h:5.2,fill:{color:SLATE,transparency:70},line:{color:SLATE,width:0}});
s.addShape(pres.shapes.OVAL,{x:7.4,y:2.2,w:3.5,h:3.5,fill:{color:TEAL,transparency:75},line:{color:TEAL,width:0}});
s.addText("🤖",{x:7.6,y:1.5,w:2,h:2,fontSize:80,align:"center"});
s.addShape(pres.shapes.RECTANGLE,{x:0.5,y:0.9,w:0.12,h:2.4,fill:{color:ORANGE},line:{color:ORANGE,width:0}});
s.addText("XFORGE",{x:0.7,y:0.85,w:6.5,h:1.5,fontSize:72,bold:true,color:WHITE,fontFace:"Arial Black",margin:0});
s.addText("Forge faster. Deliver stronger.",{x:0.7,y:2.35,w:6,h:0.5,fontSize:20,italic:true,color:ORANGE,fontFace:"Arial",margin:0});
s.addShape(pres.shapes.RECTANGLE,{x:0.7,y:2.95,w:5,h:0.04,fill:{color:ORANGE},line:{color:ORANGE,width:0}});
s.addText("La Factoría de Software con IA de Experis",{x:0.7,y:3.1,w:6.2,h:0.4,fontSize:16,color:LIGHTGREY,fontFace:"Arial",margin:0});
s.addText("Automatización inteligente de proyectos de software, de principio a fin.",{x:0.7,y:3.55,w:6,h:0.5,fontSize:13,color:MIDGREY,fontFace:"Arial",margin:0});
[["v2.2",ORANGE],["20 Agentes",TEAL],["CMMI L3",NAVY2]].forEach(([t,c],i)=>{const bx=0.7+i*1.75;s.addShape(pres.shapes.RECTANGLE,{x:bx,y:4.3,w:1.55,h:0.32,fill:{color:c},line:{color:c,width:0}});s.addText(t,{x:bx,y:4.3,w:1.55,h:0.32,fontSize:9.5,bold:true,color:WHITE,align:"center",valign:"middle",fontFace:"Arial"});});
s.addText("CONFIDENCIAL · Experis Spain · 2026",{x:0,y:5.3,w:10,h:0.25,fontSize:8,color:MIDGREY,align:"center",fontFace:"Arial"});}

// SLIDE 2 — EL RETO
{const s=pres.addSlide();lightBg(s);addLightTitle(s,"El reto de los proyectos de software hoy");
[{icon:"🕒",title:"Entregas lentas",text:"Los proyectos tradicionales tardan semanas en arrancar. Reuniones, documentos y burocracia consumen tiempo valioso.",color:NAVY2},{icon:"📄",title:"Documentación costosa",text:"Generar planes, reportes CMMI y documentos técnicos requiere horas de trabajo manual en cada proyecto.",color:TEAL},{icon:"👥",title:"Dependencia del equipo",text:"El conocimiento está en las personas. Si alguien se va, la calidad del proyecto se resiente.",color:ORANGE},{icon:"🛡",title:"Riesgo de calidad",text:"Sin estándares automatizados, la calidad varía proyecto a proyecto y cliente a cliente.",color:SLATE}].forEach((c,i)=>{const cx=0.4+i*2.33;s.addShape(pres.shapes.RECTANGLE,{x:cx,y:0.75,w:2.1,h:4.55,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});s.addShape(pres.shapes.RECTANGLE,{x:cx,y:0.75,w:2.1,h:0.28,fill:{color:c.color},line:{color:c.color,width:0}});s.addText(c.icon,{x:cx,y:1.05,w:2.1,h:0.8,fontSize:36,align:"center"});s.addText(c.title,{x:cx+0.1,y:1.88,w:1.9,h:0.4,fontSize:11,bold:true,color:DARKGREY,fontFace:"Arial",align:"center"});s.addText(c.text,{x:cx+0.1,y:2.35,w:1.9,h:2.7,fontSize:9.5,color:MIDGREY,fontFace:"Arial",align:"left"});});}

// SLIDE 3 — QUÉ ES XFORGE
{const s=pres.addSlide();darkBg(s);
s.addText("¿Qué es XFORGE?",{x:0.5,y:0.08,w:7,h:0.45,fontSize:22,bold:true,color:WHITE,fontFace:"Arial Black",margin:0});
s.addText(">FORGE",{x:8.2,y:0.08,w:1.6,h:0.45,fontSize:14,bold:true,color:ORANGE,fontFace:"Arial Black",align:"right",margin:0});
s.addShape(pres.shapes.RECTANGLE,{x:0.4,y:0.68,w:0.07,h:2.2,fill:{color:ORANGE},line:{color:ORANGE,width:0}});
s.addText("Un equipo de trabajo inteligente, siempre disponible",{x:0.6,y:0.65,w:4.5,h:0.7,fontSize:18,bold:true,color:ORANGE,fontFace:"Arial",margin:0});
s.addText("XFORGE es la Factoría de Software con Inteligencia Artificial de Experis. Funciona como un equipo de 20 agentes especializados que trabajan de forma autónoma para entregar proyectos de software de extremo a extremo: desde el análisis inicial hasta la documentación final lista para el cliente.",{x:0.6,y:1.4,w:4.5,h:1.3,fontSize:11,color:LIGHTGREY,fontFace:"Arial",margin:0});
["Automatiza el 80% de las tareas repetitivas del proyecto","CMMI Nivel 3 nativo, sin esfuerzo extra del equipo","Genera toda la documentación técnica automáticamente","Dominio bancario especializado (SEPA, PSD2, Basilea III)","Pipeline de 13 pasos con gates de aprobación humana"].forEach((t,i)=>s.addText("✅  "+t,{x:0.6,y:2.82+i*0.48,w:4.6,h:0.4,fontSize:11,color:LIGHTGREY,fontFace:"Arial"}));
[{val:"20",label:"Agentes\nespecializados",c:ORANGE},{val:"13",label:"Pasos en\nel pipeline",c:TEAL},{val:"CMMI L3",label:"Gobierno\nnativo",c:SLATE},{val:"100%",label:"Docs\nautomáticas",c:NAVY2}].forEach((m,i)=>{const mx=5.55+(i%2)*2.1,my=0.68+Math.floor(i/2)*2.35;s.addShape(pres.shapes.RECTANGLE,{x:mx,y:my,w:1.9,h:2.1,fill:{color:CARD_BG},line:{color:m.c,width:2}});s.addText(m.val,{x:mx,y:my+0.25,w:1.9,h:0.8,fontSize:30,bold:true,color:m.c,fontFace:"Arial Black",align:"center"});s.addText(m.label,{x:mx,y:my+1.1,w:1.9,h:0.75,fontSize:10,color:LIGHTGREY,fontFace:"Arial",align:"center"});});}

// SLIDE 4 — PIPELINE
{const s=pres.addSlide();lightBg(s);addLightTitle(s,"Cómo funciona: el pipeline de entrega de XFORGE");
const steps=[{n:"1",label:"Scrum Master",sub:"Planning",color:NAVY2,gate:true},{n:"2",label:"Requirements",sub:"SRS + US",color:NAVY2,gate:true},{n:"2b",label:"FA Agent",sub:"Análisis Func.",color:TEAL,gate:false},{n:"3",label:"Architect",sub:"HLD + LLD",color:SLATE,gate:true},{n:"3b",label:"Doc Agent",sub:"Diagramas",color:TEAL,gate:false},{n:"4",label:"Developer",sub:"Código + Tests",color:SLATE,gate:false},{n:"5",label:"Code Reviewer",sub:"CR + NCs",color:ORANGE,gate:true},{n:"5b",label:"Security",sub:"CVE Scan",color:ORANGE,gate:true},{n:"6",label:"QA Tester",sub:"Test Plan",color:TEAL,gate:true},{n:"7",label:"DevOps",sub:"CI/CD Release",color:SLATE,gate:true},{n:"8",label:"Doc Agent",sub:"13 Entregables",color:TEAL,gate:true},{n:"8b",label:"FA Agent",sub:"Consolidación",color:TEAL,gate:false},{n:"9",label:"Workflow Mgr",sub:"Cierre Sprint",color:ORANGE,gate:true}];
const bw=1.27,bh=1.55,gap=0.05;
const renderRow=(arr,yBase)=>arr.forEach((st,i)=>{const bx=0.28+i*(bw+gap);s.addShape(pres.shapes.RECTANGLE,{x:bx,y:yBase,w:bw,h:bh,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});s.addShape(pres.shapes.RECTANGLE,{x:bx,y:yBase,w:bw,h:0.22,fill:{color:st.color},line:{color:st.color,width:0}});s.addText(st.n,{x:bx,y:yBase+0.01,w:bw,h:0.2,fontSize:9,bold:true,color:WHITE,align:"center",fontFace:"Arial"});s.addText(st.label,{x:bx+0.04,y:yBase+0.26,w:bw-0.08,h:0.55,fontSize:9,bold:true,color:DARKGREY,fontFace:"Arial",align:"center"});s.addText(st.sub,{x:bx+0.04,y:yBase+0.83,w:bw-0.08,h:0.3,fontSize:8,color:MIDGREY,fontFace:"Arial",align:"center"});if(st.gate){s.addShape(pres.shapes.RECTANGLE,{x:bx+0.3,y:yBase+1.2,w:0.65,h:0.2,fill:{color:ORANGE},line:{color:ORANGE,width:0}});s.addText("🔒 GATE",{x:bx+0.3,y:yBase+1.2,w:0.65,h:0.2,fontSize:7,bold:true,color:WHITE,align:"center",fontFace:"Arial"});}if(i<arr.length-1)s.addShape(pres.shapes.LINE,{x:bx+bw,y:yBase+bh/2,w:gap,h:0,line:{color:ORANGE,width:1.5}});});
renderRow(steps.slice(0,7),0.74);renderRow(steps.slice(7),2.42);
s.addShape(pres.shapes.RECTANGLE,{x:0.28,y:5.08,w:9.44,h:0.35,fill:{color:"FEF3C7"},line:{color:AMBER,width:1}});
s.addText("✦  Todo el proceso es supervisado por Experis, que aprueba cada gate antes de continuar · Pasos 2b, 3b y 8b ejecutados por el FA Agent — dominio bancario especializado",{x:0.35,y:5.08,w:9.3,h:0.35,fontSize:8.5,color:DARKGREY,fontFace:"Arial",valign:"middle"});}

// SLIDE 5 — 20 AGENTES
{const s=pres.addSlide();darkBg(s);
s.addText("20 agentes especializados",{x:0.5,y:0.08,w:7.5,h:0.45,fontSize:22,bold:true,color:WHITE,fontFace:"Arial Black",margin:0});
s.addText(">FORGE",{x:8.2,y:0.08,w:1.6,h:0.45,fontSize:14,bold:true,color:ORANGE,fontFace:"Arial Black",align:"right",margin:0});
s.addText("Cada agente es un experto digital autónomo en su dominio de actuación",{x:0.5,y:0.54,w:9,h:0.25,fontSize:11,color:MIDGREY,fontFace:"Arial"});
const groups=[{title:"GESTIÓN",color:NAVY2,items:["Orchestrator","Scrum Master","Requirements","Workflow Mgr","FA Agent ★"]},{title:"ARQUITECTURA",color:SLATE,items:["Architect","Database Designer","API Designer"]},{title:"DESARROLLO",color:TEAL,items:["Developer Core","Java Dev","Angular Dev","Node.js Dev","React Dev",".NET Dev","Code Reviewer"]},{title:"CALIDAD",color:"6D3FA0",items:["QA Tester","Security Agent","Performance Agent"]},{title:"DEVOPS",color:"8B1A1A",items:["DevOps","Jenkins Agent ★"]},{title:"DOCUMENTACIÓN",color:ORANGE,items:["Doc Agent","Atlassian Agent ★"]}];
const pos=[{x:0.3,y:0.88,w:2.35,h:2.2},{x:2.73,y:0.88,w:2.35,h:1.1},{x:5.16,y:0.88,w:4.54,h:1.1},{x:0.3,y:3.16,w:2.35,h:1.2},{x:2.73,y:2.06,w:2.35,h:1.06},{x:5.16,y:2.06,w:4.54,h:1.06}];
groups.forEach((g,i)=>{const p=pos[i];darkCard(s,p.x,p.y,p.w,p.h,g.title,g.color,g.items);});
s.addShape(pres.shapes.RECTANGLE,{x:0.3,y:4.45,w:9.4,h:0.35,fill:{color:CARD_BG},line:{color:SLATE,width:1}});
s.addText("★ Agentes nuevos en SOFIA v2.0+: FA Agent (Analista Funcional bancario) · Jenkins Agent (CI/CD) · Atlassian Agent (Jira + Confluence sync automático)",{x:0.45,y:4.45,w:9.1,h:0.35,fontSize:9,color:ORANGE,fontFace:"Arial",valign:"middle"});
s.addShape(pres.shapes.RECTANGLE,{x:7.6,y:3.16,w:2.1,h:1.2,fill:{color:CARD_BG},line:{color:ORANGE,width:2}});
s.addText("20",{x:7.6,y:3.26,w:2.1,h:0.6,fontSize:48,bold:true,color:ORANGE,fontFace:"Arial Black",align:"center"});
s.addText("agentes\ntotales",{x:7.6,y:3.88,w:2.1,h:0.4,fontSize:9.5,color:LIGHTGREY,fontFace:"Arial",align:"center"});}

// SLIDE 6 — FA AGENT
{const s=pres.addSlide();lightBg(s);addLightTitle(s,"FA Agent — Analista Funcional bancario especializado (nuevo en v2.0)");
s.addText("El FA Agent es el primer agente de SOFIA con conocimiento regulatorio bancario profundo. Genera y mantiene el documento funcional vivo acumulativo sprint a sprint.",{x:0.4,y:0.72,w:9.2,h:0.48,fontSize:11,color:DARKGREY,fontFace:"Arial"});
[{title:"🏦 Banca Retail",color:NAVY2,items:["Cuentas · Tarjetas · Hipotecas","SEPA SCT / SDD / Instant","PSD2 SCA · PCI DSS v4","Bizum · Notificaciones Push","GDPR · Domiciliaciones SEPA"]},{title:"🏢 Banca Minorista (PYME)",color:TEAL,items:["Líneas de crédito · Factoring","Confirming · Descuento comercial","TPV físico y virtual","PSD2 Art.77/80 derechos deudor","Factura electrónica · ICO/BEI"]},{title:"🏛️ Banca Mayorista",color:SLATE,items:["Cash Management · Cash Pooling","Trade Finance · L/C SBLC","SWIFT gpi · ISO 20022 MX","Derivados IRS/FX · EMIR reporting","Basilea III · LCR · NSFR"]}].forEach((seg,i)=>{const sx=0.3+i*3.18;s.addShape(pres.shapes.RECTANGLE,{x:sx,y:1.28,w:2.98,h:3.48,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});s.addShape(pres.shapes.RECTANGLE,{x:sx,y:1.28,w:2.98,h:0.32,fill:{color:seg.color},line:{color:seg.color,width:0}});s.addText(seg.title,{x:sx+0.1,y:1.28,w:2.8,h:0.32,fontSize:10,bold:true,color:WHITE,fontFace:"Arial",valign:"middle"});seg.items.forEach((item,j)=>s.addText("▸  "+item,{x:sx+0.12,y:1.68+j*0.5,w:2.74,h:0.44,fontSize:9.5,color:DARKGREY,fontFace:"Arial"}));});
[{val:"52",label:"Funcionalidades\ndocumentadas",color:ORANGE},{val:"86",label:"Reglas de\nnegocio",color:TEAL},{val:"14",label:"Módulos\nbancarios",color:SLATE},{val:"16",label:"Sprints\nconsolidados",color:NAVY2}].forEach((m,i)=>{const mx=0.3+i*2.38;s.addShape(pres.shapes.RECTANGLE,{x:mx,y:4.85,w:2.15,h:0.62,fill:{color:m.color},line:{color:m.color,width:0}});s.addText(m.val,{x:mx,y:4.85,w:0.65,h:0.62,fontSize:22,bold:true,color:WHITE,fontFace:"Arial Black",align:"center",valign:"middle"});s.addText(m.label,{x:mx+0.65,y:4.85,w:1.5,h:0.62,fontSize:8.5,color:WHITE,fontFace:"Arial",align:"left",valign:"middle"});});}

// SLIDE 7 — RESULTADOS
{const s=pres.addSlide();lightBg(s);addLightTitle(s,"Resultados reales: BankPortal en producción");
s.addText("18 sprints completados · 24 SP/sprint · CMMI Nivel 3 verificado · v1.18.0 · Banco Meridian",{x:0.4,y:0.7,w:9.2,h:0.25,fontSize:10,color:MIDGREY,fontFace:"Arial",italic:true});
statBox(s,0.28,1.02,1.72,1.42,"18","Sprints","completados",NAVY2);
statBox(s,2.08,1.02,1.72,1.42,"100%","Completado","SP por sprint",SUCCESS);
statBox(s,3.88,1.02,1.72,1.42,"0","Defectos","Sprint 18",ORANGE);
statBox(s,5.68,1.02,1.72,1.42,"677","Tests","automatizados",TEAL);
statBox(s,7.48,1.02,1.72,1.42,"86%","Cobertura","código",SLATE);
s.addText("Velocidad por sprint (Story Points)",{x:0.3,y:2.56,w:4.8,h:0.25,fontSize:9.5,bold:true,color:DARKGREY,fontFace:"Arial"});
s.addChart(pres.charts.BAR,[{name:"SP",labels:["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S12","S13","S14","S15","S16","S17","S18"],values:[22,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24]}],{x:0.28,y:2.82,w:5.8,h:2.5,barDir:"col",chartColors:[NAVY2],chartArea:{fill:{color:WHITE},roundedCorners:false},catAxisLabelColor:MIDGREY,valAxisLabelColor:MIDGREY,valGridLine:{color:LIGHTGREY,size:0.5},catGridLine:{style:"none"},showValue:true,dataLabelColor:NAVY2,showLegend:false,valAxisMinVal:20,valAxisMaxVal:25});
[{val:"425 SP",label:"Acumulados",color:ORANGE},{val:"23.6",label:"SP / sprint",color:TEAL},{val:"0 CVE",label:"Críticos",color:SUCCESS},{val:"v1.18",label:"Versión",color:SLATE}].forEach((e,i)=>{const ey=2.82+i*0.64;s.addShape(pres.shapes.RECTANGLE,{x:6.3,y:ey,w:3.4,h:0.56,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});s.addShape(pres.shapes.RECTANGLE,{x:6.3,y:ey,w:0.08,h:0.56,fill:{color:e.color},line:{color:e.color,width:0}});s.addText(e.val,{x:6.45,y:ey,w:1.5,h:0.56,fontSize:20,bold:true,color:e.color,fontFace:"Arial Black",valign:"middle"});s.addText(e.label,{x:7.95,y:ey,w:1.7,h:0.56,fontSize:11,color:DARKGREY,fontFace:"Arial",valign:"middle"});});}

// SLIDE 8 — QUÉ GANA EXPERIS
{const s=pres.addSlide();lightBg(s);addLightTitle(s,"¿Qué gana Experis con XFORGE?");
s.addText("Ventajas competitivas reales para el negocio de consultoría tecnológica",{x:0.4,y:0.68,w:9.2,h:0.24,fontSize:10,color:MIDGREY,fontFace:"Arial",italic:true});
[{icon:"⚡",title:"Rapidez de entrega",text:"Arranque de proyecto en horas, no en semanas. Menor time-to-market para los clientes.",color:ORANGE},{icon:"📈",title:"Mayor margen",text:"Reducción del coste de producción en un 40-60%. El equipo humano se enfoca en valor, no en tareas.",color:TEAL},{icon:"🏆",title:"Calidad garantizada",text:"CMMI Nivel 3 nativo. Cada proyecto sigue los mismos estándares de calidad sin variación.",color:"6D3FA0"},{icon:"💎",title:"Diferenciación clara",text:"Una factoría de software con IA es una propuesta única en el mercado de consultoría IT.",color:SLATE},{icon:"🔄",title:"Escalabilidad",text:"XFORGE gestiona múltiples proyectos en paralelo sin degradar la calidad ni los plazos.",color:NAVY2},{icon:"⭐",title:"Experiencia cliente",text:"El cliente recibe documentación profesional completa, dashboards y trazabilidad total.",color:"8B1A1A"}].forEach((b,i)=>{const bx=0.3+(i%3)*3.18,by=1.05+Math.floor(i/3)*2.15;s.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:2.98,h:1.95,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});s.addShape(pres.shapes.RECTANGLE,{x:bx,y:by,w:0.08,h:1.95,fill:{color:b.color},line:{color:b.color,width:0}});s.addText(b.icon+"  "+b.title,{x:bx+0.18,y:by+0.12,w:2.7,h:0.4,fontSize:11,bold:true,color:DARKGREY,fontFace:"Arial"});s.addText(b.text,{x:bx+0.18,y:by+0.58,w:2.7,h:1.2,fontSize:9.5,color:MIDGREY,fontFace:"Arial"});});}

// SLIDE 9 — ANTES vs DESPUÉS
{const s=pres.addSlide();lightBg(s);addLightTitle(s,"Antes vs. Después: el impacto en el día a día");
s.addShape(pres.shapes.RECTANGLE,{x:0.3,y:0.73,w:4.3,h:4.6,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});
s.addShape(pres.shapes.RECTANGLE,{x:0.3,y:0.73,w:4.3,h:0.35,fill:{color:"7B2227"},line:{color:"7B2227",width:0}});
s.addText("SIN XFORGE",{x:0.3,y:0.73,w:4.3,h:0.35,fontSize:12,bold:true,color:WHITE,align:"center",fontFace:"Arial",valign:"middle"});
s.addShape(pres.shapes.RECTANGLE,{x:5.4,y:0.73,w:4.3,h:4.6,fill:{color:WHITE},line:{color:LIGHTGREY,width:1},shadow:makeShadow()});
s.addShape(pres.shapes.RECTANGLE,{x:5.4,y:0.73,w:4.3,h:0.35,fill:{color:TEAL},line:{color:TEAL,width:0}});
s.addText("CON XFORGE",{x:5.4,y:0.73,w:4.3,h:0.35,fontSize:12,bold:true,color:WHITE,align:"center",fontFace:"Arial",valign:"middle"});
s.addShape(pres.shapes.OVAL,{x:4.38,y:2.65,w:1.24,h:0.75,fill:{color:ORANGE},line:{color:ORANGE,width:0}});
s.addText("VS",{x:4.38,y:2.65,w:1.24,h:0.75,fontSize:18,bold:true,color:WHITE,fontFace:"Arial Black",align:"center",valign:"middle"});
["Arranque de proyecto: 2-4 semanas","Documentación: 8-15h por entregable","Calidad variable según el consultor","Difícil cumplir CMMI sin auditor","Gestión de riesgos manual y reactiva","Reportes tardíos e inconsistentes","Sin trazabilidad en Jira/Confluence"].forEach((t,i)=>s.addText("✗  "+t,{x:0.45,y:1.18+i*0.46,w:4.0,h:0.4,fontSize:9.5,color:"7B2227",fontFace:"Arial"}));
["Arranque de proyecto: 2-4 horas","Documentación generada automáticamente","Calidad uniforme, estándar en todos los proyectos","CMMI Nivel 3 nativo y verificado en cada sprint","Registro de riesgos automático, proactivo","Reportes en tiempo real, listos para el cliente","Sync automático Jira + Confluence en cada gate"].forEach((t,i)=>s.addText("✔  "+t,{x:5.55,y:1.18+i*0.46,w:4.0,h:0.4,fontSize:9.5,color:TEAL,fontFace:"Arial"}));}

// SLIDE 10 — ROADMAP
{const s=pres.addSlide();lightBg(s);addLightTitle(s,"Estado actual y próximos pasos");
s.addShape(pres.shapes.LINE,{x:0.6,y:2.62,w:8.8,h:0,line:{color:LIGHTGREY,width:2}});
[{x:0.6,date:"Nov 2025",ver:"v1.0",label:"Sistema base\n10 skills",status:"done"},{x:2.5,date:"Dic 2025",ver:"v1.1",label:"Agente Docs\n15 skills",status:"done"},{x:4.35,date:"Ene 2026",ver:"v1.9",label:"19 agentes\nAtlassian sync",status:"done"},{x:5.95,date:"Mar 2026",ver:"v2.2",label:"20 agentes\nFA Agent + Jenkins",status:"current"},{x:7.65,date:"Jun 2026",ver:"v3.0",label:"Multi-cliente\nDashboard exec.",status:"planned"},{x:9.1,date:"Dic 2026",ver:"v4.0",label:"Marketplace\nhabilidades",status:"planned"}].forEach(m=>{const dc=m.status==="current"?ORANGE:(m.status==="done"?TEAL:MIDGREY);s.addShape(pres.shapes.OVAL,{x:m.x-0.14,y:2.48,w:0.28,h:0.28,fill:{color:dc},line:{color:dc,width:0}});s.addText(m.ver,{x:m.x-0.6,y:1.55,w:1.2,h:0.3,fontSize:12,bold:true,color:dc,fontFace:"Arial Black",align:"center"});s.addText(m.date,{x:m.x-0.6,y:1.88,w:1.2,h:0.22,fontSize:8.5,color:MIDGREY,fontFace:"Arial",align:"center"});s.addShape(pres.shapes.RECTANGLE,{x:m.x-0.42,y:2.18,w:0.84,h:0.22,fill:{color:dc},line:{color:dc,width:0}});s.addText(m.status==="current"?"Actual":(m.status==="done"?"Completado":"Planificado"),{x:m.x-0.42,y:2.18,w:0.84,h:0.22,fontSize:7,bold:true,color:WHITE,align:"center",fontFace:"Arial",valign:"middle"});s.addText(m.label,{x:m.x-0.6,y:2.85,w:1.2,h:0.55,fontSize:8,color:DARKGREY,fontFace:"Arial",align:"center"});});
s.addShape(pres.shapes.RECTANGLE,{x:0.3,y:3.58,w:9.4,h:1.7,fill:{color:"FFF7ED"},line:{color:AMBER,width:1}});
s.addText("Próximas acciones inmediatas:",{x:0.5,y:3.65,w:4,h:0.3,fontSize:11,bold:true,color:ORANGE,fontFace:"Arial"});
["→  Desplegar XFORGE en el primer proyecto de cliente real (Sprint 19 – Q2 2026)","→  Activar Dashboard ejecutivo para seguimiento en tiempo real por parte de dirección","→  Evaluar expansión a 2 proyectos en paralelo con el equipo actual","→  Completar FEAT-017 Domiciliaciones SEPA (Sprint 19 activo)"].forEach((a,i)=>s.addText(a,{x:0.5,y:4.0+i*0.3,w:9.0,h:0.27,fontSize:9.5,color:DARKGREY,fontFace:"Arial"}));}

// SLIDE 11 — CIERRE
{const s=pres.addSlide();darkBg(s);
s.addShape(pres.shapes.OVAL,{x:6.5,y:0.8,w:4.5,h:4.5,fill:{color:SLATE,transparency:75},line:{color:SLATE,width:0}});
s.addShape(pres.shapes.OVAL,{x:7.6,y:1.8,w:2.8,h:2.8,fill:{color:TEAL,transparency:78},line:{color:TEAL,width:0}});
s.addText(">XFORGE",{x:5.5,y:1.0,w:4.2,h:2.5,fontSize:46,bold:true,color:WHITE,fontFace:"Arial Black",align:"center",margin:0});
s.addText("SOFIA by Experis",{x:5.5,y:3.4,w:4.2,h:0.4,fontSize:14,color:LIGHTGREY,fontFace:"Arial",align:"center"});
s.addText("ManpowerGroup",{x:5.5,y:3.8,w:4.2,h:0.3,fontSize:10,color:MIDGREY,fontFace:"Arial",align:"center"});
s.addShape(pres.shapes.RECTANGLE,{x:0.4,y:0.9,w:0.1,h:2.0,fill:{color:ORANGE},line:{color:ORANGE,width:0}});
s.addText("XFORGE está lista.",{x:0.65,y:0.85,w:5.5,h:1.2,fontSize:44,bold:true,color:WHITE,fontFace:"Arial Black",margin:0});
s.addText("Forge faster. Deliver stronger.",{x:0.65,y:2.05,w:5.5,h:0.5,fontSize:18,italic:true,color:ORANGE,fontFace:"Arial",margin:0});
s.addText("Experis tiene la oportunidad de convertir XFORGE en su ventaja competitiva diferencial en el mercado de consultoría tecnológica. Una factoría de 20 agentes que entrega con calidad, rapidez y documentación CMMI Nivel 3 en cada proyecto.",{x:0.65,y:2.7,w:5.5,h:1.2,fontSize:11,color:LIGHTGREY,fontFace:"Arial",margin:0});
s.addShape(pres.shapes.RECTANGLE,{x:0.65,y:4.1,w:2.8,h:0.45,fill:{color:ORANGE},line:{color:ORANGE,width:0}});
s.addText("Solicitar demostración en vivo",{x:0.65,y:4.1,w:2.8,h:0.45,fontSize:11,bold:true,color:WHITE,align:"center",fontFace:"Arial",valign:"middle"});
s.addText("XFORGE v2.2 · 20 agentes · 13 pasos pipeline · BankPortal S18 · Powered by Experis · 2026",{x:0,y:5.32,w:10,h:0.22,fontSize:7.5,color:MIDGREY,align:"center",fontFace:"Arial"});}

pres.writeFile({fileName:"docs/pitch/XFORGE_Experis_v2.2.pptx"})
  .then(()=>console.log("✅ XFORGE_Experis_v2.2.pptx persistido en docs/pitch/"))
  .catch(e=>{console.error("❌",e.message);process.exit(1);});
