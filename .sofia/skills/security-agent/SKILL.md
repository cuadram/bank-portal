# Security Agent — SOFIA Software Factory v1.6
# Agente especializado en análisis de seguridad — Skill #18

Ejecuta el análisis de seguridad completo del código generado por el Developer.
Se activa automáticamente en el pipeline en el **step 5b**, entre Code Reviewer
y QA. El Orchestrator lo invoca después de que el Code Reviewer haya dado el OK
y antes de que el QA Tester ejecute las pruebas funcionales.

También se activa si el usuario dice: "analiza la seguridad", "revisa
vulnerabilidades", "OWASP check", "escanea dependencias", "secrets scan",
"SAST", "CVE", "seguridad del código", "security report".

---

## Contexto SOFIA

- **Gobierno:** CMMI Nivel 3 — el Security Report es evidencia obligatoria
- **Stack soportado:** Java (Spring Boot), .Net (C#), Node.js (NestJS), Angular, React
- **Estándares aplicados:** OWASP Top 10, CWE Top 25, CERT-C/Java, CVSSv3.1
- **Output:** SecurityReport.docx con estilo corporativo Experis

---

## Posición en el pipeline

```
[5]  Code Reviewer  → OK (NCs resueltas)
[5b] Security Agent → SecurityReport.docx + gate si CVE críticos
[6]  QA Tester      → Plan de pruebas funcionales
```

**Gate bloqueante:** Si `cve_critical > 0` → pipeline NO avanza a QA.
El Developer debe remediar antes de continuar.

---

## Análisis a ejecutar

### 1. SAST — Análisis estático del código

Para cada stack, aplicar las siguientes comprobaciones sobre el código
generado en el step 4 (Developer):

#### Java / Spring Boot
```
Comprobaciones CERT-Java / CWE:
- CWE-89: SQL Injection → buscar concatenación directa en queries
- CWE-79: XSS → buscar ResponseBody sin sanitización
- CWE-611: XXE → buscar DocumentBuilderFactory sin setFeature
- CWE-502: Deserialization insegura → buscar ObjectInputStream
- CWE-327: Algoritmos débiles → buscar MD5, SHA1, DES
- CWE-798: Hard-coded credentials → buscar password=, secret= en literales
- CWE-730: ReDoS → buscar regex complejas con backtracking
- OWASP A02: Broken Auth → JWT sin expiración, tokens sin validación
- OWASP A05: Security Misconfiguration → CORS *, actuator sin auth
- Spring Security: CSRF desactivado sin justificación, permitAll() sin restricciones

Herramienta de referencia: SpotBugs + Find Security Bugs plugin
Comando: spotbugs -textui -bugCategories SECURITY src/
```

#### .Net / C#
```
Comprobaciones:
- CWE-89: SQL Injection → string interpolation en queries EF/ADO
- CWE-79: XSS → Html.Raw sin sanitizar en Razor
- CWE-327: Algoritmos débiles → MD5, SHA1 en System.Security.Cryptography
- CWE-798: Hard-coded credentials → ConnectionStrings en código
- OWASP A02: JWT sin validación de firma, cookies sin HttpOnly/Secure
- OWASP A05: Debug=true en producción, HSTS desactivado

Herramienta de referencia: Roslyn Analyzers + Security Code Scan
```

#### Node.js / NestJS
```
Comprobaciones:
- CWE-89: SQL Injection → queries con template literals en TypeORM/Prisma
- CWE-79: XSS → res.send() con input sin sanitizar
- CWE-400: ReDoS → regex sin límite en validadores
- npm audit → dependencias con CVEs conocidos
- OWASP A02: JWT secrets en variables de entorno no validadas
- OWASP A05: helmet() no configurado, rate limiting ausente
```

#### Angular / React
```
Comprobaciones:
- CWE-79: XSS → innerHTML/dangerouslySetInnerHTML sin sanitizar
- CWE-346: CORS mal configurado en llamadas HTTP
- Tokens JWT almacenados en localStorage (deben ir en httpOnly cookie)
- Rutas protegidas sin AuthGuard / PrivateRoute
- Dependencias con CVEs: npm audit
```

---

### 2. OWASP Dependency Check

Analizar todas las dependencias del proyecto en busca de CVEs conocidos:

```
Para Java:
  Archivo: pom.xml o build.gradle
  Buscar: dependencias con CVE en NVD (National Vulnerability Database)
  Severidad: CVSSv3.1 (Critical ≥9.0, High ≥7.0, Medium ≥4.0, Low <4.0)

Para .Net:
  Archivo: *.csproj, packages.config
  Buscar: paquetes NuGet con CVEs conocidos

Para Node.js:
  Archivo: package.json, package-lock.json
  Comando de referencia: npm audit --json
  Parsear: vulnerabilities[].severity

Para Angular/React:
  Archivo: package.json
  Mismo proceso que Node.js
```

**Criterio de bloqueo:**
- `cve_critical > 0` → BLOQUEANTE — pipeline detenido hasta remediar
- `cve_high > 3` → WARNING — requiere justificación documentada en el report
- `cve_medium` → INFORMATIVO — registrar en report, remediar en próximo sprint

---

### 3. Secrets Scanning

Buscar en el código fuente patrones que indiquen credenciales o tokens expuestos:

```
Patrones a detectar:
- API keys: [a-zA-Z0-9]{32,} en variables api_key, apiKey, API_KEY
- Tokens JWT hardcoded: eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+
- Contraseñas: password\s*=\s*["'][^"']{4,}["']
- Connection strings con credenciales: //user:pass@host
- AWS keys: AKIA[0-9A-Z]{16}
- Private keys: -----BEGIN (RSA|EC|DSA|PRIVATE) KEY-----
- .env files commiteados (deben estar en .gitignore)

Para cada hallazgo: reportar archivo, línea, tipo de secreto (sin mostrar el valor)
```

---

## Output — SecurityReport.docx

El Security Report debe generarse con el estilo corporativo Experis
(color `1B3A6B`, Arial, A4) usando el `docx` npm package.

### Estructura del documento

```
SecurityReport — [Proyecto] — Sprint [N] — [Feature FEAT-XXX]
Fecha: [ISO date]
Clasificación: CONFIDENCIAL — USO INTERNO

1. Resumen ejecutivo
   - Semáforo de seguridad global (VERDE / AMARILLO / ROJO)
   - Métricas clave: CVEs encontrados por severidad, secrets detectados
   - Recomendación: Aprobar / Aprobar con condiciones / BLOQUEAR

2. Análisis SAST — Hallazgos estáticos
   Tabla: ID | CWE | Descripción | Archivo | Línea | Severidad | Remediación
   
3. Análisis de dependencias (OWASP)
   Tabla: Dependencia | Versión | CVE | CVSS | Descripción | Fix disponible
   
4. Secrets Scan
   Tabla: Tipo | Archivo | Línea | Acción recomendada
   (NUNCA mostrar el valor del secreto)
   
5. OWASP Top 10 — Estado por categoría
   Tabla: Categoría | Estado | Evidencia | Observaciones
   
6. Plan de remediación
   - Items bloqueantes (resolver antes de QA)
   - Items de alta prioridad (resolver en este sprint)
   - Items de mejora (próximo sprint)
   
7. Criterio de aceptación de seguridad
   [ ] Zero CVEs críticos
   [ ] CVEs altos documentados con justificación o fix
   [ ] Zero secrets en código fuente
   [ ] OWASP Top 10 categorías A01-A05 sin hallazgos críticos
   Firma del revisor de seguridad: _______________________
```

### Semáforo de seguridad

```
🟢 VERDE  → cve_critical=0, cve_high≤1, secrets=0   → Pipeline continúa
🟡 AMARILLO → cve_critical=0, cve_high>1 ó secrets>0 → Pipeline continúa con condiciones
🔴 ROJO   → cve_critical>0                           → Pipeline BLOQUEADO
```

---

## Actualización de session.json

Al completar el análisis, actualizar el campo `security` en session.json:

```json
"security": {
  "scan_status": "completed",
  "semaphore": "green|yellow|red",
  "cve_critical": 0,
  "cve_high": 2,
  "cve_medium": 5,
  "secrets_found": 0,
  "sast_findings": 3,
  "report_path": "docs/security/SecurityReport-Sprint9-FEAT-XXX.docx",
  "scanned_at": "[ISO timestamp]",
  "gate_result": "approved|blocked"
}
```

---

## Generación del SecurityReport.docx

```javascript
// security-report-generator.js
// Usar: node security-report-generator.js [feature] [sprint]

const { Document, Pager, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, WidthType, ShadingType,
        Paragraph, convertInchesToTwip, BorderStyle } = require('docx');
const fs = require('fs');

const EXPERIS_BLUE = '1B3A6B';
const ROJO  = 'C00000';
const VERDE = '375623';
const AMBAR = 'ED7D31';

// Los datos del análisis se pasan como JSON desde el análisis previo
// Format: { sast: [...], dependencies: [...], secrets: [...], owasp: [...] }

async function generateSecurityReport(analysisData, feature, sprint) {
  const { sast, dependencies, secrets, owasp } = analysisData;
  
  const cveCritical = dependencies.filter(d => d.cvss >= 9.0).length;
  const cveHigh     = dependencies.filter(d => d.cvss >= 7.0 && d.cvss < 9.0).length;
  const secretsFound = secrets.length;
  
  const semaphore = cveCritical > 0 ? '🔴 ROJO — BLOQUEANTE'
                  : (cveHigh > 1 || secretsFound > 0) ? '🟡 AMARILLO'
                  : '🟢 VERDE';
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
          margin: { top: 720, right: 720, bottom: 720, left: 720 }
        }
      },
      children: [
        // Portada
        new Paragraph({
          children: [new TextRun({
            text: 'Security Report',
            bold: true, size: 52, color: EXPERIS_BLUE
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 2880, after: 400 }
        }),
        new Paragraph({
          children: [new TextRun({
            text: `${feature} · Sprint ${sprint}`,
            size: 28, color: EXPERIS_BLUE
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [new TextRun({
            text: `Generado: ${new Date().toLocaleDateString('es-ES')} · CONFIDENCIAL`,
            size: 20, color: '808080', italics: true
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 }
        }),
        // Semáforo
        new Paragraph({
          children: [new TextRun({
            text: `Estado de seguridad: ${semaphore}`,
            bold: true, size: 32,
            color: cveCritical > 0 ? ROJO : (cveHigh > 1 ? AMBAR : VERDE)
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 }
        }),
        // ... resto del documento (secciones 2-7)
        // Implementar según estructura definida arriba
      ]
    }]
  });
  
  const buffer = await Packer.toBuffer(doc);
  const outputPath = `docs/security/SecurityReport-Sprint${sprint}-${feature}.docx`;
  fs.mkdirSync('docs/security', { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✅ SecurityReport generado: ${outputPath}`);
  return { outputPath, cveCritical, cveHigh, secretsFound, semaphore };
}

module.exports = { generateSecurityReport };
```

---

## Persistence Protocol — Implementación obligatoria

Al completar el análisis de seguridad:

```javascript
// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json'));
session.pipeline_step = '5b';
session.pipeline_step_name = 'security-agent';
session.completed_steps.push('5b');
session.last_skill = 'security-agent';
session.last_skill_output_path = 'docs/security/';
session.security = {
  scan_status: 'completed',
  semaphore: semaphoreValue,
  cve_critical: cveCritical,
  cve_high: cveHigh,
  secrets_found: secretsFound,
  report_path: outputPath,
  scanned_at: new Date().toISOString(),
  gate_result: cveCritical > 0 ? 'blocked' : 'approved'
};
session.artifacts['5b'] = [outputPath];
session.updated_at = new Date().toISOString();
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log
const logEntry = `[${new Date().toISOString()}] [STEP-5b] [security-agent] COMPLETED → ${outputPath} | CVE críticos: ${cveCritical}, CVE altos: ${cveHigh}, Semáforo: ${semaphoreValue}\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-5b-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación final

```
---
✅ PERSISTENCE CONFIRMED — SECURITY-AGENT STEP-5b
- session.json: updated (step 5b added to completed_steps)
- session.json.security: scan_status=completed, cve_critical=[N], semaphore=[COLOR]
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-5b-[timestamp].json
- artifacts:
  · docs/security/SecurityReport-Sprint[N]-[FEAT-XXX].docx
- gate_result: [approved|blocked]
---
```

---

## Gate de seguridad — Decisión de pipeline

```
Si gate_result == "blocked" (cve_critical > 0):
  → Emitir: "🔴 PIPELINE BLOQUEADO — Security Gate"
  → Describir los CVEs críticos encontrados con remediación sugerida
  → Actualizar session.json: status = "gate_pending", gates.5b = {status: "blocked"}
  → Informar al Orchestrator: NO continuar a step 6
  → El Developer debe:
    1. Actualizar las dependencias afectadas
    2. Resolver los hallazgos SAST críticos
    3. Solicitar re-scan del Security Agent

Si gate_result == "approved":
  → Emitir: "✅ Security Gate: APROBADO — Continuar a QA"
  → El Orchestrator puede proceder al step 6
```

---

## Contexto adicional de seguridad para proyectos bancarios

Para proyectos del sector financiero (como BankPortal), aplicar adicionalmente:

```
PCI-DSS relevantes:
- Req 6.3: Vulnerabilidades de seguridad identificadas y corregidas
- Req 6.4: Separación de entornos desarrollo/producción
- Req 10.2: Audit trails para todos los accesos

RGPD:
- Datos personales cifrados en reposo y en tránsito
- Logs sin PII (nombres, emails, números de cuenta en texto plano)
- Trazabilidad de acceso a datos sensibles

Específico banking:
- Tokens de autenticación con tiempo de expiración ≤ 15 minutos para operaciones
- 2FA obligatorio para operaciones sensibles
- Rate limiting en endpoints de autenticación (Bucket4j/Spring Security)
- Auditoría de todas las operaciones financieras
```
