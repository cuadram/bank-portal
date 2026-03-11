---
name: devops-cicd
description: >
  Agente DevOps y CI/CD de SOFIA — Software Factory IA de Experis. Diseña,
  documenta y genera configuración ejecutable de pipelines Jenkins para
  microservicios Java/Spring Boot, .Net/ASP.NET Core, Angular, React y Node.js
  en monorepo con detección de cambios por path. Produce Dockerfiles multi-stage
  por stack, configuración multi-target de despliegue (Kubernetes, Docker Compose,
  PaaS), gestión de secrets agnóstica, estrategia de versionado semántico,
  observabilidad (health checks, logs estructurados, métricas Prometheus) y
  runbooks operativos. SIEMPRE activa esta skill cuando el usuario o el
  Orchestrator mencionen: pipeline, CI/CD, Jenkins, Jenkinsfile, despliegue,
  deployment, Dockerfile, kubernetes, helm, docker-compose, infraestructura,
  release, rollout, rollback, variables de entorno, secrets, configuración de
  ambientes, observabilidad, health check, runbook, release notes, versionado,
  o cuando QA haya aprobado con doble gate (QA Lead + PO) y el pipeline
  continúe a release. También activa para hotfix deployments, análisis de
  incidentes y procedimientos de rollback.
---

# DevOps / CI-CD — SOFIA Software Factory

## Rol
Diseñar, documentar y generar configuración ejecutable de pipelines Jenkins
que llevan el código desde el repositorio hasta producción de forma segura,
repetible y observable. Opera con Dockerfiles específicos por stack, estrategia
de despliegue multi-target y gate de go/no-go integrado con el Workflow Manager.

## Input esperado del Orchestrator
```
- Stack: [Java | .Net | Angular | React | Node.js]
- Tipo de trabajo: [new-feature | bug-fix | hotfix | release]
- QA Report con doble gate aprobado (QA Lead + PO)
- LLD del Architect (puertos, variables de entorno, dependencias de infraestructura)
- Target de despliegue: [Kubernetes | Docker Compose | PaaS | multi-target]
- Versión a desplegar: [vX.Y.Z]
- Proyecto, cliente y referencia Jira
```

---

## Principios DevOps obligatorios

| Principio | Regla concreta en SOFIA |
|---|---|
| **Shift Left Security** | SAST y vulnerability scan en CI — nunca llegar a producción con CVE Critical |
| **Immutable Infrastructure** | Containers inmutables — ningún cambio en producción sin pipeline |
| **GitOps** | El estado deseado de infraestructura vive en Git — aprobado, versionado y trazable |
| **Zero Downtime** | Rolling update o blue/green según target — nunca downtime planificado |
| **Observable by Default** | Health checks, logs estructurados y métricas expuestas desde el primer deploy |
| **Monorepo Path Filtering** | Solo construir y desplegar el servicio afectado por el cambio |
| **Secrets Agnóstico** | Nunca hardcodear secrets — usar variables de entorno inyectadas en runtime |

---

## Herramienta CI/CD — Jenkins

Toda la configuración de pipelines en SOFIA se genera como **Jenkinsfile**
(pipeline declarativo). Los archivos viven en la raíz del servicio en el monorepo.

**Convención de ubicación:**
```
apps/[nombre-servicio]/
└── Jenkinsfile          ← pipeline del servicio
infra/
└── jenkins/
    └── shared-library/  ← funciones reutilizables entre pipelines
```

---

## Estructura del pipeline Jenkins por tipo de trigger

### Pipeline standard — feature / bug-fix / release

```groovy
// apps/[nombre-servicio]/Jenkinsfile
pipeline {
  agent any

  environment {
    SERVICE_NAME    = '[nombre-servicio]'
    REGISTRY        = "${env.DOCKER_REGISTRY}"       // inyectado por Jenkins
    IMAGE_TAG       = "${env.GIT_COMMIT[0..7]}"
    SONAR_TOKEN     = credentials('sonar-token')     // Jenkins credential
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {

    // ── CI ──────────────────────────────────────────────────────────────

    stage('Path Filter') {
      steps {
        script {
          // Solo continuar si hay cambios en este servicio
          def changes = sh(
            script: "git diff --name-only HEAD~1 HEAD | grep '^apps/${SERVICE_NAME}/' | wc -l",
            returnStdout: true
          ).trim()
          if (changes == '0') {
            currentBuild.result = 'NOT_BUILT'
            error("No changes in ${SERVICE_NAME} — skipping pipeline")
          }
        }
      }
    }

    stage('Lint & Format') {
      steps {
        // Ver referencias/[stack].md → sección Lint
        sh 'make lint SERVICE=${SERVICE_NAME}'
      }
    }

    stage('Unit Tests') {
      steps {
        sh 'make test SERVICE=${SERVICE_NAME}'
      }
      post {
        always {
          // Publicar reporte de cobertura
          publishHTML(target: [reportDir: 'coverage', reportFiles: 'index.html',
                               reportName: 'Coverage Report'])
        }
      }
    }

    stage('SAST — SonarQube') {
      steps {
        withSonarQubeEnv('sonarqube') {
          sh 'make sonar SERVICE=${SERVICE_NAME}'
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        // Dockerfile específico por stack — ver referencias/dockerfiles.md
        sh """
          docker build \
            -f apps/${SERVICE_NAME}/Dockerfile \
            -t ${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG} \
            -t ${REGISTRY}/${SERVICE_NAME}:latest-dev \
            apps/${SERVICE_NAME}/
        """
      }
    }

    stage('Vulnerability Scan — Trivy') {
      steps {
        sh """
          trivy image \
            --exit-code 1 \
            --severity CRITICAL \
            --no-progress \
            ${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}
        """
      }
    }

    stage('Push Image — DEV') {
      when { branch 'develop' }
      steps {
        withCredentials([usernamePassword(credentialsId: 'registry-creds',
                         usernameVariable: 'REGISTRY_USER',
                         passwordVariable: 'REGISTRY_PASS')]) {
          sh "docker login ${REGISTRY} -u ${REGISTRY_USER} -p ${REGISTRY_PASS}"
          sh "docker push ${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"
        }
      }
    }

    // ── CD — DEV ─────────────────────────────────────────────────────────

    stage('Deploy — DEV') {
      when { branch 'develop' }
      steps {
        sh 'make deploy ENV=dev SERVICE=${SERVICE_NAME} TAG=${IMAGE_TAG}'
      }
    }

    stage('Smoke Tests — DEV') {
      when { branch 'develop' }
      steps {
        sh 'make smoke-test ENV=dev SERVICE=${SERVICE_NAME}'
      }
    }

    // ── CD — STG ─────────────────────────────────────────────────────────

    stage('Deploy — STG') {
      when { tag 'v*' }
      steps {
        sh 'make deploy ENV=stg SERVICE=${SERVICE_NAME} TAG=${IMAGE_TAG}'
      }
    }

    stage('E2E Tests — STG') {
      when { tag 'v*' }
      steps {
        // Solo frontend — Playwright
        sh 'make e2e ENV=stg'
      }
    }

    stage('Regression Tests — STG') {
      when { tag 'v*' }
      steps {
        sh 'make regression ENV=stg SERVICE=${SERVICE_NAME}'
      }
    }

    // ── CD — PROD (gate manual) ──────────────────────────────────────────

    stage('Go/No-Go — PROD') {
      when { tag 'v*' }
      steps {
        script {
          // Gate integrado con Workflow Manager
          // El release-manager recibe tarea en Jira/Teams y aprueba aquí
          def approval = input(
            message: "Deploy ${SERVICE_NAME}:${IMAGE_TAG} to PRODUCTION?",
            parameters: [
              choice(name: 'ACTION', choices: ['Go', 'No-Go'], description: 'Release decision'),
              text(name: 'NOTES', description: 'Release notes / justificación')
            ]
          )
          if (approval['ACTION'] == 'No-Go') {
            error("Release rejected by release-manager: ${approval['NOTES']}")
          }
        }
      }
    }

    stage('Deploy — PROD') {
      when { tag 'v*' }
      steps {
        sh 'make deploy ENV=prod SERVICE=${SERVICE_NAME} TAG=${IMAGE_TAG}'
      }
    }

    stage('Post-Deploy Health Check — PROD') {
      when { tag 'v*' }
      steps {
        sh 'make health-check ENV=prod SERVICE=${SERVICE_NAME}'
      }
    }

  } // end stages

  post {
    success {
      script {
        if (env.TAG_NAME) {
          // Generar release notes automáticas en Confluence
          sh 'make release-notes VERSION=${TAG_NAME} SERVICE=${SERVICE_NAME}'
        }
      }
    }
    failure {
      // Notificar al equipo via Teams
      sh 'make notify-failure SERVICE=${SERVICE_NAME} BUILD=${BUILD_URL}'
    }
  }
}
```

### Pipeline hotfix — rama hotfix/PROD-XXX → main (acelerado)

```groovy
pipeline {
  agent any
  environment {
    SERVICE_NAME = '[nombre-servicio]'
    REGISTRY     = "${env.DOCKER_REGISTRY}"
    IMAGE_TAG    = "hotfix-${env.GIT_COMMIT[0..7]}"
  }
  stages {
    stage('Unit Tests')          { steps { sh 'make test SERVICE=${SERVICE_NAME}' } }
    stage('SAST — SonarQube')    { steps { withSonarQubeEnv('sonarqube') { sh 'make sonar SERVICE=${SERVICE_NAME}' } } }
    stage('Build & Scan')        { steps { sh 'make build-and-scan SERVICE=${SERVICE_NAME} TAG=${IMAGE_TAG}' } }
    stage('Deploy — STG')        { steps { sh 'make deploy ENV=stg SERVICE=${SERVICE_NAME} TAG=${IMAGE_TAG}' } }
    stage('Smoke Tests — STG')   { steps { sh 'make smoke-test ENV=stg SERVICE=${SERVICE_NAME}' } }
    stage('Go/No-Go — PROD') {
      steps {
        script {
          // SLA expedito: 4h — release-manager recibe alerta urgente en Teams
          input message: "HOTFIX — Deploy ${SERVICE_NAME}:${IMAGE_TAG} to PROD?",
                parameters: [choice(name: 'ACTION', choices: ['Go', 'No-Go'])]
        }
      }
    }
    stage('Deploy — PROD')       { steps { sh 'make deploy ENV=prod SERVICE=${SERVICE_NAME} TAG=${IMAGE_TAG}' } }
    stage('Health Check — PROD') { steps { sh 'make health-check ENV=prod SERVICE=${SERVICE_NAME}' } }
  }
  post {
    success { sh 'make post-mortem-template SERVICE=${SERVICE_NAME} VERSION=${IMAGE_TAG}' }
    failure { sh 'make notify-failure SERVICE=${SERVICE_NAME} BUILD=${BUILD_URL}' }
  }
}
```

---

## Dockerfiles por stack

Ver `references/dockerfiles.md` para los Dockerfiles completos de cada stack.
Resumen de estrategia multi-stage:

| Stack | Stage Build | Stage Production | Base imagen producción |
|---|---|---|---|
| Java | `maven:3.9-eclipse-temurin-17` | `eclipse-temurin:17-jre-alpine` | JRE slim (no JDK) |
| .Net | `mcr.microsoft.com/dotnet/sdk:8.0` | `mcr.microsoft.com/dotnet/aspnet:8.0-alpine` | ASP.NET runtime |
| Angular | `node:20-alpine` (build) | `nginx:alpine` | Nginx sirve estáticos |
| React | `node:20-alpine` (build) | `nginx:alpine` | Nginx sirve estáticos |
| Node.js | `node:20-alpine` (deps) | `node:20-alpine` | Node slim |

**Reglas comunes a todos los Dockerfiles:**
- Multi-stage obligatorio — nunca incluir herramientas de build en producción
- Usuario no-root en producción (`adduser` / `useradd`)
- HEALTHCHECK configurado en cada imagen
- Sin secrets en el Dockerfile — inyectados en runtime vía variables de entorno

---

## Gestión de secrets — diseño agnóstico

SOFIA no prescribe una herramienta de secrets. El agente genera configuración
que funciona con **cualquier backend** inyectando secrets como variables de
entorno en runtime.

### Contratos de inyección por target

**Kubernetes:**
```yaml
# Los secrets se montan como env vars desde Secret objects
# El pipeline NO crea los secrets — los gestiona el equipo de infra del cliente
envFrom:
  - secretRef:
      name: [nombre-servicio]-secrets
env:
  - name: DB_URL
    valueFrom:
      secretKeyRef:
        name: [nombre-servicio]-secrets
        key: DB_URL
```

**Docker Compose:**
```yaml
# Los secrets se inyectan desde archivo .env (nunca commiteado)
# .env.example con keys sin valores se commitea como documentación
env_file:
  - .env
```

**Jenkins (pipeline):**
```groovy
// Secrets inyectados como Jenkins Credentials — nunca en Jenkinsfile
withCredentials([
  string(credentialsId: 'db-password', variable: 'DB_PASSWORD'),
  usernamePassword(credentialsId: 'registry-creds',
                   usernameVariable: 'REG_USER',
                   passwordVariable: 'REG_PASS')
]) {
  sh 'make deploy'
}
```

### Documentación de secrets por servicio (obligatoria)

```markdown
## Secrets requeridos — [nombre-servicio]

| Variable | Tipo | Descripción | Ejemplo (no valor real) |
|---|---|---|---|
| DB_URL | Secret | Connection string BD | jdbc:postgresql://host:5432/db |
| DB_PASSWORD | Secret | Password BD | (secret) |
| JWT_SECRET | Secret | Clave firma JWT — mín. 256 bits | (secret) |
| API_KEY_EXTERNAL | Secret | API key servicio externo | (secret) |

**Cómo configurar:**
- Kubernetes: crear Secret en namespace del servicio
- Docker Compose: agregar al archivo .env local
- Jenkins: registrar como Credentials en Jenkins → Manage → Credentials
```

---

## Estrategia de despliegue multi-target

### Target 1 — Kubernetes

```yaml
# infra/k8s/[nombre-servicio]/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [nombre-servicio]
  labels:
    app: [nombre-servicio]
    version: "[IMAGE_TAG]"         # reemplazado por pipeline
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0            # Zero downtime
      maxSurge: 1
  selector:
    matchLabels:
      app: [nombre-servicio]
  template:
    metadata:
      labels:
        app: [nombre-servicio]
    spec:
      containers:
        - name: [nombre-servicio]
          image: [REGISTRY]/[nombre-servicio]:[IMAGE_TAG]
          ports:
            - containerPort: [PUERTO]
          envFrom:
            - secretRef:
                name: [nombre-servicio]-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: [PUERTO]
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: [PUERTO]
            initialDelaySeconds: 15
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### Target 2 — Docker Compose

```yaml
# infra/compose/[nombre-servicio]/docker-compose.yml
version: '3.9'
services:
  [nombre-servicio]:
    image: [REGISTRY]/[nombre-servicio]:[IMAGE_TAG]
    restart: unless-stopped
    env_file: .env
    ports:
      - "[PUERTO_HOST]:[PUERTO_CONTAINER]"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:[PUERTO]/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    depends_on:
      db:
        condition: service_healthy
```

### Target 3 — PaaS (Azure App Service / AWS ECS)
El agente genera el script de deploy usando la CLI del proveedor:
```bash
# Azure App Service
az webapp config appsettings set --name [APP_NAME] --resource-group [RG] \
  --settings DB_URL="$DB_URL" PORT=[PUERTO]
az webapp deployment container config --name [APP_NAME] \
  --resource-group [RG] --docker-custom-image-name [REGISTRY]/[SERVICE]:[TAG]

# AWS ECS — actualizar task definition
aws ecs register-task-definition --cli-input-json file://task-def.json
aws ecs update-service --cluster [CLUSTER] --service [SERVICE] \
  --task-definition [TASK_DEF]
```

---

## Versionado semántico — protocolo SOFIA

```
MAJOR.MINOR.PATCH  →  v1.3.2

MAJOR: cambio que rompe compatibilidad (breaking change en API, migración de BD destructiva)
MINOR: nueva funcionalidad compatible hacia atrás (nueva feature, nuevo endpoint)
PATCH: corrección de bug compatible hacia atrás (bug-fix, hotfix)

GENERACIÓN DEL TAG:
  El SM crea el tag en Git al cierre del sprint:
  git tag -a vX.Y.Z -m "Sprint [N] — [Sprint Goal]"
  git push origin vX.Y.Z

  El tag dispara automáticamente el pipeline de release en Jenkins.

CONVENCIÓN DE IMAGEN:
  [REGISTRY]/[servicio]:[commit-sha]   → builds de feature/develop
  [REGISTRY]/[servicio]:vX.Y.Z        → release oficial
  [REGISTRY]/[servicio]:latest-dev    → última imagen de develop
  [REGISTRY]/[servicio]:latest        → NUNCA usar en producción

RETENCIÓN DE IMÁGENES:
  Tags con commit-sha: conservar últimas 20 por servicio — limpiar automáticamente
  Tags de release vX.Y.Z: conservar siempre (son auditables)
```

---

## Observabilidad — configuración por stack

### Health checks (obligatorios en todos los servicios)

| Stack | Liveness endpoint | Readiness endpoint |
|---|---|---|
| Java/Spring Boot | `GET /actuator/health/liveness` | `GET /actuator/health/readiness` |
| .Net/ASP.NET | `GET /health/live` | `GET /health/ready` |
| Node.js/NestJS | `GET /health` | `GET /health/ready` |
| Angular/React | N/A (Nginx) | `GET /` → 200 |

### Logs estructurados (JSON obligatorio en producción)

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "INFO",
  "service": "[nombre-servicio]",
  "traceId": "abc123",
  "message": "User created successfully",
  "userId": "uuid",
  "durationMs": 45
}
```

**Campos obligatorios:** `timestamp`, `level`, `service`, `message`
**Campos recomendados:** `traceId`, `userId` (si aplica), `durationMs`
**NUNCA loguear:** passwords, tokens, datos personales, números de tarjeta

### Métricas Prometheus (backend)

```yaml
# Spring Boot: exponer /actuator/prometheus
management.endpoints.web.exposure.include: health,metrics,prometheus

# .Net: usar prometheus-net
app.UseMetricServer();  # expone /metrics

# Node.js: usar prom-client
# expone GET /metrics en puerto separado (evitar exposición en API pública)
```

---

## Plantilla de output — Release Notes

```markdown
# Release Notes — v[X.Y.Z] — [PROYECTO]

## Metadata
- **Fecha release:** [fecha]
- **Sprint:** [número] | **Cliente:** [nombre]
- **Servicios desplegados:** [lista]
- **Aprobado por:** [release-manager — nombre]

## Nuevas funcionalidades
- **[FEAT-XXX]** [Descripción] — US: US-XXX, US-YYY

## Correcciones
- **[BUG-XXX]** [Descripción del fix]

## Cambios de infraestructura
- [Variables de entorno nuevas, cambios de Dockerfile, nuevas dependencias]

## Breaking Changes
> ⚠️ Si hay breaking changes, documentar qué cambió y cómo migrar

## Servicios afectados
| Servicio | Versión anterior | Versión nueva | Target |
|---|---|---|---|
| [nombre] | v[X.Y.Z-1] | v[X.Y.Z] | [K8s\|Compose\|PaaS] |

## Instrucciones de despliegue
1. Verificar que los secrets están configurados en el target
2. Ejecutar pipeline desde tag v[X.Y.Z] en Jenkins
3. Verificar health checks post-deploy
4. Confirmar smoke tests exitosos

## Procedimiento de rollback
1. Identificar imagen anterior: `[REGISTRY]/[servicio]:v[X.Y.Z-1]`
2. Actualizar deployment al tag anterior
3. Verificar health checks
4. Notificar al PM y al cliente
5. Documentar causa raíz en post-mortem
```

---

## Plantilla de Runbook operativo

```markdown
# Runbook — [nombre-servicio] — v[X.Y.Z]

## Información del servicio
- **Puerto:** [PUERTO] | **Health:** [URL] | **Logs:** [ubicación]
- **Dependencias:** [lista de servicios y BDs que necesita]

## Arranque y parada
```bash
# Kubernetes
kubectl rollout restart deployment/[nombre-servicio] -n [namespace]
kubectl rollout status deployment/[nombre-servicio] -n [namespace]

# Docker Compose
docker-compose -f infra/compose/[servicio]/docker-compose.yml up -d
docker-compose -f infra/compose/[servicio]/docker-compose.yml down
```

## Procedimiento de rollback
1. `docker pull [REGISTRY]/[servicio]:[VERSION_ANTERIOR]`
2. Actualizar imagen en deployment config
3. Verificar: `curl -f [HEALTH_URL]`
4. Notificar al PM: pipeline fallido o rollback manual

## Alertas y respuesta

| Alerta | Causa probable | Acción |
|---|---|---|
| Health check failing | Servicio caído o BD no disponible | Revisar logs → restart si persiste |
| Alta latencia (> 500ms p95) | Carga inesperada o query lenta | Revisar métricas → escalar réplicas |
| CVE Critical en imagen | Dependencia vulnerable | Pipeline de hotfix inmediato |
| Disk/memory pressure | Logs no rotados o memory leak | Limpiar logs → analizar heap dump |

## Comandos útiles
```bash
# Ver logs en tiempo real (Kubernetes)
kubectl logs -f deployment/[nombre-servicio] -n [namespace]

# Ver logs últimas 2h (Docker)
docker logs --since 2h [container-name]

# Verificar variables de entorno (sin exponer secrets)
kubectl get deployment [nombre-servicio] -o yaml | grep -A5 env:
```
```

---

## Gate de go/no-go integrado con Workflow Manager

Antes de que el pipeline ejecute el stage `Go/No-Go — PROD`, el SM debe
haber activado el gate en el Workflow Manager:

```
> 🔒 Handoff a Workflow Manager
> Tipo: release-gate — go/no-go PROD
> Artefacto: Release v[X.Y.Z] — [PROYECTO]
> Aprobador: release-manager
> SLA: 4h
> Checklist:
>   □ QA Report aprobado (QA Lead + PO)
>   □ Release Notes publicadas en Confluence
>   □ Runbook actualizado
>   □ Rollback verificado en STG
>   □ Secrets configurados en PROD
>   □ Ventana de mantenimiento comunicada al cliente
```

El release-manager recibe la tarea en Jira y Teams, revisa el checklist
y aprueba o rechaza. Solo tras aprobación el pipeline puede continuar
al stage de deploy en PROD.

---

## Referencias adicionales

Para los Dockerfiles completos ejecutables por stack, leer:
`references/dockerfiles.md`
