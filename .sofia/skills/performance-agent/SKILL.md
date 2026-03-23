# Performance Agent — SOFIA Software Factory v1.7
# Agente especializado en performance testing — Skill #19

Genera scripts de performance testing y el Performance Test Report.
Se activa en el pipeline como **step opcional** entre QA (step 6) y DevOps (step 7),
configurable en `sofia-config.json.pipeline.optional_steps.performance`.

También se activa si el usuario dice: "performance test", "pruebas de carga",
"JMeter", "Gatling", "SLA", "tiempo de respuesta", "throughput", "stress test",
"carga del sistema", "p95", "p99".

---

## Posición en el pipeline (cuando está activo)

```
[6]  QA Tester    → Gate aprobado
[6b] Performance Agent → JMeter plan + PerformanceReport.docx
[7]  DevOps       → Pipeline CI/CD
```

El step 6b es **no bloqueante por defecto** — el pipeline continúa salvo que
los resultados superen los umbrales críticos definidos en los SLAs.

---

## Entradas requeridas

El Performance Agent necesita del contexto del pipeline:
- OpenAPI spec del servicio (de `docs/architecture/` o `src/`)
- SLAs definidos (si no existen, el agente los propone)
- Stack del servicio (de `sofia-config.json`)
- Entorno de test (URL del servicio en staging/QA)

---

## Análisis a ejecutar

### 1. Definir SLAs

Si no hay SLAs previos, proponer los siguientes estándares para servicios bancarios:

```
Endpoints críticos (autenticación, transacciones):
  · p95 tiempo de respuesta < 500ms
  · p99 tiempo de respuesta < 1000ms
  · Throughput mínimo: 100 req/s
  · Tasa de error < 0.1%

Endpoints no críticos (consultas, reporting):
  · p95 tiempo de respuesta < 1000ms
  · p99 tiempo de respuesta < 2000ms
  · Throughput mínimo: 50 req/s
  · Tasa de error < 0.5%

Carga sostenida (30 min):
  · Sin degradación de p95 > 20% entre minuto 1 y minuto 30
  · Sin memory leaks (heap estable)
```

### 2. Generar JMeter Test Plan (.jmx)

Basándose en el OpenAPI spec, generar un test plan JMeter con:

```xml
<!-- Estructura del .jmx generado -->
<jmeterTestPlan>
  <hashTree>
    <TestPlan testname="[Proyecto] Performance Test — Sprint [N]">

      <!-- Thread Groups por escenario -->
      <ThreadGroup testname="Smoke Test — 1 usuario, 1 iteración">
        <!-- Verificar que los endpoints responden correctamente -->
      </ThreadGroup>

      <ThreadGroup testname="Load Test — 50 usuarios, 5 minutos">
        <!-- Carga normal de producción -->
        <stringProp name="ThreadGroup.num_threads">50</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
        <stringProp name="ThreadGroup.duration">300</stringProp>
      </ThreadGroup>

      <ThreadGroup testname="Stress Test — Ramp hasta 200 usuarios">
        <!-- Encontrar el punto de quiebre -->
        <stringProp name="ThreadGroup.num_threads">200</stringProp>
        <stringProp name="ThreadGroup.ramp_time">180</stringProp>
      </ThreadGroup>

      <ThreadGroup testname="Soak Test — 30 usuarios, 30 minutos">
        <!-- Detectar memory leaks y degradación -->
        <stringProp name="ThreadGroup.num_threads">30</stringProp>
        <stringProp name="ThreadGroup.duration">1800</stringProp>
      </ThreadGroup>

      <!-- Samplers por endpoint del OpenAPI -->
      <!-- Assertions de SLA -->
      <!-- Listeners: Summary Report, Response Time Graph -->
    </TestPlan>
  </hashTree>
</jmeterTestPlan>
```

Para cada endpoint del OpenAPI:
- Extraer path, method, parameters, request body schema
- Generar sampler HTTP con datos de ejemplo
- Añadir assertion de tiempo de respuesta según SLA del endpoint
- Añadir assertion de código de respuesta (2xx)

### 3. Generar Gatling simulation (alternativa)

Para proyectos con stack Scala/Maven, generar `PerformanceSimulation.scala`:

```scala
class PerformanceSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("[SERVICE_URL]")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")

  val loadScenario = scenario("Load Test")
    .exec(
      http("[ENDPOINT_NAME]")
        .post("[PATH]")
        .body(StringBody("""[REQUEST_BODY]"""))
        .check(status.is(200))
        .check(responseTimeInMillis.lte(500))
    )

  setUp(
    loadScenario.inject(
      rampUsers(50).during(60.seconds),
      constantUsersPerSec(10).during(300.seconds)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.percentile(95).lte(500),
     global.successfulRequests.percent.gte(99.9)
   )
}
```

---

## Output — PerformanceReport.docx

Generar con el `docx` npm package, estilo corporativo Experis:

```
PerformanceReport — [Proyecto] — Sprint [N] — [Feature FEAT-XXX]
Clasificación: CONFIDENCIAL — USO INTERNO

1. Resumen ejecutivo
   - Semáforo de performance (VERDE / AMARILLO / ROJO)
   - SLAs cumplidos vs incumplidos
   - Recomendación: Apto para producción / Requiere optimización / BLOQUEANTE

2. SLAs definidos
   Tabla: Endpoint | Métrica | Objetivo | Resultado | Estado

3. Resultados Load Test (50 usuarios)
   - p50, p75, p95, p99 por endpoint
   - Throughput (req/s)
   - Tasa de error
   - Gráfica: tiempo de respuesta vs tiempo

4. Resultados Stress Test
   - Punto de saturación (usuarios donde p95 supera SLA)
   - Comportamiento bajo carga extrema
   - ¿El sistema se recupera tras el pico?

5. Resultados Soak Test (30 min)
   - Tendencia de p95 a lo largo del tiempo
   - Consumo de memoria (si disponible)
   - Evidencia de ausencia de memory leaks

6. Cuellos de botella identificados
   - Endpoints más lentos
   - Queries lentas (si hay APM disponible)
   - Recomendaciones de optimización

7. Certificación de performance
   [ ] SLAs críticos cumplidos (p95 < 500ms)
   [ ] Tasa de error < 0.1%
   [ ] Sin memory leaks en soak test
   [ ] Sistema se recupera tras pico de carga
   Firma del QA Lead: _______________________
```

### Semáforo de performance

```
🟢 VERDE    → todos los SLAs críticos cumplidos → pipeline continúa
🟡 AMARILLO → SLAs no críticos incumplidos → pipeline continúa con advertencia
🔴 ROJO     → SLAs críticos incumplidos → consultar con tech-lead antes de continuar
```

---

## Archivos generados

```
docs/quality/
├── PerformanceReport-Sprint[N]-[FEAT-XXX].docx
└── performance/
    ├── [proyecto]-load-test.jmx          ← JMeter test plan
    ├── PerformanceSimulation.scala        ← Gatling (si aplica)
    └── slas-[FEAT-XXX].json              ← SLAs definidos (machine-readable)
```

---

## slas.json — Formato machine-readable

```json
{
  "feature": "FEAT-XXX",
  "sprint": 9,
  "generated_at": "2026-03-18T00:00:00Z",
  "slas": [
    {
      "endpoint": "POST /api/v1/auth/login",
      "tier": "critical",
      "p95_ms": 500,
      "p99_ms": 1000,
      "throughput_rps": 100,
      "error_rate_pct": 0.1
    }
  ],
  "results": {
    "load_test": {
      "users": 50,
      "duration_s": 300,
      "p95_ms": 320,
      "p99_ms": 580,
      "throughput_rps": 145,
      "error_rate_pct": 0.02,
      "status": "passed"
    }
  },
  "semaphore": "green",
  "gate_result": "passed"
}
```

---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '6b';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step      = step;
session.pipeline_step_name = 'performance-agent';
session.last_skill         = 'performance-agent';
session.last_skill_output_path = 'docs/quality/';
session.updated_at         = now;
if (!session.artifacts) session.artifacts = {};
session.artifacts[step] = [
  'docs/quality/PerformanceReport-Sprint[N]-[FEAT-XXX].docx',
  'docs/quality/performance/[proyecto]-load-test.jmx',
  'docs/quality/performance/slas-[FEAT-XXX].json'
];

// Añadir métricas de performance al session
session.performance = {
  semaphore: semaphoreValue,
  slas_passed: slasPassed,
  slas_failed: slasFailed,
  p95_ms: p95Result,
  throughput_rps: throughputResult,
  report_path: 'docs/quality/PerformanceReport-Sprint[N]-[FEAT-XXX].docx',
  tested_at: now
};

fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

const logEntry = `[${now}] [STEP-6b] [performance-agent] COMPLETED → docs/quality/ | SLAs: ${slasPassed} passed ${slasFailed} failed, semáforo: ${semaphoreValue}\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

const snapPath = `.sofia/snapshots/step-6b-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación

```
---
✅ PERSISTENCE CONFIRMED — PERFORMANCE_AGENT STEP-6b
- session.json: updated (step 6b added, performance metrics recorded)
- session.json.performance: semaphore=[COLOR], p95=[N]ms
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-6b-[timestamp].json
- artifacts:
  · docs/quality/PerformanceReport-Sprint[N]-[FEAT-XXX].docx
  · docs/quality/performance/[proyecto]-load-test.jmx
  · docs/quality/performance/slas-[FEAT-XXX].json
---
```
