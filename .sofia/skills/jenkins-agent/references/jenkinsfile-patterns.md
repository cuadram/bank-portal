# Jenkinsfile Patterns — SOFIA Advanced

## Parallel stages (tests + lint simultáneos)

```groovy
stage('Quality Gate') {
    parallel {
        stage('Lint') {
            steps { sh '${NPX} eslint src/' }
        }
        stage('Unit Tests') {
            steps { sh '${NPX} jest --ci' }
        }
        stage('Security Scan') {
            steps { sh '${NPX} --yes audit-ci --moderate' }
        }
    }
}
```

## Stage condicional por rama

```groovy
stage('Deploy Staging') {
    when { branch 'develop' }
    steps { echo 'Deploying to staging...' }
}
stage('Deploy Production') {
    when { branch 'main' }
    steps { input message: '¿Aprobar deploy a producción?' }
}
```

## Retry automático

```groovy
stage('Flaky Test') {
    steps {
        retry(3) {
            sh 'npm test'
        }
    }
}
```

## Shared Library (futuro)

```groovy
// Para cuando SOFIA tenga una shared library
@Library('sofia-shared-lib') _
sofiaStage('documentation')
```

## Matrix build (múltiples versiones Node)

```groovy
matrix {
    axes {
        axis { name 'NODE_VERSION'; values '18', '20', '22' }
    }
    stages {
        stage('Test') {
            steps { sh "node --version" }
        }
    }
}
```
