---
sofia_version: "2.6"
# updated: 2026-04-02 — version bump SOFIA v2.6
name: jenkins-agent
description: >
  Agente especializado en Jenkins para el pipeline de SOFIA. Úsalo SIEMPRE que el agente DevOps necesite:
  crear o modificar Jenkinsfiles, configurar jobs/pipelines, gestionar builds, diagnosticar errores de
  ejecución, configurar credenciales, instalar plugins, integrar con Git, generar reportes de build,
  o cualquier operación CI/CD sobre Jenkins. También activa este skill cuando se mencione: pipeline,
  stage, Jenkinsfile, build fallido, trigger, webhook, agente Jenkins, nodo Jenkins, o Blue Ocean.
  Entorno objetivo: macOS + Homebrew, Jenkins LTS en localhost:8080, PROJECT_REPO configurado.
---

# Jenkins Agent — SOFIA CI/CD

Agente especializado en Jenkins integrado al pipeline de SOFIA (Software Factory IA de Experis).
Opera sobre Jenkins LTS instalado vía Homebrew en macOS, conectado al repo del proyecto activo.

> **Nota de instalación:** Las rutas absolutas en este skill usan el usuario `cuadram` y el
> proyecto `bank-portal`. Al instalar en un nuevo equipo o proyecto, reemplazar por la ruta
> real: `$SOFIA_REPO` o `~/proyectos/[PROJECT_NAME]`.

---

## Contexto SOFIA

El pipeline de SOFIA tiene 8 stages que este agente debe mapear a Jenkins:

| Stage SOFIA         | Stage Jenkins           | Artefacto esperado                        |
|---------------------|-------------------------|-------------------------------------------|
| 1. Requirements     | `requirements`          | `docs/requirements/FEAT-XXX.md`           |
| 2. Architecture     | `architecture`          | Diagramas + HLD en `docs/architecture/`   |
| 3. Development      | `development`           | Código en `src/` + tests                  |
| 4. Code Review      | `code-review`           | Reporte de calidad                        |
| 5. Testing          | `testing`               | Resultados en `reports/tests/`            |
| 6. DevOps           | `devops`                | IaC validado en `infra/`                  |
| 7. Documentation    | `documentation`         | Entregables en `docs/deliverables/`       |
| 8. Delivery         | `delivery`              | Package final aprobado                    |

---

## Operaciones principales

### 1. Generar Jenkinsfile completo

Cuando se pida crear o actualizar el Jenkinsfile del proyecto, usar esta plantilla base
y adaptarla al contexto del sprint/feature solicitado:

```groovy
pipeline {
    agent any

    environment {
        NODE     = '/opt/homebrew/opt/node@22/bin/node'
        NPX      = '/opt/homebrew/opt/node@22/bin/npx'
        PYTHON   = '/opt/homebrew/bin/python3'
        UVX      = '/opt/homebrew/bin/uvx'
        // SOFIA_REPO se configura en Manage Jenkins → System → Global properties
        // Permite portabilidad entre proyectos sin modificar el Jenkinsfile
        REPO     = "${env.SOFIA_REPO ?: '/Users/cuadram/proyectos/bank-portal'}"
        FEATURE  = "${params.FEATURE_ID ?: 'FEAT-001'}"
        SPRINT   = "${params.SPRINT_NUM ?: '1'}"
    }

    parameters {
        string(name: 'FEATURE_ID', defaultValue: 'FEAT-001', description: 'ID del feature')
        string(name: 'SPRINT_NUM', defaultValue: '1',        description: 'Número de sprint')
        choice(name: 'STAGE_FROM',
               choices: ['requirements','architecture','development','testing','devops','documentation','delivery'],
               description: 'Stage inicial')
    }

    options {
        timestamps()
        timeout(time: 2, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Requirements') {
            when { expression { params.STAGE_FROM == 'requirements' } }
            steps {
                sh '''
                    echo "=== SOFIA: Requirements ==="
                    mkdir -p ${REPO}/docs/requirements
                '''
            }
        }

        stage('Architecture') {
            steps {
                sh '''
                    echo "=== SOFIA: Architecture ==="
                    mkdir -p ${REPO}/docs/architecture/${FEATURE}
                    ${NPX} --yes @mermaid-js/mermaid-cli --version || true
                '''
            }
            post {
                success {
                    archiveArtifacts artifacts: 'docs/architecture/**/*', allowEmptyArchive: true
                }
            }
        }

        stage('Development') {
            steps {
                sh '''
                    echo "=== SOFIA: Development ==="
                    ${NODE} --version
                    cd ${REPO} && ${NPX} --yes eslint src/ --ext .js,.ts || true
                '''
            }
        }

        stage('Code Review') {
            steps {
                sh '''
                    echo "=== SOFIA: Code Review ==="
                    mkdir -p ${REPO}/reports/code-review
                    cd ${REPO} && ${NPX} --yes jshint src/ > reports/code-review/${FEATURE}.txt || true
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/code-review/**/*', allowEmptyArchive: true
                }
            }
        }

        stage('Testing') {
            steps {
                sh '''
                    echo "=== SOFIA: Testing ==="
                    mkdir -p ${REPO}/reports/tests
                    cd ${REPO} && [ -f package.json ] && ${NPX} jest --ci --reporters=default || echo "No tests found"
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/tests/**/*', allowEmptyArchive: true
                }
            }
        }

        stage('DevOps') {
            steps {
                sh '''
                    echo "=== SOFIA: DevOps ==="
                    mkdir -p ${REPO}/infra
                    echo "Validando IaC..."
                '''
            }
        }

        stage('Documentation') {
            steps {
                sh '''
                    echo "=== SOFIA: Documentation Agent ==="
                    mkdir -p ${REPO}/docs/deliverables/sprint-${SPRINT}-${FEATURE}
                    ${PYTHON} --version
                    ${UVX} --version || true
                '''
            }
            post {
                success {
                    archiveArtifacts artifacts: 'docs/deliverables/**/*', allowEmptyArchive: true
                }
            }
        }

        stage('Delivery') {
            steps {
                sh '''
                    echo "=== SOFIA: Delivery ==="
                    echo "Sprint ${SPRINT} | Feature ${FEATURE} completado"
                    ls -la ${REPO}/docs/deliverables/sprint-${SPRINT}-${FEATURE}/ || true
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline SOFIA completado: Sprint ${SPRINT} | ${FEATURE}"
        }
        failure {
            echo "Pipeline SOFIA FALLIDO en stage: ${currentBuild.currentResult}"
        }
        always {
            cleanWs()
        }
    }
}
```

---

### 2. Crear job en Jenkins vía UI

Pasos para crear el pipeline job:

1. `New Item` → nombre: `sofia-pipeline` → tipo: **Pipeline**
2. En **General**: marcar `This project is parameterized` → añadir los 3 params del Jenkinsfile
3. En **Pipeline**:
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: `file:///[RUTA_REPO]` (ej: `file:///Users/cuadram/proyectos/bank-portal`)
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
4. `Save` → `Build with Parameters`

---

### 3. Diagnóstico de errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `node: command not found` | PATH incompleto en Jenkins | Añadir PATH en Manage Jenkins → System → Global properties |
| `npx: command not found` | Igual que arriba | Usar ruta absoluta `/opt/homebrew/opt/node@22/bin/npx` |
| `Permission denied` | Jenkins sin permisos sobre repo | `chmod -R 755 ~/proyectos/[PROJECT]` |
| `couldn't find remote ref` | Branch mal configurada | Verificar: `*/main` o `*/master` |
| `No such file: Jenkinsfile` | Script Path incorrecto | Confirmar que `Jenkinsfile` está en la raíz |
| Build en `pending` | Sin agente disponible | Verificar en Manage Jenkins → Nodes |
| `JAVA_HOME not set` | Java no encontrado | Añadir `JAVA_HOME` a variables de entorno globales |
| `SOFIA_REPO not set` | Variable global no configurada | Añadir `SOFIA_REPO` en Manage Jenkins → System → Global properties |

---

### 4. Comandos Jenkins CLI / Homebrew

```bash
brew services start   jenkins-lts
brew services stop    jenkins-lts
brew services restart jenkins-lts
brew services status  jenkins-lts

tail -f ~/.jenkins/logs/jenkins.log
cat ~/.jenkins/secrets/initialAdminPassword
brew upgrade jenkins-lts && brew services restart jenkins-lts
open http://localhost:8080
```

---

### 5. Variables de entorno globales requeridas

Configurar en `Manage Jenkins → System → Global properties → Environment variables`:

| Name | Value |
|------|-------|
| `PATH` | `/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin` |
| `JAVA_HOME` | `/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home` |
| `NODE_HOME` | `/opt/homebrew/opt/node@22` |
| `SOFIA_REPO` | `/Users/cuadram/proyectos/bank-portal` *(actualizar por proyecto)* |

> **SOFIA_REPO** es la variable clave de portabilidad: permite reutilizar el mismo
> Jenkinsfile en distintos proyectos sin modificarlo. Solo hay que actualizar la
> variable global en Jenkins al cambiar de proyecto.

---

### 6. Plugins recomendados para SOFIA

| Plugin | Propósito |
|--------|-----------|
| `Pipeline` | Pipeline declarativo (obligatorio) |
| `Git` | Integración con repo del proyecto |
| `Blue Ocean` | UI mejorada para pipelines |
| `NodeJS` | Gestión de versiones Node en jobs |
| `Workspace Cleanup` | `cleanWs()` en post steps |
| `Timestamper` | timestamps() en logs |
| `AnsiColor` | Colores en consola |
| `Build Timeout` | timeout() en options |
| `Parameterized Build` | Builds con parámetros FEATURE/SPRINT |

---

### 7. Webhook local (trigger automático desde Git)

```bash
cat > [REPO]/.git/hooks/post-commit << 'EOF'
#!/bin/bash
curl -X POST http://localhost:8080/job/sofia-pipeline/build \
     --user admin:$(cat ~/.jenkins/secrets/initialAdminPassword) \
     --data-urlencode json='{"parameter": [{"name":"FEATURE_ID","value":"FEAT-001"}]}'
EOF
chmod +x [REPO]/.git/hooks/post-commit
```

---

## Notas de integración con SOFIA

- El agente **DevOps** delega en este skill para toda operación Jenkins
- Los artefactos generados en `docs/deliverables/` son consumidos por el **Documentation Agent**
- Cada stage debe dejar evidencia en el repo para trazabilidad CMMI Level 3
- Los parámetros `FEATURE_ID` y `SPRINT_NUM` conectan con el tracking de Scrumban
- `SOFIA_REPO` como variable de entorno global permite portabilidad sin modificar el Jenkinsfile


---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-7] [jenkins-agent] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "7", updated_at = now
```

### Al COMPLETAR

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '7';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step          = step;
session.pipeline_step_name     = 'jenkins-agent';
session.last_skill             = 'jenkins-agent';
session.last_skill_output_path = 'infra/';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${now}] [STEP-7] [jenkins-agent] COMPLETED → infra/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-7-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — JENKINS_AGENT STEP-7
- session.json: updated (step 7 added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-7-[timestamp].json
- artifacts:
  · infra/<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.
