# SRS — FEAT-007 Consulta de Cuentas y Movimientos
## BankPortal · Banco Meridian
*SOFIA Requirements Analyst · Sprint 9 · 2026-03-19*

## 1. Metadata
| Campo | Valor |
|---|---|
| Feature ID | FEAT-007 |
| Proyecto | BankPortal — Banco Meridian |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Tipo | new-feature |
| Sprint objetivo | 9 · 20 mar → 2 abr 2026 |
| Prioridad | Alta (P1) — primera épica Operaciones Bancarias |
| Solicitado por | Product Owner |
| Versión | 1.0 · Estado: APPROVED |

## 2. Descripción del sistema / contexto

Con FEAT-001→006 operativos, BankPortal cubre completamente la capa de identidad y
seguridad. FEAT-007 inaugura la épica Operaciones Bancarias: el usuario puede consultar
sus cuentas y movimientos — la función nuclear de cualquier portal bancario.

El actor principal es el usuario autenticado con JWT full-session que necesita conocer
su posición financiera en tiempo real. Esta feature también salda DEBT-011 (Redis Pub/Sub
para SSE multi-pod) y DEBT-012 (purga automática de notificaciones > 90 días).

## 3. Alcance

### Incluido
- Listado de cuentas con saldo actualizado en tiempo real
- Historial de movimientos paginado con filtros
- Búsqueda de movimientos por importe, fecha y concepto
- Descarga de extracto PDF (30/90/365 días)
- Resumen visual de gastos por categoría
- Redis Pub/Sub para SSE multi-pod (DEBT-011)
- Job nocturno de purga de notificaciones >90 días (DEBT-012)

### Excluido
- Transferencias entre cuentas (FEAT-008)
- Pagos y domiciliaciones (backlog futuro)
- Exportación OFX/CSV (backlog futuro)

## 4. Épica

**EPIC-002: Operaciones Bancarias**
Permitir al usuario gestionar su posición financiera completa desde el portal.
Transforma BankPortal de un portal de identidad en una ventanilla digital operativa.

## 5. User Stories

### US-701: Consultar listado de cuentas con saldo actualizado
**Como** usuario autenticado,
**quiero** ver el listado de todas mis cuentas bancarias con su saldo actualizado,
**para** conocer mi posición financiera de un vistazo al acceder al portal.

**SP:** 3 | **Prioridad:** Must Have | **Dependencias:** ninguna

```gherkin
Scenario: Consulta exitosa del listado de cuentas
  Given que el usuario tiene sesión JWT full-session activa
  And tiene 2 cuentas asociadas en el sistema
  When accede a la sección "Mis Cuentas"
  Then ve una tarjeta por cada cuenta con alias, IBAN enmascarado (****1234),
       tipo de cuenta, saldo disponible y saldo contable
  And los saldos reflejan el estado en tiempo real (timestamp visible)
  And la carga inicial se completa en < 1s (p95)

Scenario: Usuario sin cuentas asociadas
  Given que el usuario autenticado no tiene cuentas asociadas
  When accede a "Mis Cuentas"
  Then ve empty state: "Aún no tienes cuentas asociadas. Contacta con tu oficina."
  And no se muestra ningún error de sistema

Scenario: Error de servicio en la consulta de saldos
  Given que el servicio de cuentas está temporalmente no disponible
  When el usuario accede a "Mis Cuentas"
  Then ve las tarjetas con indicador "Saldo no disponible"
  And mensaje: "No podemos actualizar los saldos en este momento"
  And los datos de cuenta (alias, IBAN) se muestran desde caché local
```

### US-702: Ver historial de movimientos paginado con filtros
**Como** usuario autenticado,
**quiero** consultar el historial de movimientos de una cuenta con paginación y filtros,
**para** revisar mis transacciones recientes de forma organizada y eficiente.

**SP:** 4 | **Prioridad:** Must Have | **Dependencias:** US-701

```gherkin
Scenario: Carga inicial del historial de movimientos
  Given que el usuario selecciona una cuenta de su listado
  When accede al historial de movimientos
  Then ve los últimos 20 movimientos ordenados por fecha DESC (cursor-based)
  And cada movimiento muestra fecha, concepto, importe (+/-), saldo resultante, categoría
  And hay un botón "Cargar más" que trae los siguientes 20

Scenario: Filtrar por rango de fechas
  Given que el usuario está en el historial
  When selecciona "Desde: 01/01/2026 Hasta: 31/01/2026"
  Then el historial muestra únicamente los movimientos del período
  And el contador indica "X movimientos encontrados"
  And la paginación se reinicia desde el primero del período

Scenario: Filtrar por tipo de movimiento
  Given que el usuario está en el historial
  When selecciona el filtro "Tipo: Cargos"
  Then el historial muestra únicamente movimientos con importe negativo
  And el resumen del período muestra el total de cargos

Scenario: Historial sin movimientos en el período seleccionado
  Given que el usuario aplica un filtro sin movimientos
  When se ejecuta la consulta
  Then ve empty state: "No hay movimientos para el período seleccionado"
  And los filtros activos se muestran claramente para poder modificarlos
```

### US-703: Búsqueda de movimientos por importe, fecha y concepto
**Como** usuario autenticado,
**quiero** buscar movimientos específicos por concepto, importe o fecha,
**para** localizar transacciones concretas sin revisar todo el historial.

**SP:** 3 | **Prioridad:** Must Have | **Dependencias:** US-702

```gherkin
Scenario: Búsqueda por concepto con resultados
  Given que el usuario está en el historial de movimientos
  When escribe "Netflix" en el campo de búsqueda (debounce 300ms)
  Then el sistema devuelve todos los movimientos cuyo concepto contiene "netflix"
       (case-insensitive)
  And los términos buscados aparecen resaltados en los resultados

Scenario: Búsqueda por importe exacto
  Given que el usuario introduce "19.99" en el buscador
  When el sistema procesa la consulta
  Then devuelve todos los movimientos con importe exacto 19.99€ (cargo o abono)

Scenario: Búsqueda sin resultados
  Given que el usuario busca "XYZNOTEXISTS"
  When el sistema procesa la consulta
  Then muestra empty state: "No se encontraron movimientos que coincidan"
  And ofrece la opción de limpiar la búsqueda

Scenario: Búsqueda combinada con filtro de fechas activo
  Given que el usuario tiene activo el filtro "Últimos 30 días"
  When introduce "supermercado" en el buscador
  Then los resultados respetan ambos criterios: concepto + rango de fechas
  And se indican los criterios de búsqueda activos
```

### US-704: Descarga de extracto PDF
**Como** usuario autenticado,
**quiero** descargar el extracto de movimientos de mi cuenta en PDF,
**para** disponer de un documento oficial para gestiones bancarias o personales.

**SP:** 3 | **Prioridad:** Should Have | **Dependencias:** US-702

```gherkin
Scenario: Generación y descarga de extracto en PDF
  Given que el usuario está en el historial de una cuenta
  When selecciona "Descargar extracto" y elige "Últimos 30 días"
  Then el sistema genera el PDF en < 5s
  And el PDF incluye: cabecera Banco Meridian, IBAN, período,
      saldo inicial, listado de movimientos, saldo final
  And el nombre del archivo es "extracto-[IBAN-últimos4]-[YYYYMM].pdf"
  And la descarga se inicia vía signed URL (TTL 60s)

Scenario: Extracto para los tres rangos disponibles
  Given que el usuario hace clic en "Descargar extracto"
  When selecciona cualquiera de los rangos (30/90/365 días)
  Then el sistema genera el extracto del rango seleccionado

Scenario: Extracto sin movimientos en el período
  Given que el usuario solicita extracto de un período sin movimientos
  When el PDF se genera
  Then el documento indica "Sin movimientos para el período seleccionado"
  And se incluyen los datos de cuenta y saldo inicial/final
```

### US-705: Resumen visual de gastos por categoría
**Como** usuario autenticado,
**quiero** ver un resumen visual de mis gastos agrupados por categoría,
**para** entender en qué estoy gastando en el período actual.

**SP:** 2 | **Prioridad:** Could Have | **Dependencias:** US-702

```gherkin
Scenario: Visualización del resumen de categorías
  Given que el usuario tiene movimientos de cargo categorizados en el último mes
  When accede al "Resumen de gastos"
  Then ve un gráfico de donut con las top-5 categorías por importe
  And una categoría "Otros" agrupa el resto
  And al pasar el cursor sobre cada segmento ve: categoría, importe, % del total

Scenario: Período sin gastos categorizados
  Given que no hay movimientos de cargo en el período seleccionado
  When accede al resumen
  Then ve empty state: "No hay gastos registrados para este período"

Scenario: Cambio de período en el resumen
  Given que el usuario ve el resumen del mes actual
  When cambia el selector a "Últimos 3 meses"
  Then el gráfico se actualiza con los datos del nuevo período
  And los porcentajes se recalculan para el nuevo período
```

## 6. RNF Delta — FEAT-007
> Base: SRS Baseline BankPortal (RNF-001 a RNF-008 vigentes)

| ID | Categoría | Descripción | Criterio medible |
|---|---|---|---|
| RNF-D07-01 | Rendimiento | Consulta listado de cuentas | p95 < 500ms |
| RNF-D07-02 | Rendimiento | Consulta historial paginado | p95 < 800ms para 20 items |
| RNF-D07-03 | Rendimiento | Generación extracto PDF | < 5s para 365 días |
| RNF-D07-04 | Seguridad | Datos financieros en tránsito | TLS 1.3 mandatorio (PCI-DSS req. 4.2) |
| RNF-D07-05 | Seguridad | IBAN en respuestas API | Siempre enmascarado (****1234) salvo PDF firmado |
| RNF-D07-06 | Seguridad | Datos en STG | Exclusivamente sintéticos (PCI-DSS req. 3.4) |
| RNF-D07-07 | Escalabilidad | SSE multi-pod (DEBT-011) | Correcto en cluster ≥ 2 pods vía Redis Pub/Sub |

## 7. Restricciones
| ID | Tipo | Descripción |
|---|---|---|
| RR-07-01 | Normativa | PCI-DSS req. 3.4: IBAN nunca en texto plano en BD ni logs |
| RR-07-02 | Normativa | PCI-DSS req. 4.2: TLS 1.3 obligatorio en endpoints financieros |
| RR-07-03 | Normativa | GDPR Art. 25: privacy by design — datos mínimos en extracto PDF |
| RR-07-04 | Tecnología | JPA Specification para búsqueda dinámica |
| RR-07-05 | Tecnología | Cursor-based pagination (no offset) para historial |

## 8. RTM
| ID US | Proceso negocio | RF/RNF | Componente Arq. | Caso de prueba | Estado |
|---|---|---|---|---|---|
| US-701 | Consulta posición financiera | RF-701, RNF-D07-01, RNF-D07-05 | AccountService, AccountListComponent | *(QA step 6)* | APPROVED |
| US-702 | Historial movimientos | RF-702, RNF-D07-02, RR-07-05 | TransactionHistoryUseCase, TransactionListComponent | *(QA step 6)* | APPROVED |
| US-703 | Búsqueda transacciones | RF-703, RNF-D07-02 | TransactionSearchService, SearchFormComponent | *(QA step 6)* | APPROVED |
| US-704 | Extracto PDF oficial | RF-704, RNF-D07-03, RR-07-01 | StatementGeneratorService | *(QA step 6)* | APPROVED |
| US-705 | Análisis de gastos | RF-705 | CategorySummaryService, ChartComponent | *(QA step 6)* | APPROVED |
| DEBT-011 | SSE multi-pod | RNF-D07-07 | RedisMessageListenerContainer | *(QA step 6)* | APPROVED |
| DEBT-012 | Ciclo vida datos | RNF mantenimiento | NotificationPurgeJob | *(QA step 6)* | APPROVED |

## 9. Supuestos y dependencias
- FEAT-001/002/003/004/005/006 en PROD ✅
- Redis disponible en STG (ya usado por DEBT-009) ✅
- Datos sintéticos en STG cargados antes del inicio del sprint (R-S9-004)
- Categorización de movimientos basada en reglas del banco (no ML en esta fase)

*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1 · REQM SP 1.1*
*SOFIA Requirements Analyst · BankPortal Sprint 9 · 2026-03-19*
