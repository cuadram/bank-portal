# Code Review Report — Gate 4: US-703/704/705 · Sprint 9 Semana 2

## Metadata
- **Proyecto:** BankPortal | **Cliente:** Banco Meridian / Experis
- **Stack:** Java 21 (Spring Boot) + TypeScript (Playwright E2E)
- **Sprint:** 9 | **Fecha:** 2026-03-19
- **Archivos revisados:** 5 | **Líneas revisadas:** ~750
- **PR / Rama:** `feature/FEAT-007-sprint9`
- **Commit revisado:** `e85215b`
- **Referencia Jira:** US-704 (principal), US-701/702/703/705 (E2E)

---

## Resumen ejecutivo

| Categoría             | 🔴 Bloqueante | 🟠 Mayor | 🟡 Menor | 🟢 Sugerencia |
|-----------------------|:---:|:---:|:---:|:---:|
| Arquitectura y Diseño | 0   | 0   | 0   | 1   |
| Contrato OpenAPI      | 0   | 0   | 0   | 0   |
| Seguridad             | 0   | 0   | 1   | 0   |
| Calidad de Código     | 0   | 1   | 1   | 1   |
| Tests                 | 0   | 2   | 1   | 0   |
| Documentación         | 0   | 0   | 0   | 0   |
| Convenciones Git      | 0   | 0   | 0   | 0   |
| **TOTAL**             | **0** | **3** | **3** | **2** |

## Veredicto

> ⚠️ **APROBADO CON CONDICIONES — RE-REVIEW OBLIGATORIO**
>
> 0 BLOQUEANTES · 3 MAYORES · corrección requerida antes de Gate 5 (QA)

---

## Hallazgos detallados

---

### 🟠 Mayores

#### RV-001 — Hash SHA-256 del footer PDF calculado sobre bytes incompletos

- **Nivel:** Calidad de Código / Integridad de datos financieros
- **Archivo:** `StatementExportUseCase.java` → método `generatePdf()`, línea ~113
- **Descripción:**
  `addPdfFooter(doc, sha256Hex(baos.toByteArray()))` se invoca **antes** de `doc.close()`.
  En ese punto el `ByteArrayOutputStream` contiene bytes parciales porque `PdfWriter`
  aún no ha vaciado su buffer interno. El hash que se imprime en el pie del PDF
  **siempre es incorrecto** — no representa la integridad real del documento.
  El hash correcto sí llega al header HTTP `X-Content-SHA256` (calculado después),
  pero el documento físico queda con un hash inútil, lo que invalida cualquier
  verificación offline del extracto. Inaceptable en un documento financiero regulado.

- **Código actual:**
  ```java
  try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
      Document doc = new Document(PageSize.A4, 36, 36, 54, 54);
      PdfWriter.getInstance(doc, baos);
      doc.open();

      addPdfHeader(doc, account, year, month);
      addPdfTransactionTable(doc, txs);
      addPdfSummary(doc, txs);
      addPdfFooter(doc, sha256Hex(baos.toByteArray())); // ← baos incompleto aquí
      doc.close();
      return baos.toByteArray();
  }
  ```

- **Corrección sugerida:**
  ```java
  try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
      Document doc = new Document(PageSize.A4, 36, 36, 54, 54);
      PdfWriter.getInstance(doc, baos);
      doc.open();

      addPdfHeader(doc, account, year, month);
      addPdfTransactionTable(doc, txs);
      addPdfSummary(doc, txs);
      // Placeholder de footer sin hash — el hash se añade como metadato PDF
      addPdfFooterWithoutHash(doc);
      doc.close();

      // Hash sobre el documento completo
      byte[] pdfBytes = baos.toByteArray();
      // Opcional: incrustar hash en metadatos XMP del PDF en lugar de en el footer visual
      return pdfBytes;
  }
  // En export(): el hash correcto sigue calculándose sobre content y va al header HTTP
  ```
  > Alternativa más simple: eliminar el hash del footer visual y confiar
  > únicamente en el header HTTP `X-Content-SHA256`. El footer puede mostrar
  > fecha + texto "Verifique la integridad en banca online" sin el hash.

---

#### RV-002 — Test `downloadStatement_invalidMonthZero_returns400` sin assertions

- **Nivel:** Tests
- **Archivo:** `StatementControllerIT.java` → método `downloadStatement_invalidMonthZero_returns400()`
- **Descripción:**
  El test finaliza sin ningún `.andExpect(status().isBadRequest())` o equivalente.
  Simplemente ejecuta `.andReturn()` sin verificar el status HTTP.
  El test **siempre pasará** aunque el controller devuelva 200 o 500.
  Escenario Gherkin US-704 "mes fuera de rango" no está cubierto para `month=0`.

- **Código actual:**
  ```java
  @Test
  @DisplayName("US-704: mes=0 → 400 Bad Request")
  void downloadStatement_invalidMonthZero_returns400() throws Exception {
      mockMvc.perform(get("/api/v1/accounts/" + ACCOUNT_ID + "/statements/2026/0")
                      .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
              .andExpect(request -> {}) // ← lambda vacía, nunca falla
              .andReturn();
      // Sin ningún andExpect de status → TEST INVÁLIDO
  }
  ```

- **Corrección sugerida:**
  ```java
  @Test
  @DisplayName("US-704: mes=0 → 400 Bad Request")
  void downloadStatement_invalidMonthZero_returns400() throws Exception {
      var mvcResult = mockMvc.perform(
                      get("/api/v1/accounts/" + ACCOUNT_ID + "/statements/2026/0")
                              .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
              .andReturn();

      mockMvc.perform(asyncDispatch(mvcResult))
              .andExpect(status().isBadRequest());
  }
  ```

---

#### RV-003 — Formato SLF4J incorrecto `{:02d}` → log malformado en producción

- **Nivel:** Calidad de Código
- **Archivo:** `StatementExportUseCase.java` → método `export()`, línea ~78
- **Descripción:**
  SLF4J utiliza `{}` como único placeholder — no soporta especificadores de formato
  estilo `printf` como `{:02d}`. El log resultante mostrará literalmente `{:02d}`
  en lugar del mes con zero-padding. En un entorno con log aggregation (ELK/Splunk),
  esto dificulta el parsing y las alertas.

- **Código actual:**
  ```java
  log.info("[US-704] Iniciando exportación extracto accountId={} periodo={}-{:02d} format={}",
          accountId, year, month, format);
  ```

- **Corrección sugerida:**
  ```java
  log.info("[US-704] Iniciando exportación extracto accountId={} periodo={}-{} format={}",
          accountId, year, String.format("%02d", month), format);
  ```

---

### 🟡 Menores

#### RV-004 — `Content-Disposition` sin sanitización del filename

- **Nivel:** Seguridad (OWASP A03:2021 Injection — HTTP Header Injection, bajo riesgo)
- **Archivo:** `StatementController.java` → método `buildResponse()`, línea ~73
- **Descripción:**
  El `filename` se inyecta directamente en el header `Content-Disposition`
  sin eliminar caracteres `\r`, `\n` o `"`. Si bien el filename proviene del propio
  backend (IBAN enmascarado), un cambio futuro que permita nombres personalizados
  abriría un vector de header injection. Bajo riesgo actual, pero debe blindarse.

- **Corrección sugerida:**
  ```java
  String safeFilename = r.filename().replaceAll("[\\r\\n\"\\\\]", "_");
  headers.set(HttpHeaders.CONTENT_DISPOSITION,
          "attachment; filename=\"" + safeFilename + "\"");
  ```

---

#### RV-005 — Cálculo de `saldoInicial` asume orden DESC implícito

- **Nivel:** Calidad de Código
- **Archivo:** `StatementExportUseCase.java` → método `addPdfSummary()`, línea ~185
- **Descripción:**
  `txs.get(0).getBalanceAfter().subtract(txs.get(0).getAmount())` asume que el
  primer elemento de la lista es el movimiento **más antiguo** del mes.
  `findByMonth` no especifica orden en su contrato — si el repositorio devuelve
  en orden DESC (más reciente primero), el "saldo inicial" calculado corresponderá
  al saldo **final** del mes anterior y la fórmula será incorrecta. Añadir orden
  explícito en el port o documentar el contrato de orden.

- **Corrección sugerida:**
  ```java
  // Opción A: ordenar antes de calcular
  List<Transaction> sorted = txs.stream()
          .sorted(Comparator.comparing(Transaction::getTransactionDate))
          .toList();
  BigDecimal saldoInicial = sorted.get(0).getBalanceAfter()
          .subtract(sorted.get(0).getAmount());
  BigDecimal saldoFinal   = sorted.get(sorted.size() - 1).getBalanceAfter();
  ```

---

#### RV-006 — `assertThatFuture` helper con tipo raw en test

- **Nivel:** Tests / Calidad
- **Archivo:** `StatementExportUseCaseTest.java` → helper `assertThatFuture()`
- **Descripción:**
  El método helper privado retorna `AbstractFutureAssert<?, ?, T, ?>` con wildcards.
  En AssertJ 3.x, `Assertions.assertThat(CompletableFuture)` retorna directamente
  `AbstractCompletableFutureAssert` — el helper es innecesario y añade ruido.

- **Corrección sugerida:**
  ```java
  // Eliminar el helper y usar directamente:
  assertThat(useCase.export(userId, accountId, 2026, 1, "xlsx"))
          .failsWithin(Duration.ofSeconds(3))
          .withThrowableOfType(ExecutionException.class)
          .withCauseInstanceOf(IllegalArgumentException.class);
  ```

---

### 🟢 Sugerencias

#### RV-007 — Extraer generadores PDF/CSV a servicios de infraestructura

- **Descripción:**
  `StatementExportUseCase` mezcla lógica de dominio (ownership check, auditoría)
  con generación de documentos (OpenPDF, CSV builder). Extraer
  `PdfStatementRenderer` y `CsvStatementRenderer` a `infrastructure/export/`
  aislaría la dependencia de OpenPDF de la capa de aplicación y facilitaría
  cambiar la librería PDF en el futuro sin tocar el use case.

---

#### RV-008 — Añadir test unitario para generación PDF (cobertura)

- **Descripción:**
  Los tests de `StatementExportUseCaseTest` cubren el path CSV pero no verifican
  que `format=pdf` devuelva bytes no vacíos con magic bytes `%PDF`.
  Añadir al menos:
  ```java
  @Test
  void export_pdf_returnsPdfBytes() throws Exception {
      when(...).thenReturn(List.of(buildTransaction(...)));
      var r = useCase.export(userId, accountId, 2026, 2, "pdf").get().orElseThrow();
      assertThat(r.format()).isEqualTo("PDF");
      assertThat(r.content()).startsWith(new byte[]{'%','P','D','F'});
  }
  ```

---

## Métricas de calidad

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Tests unitarios nuevos (S2) | 6 unit + 6 IT + 18 E2E = 30 | — | ✅ |
| Cobertura estimada `StatementExportUseCase` | ~72% (path PDF sin test) | 80% | 🟠 |
| Complejidad ciclomática máx. (`addPdfTransactionTable`) | ~7 | 10 | ✅ |
| Métodos públicos sin Javadoc | 0 | 0 | ✅ |
| Desviaciones contrato OpenAPI | 0 | 0 | ✅ |
| Secrets hardcodeados | 0 | 0 | ✅ |

> **Nota cobertura:** La cobertura sube a ~82% si se añade el test PDF (RV-008).
> Con la corrección de RV-002 el test de mes=0 pasa de inválido a funcional.

---

## Checklist de conformidad

```
ARQUITECTURA
✅ UseCase en application/, Controller en api/
✅ Dependencias fluyen en dirección correcta
✅ Sin lógica de negocio en Controller

CONTRATO OPENAPI
✅ GET /api/v1/accounts/{id}/statements/{year}/{month}?format=pdf|csv — correcto
✅ 200/204/400/401 implementados
✅ Headers X-Content-SHA256, X-Statement-Format, Content-Disposition presentes

SEGURIDAD
✅ Sin secrets hardcodeados
✅ Endpoints protegidos con JWT (@AuthenticationPrincipal)
✅ Ownership check: cuenta debe pertenecer al userId del JWT
🟡 RV-004: Content-Disposition sin sanitización de filename
✅ Sin stack traces expuestos al cliente

TESTS
🟠 RV-002: TC mes=0 sin assertions (test inválido)
✅ Happy path PDF+CSV cubiertos
✅ 204 mes vacío cubierto
✅ 401 sin JWT cubierto

DOCUMENTACIÓN
✅ Javadoc en clase y método público export()
✅ Records documentados
✅ Comentarios de sección en métodos privados

GIT
✅ Rama: feature/FEAT-007-sprint9
✅ Conventional Commits aplicado
✅ PR referencia tickets [SCRUM-35][SCRUM-36]
```

---

## Acciones requeridas — Re-review

| ID | Acción | Archivo | SLA |
|---|---|---|---|
| **RV-001** | Corregir hash PDF footer (calcular post `doc.close()` o eliminar del footer visual) | `StatementExportUseCase.java` | 24h |
| **RV-002** | Añadir `andExpect(status().isBadRequest())` al test mes=0 | `StatementControllerIT.java` | 24h |
| **RV-003** | Corregir `{:02d}` → `{}` con `String.format` en el log | `StatementExportUseCase.java` | 24h |
| **RV-004** | Sanitizar filename en `Content-Disposition` | `StatementController.java` | 24h |
| **RV-005** | Ordenar transacciones explícitamente antes de calcular saldos en summary | `StatementExportUseCase.java` | 24h |
| **RV-006** | Eliminar helper `assertThatFuture`, usar `assertThat(future)` directamente | `StatementExportUseCaseTest.java` | 24h |

> Tras corrección de RV-001 a RV-006 → **re-review completo** antes de Gate 5.
> Sugerencias RV-007 y RV-008 opcionales para este sprint, recomendadas para Sprint 10.

---

*SOFIA Code Reviewer Agent · BankPortal Sprint 9 · Gate 4 · 2026-03-19*
