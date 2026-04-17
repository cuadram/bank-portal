# LLD — FEAT-023 · Mi Dinero (PFM) · Bounded Context `pfm`

## Metadata
- **Servicio:** pfm | **Stack:** Java Spring Boot + Angular 17 | **Feature:** FEAT-023
- **Sprint:** 25 | **Versión:** 1.0 | **Estado:** DRAFT | **Flyway:** V28

## Estructura de paquetes — Backend
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/pfm/
  domain/model: PfmCategoryRule · PfmUserRule · Budget · BudgetAlert · PfmCategory(enum 14)
  domain/repository: PfmCategoryRuleRepository · PfmUserRuleRepository · BudgetRepository · BudgetAlertRepository
  domain/service: PfmCategorizationService · BudgetService · BudgetAlertService · PfmAnalysisService · PfmDistributionService · UserRuleService
  application/usecase: GetPfmOverviewUseCase · GetBudgetsUseCase · CreateBudgetUseCase · DeleteBudgetUseCase · GetPfmAnalysisUseCase · GetPfmDistributionUseCase · OverrideCategoryUseCase · GetPfmWidgetUseCase
  application/dto: PfmOverviewResponse · MovimientoCategoriadoDto · BudgetDto · BudgetCreateRequest · PfmAnalysisResponse · CategoryAnalysisDto · PfmDistributionResponse · TopMerchantDto · CategoryOverrideRequest · PfmWidgetResponse
  infrastructure/persistence: JpaPfmCategoryRuleAdapter(@Primary) · JpaPfmUserRuleAdapter(@Primary) · JpaBudgetAdapter(@Primary) · JpaBudgetAlertAdapter(@Primary) · TransactionReadAdapter
  api/controller: PfmController (/api/v1/pfm)
  api/advice: PfmExceptionHandler

## Estructura Angular — features/pfm/
  pfm-page(Smart·tabs) · pfm-overview(Smart) · pfm-movimiento-row(Presentational)
  category-edit-modal(MatDialog) · budget-list(Smart) · budget-progress-bar(Presentational)
  budget-form(Smart·ReactiveForm) · pfm-analysis(Smart·barras·nav) · pfm-distribution(Smart·donut)
  pfm-widget(Presentational·async·degradación elegante)
  services/pfm.service.ts | models/pfm.models.ts

## Mapa de tipos BD→Java (LA-019-13)
| Columna | PostgreSQL | Java |
|---|---|---|
| id / user_id / budget_id | uuid | UUID |
| amount_limit | numeric(15,2) | BigDecimal (HALF_EVEN ADR-034) |
| threshold_percent / priority | int | int |
| budget_month / alert_month | varchar(7) | YearMonth (YYYY-MM) |
| concept_pattern | varchar(200) | String |
| category_code | varchar(30) | PfmCategory (Enum.name()) |
| created_at / updated_at / emitted_at | timestamptz | Instant |

## Estrategia de perfiles (LA-019-08)
Todos los adapters JPA: @Primary sin @Profile → activos en dev/staging/production
Mocks: @Profile("mock") únicamente para tests unitarios

## Flyway V28 — Tablas nuevas
pfm_category_rules · pfm_user_rules · pfm_budgets · pfm_budget_alerts
Seed ≥50 reglas categorización en V28

## RNF cubiertos
RNF-D023-01 p95<400ms → índice (concept_pattern) en pfm_category_rules
RNF-D023-02 p95<300ms → query agregado con índice (user_id, budget_month)
RNF-D023-03 widget async → degradación elegante sin romper dashboard
RNF-D023-04 GDPR → pfm_user_rules incluida en flujo supresión FEAT-019
RNF-D023-06 5000 tx/usuario → validado en TransactionReadAdapter con LIMIT
