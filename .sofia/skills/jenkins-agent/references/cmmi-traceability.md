# CMMI L3 Traceability — Jenkins + SOFIA

## Áreas de proceso cubiertas por el pipeline Jenkins

| PA CMMI L3         | Stage Jenkins      | Evidencia generada                              |
|--------------------|--------------------|-------------------------------------------------|
| REQM               | requirements       | `docs/requirements/FEAT-XXX.md`                 |
| TS / PI            | architecture       | Diagramas C4, HLD, LLD en `docs/architecture/`  |
| TS                 | development        | Código fuente + commits Git                     |
| VER                | code-review        | Reporte estático en `reports/code-review/`      |
| VER / VAL          | testing            | Resultados JUnit/Jest en `reports/tests/`       |
| CM                 | devops             | IaC versionado en `infra/`                      |
| PMC / OPF          | documentation      | 10 Word + 3 Excel en `docs/deliverables/`       |
| SAM / PPQA         | delivery           | Package entregable aprobado                     |

## Convención de naming para trazabilidad

```
docs/deliverables/sprint-{N}-{FEAT-XXX}/
├── 01-project-plan.docx
├── 02-sprint-report.docx
├── 03-risk-register.docx
├── 04-architecture-hld.docx
├── 05-architecture-lld.docx
├── 06-test-plan.docx
├── 07-test-report.docx
├── 08-user-manual.docx
├── 09-deployment-guide.docx
├── 10-meeting-minutes.docx
├── 11-nc-tracker.xlsx
├── 12-decision-log.xlsx
└── 13-quality-dashboard.xlsx
```

## Build description para trazabilidad

Añadir al stage Delivery para que Jenkins muestre info en el historial:

```groovy
stage('Delivery') {
    steps {
        script {
            currentBuild.description = "Sprint ${SPRINT} | ${FEATURE} | ${new Date().format('yyyy-MM-dd')}"
        }
    }
}
```
