# FEAT-007 — Consulta de Cuentas y Movimientos

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-007 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Operaciones Bancarias (nueva épica) |
| Solicitante | Producto Digital + Operaciones — Banco Meridian |
| Fecha creación | 2026-03-17 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Rama git | `feature/FEAT-007-sprint9` |

---

## Descripción de negocio

Con la plataforma de seguridad completamente operativa (FEAT-001→006, 192 SP entregados),
BankPortal dispone de autenticación robusta, gestión de sesiones/dispositivos, notificaciones
en tiempo real, auditoría inmutable y protección proactiva ante fraude.

FEAT-007 abre la épica de **Operaciones Bancarias**: permite al usuario consultar el saldo
y movimientos de sus cuentas, buscar transacciones y descargar extractos certificados.
Es el caso de uso con mayor retorno percibido por el cliente final — el momento en que el
portal deja de ser una herramienta de seguridad y se convierte en la ventanilla digital
completa del banco.

Todos los accesos a información de cuentas quedan auditados automáticamente en `audit_log`
(FEAT-005) y protegidos por el flujo de autenticación contextual (FEAT-006).

---

## Objetivo y valor de negocio

- **Autoservicio financiero**: el usuario consulta su posición financiera sin acudir a oficina ni llamar al servicio de atención
- **Reducción de carga operativa**: estimación Banco Meridian de reducción del 35% en consultas por saldo/movimientos al call center
- **Retención digital**: el acceso a información de cuentas aumenta la frecuencia de sesiones y la adopción del portal
- **Cumplimiento PSD2 Art. 67**: acceso del cliente a su información de cuentas en plataformas propias del banco
- **KPI**: tasa de consulta mensual ≥ 70% de usuarios activos · tiempo medio de consulta ≤ 3 segundos p95

---

## Alcance funcional

### Incluido en FEAT-007
- Vista de resumen: todas las cuentas del usuario con saldo disponible y retenido
- Listado de movimientos paginado (20/página) con filtros por fecha, tipo e importe
- Búsqueda de movimientos por concepto, importe exacto o rango de fechas
- Descarga de extracto mensual en PDF (certificado con hash SHA-256) y CSV
- Categorización automática de movimientos por tipo (domiciliaciones, nómina, compras, transferencias)
- Deuda técnica integrada: DEBT-011 (Redis Pub/Sub SSE) y DEBT-012 (purga notificaciones)

### Excluido (backlog futuro)
- Transferencias entre cuentas (FEAT-008 — siguiente épica)
- Pagos de servicios y facturas (FEAT-009)
- Análisis de gastos con gráficos históricos (FEAT-010)
- Alertas de saldo mínimo (FEAT-010)
- Acceso a productos de ahorro e inversión (backlog largo plazo)

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| JWT + SecurityFilterChain (FEAT-001) | Seguridad | ✅ Operativo |
| `audit_log` inmutable (FEAT-005) | BD | ✅ Operativo |
| Autenticación contextual (FEAT-006) | Seguridad | ✅ Operativo |
| `JwtBlacklistService` Redis (DEBT-009) | Infra | ✅ Sprint 8 |
| API core bancario / adaptador cuentas | Integración | ⚠️ Mock en Sprint 9 · real en Sprint 10 |
| Tabla `accounts` + `transactions` (BD) | BD | ⚠️ Flyway V10 — Sprint 9 día 1 |
| `SseRegistry` (FEAT-004/DEBT-011) | Infra | ⚠️ DEBT-011 precede US-701 |
| Generación PDF (OpenPDF) | Librería | ✅ Disponible desde FEAT-005 |

---

## User Stories

| ID | Título | SP | Prioridad | Sprint semana |
|---|---|---|---|---|
| DEBT-011 | Redis Pub/Sub para SSE escalado horizontal | 3 | Must Have | S1 |
| DEBT-012 | Job nocturno purga user_notifications >90d | 2 | Must Have | S1 |
| US-701 | Ver resumen de cuentas con saldo | 3 | Must Have | S1 |
| US-702 | Consultar movimientos paginados con filtros | 5 | Must Have | S1 |
| US-703 | Buscar movimiento por concepto, importe o fecha | 3 | Must Have | S2 |
| US-704 | Descargar extracto mensual PDF / CSV | 4 | Should Have | S2 |
| US-705 | Categorización automática de movimientos | 3 | Should Have | S2 |

**Total estimado: 23 SP** (dentro de la capacidad referencia de 24 SP)

---

## User Stories — detalle completo

---

### DEBT-011 — Redis Pub/Sub para SSE escalado horizontal

**Como** arquitecto de la plataforma,
**quiero** implementar Redis Pub/Sub como broker de eventos SSE,
**para** que las notificaciones en tiempo real funcionen correctamente en un entorno multi-pod.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Evento SSE broadcast multi-pod
  Dado que hay 2 instancias del backend corriendo en paralelo
  Cuando se genera un evento de seguridad (ej. nuevo login)
  Entonces el evento llega al cliente SSE independientemente de a qué pod está conectado
  Y la entrega ocurre en ≤ 500ms desde la publicación en Redis

Escenario 2: Reconexión tras caída de un pod
  Dado que el pod al que está conectado el cliente SSE cae
  Cuando el cliente reconecta (≤ 5s — comportamiento existente US-305)
  Entonces reconecta al pod disponible y recibe los eventos perdidos desde el último EventID

Escenario 3: Redis no disponible — fallback graceful
  Dado que Redis no está disponible
  Cuando se publica un evento SSE
  Entonces el sistema usa el canal en memoria (SseRegistry local) como fallback
  Y loguea la degradación como WARN en sofia.log
  Y no hay pérdida de funcionalidad para usuarios en instancia única
```

#### Notas técnicas
- Patrón: `RedisMessageListenerContainer` + `MessageListenerAdapter` en Spring
- Channel naming: `sse:events:{userId}` para mensajes dirigidos, `sse:events:broadcast` para globales
- `SseRegistry` mantiene las conexiones locales por pod; Redis propaga cross-pod
- ADR-014 requerido antes del desarrollo (diseño Pub/Sub + fallback)

---

### DEBT-012 — Job nocturno purga user_notifications >90d

**Como** administrador de la plataforma,
**quiero** que las notificaciones con más de 90 días se purguen automáticamente,
**para** evitar crecimiento ilimitado de la tabla `user_notifications`.

**Estimación:** 2 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Purga automática nocturna
  Dado que existen notificaciones con created_at < NOW() - 90 días
  Cuando el job @Scheduled se ejecuta a las 02:00 UTC
  Entonces se eliminan todas las notificaciones con más de 90 días
  Y audit_log registra: cantidad purgada, tiempo de ejecución, fecha

Escenario 2: Job idempotente — sin dobles ejecuciones
  Dado que el job se lanza dos veces seguidas (reinicio del pod a las 02:00)
  Cuando la segunda ejecución corre con la tabla ya purgada
  Entonces no falla y registra "0 notificaciones purgadas"

Escenario 3: Notificaciones recientes no afectadas
  Dado que existen notificaciones de hace 89 días
  Cuando el job ejecuta la purga
  Entonces esas notificaciones NO se eliminan (límite exclusivo: > 90 días)
```

#### Notas técnicas
- Cron: `@Scheduled(cron = "0 0 2 * * *")` — 02:00 UTC diario
- Patrón existente: `@Scheduled` ya usado en `SseHeartbeatScheduler` (Sprint 8)
- Batch delete con `DELETE FROM user_notifications WHERE created_at < :cutoff`
- Métrica: log estructurado `purge.notifications.count` para monitorización

---

### US-701 — Ver resumen de cuentas con saldo

**Como** usuario autenticado,
**quiero** ver un resumen de todas mis cuentas bancarias con saldo disponible,
**para** tener una visión inmediata de mi posición financiera al entrar al portal.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Vista de resumen de cuentas
  Dado que el usuario tiene 2 cuentas en Banco Meridian (corriente + ahorro)
  Cuando accede a "Inicio" o "Mis cuentas"
  Entonces ve una tarjeta por cuenta con:
    - Alias o nombre de la cuenta (ej. "Cuenta corriente", "Cuenta ahorro")
    - IBAN enmascarado (primeros 4 + últimos 4 dígitos)
    - Saldo disponible en EUR con 2 decimales
    - Saldo retenido si existe (con tooltip explicativo)
    - Indicador visual de tipo de cuenta (icono)
  Y la carga completa en ≤ 2 segundos (p95)

Escenario 2: Saldo actualizado en tiempo real (SSE)
  Dado que el usuario tiene el portal abierto
  Cuando se procesa un movimiento en su cuenta
  Entonces el saldo en la tarjeta se actualiza automáticamente vía SSE
  Sin necesidad de recargar la página

Escenario 3: Sin cuentas activas
  Dado que el usuario no tiene cuentas activas en el sistema
  Cuando accede a "Mis cuentas"
  Entonces ve un mensaje "No tienes cuentas activas. Contacta con tu oficina."

Escenario 4: Acceso auditado
  Dado que el usuario consulta sus cuentas
  Entonces audit_log registra ACCOUNT_BALANCE_VIEWED con userId, timestamp e IP enmascarada
```

#### Notas técnicas
- `AccountSummaryUseCase` → `AccountRepositoryPort` (adaptador mock Sprint 9 / real Sprint 10)
- DTO: `AccountSummaryDto { accountId, alias, ibanMasked, availableBalance, retainedBalance, type }`
- Angular: `AccountSummaryComponent` con Signals + `SseNotificationService` para actualización reactiva
- Flyway V10: tablas `accounts` y `account_balances` (datos mock para desarrollo)

---

### US-702 — Consultar movimientos paginados con filtros

**Como** usuario autenticado,
**quiero** ver el historial de movimientos de una cuenta con filtros por fecha, tipo e importe,
**para** revisar mi actividad financiera de forma eficiente.

**Estimación:** 5 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Listado de movimientos paginado
  Dado que selecciono una cuenta con movimientos
  Cuando accedo a "Ver movimientos"
  Entonces veo una lista paginada (20 por página) con:
    - Fecha y hora del movimiento
    - Concepto / descripción
    - Importe (en verde si es ingreso, en rojo si es cargo)
    - Saldo resultante tras el movimiento
    - Categoría asignada (US-705)
  Y los movimientos están ordenados por fecha DESC

Escenario 2: Filtrar por rango de fechas
  Dado que selecciono "Último mes" como filtro de fecha
  Cuando aplico el filtro
  Entonces veo solo movimientos de los últimos 30 días
  Y el contador muestra el total de resultados filtrados

Escenario 3: Filtrar por tipo de movimiento
  Dado que selecciono el filtro "Solo cargos"
  Cuando aplico el filtro
  Entonces veo solo movimientos con importe negativo
  Y puedo combinar filtros (fecha + tipo simultáneamente)

Escenario 4: Filtrar por rango de importe
  Dado que introduzco "Importe entre 100€ y 500€"
  Cuando aplico el filtro
  Entonces veo solo movimientos cuyo importe absoluto está en ese rango

Escenario 5: Sin movimientos en el período seleccionado
  Dado que no hay movimientos en el rango de fechas seleccionado
  Entonces veo un estado vacío con mensaje "No hay movimientos en el período seleccionado"
```

#### Notas técnicas
- `TransactionHistoryUseCase` — paginación via `Pageable` Spring Data
- API: `GET /api/v1/accounts/{accountId}/transactions?page=0&size=20&from=&to=&type=&minAmount=&maxAmount=`
- Respuesta: `Page<TransactionDto>` con `{ id, date, concept, amount, balanceAfter, category, type }`
- Angular: `TransactionListComponent` con virtual scroll (`@angular/cdk/scrolling`) para listas largas
- Caché: `@Cacheable("transactions")` con TTL 30s — invalidar en nuevos movimientos vía SSE

---

### US-703 — Buscar movimiento por concepto, importe o fecha

**Como** usuario autenticado,
**quiero** buscar movimientos específicos por concepto, importe exacto o fecha,
**para** localizar rápidamente una transacción sin revisar todo el historial.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Búsqueda por concepto (texto libre)
  Dado que introduzco "IKEA" en el buscador de movimientos
  Cuando ejecuto la búsqueda
  Entonces veo todos los movimientos cuyo concepto contiene "IKEA" (case-insensitive)
  Y los resultados se muestran resaltando el término buscado

Escenario 2: Búsqueda por importe exacto
  Dado que introduzco "123.45" en el campo de búsqueda
  Cuando ejecuto la búsqueda
  Entonces veo todos los movimientos con importe absoluto de 123.45 EUR

Escenario 3: Búsqueda por fecha exacta
  Dado que introduzco "15/02/2026" como fecha de búsqueda
  Cuando ejecuto la búsqueda
  Entonces veo todos los movimientos del 15 de febrero de 2026

Escenario 4: Sin resultados
  Dado que la búsqueda no encuentra coincidencias
  Entonces veo "No se encontraron movimientos para tu búsqueda"
  Y un botón "Limpiar búsqueda" para resetear los filtros

Escenario 5: Búsqueda combinada
  Dado que busco "NETFLIX" con filtro "Último año"
  Cuando aplico la búsqueda
  Entonces veo solo los cobros de Netflix en los últimos 12 meses
```

#### Notas técnicas
- Backend: búsqueda con `LIKE %query%` en `concept` + índice full-text en PostgreSQL
- Mínimo 3 caracteres para activar la búsqueda (evitar queries masivos)
- Debounce de 300ms en Angular antes de lanzar la petición
- Integrar con `TransactionHistoryUseCase` como filtro adicional

---

### US-704 — Descargar extracto mensual PDF / CSV

**Como** usuario autenticado,
**quiero** descargar el extracto de movimientos de un mes en PDF o CSV,
**para** tener un registro descargable para justificantes, contabilidad o requerimientos legales.

**Estimación:** 4 SP | **Prioridad:** Should Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Descarga de extracto PDF
  Dado que selecciono la cuenta y el mes (ej. "Febrero 2026")
  Cuando hago clic en "Descargar extracto → PDF"
  Entonces se genera y descarga un PDF con:
    - Cabecera: logo Banco Meridian, nombre del titular, IBAN completo, período
    - Tabla de movimientos: fecha, concepto, importe, saldo tras movimiento
    - Resumen final: total ingresos, total cargos, saldo inicial, saldo final
    - Pie de página: fecha de generación, hash SHA-256 de integridad
  Y el PDF se descarga en ≤ 5 segundos para extractos de hasta 500 movimientos

Escenario 2: Descarga de extracto CSV
  Dado que selecciono formato CSV
  Cuando confirmo la descarga
  Entonces se descarga un CSV con cabeceras en la primera fila:
    fecha;concepto;importe;saldo_tras_movimiento;categoria
  Y el encoding es UTF-8 con BOM (compatible con Excel)

Escenario 3: Mes sin movimientos
  Dado que selecciono un mes donde no hay movimientos registrados
  Entonces recibo HTTP 204 con mensaje "No hay movimientos en el período seleccionado"

Escenario 4: Extracto auditado
  Dado que el usuario descarga un extracto
  Entonces audit_log registra STATEMENT_DOWNLOADED con userId, cuenta, período y formato
```

#### Notas técnicas
- Reutilizar `ExportSecurityHistoryUseCase` de FEAT-005 como patrón (OpenPDF, @Async, streaming)
- PDF: plantilla corporativa Banco Meridian con `#1B3A6B` header (coherente con docs SOFIA)
- Hash SHA-256 en pie de página — mismo patrón que extracto de seguridad (FEAT-005 US-402)
- Endpoint: `GET /api/v1/accounts/{accountId}/statements/{year}/{month}?format=pdf|csv`

---

### US-705 — Categorización automática de movimientos

**Como** usuario autenticado,
**quiero** que mis movimientos aparezcan categorizados automáticamente,
**para** entender de un vistazo en qué categoría cae cada gasto o ingreso.

**Estimación:** 3 SP | **Prioridad:** Should Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Categorización automática en carga
  Dado que cargo el listado de movimientos
  Cuando el sistema procesa cada movimiento
  Entonces cada movimiento tiene una categoría asignada:
    NOMINA, TRANSFERENCIA, COMPRA, DOMICILIACION, CAJERO,
    COMISION, DEVOLUCION, BIZUM, RECIBO_UTIL, OTRO
  Y la categoría se muestra con icono y color diferenciado

Escenario 2: Reglas de categorización por concepto
  Dado que el concepto del movimiento contiene "NOMINA" o "SALARY"
  Entonces la categoría asignada es NOMINA
  Y el importe se muestra en verde independientemente del signo

Escenario 3: Categoría OTRO para movimientos no reconocidos
  Dado que el concepto no encaja en ninguna regla
  Entonces la categoría es OTRO
  Y el movimiento se muestra sin icono especial

Escenario 4: Filtrar movimientos por categoría
  Dado que selecciono la categoría "DOMICILIACION" en el filtro
  Cuando aplico el filtro
  Entonces veo solo los movimientos categorizados como DOMICILIACION
```

#### Notas técnicas
- `TransactionCategorizationService` — reglas basadas en keywords en `concept` (sin ML en Sprint 9)
- Enum `TransactionCategory` con 10 valores + lógica de matching case-insensitive
- Categorización lazy: se asigna al leer el movimiento, se persiste en `transactions.category`
- Reglas básicas Sprint 9; ML-based en backlog futuro (FEAT-010)
- Angular: paleta de colores por categoría usando CSS variables del sistema

---

## Riesgos FEAT-007

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F7-001 | API core bancario no disponible en Sprint 9 | A | A | 🔴 Alta | Mock completo con datos realistas desde día 1; adaptador con interfaz sellada para swap en Sprint 10 |
| R-F7-002 | Volumen de movimientos — queries lentas sin índices | M | M | 🟡 Media | Flyway V10 incluye índices en `transactions(account_id, created_at)` desde el inicio |
| R-F7-003 | DEBT-011 Redis Pub/Sub bloquea US-701 si no se completa en S1 | M | M | 🟡 Media | DEBT-011 es el primer ítem del sprint; US-701 empieza en paralelo con mock SSE |
| R-F7-004 | Extracto PDF tarda > 5s para cuentas con muchos movimientos | B | B | 🟢 Baja | Límite de 500 movimientos por extracto + `@Async` (patrón FEAT-005) |
| R-F7-005 | Datos financieros en caché — riesgo de mostrar saldo desactualizado | M | M | 🟡 Media | TTL de caché 30s máximo + invalidación activa vía SSE al recibir nuevo movimiento |
| R-F7-006 | Categorización incorrecta genera confusión en el usuario | B | B | 🟢 Baja | Categoría OTRO como fallback siempre presente; categorización mejorable en FEAT-010 |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio claro (PSD2 Art. 67 + KPIs definidos)
- [x] 7 ítems (5 US + 2 DEBT) con criterios Gherkin completos
- [x] Estimación en SP: 23 SP (dentro de capacidad 24 SP)
- [x] Dependencias identificadas — riesgo R-F7-001 documentado con mitigación (mock)
- [x] Riesgos documentados con mitigación para los 6 riesgos identificados
- [x] Stack confirmado: Java/Spring Boot + Angular 17 + OpenPDF + Redis
- [x] ADR-014 requerido antes de DEBT-011 (diseño Redis Pub/Sub)
- [x] Flyway V10 diseñado (tablas accounts + transactions + índices)
- [x] Aprobación Product Owner pendiente — Gate 1 Sprint 9 Planning

---

## Sprint 9 — Release planning

| Release | Contenido | ETA |
|---|---|---|
| v1.8.0 | FEAT-004 + DEBT-009/010 | 2026-03-31 |
| **v1.9.0** | **FEAT-007 completo + DEBT-011/012** | **2026-04-14** |
| v2.0.0 | FEAT-008 Transferencias (siguiente épica) | 2026-04-28 |

---

*Generado por SOFIA Requirements Analyst Agent · BankPortal Sprint 9 Planning · 2026-03-17*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1 · REQM SP 1.1*
