# FA — Análisis Funcional
## FEAT-018: Exportación de Movimientos Bancarios (PDF/CSV)
**Sprint:** 20 | **Versión:** v1.20.0 | **Módulo:** `export`  
**SOFIA Step:** 2b — FA-Agent | **Fecha:** 2026-03-30  
**Regulación:** PSD2 Art.47 · GDPR Art.15/17 · PCI-DSS Req.3.4/10  

---

## Funcionalidades

### FA-018-A: Generación de Extracto PDF
**ID:** FA-018-A | **Módulo:** export | **Estado:** EN DESARROLLO

El sistema permite al usuario autenticado solicitar la generación de un extracto de movimientos en formato PDF para una cuenta y rango de fechas determinados. El extracto incluye cabecera corporativa Banco Meridian, datos del titular, IBAN, rango del extracto, tabla de movimientos con fecha valor, fecha contable, concepto, importe y saldo, PAN enmascarado (últimos 4 dígitos), y huella de integridad SHA-256 en el pie de página. La generación es síncrona para ≤ 500 registros (< 3s p95) y asíncrona para volúmenes mayores con polling de estado.

**Reglas de negocio:**
- RN-F018-01: El rango máximo de historial exportable es 12 meses desde la fecha de solicitud (PSD2 Art.47 §2).
- RN-F018-02: El PAN de tarjeta debe aparecer enmascarado — solo últimos 4 dígitos visibles (PCI-DSS Req.3.4).
- RN-F018-03: El PDF incluirá hash SHA-256 del contenido como garantía de integridad y no repudio.
- RN-F018-04: Máximo 500 registros por exportación. Si se supera, el sistema informa al usuario y solicita reducir el rango.

**Flujo principal:**
1. Usuario selecciona cuenta, rango de fechas y filtros opcionales.
2. Sistema muestra preview del número de registros que se exportarán.
3. Usuario confirma. Sistema genera PDF.
4. Sistema registra la exportación en `export_audit_log` (async).
5. PDF disponible para descarga inmediata.

---

### FA-018-B: Generación de Extracto CSV
**ID:** FA-018-B | **Módulo:** export | **Estado:** EN DESARROLLO

El sistema genera un archivo CSV en formato europeo (UTF-8 BOM, separador `;`, coma decimal) con los movimientos filtrados. Compatible con Microsoft Excel en entornos de idioma español/europeo. Contiene las columnas: fecha_valor, fecha_contable, concepto, importe, divisa, saldo, tipo_movimiento, iban_cuenta. El nombre del archivo sigue el patrón `movimientos_{IBAN_last8}_{YYYY-MM-DD}.csv`.

**Reglas de negocio:**
- RN-F018-05: El CSV usa UTF-8 BOM para compatibilidad con Excel en español (evita problemas de encoding con caracteres acentuados).
- RN-F018-06: El separador de campos es `;` (estándar europeo). El separador decimal es `,`.
- RN-F018-07: El PAN no se incluirá en ninguna columna del CSV. Las tarjetas se referencian por alias o últimos 4 dígitos.
- RN-F018-08: La primera fila contiene los nombres de columna en español.

---

### FA-018-C: Filtrado Multicriteria de Movimientos
**ID:** FA-018-C | **Módulo:** export | **Estado:** EN DESARROLLO

El sistema proporciona un formulario de filtrado previo a la exportación que permite al usuario seleccionar: tipo de movimiento (TODOS, TRANSFERENCIA_EMITIDA, TRANSFERENCIA_RECIBIDA, DOMICILIACION, PAGO_TARJETA, INGRESO, COMISION), rango de fechas y cuenta/IBAN. Antes de confirmar la exportación, el sistema muestra un recuento previo (preview count) de los registros que serán exportados. Los filtros se mantienen durante la sesión pero no se persisten entre sesiones.

**Reglas de negocio:**
- RN-F018-09: La fecha mínima seleccionable es 12 meses atrás desde la fecha actual.
- RN-F018-10: Si el preview count supera 500 registros, el sistema muestra un aviso y bloquea la exportación hasta que el usuario reduzca el rango.
- RN-F018-11: Los filtros aplicados se registran en el `export_audit_log` para trazabilidad GDPR.

---

### FA-018-D: Audit Log de Exportaciones
**ID:** FA-018-D | **Módulo:** audit | **Estado:** EN DESARROLLO

El sistema registra de forma asíncrona cada exportación de movimientos en la tabla `export_audit_log`. El registro incluye: identificador único, user_id, timestamp UTC, IBAN de la cuenta, rango de fechas del filtro, tipo de movimiento, formato (PDF/CSV), número de registros exportados, IP de origen y user agent. El registro no bloquea la exportación en caso de fallo (fire-and-forget con reintento automático x3). La retención es de 7 años (GDPR Art.17 §3.b). El panel de administración permite consultar el log con búsqueda por usuario y fecha.

**Reglas de negocio:**
- RN-F018-12: El audit log es asíncrono — su fallo no interrumpe la exportación.
- RN-F018-13: Retención obligatoria del audit log: 7 años (GDPR Art.17 §3.b y PCI-DSS Req.10.7).
- RN-F018-14: Solo usuarios con rol ADMIN pueden consultar el audit log completo.
- RN-F018-15: El hash SHA-256 del PDF generado se almacena en el audit log para verificación posterior.

---

## Deuda Técnica S20 — Impacto en análisis funcional

### DEBT-032: Lambda Refactor
Refactor interno sin impacto funcional visible. Mejora la mantenibilidad y los stack traces de error en logs de producción. No altera ninguna funcionalidad existente.

### DEBT-033: Angular AuthService Split
Refactor arquitectural del frontend. `AuthGuard` limpiado elimina posibles estados inconsistentes en la gestión de sesión. Sin impacto en UX ni en flujos funcionales existentes.

### DEBT-034: DebitProcessorStrategy
Implementación del patrón Strategy en el procesamiento de domiciliaciones. Permite añadir nuevos tipos de domiciliación (ej: SEPA B2B en S21+) sin modificar el código existente. Sin impacto funcional en S20.

### DEBT-035: CoreBanking Webhook RETURNED
**Impacto funcional directo:** El usuario recibirá notificación push cuando una domiciliación sea devuelta por CoreBanking (estado RETURNED). Mejora la experiencia del usuario respecto al estado de sus mandatos. Nuevas reglas de negocio:
- RN-DEBT035-01: Al recibir estado RETURNED del CoreBanking, el mandato se actualiza a estado RETURNED con R-code y motivo.
- RN-DEBT035-02: Se envía notificación push al titular con descripción legible del R-code (ej: R01="Fondos insuficientes", R03="Cuenta inexistente").
- RN-DEBT035-03: El evento RETURNED queda registrado en el audit trail con timestamp, mandato_id y R-code.

---

*Generado por SOFIA v2.3 · FA-Agent · Step 2b · Sprint 20 · 2026-03-30*
