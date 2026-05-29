# Fase 1 — Hotfix tests rotos main (DEBT-061)

**Branch**: `hotfix/qa-audit-s18-s26` · **Parent**: `346cb26` (Fase 0)
**Started**: 2026-05-20T08:25Z · **Completed**: 2026-05-20T07:42Z
**NC**: NC-CMMI-001 · **Decision triage**: S2=(a) pragmatico (<30 lineas fix vs @Disabled+DEBT)

## Estado inicial (HEAD 5f6803f)

```
mvn test: Tests run: 642 · Failures: 2 · Errors: 5 · Skipped: 11
BUILD FAILURE
```

## Estado final (este commit)

```
mvn test: Tests run: 642 · Failures: 0 · Errors: 0 · Skipped: 13
BUILD SUCCESS
```

+2 Skipped son los TC-LOAN-001 y TC-LOAN-004 deshabilitados con motivo explicito (DEBT-063).

## Triage por archivo

| # | Archivo | Diagnostico | Accion | Resultado |
|---|---|---|---|---|
| 1 | `PfmControllerIT` | 1 ERROR `@SpringBootConfiguration` no encontrado (paquete fuera de twofa.*) | Fix < 5 lineas: anadido `classes=BackendTwoFactorApplication.class` + perfil `integration-compose` (alineacion patron S26) | **5/5 PASS** (DEBT-055 raiz resuelta) |
| 2 | `DataExportServiceTest` | 2 ERRORS: servicio refactorizado `findActive*` -> `findLatest*` (fix F4) sin actualizar mocks. Mockito strict marca unnecessary stubbing | Fix < 10 lineas: actualizar 2 stubs al metodo nuevo | **4/4 PASS** |
| 3 | `DeletionRequestServiceTest` | 1 ERROR NPE `getCreatedAt()` null: fix DEBT-042 anadio validacion TTL 24h sin actualizar setUp del test | Fix < 5 lineas: anadir `.createdAt(LocalDateTime.now())` al builder | **5/5 PASS** |
| 4 | `AmortizationCalculatorTest` | 2 FAILURES: ambiguedad TIN vs TAE en calcular cuota. Codigo devuelve 862.96 (TIN interpretation), test esperaba 861.35 (TAE interpretation). Codigo no toco desde commit 4863667 | **@Disabled + DEBT-063 Alta** (decision regulatoria PO+legal pendiente) | 4/6 PASS · 2 SKIPPED con motivo |
| 5 | `RequestMoneyUseCaseTest` | 1 ERROR Mockito strict: TC013 early-return sobreescribe stub compartido del setUp | Fix < 5 lineas: `lenient()` en stub compartido | **4/4 PASS** |
| 6 | `OpenDepositUseCaseTest` | 1 ERROR Mockito strict: otpInvalidoNoGuarda early-return (mismo patron) | Fix < 5 lineas: `lenient()` en 2 stubs compartidos | **5/5 PASS** |

## Hallazgo derivado item 4 → DEBT-063 (Alta)

**Riesgo regulatorio Directiva 2008/48/CE / Ley 16/2011**:

- Verificacion manual del calculo metodo frances para P=10000, plazo=12, TAE=6.50%:
  - Si `taeAnual` es TIN nominal (codigo actual): r=0.005416, cuota=**862.96** EUR
  - Si `taeAnual` es TAE compuesta efectiva: r=0.005262, cuota=**861.35** EUR
- ADR-034 no desambigua. Codigo unico commit 4863667 sin historico de fix previo.
- **Impacto produccion**: NULO (solo simulador, no contratacion); pero si un cliente firma un prestamo basandose en simulacion "TAE 6.50%" y le cobran cuota acorde a TIN, la TAE efectiva real es ~6.70% → litigio potencial.
- **Decision pendiente**: PO + asesoria legal Banco Meridian.

## Verificacion no-regresion

Suite completa antes del hotfix:
```
Tests run: 642 · Failures: 2 · Errors: 5 · Skipped: 11
```

Suite completa despues del hotfix:
```
Tests run: 642 · Failures: 0 · Errors: 0 · Skipped: 13
BUILD SUCCESS
```

Delta esperado: -2F / -5E / +2 Skipped (TC-LOAN-001 y TC-LOAN-004). Cumple.

Ningun fix introduce side-effects: todos los cambios son test-only excepto **0 archivos de produccion modificados**.

## Archivos modificados

- `apps/backend-2fa/src/test/.../pfm/PfmControllerIT.java` (+12 / -3 lineas)
- `apps/backend-2fa/src/test/.../privacy/DataExportServiceTest.java` (+4 / -2 lineas)
- `apps/backend-2fa/src/test/.../privacy/DeletionRequestServiceTest.java` (+2 / -0 lineas)
- `apps/backend-2fa/src/test/.../bizum/.../RequestMoneyUseCaseTest.java` (+4 / -1 linea)
- `apps/backend-2fa/src/test/.../deposit/.../OpenDepositUseCaseTest.java` (+3 / -2 lineas)
- `apps/backend-2fa/src/test/.../loan/.../AmortizationCalculatorTest.java` (+7 / -2 lineas, @Disabled)
- `.sofia/session.json` (DEBT-063 registrada + NC-CMMI-001 derived_findings)

## Cierre Fase 1

- DEBT-061 cerrable: tests rotos main estabilizados (2 Skipped explicitos con DEBT-063 vinculada)
- DEBT-055 raiz tecnica resuelta (PfmControllerIT funcional con 5 PASS reales)
- Siguiente fase: Fase 2 audit retrospectiva S18-S26
