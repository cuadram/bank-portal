# Dashboard Global de Proyecto — SOFIA v2.0
# Especificación para actualización automática cada cierre de sprint

## Qué es y para qué sirve

El dashboard es un artefacto React (`docs/dashboard/project-dashboard.jsx`) que
se genera/actualiza al cierre de cada sprint (Step 8 o Step 9).

Su propósito es **facilitar decisiones**, no solo reportar estado. Cada sección
responde a una pregunta concreta:

| Sección | Pregunta que responde |
|---|---|
| Semáforo global | ¿Puede el proyecto ir a producción esta semana? |
| KPIs | ¿La velocidad y calidad son sostenibles? |
| Acciones requeridas | ¿Qué necesita una decisión AHORA? |
| Velocity chart | ¿Hay anomalías en la entrega? |
| Deuda técnica | ¿Cuánto SP compromete el sprint siguiente? |
| Riesgos activos | ¿Qué puede bloquear el próximo sprint? |
| CMMI compliance | ¿Estamos cubiertos para una auditoría? |
| Roadmap + Decisiones | ¿Qué decidir en el próximo planning? |

---

## Cuándo actualizar

El Documentation Agent actualiza el dashboard en:
- **Step 8** (cierre sprint): actualizar TODOS los datos
- **Step 3b** (post-arquitectura): actualizar solo sección roadmap si hay cambios
- **On-demand**: cuando el usuario o Orchestrator lo solicita

---

## Datos a actualizar en cada sprint

### 1. Array SPRINTS — añadir fila del sprint cerrado

```javascript
{ s: N, sp: SP_ENTREGADOS, feat: "FEAT-XXX", titulo: "Titulo feature",
  rel: "vX.Y.Z", tests: TESTS_ACUMULADOS, cov: COBERTURA_PCT, ncs: NCS_CR, acum: SP_ACUMULADOS }
```

Fuente: `docs/sprints/SPRINT-0NN-report.md` → sección Métricas de calidad

### 2. Array DEBT_ACTIVA — sincronizar con deuda técnica del sprint

```javascript
{ id:"DEBT-XXX", desc:"...", area:"Backend|Security|Arch|Compliance",
  pri:"URGENTE|Media|Baja", sprint:N, cvss:"X.X" }
```

Fuente: `docs/sprints/SPRINT-0NN-report.md` → sección Deuda técnica
- Eliminar las DEBTs cerradas en el sprint que se cierra
- Agregar las DEBTs nuevas generadas

### 3. Array RIESGOS_ACTIVOS — sincronizar con Risk Register

```javascript
{ id:"R-0NN-NN", desc:"...", prob:"Alta|Media|Baja", imp:"Alta|Media|Baja",
  niv:3|2|1, estado:"Mitigando|Aceptado|Planificado|Cerrado", sprint:N }
```

Fuente: `docs/sprints/SPRINT-0NN-report.md` → sección Riesgos
- Eliminar riesgos con estado "Cerrado"

### 4. Array ROADMAP — actualizar próximos sprints

```javascript
{ sprint:N, feat:"FEAT-XXX", estado:"Planificación|Backlog",
  sp:24, desc:"...", pri:"MUST|SHOULD|TBD" }
```

### 5. Sección "Acciones requeridas" — derivar de deuda + riesgos

Reglas para generar las acciones:
- URGENTE: cualquier DEBT con CVSS > 4.0 o riesgo nivel 3 activo
- IMPORTANTE: riesgos nivel 2 sin plan de prueba
- PLANIFICAR: features sin definir en próximo sprint
- PENDIENTE: tareas administrativas (deliverables, documentación)

### 6. Constantes de resumen

```javascript
const TOTAL_SP = SPRINTS.reduce((a,s)=>a+s.sp,0);
const AVG = (TOTAL_SP / SPRINTS.length).toFixed(1);
const LAST = SPRINTS[SPRINTS.length-1];
```

### 7. Header — sprint y release actuales

```html
Sprint N · FEAT-XXX · vX.Y.Z · Completado YYYY-MM-DD
```

### 8. Semáforo global RAG

| Color | Condición |
|---|---|
| VERDE | 0 defectos + 0 CVEs críticos + velocidad > 20 SP + cobertura >= 80% |
| AMARILLO | Velocidad < 20 SP O cobertura < 80% O riesgo nivel 3 abierto sin plan |
| ROJO | Defectos en producción O CVE crítico abierto O sprint goal no cumplido |

---

## Ruta del archivo

```
docs/dashboard/
├── project-dashboard.jsx    ← artifact React principal
├── project-dashboard.html   ← versión standalone para cliente
└── dashboard-data.json      ← datos separados (opcional, para automatización)
```

---

## Instrucción de generación

Cuando el Documentation Agent genere o actualice el dashboard:

1. Leer `docs/sprints/SPRINT-0NN-report.md` (sprint cerrado)
2. Leer `docs/sprints/risk-register-bankportal.md` (riesgos actuales)
3. Actualizar los arrays SPRINTS, DEBT_ACTIVA, RIESGOS_ACTIVOS, ROADMAP
4. Recalcular TOTAL_SP, AVG, LAST
5. Derivar las "Acciones requeridas" según reglas RAG
6. Actualizar header + semáforo
7. Escribir `docs/dashboard/project-dashboard.jsx`
8. Registrar en session.json: `artifacts.dashboard = "docs/dashboard/project-dashboard.jsx"`

---

## Mensaje al usuario tras actualizar

```markdown
## 📊 Dashboard actualizado — Sprint NN

**Semáforo:** [VERDE/AMARILLO/ROJO]
**SP acumulados:** NNN · **Velocidad:** NN.N SP/sprint
**Deuda activa:** N items · **Riesgos activos:** N items

Acciones que requieren decisión:
- [lista de 2-4 acciones más urgentes]

Archivo: docs/dashboard/project-dashboard.jsx
```
