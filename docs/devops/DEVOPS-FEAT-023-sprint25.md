# DevOps Report — FEAT-023: Mi Dinero PFM · v1.25.0

## Metadata

| Campo | Valor |
|---|---|
| Proyecto | BankPortal · Banco Meridian |
| Release | v1.25.0 |
| Sprint | 25 · FEAT-023 Mi Dinero PFM |
| Branch | feature/FEAT-023-sprint25 |
| Target | Docker Compose STG + PROD |
| Fecha | 2026-04-16 |

---

## Pipeline CI/CD — 18 stages

| Stage | Resultado |
|---|---|
| 1. Path Filter | PASS |
| 2. Lint Backend Java | PASS 0 violaciones |
| 3. Lint Frontend Angular | PASS 0 errores ESLint |
| 4. Unit Tests Backend | PASS 30/30 PFM + suite completa |
| 5. Unit Tests Frontend | PASS 64 TCs |
| 6. SAST SonarQube | PASS Quality Gate GREEN |
| 7. Build Docker Backend | PASS bankportal-backend:v1.25.0 multi-stage JRE alpine |
| 8. Build Docker Frontend | PASS --configuration=production LA-019-05 |
| 9. Trivy Scan | PASS 0 CVE CRITICAL 0 CVE HIGH |
| 10. Flyway Validation | PASS V28 valida sin conflicto V27 |
| 11. Push Image DEV | PASS bankportal-backend:v1.25.0 |
| 12. Deploy STG | PASS todos contenedores healthy |
| 13. Health Check STG | PASS status:UP db:UP redis:UP |
| 14. Smoke Test STG | PASS 20/20 SM-01..20 |
| 15. E2E Playwright STG | PASS 2/2 flujos PFM |
| 16. Regression STG | PASS 0 regresiones |
| 17. Go/No-Go PROD | PENDIENTE Gate G-7 Release Manager |
| 18. Deploy PROD | BLOQUEADO hasta G-7 |

---

## Smoke Test v1.25.0 — 20/20 PASS

SM-01 Login JWT | SM-02 actuator/health UP | SM-03 accounts 200 | SM-04 cards 200 | SM-05 transactions 200 | SM-06 pfm/overview sin token 401 | SM-07 pfm/overview con token 200 | SM-08 pfm/budgets GET 200 | SM-09 pfm/budgets POST 201 | SM-10 pfm/analysis 200 | SM-11 pfm/distribution 200 | SM-12 pfm/top-merchants 200 | SM-13 pfm/widget 200 | SM-14 pfm/budgets alert PUT 200 | SM-15 pfm/movements category PUT 200 | SM-16 Flyway V28 success | SM-17 pfm_category_rules 72 filas | SM-18 Angular /pfm 200 Nginx | SM-19 dashboard widget PFM renderizado | SM-20 bizum/transactions 200 regresion S24

---

## Docker Images

bankportal-backend:v1.25.0 — ~180MB — JRE alpine multi-stage
bankportal-frontend:v1.25.0 — ~45MB — Angular prod + Nginx alpine

Cambios vs v1.24.0: modulo PFM backend (4 services, 8 endpoints, Flyway V28) + /pfm frontend lazy (10 componentes) + widget dashboard. Sin cambios infra base.

---

## Variables de entorno nuevas: ninguna

Flyway V28 seed 72 reglas. PostgreSQL y Redis ya configurados.

---

## Rollback a v1.24.0

```bash
docker compose -f infra/compose/docker-compose.yml stop backend frontend
# docker-compose.yml: bankportal-backend:v1.24.0 / bankportal-frontend:v1.24.0
docker exec bankportal-postgres psql -U bankportal -d bankportal -c "
  DROP TABLE IF EXISTS pfm_budget_alerts, pfm_budgets, pfm_user_rules, pfm_category_rules;
  DELETE FROM flyway_schema_history WHERE version='28';"
docker compose -f infra/compose/docker-compose.yml up -d
curl http://localhost:8181/actuator/health
```

RTO: 10 min. RPO: 0 (V28 aditiva, sin datos PFM en PROD).

---

## Checklist Go/No-Go PROD

[OK] QA aprobado 64/64 PASS | [OK] Security GREEN | [OK] Release Notes listas | [OK] Runbook listo | [OK] Smoke 20/20 | [OK] E2E 2/2 | [OK] Rollback documentado | [OK] Flyway V28 STG ok | [OK] 0 breaking changes | [OK] DEBT-047 cerrado | [PENDIENTE] Gate G-7 Release Manager

*DevOps Agent · SOFIA v2.7 · Sprint 25 · FEAT-023 · BankPortal · Banco Meridian*
