# Release Notes — v1.25.0 · BankPortal · Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| **Fecha release** | 2026-04-16 |
| **Sprint** | 25 · FEAT-023 Mi Dinero PFM |
| **Servicios** | bankportal-backend · bankportal-frontend |
| **Release Manager** | pendiente G-7 |
| **Release anterior** | v1.24.0 (Bizum P2P · Sprint 24) |

---

## Nueva funcionalidad — FEAT-023: Mi Dinero (Gestor de Finanzas Personales)

BankPortal incorpora el primer modulo de gestion financiera personal (PFM) nativo, posicionando la plataforma como referente de banca digital inteligente frente a N26, Revolut y Monzo.

**US-F023-01 — Categorizacion automatica de movimientos**
Los movimientos CARGO se clasifican automaticamente en 14 categorias (Alimentacion, Transporte, Restaurantes, Salud, Hogar, Suministros, Comunicaciones, Ocio, Educacion, Viajes, Seguros, Nomina, Transferencias, Otros) mediante 72 reglas ILIKE sobre el concepto del movimiento. Las reglas del usuario tienen prioridad sobre las del sistema. La categoria se calcula en tiempo de consulta; solo el override manual se persiste.

**US-F023-02 — Presupuestos mensuales por categoria**
El cliente puede configurar hasta 10 presupuestos mensuales (1 por categoria/mes, importe 0,01-99.999,99 EUR). La barra de progreso muestra semaforo verde/naranja/rojo segun consumo.

**US-F023-03 — Alertas de gasto por umbral configurable**
Notificacion push BUDGET_ALERT al superar el umbral configurado (50-95%, pasos de 5%). Una sola alerta por presupuesto y mes. Accion de navegacion: /pfm/presupuestos.

**US-F023-04 — Analisis mensual comparativo**
Vista grafica de barras dobles (mes actual vs anterior) por categoria. Navegacion a los ultimos 12 meses. Solo categorias con al menos 1 CARGO.

**US-F023-05 — Widget "Como voy este mes" en dashboard**
Widget asincrono con gasto total, top-3 categorias coloreadas y semaforo de presupuestos. Degradacion elegante si el endpoint PFM falla sin romper el dashboard. Navegacion via Router.navigateByUrl (LA-023-01).

**US-F023-06 — Edicion manual de categoria con aprendizaje**
El cliente puede recategorizar cualquier movimiento CARGO. El sistema persiste la regla en pfm_user_rules (maximo 50 por usuario) para aplicarla a futuros movimientos del mismo comercio. Los ABONO no son recategorizables.

**US-F023-07 — Distribucion de gasto y top-10 comercios**
Grafico de distribucion porcentual por categoria (CSS conic-gradient). Ranking top-10 comercios unificando bill_payments y transactions. Cierra DEBT-047.

---

## Deuda tecnica cerrada

**DEBT-047** — findTopMerchants unificado: la consulta ahora combina bill_payments.biller_name y transactions.concept (primer token mayor de 4 caracteres) mediante UNION ALL, excluyendo AEAT, TGSS, SUMA y transferencias propias.

---

## Cambios de infraestructura

- **Flyway V28** — 4 nuevas tablas: pfm_category_rules, pfm_user_rules, pfm_budgets, pfm_budget_alerts. Seed de 72 reglas de categorizacion.
- **Angular** — Modulo /pfm lazy-loaded con 10 componentes. Ruta registrada en app-routing.module.ts. Item "Mi Dinero" en sidebar.
- **Dashboard** — Slot PfmWidgetComponent integrado en dashboard.component.ts.

---

## Breaking changes

Ninguno. Todos los endpoints existentes mantienen compatibilidad. Las nuevas tablas PFM son aditivas.

---

## Variables de entorno nuevas

Ninguna. El modulo PFM usa la conexion PostgreSQL y Redis ya configurados.

---

## Servicios desplegados

| Servicio | Version anterior | Version nueva |
|---|---|---|
| bankportal-backend | v1.24.0 | v1.25.0 |
| bankportal-frontend | v1.24.0 | v1.25.0 |

---

## Instrucciones de despliegue

```bash
# 1. Confirmar que la imagen esta disponible
docker pull bankportal-backend:v1.25.0
docker pull bankportal-frontend:v1.25.0

# 2. Actualizar docker-compose.yml con los nuevos tags

# 3. Desplegar
docker compose -f infra/compose/docker-compose.yml up -d

# 4. Verificar Flyway V28
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT version, description, success FROM flyway_schema_history WHERE version='28';"

# 5. Ejecutar smoke test
chmod +x infra/compose/smoke-test-v1.25.0.sh
./infra/compose/smoke-test-v1.25.0.sh
```

---

## Rollback a v1.24.0

Ver RUNBOOK-backend-v1.25.0.md — seccion "Procedimiento de rollback". RTO 10 min.

---

*DevOps Agent · SOFIA v2.7 · Sprint 25 · FEAT-023 · BankPortal · Banco Meridian*
