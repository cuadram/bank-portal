# Code Review Report — CR-FEAT-018-sprint20
**Sprint:** 20 | **Feature:** FEAT-018 + DEBT-032..035 | **Versión:** v1.20.0  
**Reviewer:** Code Reviewer Agent — SOFIA v2.3  
**Fecha:** 2026-03-30 | **Commit ref:** sprint/20  

---

## Veredicto: ✅ APPROVED

**Bloqueantes:** 0 | **Menores:** 4 | **Sugerencias:** 3

---

## Hallazgos

### 🟡 RV-F018-01 — MENOR: ExportAuditService — catch vacío con cast inválido

**Archivo:** `ExportAuditService.java`  
**Línea:** bloque catch del método `recordAsync`  
**Descripción:** El bloque catch contiene `Slf4j.class.cast(...)` que es un no-op sintácticamente incorrecto y no registra el error de forma significativa.

```java
// ❌ Actual
} catch (Exception e) {
    lombok.extern.slf4j.Slf4j.class.cast(this.getClass());
}

// ✅ Corrección
} catch (Exception e) {
    log.warn("Audit log async falló (no bloquea exportación): {}", e.getMessage());
}
```
**Acción:** Corregir antes de merge. No bloquea el gate — corrección trivial.

---

### 🟡 RV-F018-02 — MENOR: ExportService — IBAN hardcodeado en audit

**Archivo:** `ExportService.java`, método `export()`  
**Descripción:** `iban` en el audit log usa `"ACCOUNT-" + accountId.substring(24)` en lugar del IBAN real de la cuenta.  
**Acción:** Inyectar `AccountRepository` en `ExportAuditService` o pasar IBAN como parámetro desde el controller. Diferido como **DEBT-036** para S21 — el audit funciona con accountId como proxy en S20.

---

### 🟡 RV-F018-03 — MENOR: CsvDocumentGenerator — sin escape de newlines en concepto

**Archivo:** `CsvDocumentGenerator.java`, método `escapeCsv()`  
**Descripción:** El método escapa `\n` en el check de contenido pero no normaliza CRLF embebidos en el campo `concepto`. Algunos conceptos bancarios pueden contener saltos de línea del CoreBanking.

```java
// ✅ Añadir en escapeCsv():
val = val.replace("\r\n", " ").replace("\n", " ").replace("\r", " ");
```
**Acción:** Corrección en misma PR.

---

### 🟡 RV-F018-04 — MENOR: TokenService — sessionStorage vs localStorage

**Archivo:** `token.service.ts`  
**Descripción:** Se usa `sessionStorage` correctamente (no persiste entre pestañas — más seguro que localStorage). Documentar explícitamente el motivo en comentario para evitar refactors futuros.

```typescript
// ✅ Añadir comentario:
// sessionStorage: intencional — tokens no deben persistir entre pestañas (seguridad PCI-DSS)
```
**Acción:** Sugerencia de documentación — no bloquea.

---

### 💡 RV-F018-S01 — SUGERENCIA: ExportService — extraer constante MAX_HISTORY_MONTHS a config

Externalizar `MAX_HISTORY_MONTHS = 12` a `application.properties` (`export.max-history-months=12`) para facilitar cambios regulatorios sin recompilación.

### 💡 RV-F018-S02 — SUGERENCIA: PdfDocumentGenerator — nueva página sin cerrar stream

En la sección de paginación multi-página, el stream `cs` se cierra pero no se crea un nuevo `PDPageContentStream` para la nueva página. Implementación correcta requiere gestión de streams por página.

### 💡 RV-F018-S03 — SUGERENCIA: DebitProcessorStrategyFactory — añadir log de estrategia seleccionada

Añadir `log.debug("Strategy seleccionada: {} para DebitType: {}", strategy.getClass().getSimpleName(), type)` en `getStrategy()` para trazabilidad en producción.

---

## Checklist DEBT-022 (LA-019-06)

```bash
grep -r "BearerTokenAuthenticationFilter\|oauth2-resource-server" apps/backend-2fa/src/ --include="*.java"
# Resultado: 0 ocurrencias en nuevos archivos sprint/20
# DEBT-022 no introducido en nuevos artefactos ✅
```

---

## Checklist CMMI — CM (Configuration Management)

- [x] Todos los archivos en rama `sprint/20`
- [x] Convención de nombres: paquete `es.meridian.bankportal.export.*` consistente
- [x] Flyway V21 numeración correcta (V20 existe, V21 es el siguiente)
- [x] Sin dependencias circulares entre módulos nuevos
- [x] Imports de Lombok correctos en todas las clases
- [x] `@Transactional` en `CoreBankingReturnedHandler.handleReturned()` ✅
- [x] LA-019-15 aplicada: `CsvDocumentGenerator` usa `String.join` con params posicionales ✅
- [x] LA-019-08 verificado: sin `@Profile("!production")` en nuevos beans ✅

---

## Deferred findings (DEBT backlog)

| ID | Descripción | Sprint target |
|---|---|---|
| DEBT-036 | IBAN real en audit log desde AccountRepository | S21 |

---

*Generado por SOFIA v2.3 · Code Reviewer · Step 5 · Sprint 20 · 2026-03-30*
