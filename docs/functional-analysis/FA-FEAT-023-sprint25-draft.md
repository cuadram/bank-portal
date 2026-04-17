# FA-FEAT-023 · Mi Dinero — Gestor de Finanzas Personales (PFM)
**Sprint 25 · Banco Meridian · BankPortal**
**Estado:** DRAFT · **Fecha:** 2026-04-16 · **FA-Agent:** v2.7

---

## Contexto de negocio

El módulo **Mi Dinero** introduce capacidades de Gestión de Finanzas Personales (PFM) nativas en BankPortal, respondiendo a la demanda creciente de los clientes de banca digital por herramientas de control financiero integradas en su banco habitual. El PFM elimina la necesidad de aplicaciones de terceros (Fintonic, Money Manager, YNAB) y refuerza el posicionamiento de Banco Meridian en el segmento de banca digital innovadora frente a neobancos como N26, Revolut y Monzo.

La funcionalidad opera sobre los datos de movimientos ya existentes en BankPortal (FEAT-001 Cuentas, FEAT-002 Movimientos, FEAT-018 Domiciliaciones) enriqueciéndolos con una capa de inteligencia financiera sin requerir integración con entidades externas.

**Regulación aplicable:** GDPR Art.6 (base legal tratamiento datos financieros personales) · PSD2 Art.67 (acceso datos cuenta propio titular) · GDPR Art.17 (derecho supresión aplica a pfm_user_rules)

---

## Funcionalidades PFM — Sprint 25

### FA-PFM-001 · Categorización automática de movimientos

El sistema clasifica cada movimiento CARGO de la cuenta del cliente en una de las 14 categorías predefinidas (Alimentación, Transporte, Restaurantes, Salud, Hogar, Suministros, Comunicaciones, Ocio, Educación, Viajes, Seguros, Nómina, Transferencias, Otros) aplicando un motor de reglas que compara el concepto del movimiento con patrones conocidos de comercios y entidades. Las reglas personalizadas del usuario tienen prioridad permanente sobre las reglas del sistema.

**Reglas de negocio:** RN-F023-01 · RN-F023-02 · RN-F023-03

**Valor para el cliente:** visibilidad inmediata de en qué gasta su dinero sin ningún esfuerzo manual. El cliente de Banco Meridian obtiene en su próximo acceso al portal una vista estructurada de todos sus movimientos históricos clasificados por tipo de gasto.

---

### FA-PFM-002 · Gestión de presupuestos mensuales por categoría

El cliente puede establecer un límite mensual de gasto para cada categoría de su interés. El portal muestra en tiempo real el porcentaje consumido de cada presupuesto mediante una barra de progreso con código de color semafórico: verde mientras el gasto está por debajo del 80%, naranja entre el 80% y el 100%, y rojo cuando se supera el importe establecido. Los presupuestos son mensuales recurrentes: el consumo se reinicia al inicio de cada mes manteniendo el importe configurado como referencia.

**Límites:** máximo 10 presupuestos activos · 1 por categoría · importes entre 0,01 EUR y 99.999,99 EUR

**Reglas de negocio:** RN-F023-04 · RN-F023-05 · RN-F023-06 · RN-F023-07

**Valor para el cliente:** control proactivo del gasto mensual con visibilidad instantánea del estado de cada área de consumo.

---

### FA-PFM-003 · Alertas de gasto por umbral configurable

Cuando el gasto acumulado en una categoría alcanza el porcentaje configurado del presupuesto correspondiente, el sistema emite automáticamente una notificación push al cliente a través del centro de notificaciones del portal. El umbral es configurable entre el 50% y el 95% del importe del presupuesto. La alerta se emite una única vez por presupuesto y por mes para evitar saturar al cliente con notificaciones repetidas.

**Integración:** sistema de notificaciones push FEAT-014 · tipo BUDGET_ALERT · acción /pfm/presupuestos

**Reglas de negocio:** RN-F023-08 · RN-F023-09 · RN-F023-10 · RN-F023-11

**Valor para el cliente:** capacidad de reacción anticipada ante desviaciones de gasto, antes de superar el límite establecido.

---

### FA-PFM-004 · Análisis mensual comparativo de gasto

Mi Dinero ofrece una vista analítica del gasto del cliente desglosada por categoría con comparación directa con el mes anterior. El análisis incluye el total gastado en cada período, el porcentaje de variación por categoría (con indicadores visuales de aumento en rojo y reducción en verde) y la posibilidad de navegar por los últimos 12 meses de historial. La vista es interactiva: pulsando sobre una categoría el cliente accede al detalle de los movimientos de ese período.

**Reglas de negocio:** RN-F023-12 · RN-F023-13 · RN-F023-14

**Valor para el cliente:** identificación de tendencias de consumo y detección de desviaciones respecto a meses anteriores para una toma de decisiones financieras más informada.

---

### FA-PFM-005 · Widget resumen financiero en dashboard principal

El dashboard principal de BankPortal incorpora un widget de resumen de finanzas personales que proporciona visibilidad inmediata de la situación financiera mensual del cliente sin necesidad de acceder al módulo completo de Mi Dinero. El widget muestra el gasto total del mes, las tres categorías con mayor importe y un semáforo global de estado de los presupuestos. La carga es asíncrona para garantizar que el dashboard principal siempre responde con rapidez independientemente del estado del módulo PFM.

**Reglas de negocio:** RN-F023-15 · RN-F023-16

**Valor para el cliente:** acceso inmediato al estado financiero mensual en la pantalla de inicio del portal, reforzando el hábito de uso diario de BankPortal.

---

### FA-PFM-006 · Edición manual de categoría con aprendizaje

Cuando la categorización automática no refleja correctamente el tipo de gasto del cliente, este puede corregirla directamente desde el detalle del movimiento. Tras la corrección el sistema almacena una regla personalizada que asocia el comercio o concepto del movimiento a la categoría elegida, aplicándola automáticamente a todos los movimientos futuros del mismo origen. El cliente puede gestionar sus reglas personalizadas desde la sección de configuración de Mi Dinero, con un límite de 50 reglas activas por usuario.

**Reglas de negocio:** RN-F023-17 · RN-F023-18 · RN-F023-19

**Valor para el cliente:** análisis financiero personalizado y preciso que refleja los hábitos reales del cliente, mejorando con el uso continuado del servicio.

---

### FA-PFM-007 · Distribución de gasto y ranking de comercios

Mi Dinero presenta la distribución porcentual del gasto del mes en curso mediante un gráfico visual por categoría, excluyendo ingresos y transferencias internas para mostrar únicamente el gasto real. Complementariamente ofrece el ranking de los diez comercios donde el cliente concentra mayor importe, consolidando tanto los pagos de domiciliaciones como las transacciones de cargo en un único ranking unificado. El cliente puede hacer drill-down en cualquier comercio del ranking para ver el detalle de sus transacciones en el período. Esta funcionalidad incorpora la corrección de la deuda técnica DEBT-047.

**Reglas de negocio:** RN-F023-20 · RN-F023-21 · RN-F023-22

**Valor para el cliente:** visión completa y consolidada de los patrones de consumo con identificación inmediata de los principales destinos del gasto mensual.

---

## Resumen de cobertura FEAT-023

| Elemento | Cantidad |
|---|---|
| Funcionalidades FA documentadas | 7 (FA-PFM-001..007) |
| Reglas de negocio nuevas | 22 (RN-F023-01..22) |
| Actores involucrados | Cliente Banco Meridian · Sistema de Notificaciones |
| Regulaciones aplicables | GDPR Art.6 · GDPR Art.17 · PSD2 Art.67 · WCAG 2.1 AA |
| Deuda técnica cerrada | DEBT-047 (FA-PFM-007) |
| Integraciones con features previas | FEAT-001 · FEAT-002 · FEAT-014 · FEAT-018 · FEAT-019 |

---

## FA acumulativo post-FEAT-023

| Métrica | Antes (S24) | Después (S25) | Δ |
|---|---|---|---|
| Funcionalidades totales | 93 | **100** | +7 |
| Reglas de negocio | 209 | **231** | +22 |
| Sprints cubiertos | S1-S24 | S1-S25 | +1 |
| Versión FA | v0.6 | v0.7 (en Gate 8b) | — |

---
*FA-Agent v2.7 · SOFIA v2.7 · Sprint 25 · FEAT-023 · BankPortal · Banco Meridian*
*Estado: DRAFT — pendiente enriquecimiento arquitectónico en Gate 3b*
