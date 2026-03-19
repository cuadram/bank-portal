#!/usr/bin/env python3
"""
SOFIA v1.7 — sofia-dashboard.py (US-1001) — fixed Python 3.12
"""
import os, sys, json, re, datetime
from collections import defaultdict

REPO    = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/proyectos/bank-portal")
LOG     = os.path.join(REPO, ".sofia", "sofia.log")
SESSION = os.path.join(REPO, ".sofia", "session.json")
OUT_DIR = os.path.join(REPO, "docs", "quality")
OUT     = os.path.join(OUT_DIR, "sofia-metrics.html")
os.makedirs(OUT_DIR, exist_ok=True)

ENTRY_RE = re.compile(
    r'^\[(?P<ts>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\]\s+'
    r'\[(?P<step>[^\]]+)\]\s+\[(?P<skill>[^\]]+)\]\s+'
    r'(?P<status>\w+)\s*→\s*(?P<detail>.+)$'
)
entries = []
if os.path.isfile(LOG):
    for line in open(LOG, encoding="utf-8", errors="ignore"):
        m = ENTRY_RE.match(line.strip())
        if m: entries.append(m.groupdict())

session = {}
if os.path.isfile(SESSION):
    try: session = json.load(open(SESSION))
    except: pass

skill_counts  = defaultdict(lambda: {"completed":0,"errors":0,"total_ms":0})
step_times    = defaultdict(list)
status_counts = defaultdict(int)
gate_results  = {"approved":0,"rejected":0,"pending":0,"blocked":0}
errors = []; started = {}

for e in entries:
    st,skill,step,ts = e["status"],e["skill"],e["step"],e["ts"]
    status_counts[st] += 1
    if st == "STARTED":
        started[(step,skill)] = ts
    elif st == "COMPLETED":
        skill_counts[skill]["completed"] += 1
        key = (step,skill)
        if key in started:
            try:
                t1 = datetime.datetime.strptime(started[key],"%Y-%m-%dT%H:%M:%SZ")
                t2 = datetime.datetime.strptime(ts,"%Y-%m-%dT%H:%M:%SZ")
                ms = int((t2-t1).total_seconds()*1000)
                if ms>=0: step_times[step].append(ms); skill_counts[skill]["total_ms"]+=ms
            except: pass
    elif st == "ERROR":
        skill_counts[skill]["errors"] += 1; errors.append(e)
    elif st == "GATE_APPROVED": gate_results["approved"]+=1
    elif st == "GATE_REJECTED": gate_results["rejected"]+=1
    elif st == "GATE_PENDING":  gate_results["pending"]+=1
    elif st == "GATE_BLOCKED":  gate_results["blocked"]+=1

total_done  = status_counts.get("COMPLETED",0)
total_err   = status_counts.get("ERROR",0)
success_rate = round(total_done/max(total_done+total_err,1)*100,1)
total_gates  = sum(gate_results.values())
gate_pct     = round(gate_results["approved"]/max(total_gates,1)*100,1)

skill_names = list(skill_counts.keys())[:12]
skill_done  = [skill_counts[s]["completed"] for s in skill_names]
skill_errs  = [skill_counts[s]["errors"]    for s in skill_names]

STEP_ORD = ["1","2","3","3b","4","5","5b","6","7","8","9"]
step_avg  = [round(sum(step_times.get(s,[]))/len(step_times[s])/1000,1) if step_times.get(s) else 0 for s in STEP_ORD]
step_colors = ["#185FA5" if t==0 else "#3B6D11" if t<60 else "#BA7517" if t<300 else "#A32D2D" for t in step_avg]

now_str   = datetime.datetime.now(datetime.timezone.utc).strftime("%d/%m/%Y %H:%M UTC")
now_ts    = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
project   = session.get("project") or "bank-portal"
sprint    = session.get("sprint")  or "—"
pip_status= session.get("status")  or "idle"
sec       = session.get("security",{})
cve_crit  = sec.get("cve_critical",0)
semaphore = sec.get("semaphore") or "—"

def kpi_cl(v,good,med): return "green" if v>=good else "amber" if v>=med else "red"

STATUS_COLORS = {
    "COMPLETED":"#3B6D11","ERROR":"#A32D2D","STARTED":"#185FA5",
    "GATE_APPROVED":"#2d6a1f","GATE_REJECTED":"#a01010","GATE_PENDING":"#BA7517",
    "GATE_BLOCKED":"#D85A30","PATCH":"#888780","AUDIT":"#9ca3af",
    "INIT":"#6b7280","COMMIT":"#b0b0a8","RESUME":"#a0a098","DASHBOARD":"#c0bfb8","SYNC":"#7090b0",
}
FALLBACK = ["#185FA5","#3B6D11","#BA7517","#A32D2D","#888780","#6b7280","#9ca3af"]
st_labels = list(status_counts.keys())
st_values = list(status_counts.values())
st_colors = [STATUS_COLORS.get(k,FALLBACK[i%len(FALLBACK)]) for i,k in enumerate(st_labels)]

# ── Bloques HTML ──────────────────────────────────────────────────────────────
CMMI_DATA = [
    ("REQM — Gestión requisitos",   85,"#185FA5"),
    ("PP   — Planificación",        80,"#185FA5"),
    ("PMC  — Monitorización",       65,"#EF9F27"),
    ("MA   — Medición y análisis",  50,"#EF9F27"),
    ("PPQA — Calidad proceso",      75,"#185FA5"),
    ("CM   — Config. management",   70,"#185FA5"),
    ("DAR  — Análisis decisiones",  55,"#EF9F27"),
]
cmmi_html = ""
for name,pct,color in CMMI_DATA:
    cmmi_html += (
        '<div class="cmmi-row">'
        f'<div class="cmmi-name">{name}</div>'
        '<div class="cmmi-bar-wrap">'
        f'<div class="cmmi-bar" style="width:{pct}%;background:{color}"></div>'
        '</div>'
        f'<div class="cmmi-pct">{pct}%</div>'
        '</div>\n'
    )

def badge(st):
    cls = "ok" if st=="COMPLETED" else "err" if st=="ERROR" else "warn" if "GATE" in st else "info"
    return f'<span class="badge {cls}">{st}</span>'

log_rows = ""
for e in reversed(entries[-20:]):
    det = e["detail"][:60]+("…" if len(e["detail"])>60 else "")
    log_rows += (
        f'<tr>'
        f'<td style="color:#888;font-size:11px">{e["ts"]}</td>'
        f'<td>{badge("info"[0:0]+e["step"])}</td>'
        f'<td style="font-size:12px">{e["skill"]}</td>'
        f'<td>{badge(e["status"])}</td>'
        f'<td style="color:#555;font-size:11px">{det}</td>'
        f'</tr>\n'
    )

# step badge simple
log_rows2 = ""
for e in reversed(entries[-20:]):
    det = e["detail"][:60]+("…" if len(e["detail"])>60 else "")
    log_rows2 += (
        '<tr>'
        f'<td style="color:#888;font-size:11px">{e["ts"]}</td>'
        f'<td><span class="badge info">{e["step"]}</span></td>'
        f'<td style="font-size:12px">{e["skill"]}</td>'
        f'<td>{badge(e["status"])}</td>'
        f'<td style="color:#555;font-size:11px">{det}</td>'
        '</tr>\n'
    )

err_html = ""
if errors:
    err_rows = ""
    for e in errors:
        err_rows += (
            '<tr>'
            f'<td style="color:#888;font-size:11px">{e["ts"]}</td>'
            f'<td>{e["step"]}</td><td>{e["skill"]}</td>'
            f'<td style="color:#a01010;font-size:11px">{e["detail"][:80]}</td>'
            '</tr>\n'
        )
    err_html = (
        '<div class="card" style="border-color:#fca5a5">'
        f'<h3 style="color:#a01010">Errores ({len(errors)})</h3>'
        '<table><thead><tr>'
        '<th>Timestamp</th><th>Step</th><th>Skill</th><th>Detalle</th>'
        f'</tr></thead><tbody>{err_rows}</tbody></table></div>'
    )

# ── HTML final ────────────────────────────────────────────────────────────────
html = (
"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SOFIA Dashboard — """ + project + """</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f0;color:#1a1a18;font-size:14px}
header{background:#1B3A6B;color:#fff;padding:20px 32px;display:flex;align-items:center;justify-content:space-between}
header h1{font-size:20px;font-weight:500}
.container{max-width:1200px;margin:0 auto;padding:24px 20px}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.metric{background:#fff;border:1px solid #e5e4df;border-radius:8px;padding:16px}
.metric .val{font-size:28px;font-weight:500;line-height:1}
.metric .lbl{font-size:12px;color:#888;margin-top:4px}
.metric .sub{font-size:11px;color:#aaa;margin-top:2px}
.metric.green .val{color:#2d6a1f}.metric.amber .val{color:#a05a00}
.metric.red .val{color:#a01010}.metric.blue .val{color:#1B3A6B}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.card{background:#fff;border:1px solid #e5e4df;border-radius:8px;padding:20px;margin-bottom:16px}
.card h3{font-size:12px;font-weight:500;color:#1B3A6B;margin-bottom:14px;text-transform:uppercase;letter-spacing:.5px}
.chart-wrap{position:relative;width:100%;height:220px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{padding:6px 10px;text-align:left;color:#888;border-bottom:1px solid #e5e4df;font-weight:500}
td{padding:7px 10px;border-bottom:1px solid #f0efea;vertical-align:middle}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;padding:1px 7px;border-radius:8px;font-size:11px;font-weight:500}
.badge.ok{background:#e6f3df;color:#2d6a1f}.badge.warn{background:#fff3dc;color:#a05a00}
.badge.err{background:#fde8e8;color:#a01010}.badge.info{background:#e6eef8;color:#1B3A6B}
.cmmi-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0efea}
.cmmi-row:last-child{border-bottom:none}
.cmmi-name{font-size:12px;color:#555;width:220px;flex-shrink:0;font-family:monospace}
.cmmi-bar-wrap{flex:1;height:8px;background:#e5e4df;border-radius:4px;overflow:hidden}
.cmmi-bar{height:100%;border-radius:4px}
.cmmi-pct{font-size:11px;color:#888;width:36px;text-align:right}
.footer{text-align:center;padding:20px;font-size:11px;color:#aaa}
</style>
</head>
<body>
<header>
  <div>
    <h1>SOFIA Dashboard — """ + project + """</h1>
    <div style="font-size:12px;opacity:.75;margin-top:2px">Métricas CMMI MA · Sprint """ + str(sprint) + " · " + now_str + """</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:13px">Pipeline: <strong>""" + pip_status + """</strong></div>
    <div style="font-size:11px;opacity:.75">Security: """ + semaphore + " · CVE críticos: " + str(cve_crit) + """</div>
  </div>
</header>
<div class="container">
  <div class="metrics">
    <div class="metric """ + kpi_cl(success_rate,90,70) + """">
      <div class="val">""" + str(success_rate) + """%</div>
      <div class="lbl">Tasa de éxito del pipeline</div>
      <div class="sub">""" + str(total_done) + " completados · " + str(total_err) + """ errores</div>
    </div>
    <div class="metric """ + kpi_cl(gate_pct,90,70) + """">
      <div class="val">""" + str(gate_pct) + """%</div>
      <div class="lbl">Tasa aprobación gates</div>
      <div class="sub">""" + str(gate_results['approved']) + " aprobados · " + str(gate_results['rejected']) + """ rechazados</div>
    </div>
    <div class="metric blue">
      <div class="val">""" + str(len(entries)) + """</div>
      <div class="lbl">Entradas en sofia.log</div>
      <div class="sub">""" + str(len(skill_counts)) + """ skills activos</div>
    </div>
    <div class="metric """ + ("green" if cve_crit==0 else "red") + """">
      <div class="val">""" + str(cve_crit) + """</div>
      <div class="lbl">CVEs críticos activos</div>
      <div class="sub">Semáforo: """ + semaphore + """</div>
    </div>
  </div>
  <div class="grid2">
    <div class="card"><h3>Actividad por skill</h3>
      <div class="chart-wrap"><canvas id="skillChart"></canvas></div></div>
    <div class="card"><h3>Tiempo medio por step (segundos)</h3>
      <div class="chart-wrap"><canvas id="stepTimeChart"></canvas></div></div>
  </div>
  <div class="grid2">
    <div class="card"><h3>Distribución de estados</h3>
      <div class="chart-wrap"><canvas id="statusChart"></canvas></div></div>
    <div class="card"><h3>Gates — resultado acumulado</h3>
      <div class="chart-wrap"><canvas id="gateChart"></canvas></div></div>
  </div>
  <div class="card"><h3>Madurez CMMI Nivel 3</h3>""" + cmmi_html + """</div>
  <div class="card"><h3>Últimas 20 entradas del log</h3>
    <table><thead><tr>
      <th>Timestamp</th><th>Step</th><th>Skill</th><th>Estado</th><th>Detalle</th>
    </tr></thead><tbody>""" + log_rows2 + """</tbody></table></div>
  """ + err_html + """
</div>
<div class="footer">SOFIA v1.7 Dashboard · """ + now_str + """ · Evidencia CMMI MA válida</div>
<script>
const B='#185FA5',A='#BA7517',G='#3B6D11',R='#A32D2D';
new Chart(document.getElementById('skillChart'),{type:'bar',data:{labels:""" + json.dumps(skill_names) + """,datasets:[{label:'Completados',data:""" + json.dumps(skill_done) + """,backgroundColor:B},{label:'Errores',data:""" + json.dumps(skill_errs) + """,backgroundColor:R}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11}}}},scales:{x:{ticks:{font:{size:10},maxRotation:45}},y:{beginAtZero:true}}}});
new Chart(document.getElementById('stepTimeChart'),{type:'bar',data:{labels:['S1','S2','S3','S3b','S4','S5','S5b','S6','S7','S8','S9'],datasets:[{label:'s',data:""" + json.dumps(step_avg) + """,backgroundColor:""" + json.dumps(step_colors) + """,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{font:{size:11}}},y:{beginAtZero:true}}}});
new Chart(document.getElementById('statusChart'),{type:'doughnut',data:{labels:""" + json.dumps(st_labels) + """,datasets:[{data:""" + json.dumps(st_values) + """,backgroundColor:""" + json.dumps(st_colors) + """}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:10},padding:8}}}}});
new Chart(document.getElementById('gateChart'),{type:'bar',data:{labels:['Aprobados','Rechazados','Pendientes','Bloqueados'],datasets:[{data:[""" + str(gate_results['approved']) + "," + str(gate_results['rejected']) + "," + str(gate_results['pending']) + "," + str(gate_results['blocked']) + """],backgroundColor:[G,R,A,'#D85A30'],borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
</script>
</body></html>"""
)

with open(OUT,"w",encoding="utf-8") as f: f.write(html)

if os.path.isfile(LOG):
    with open(LOG,"a") as f:
        f.write(f"[{now_ts}] [DASHBOARD] [sofia-dashboard.py] COMPLETED → {OUT} | {len(entries)} entradas\n")

print(f"\n  ✅ Dashboard generado: {OUT}")
print(f"  📊 {len(entries)} entradas · {len(skill_counts)} skills · {total_done} completados")
print(f"  📁 open \"{OUT}\"\n")
