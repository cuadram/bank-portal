# CR-FEAT-013 — Code Review — Onboarding KYC

**BankPortal · Sprint 15 · Commit d2d056d**

| Campo | Valor |
|---|---|
| Revisor | SOFIA Code Reviewer Agent |
| Commit | d2d056d54848ca89825bf8fc338ff27c888476d1 |
| Rama | feature/FEAT-013-sprint15 |
| Fecha | 2026-03-24 |
| Stack | Java 21 + Spring Boot 3.3 · Angular 17 |
| US revisadas | US-1301..1307 · RV-020 · SAST-001 · SAST-002 |

---

## Resumen ejecutivo

| Severidad | Cantidad |
|---|---|
| 🔴 BLOQUEANTE | 1 |
| 🟡 MENOR | 3 |
| 🟢 SUGERENCIA | 3 |

**Decisión:** ⛔ **BLOQUEANTE — Requiere corrección antes de pasar a QA.**

---

## RV-021 🔴 BLOQUEANTE — Violación de arquitectura: `UploadDocumentUseCase` importa directamente infraestructura

**Archivo:** `kyc/application/UploadDocumentUseCase.java:9`
**Hallazgo:**

```java
import com.experis.sofia.bankportal.kyc.infrastructure.DocumentStorageService;
```

La capa **application** no debe depender directamente de **infrastructure** — viola el principio de inversión de dependencias de Clean Architecture / Hexagonal. El use case debe depender de un puerto (interfaz de dominio), no de la implementación concreta.

**Corrección:**
1. Crear interfaz `DocumentStoragePort` en `kyc/domain/`
2. `DocumentStorageService` implementa `DocumentStoragePort`
3. `UploadDocumentUseCase` inyecta `DocumentStoragePort`

```java
// kyc/domain/DocumentStoragePort.java
public interface DocumentStoragePort {
    StorageResult store(MultipartFile file);
    boolean verifyIntegrity(String filePath, String expectedHash);
    record StorageResult(String filePath, String sha256Hash) {}
}
```

**Impacto:** Alta — patrón establecido en todos los módulos del proyecto (BeneficiaryRepositoryPort, BankCoreTransferPort, etc.)

---

## RV-022 🟡 MENOR — Validación ejecuta de forma síncrona, contradice ADR-024

**Archivo:** `kyc/application/UploadDocumentUseCase.java:54`
**Hallazgo:**

```java
// Ejecutar validación automática en la misma transacción
validateUseCase.execute(kyc.getId(), userId);
```

ADR-024 especifica validación asíncrona (`@Async` + event). La validación actual bloquea la respuesta HTTP hasta completarse, degradando UX en documentos que requieran más tiempo.

**Corrección:**

```java
// Publicar evento post-commit en lugar de llamar directamente
applicationEventPublisher.publishEvent(
    new KycDocumentSubmittedEvent(this, kyc.getId(), userId));
```

Y `ValidateDocumentUseCase` anota con `@Async @EventListener`.

**Impacto:** Medio — funcional pero incumple ADR-024 y degrada latencia.

---

## RV-023 🟡 MENOR — `KycAuthorizationFilter` no protege `/api/v1/payments`

**Archivo:** `kyc/security/KycAuthorizationFilter.java:36`
**Hallazgo:**

```java
private static final String[] FINANCIAL_PREFIXES = {
    "/api/v1/transfers", "/api/v1/bills"
};
```

SRS US-1305 y HLD especifican que `/api/v1/payments/**` también debe estar protegido por el guard KYC. Actualmente omitido.

**Corrección:**

```java
private static final String[] FINANCIAL_PREFIXES = {
    "/api/v1/transfers", "/api/v1/bills", "/api/v1/payments"
};
```

---

## RV-024 🟡 MENOR — `gracePeriodDays` declarado pero no usado en lógica

**Archivo:** `kyc/security/KycAuthorizationFilter.java:30,61`
**Hallazgo:**

```java
@Value("${kyc.grace-period-days:90}")
private int gracePeriodDays;
```

El campo se inyecta pero nunca se usa en `doFilterInternal`. El comentario indica "período de gracia" pero todos los usuarios sin KYC pasan sin restricción. Si la intención es desactivar el período, eliminar el campo y el `@Value` para evitar confusión. Si debe aplicarse, implementar la lógica de retención basada en `createdAt`.

**Corrección sugerida:** Eliminar `gracePeriodDays` hasta que se especifique el comportamiento o implementar la lógica real.

---

## RV-025 🟢 SUGERENCIA — `side` en `KycController` sin validación de valores permitidos

**Archivo:** `kyc/api/KycController.java:42`
**Hallazgo:**

```java
@RequestParam String side,
```

`side` acepta cualquier string. Un valor como `"LATERAL"` pasaría la validación en el controller y fallaría en BD con una excepción de constraint no controlada. Mejor validar con `@Pattern` o un enum.

**Sugerencia:**

```java
@RequestParam @Pattern(regexp = "FRONT|BACK") String side,
```

---

## RV-026 🟢 SUGERENCIA — `KycAdminController` devuelve `Map<String, Object>` en lugar de DTO tipado

**Archivo:** `kyc/api/KycAdminController.java:43`

La respuesta con `Map.of(...)` no tiene contrato tipado y es difícil de mantener. Crear `KycReviewResponse` record para tener contrato OpenAPI documentado y tests tipados.

---

## RV-027 🟢 SUGERENCIA — Test `upload_noExistingKyc_createsVerificationOnTheFly` tiene stub contradictorio

**Archivo:** `UploadDocumentUseCaseTest.java:88`

```java
when(kycRepo.save(any())).thenReturn(pendingKyc);
when(docRepo.save(any())).thenAnswer(i -> ...); // ok
// Pero luego:
when(docRepo.save(any())).thenAnswer(...); // sobreescribe el anterior
```

El segundo `when(kycRepo.save(any()))` y `when(docRepo.save(any()))` se solapan. En la implementación `kycRepo.save` se llama dos veces (crear KYC + potencial update), pero el mock solo captura la primera. Separar con `thenReturn(...).thenReturn(...)` para mayor claridad y robustez.

---

## Items correctos destacados

- **Arquitectura Clean** correctamente aplicada en todos los módulos excepto RV-021
- **AES-256-GCM** con IV aleatorio por fichero — implementación correcta (ADR-023 ✅)
- **SHA-256** calculado antes del cifrado sobre bytes originales — correcto
- **`@PreAuthorize("hasRole('KYC_REVIEWER')")`** en `KycAdminController` — correcto
- **RV-020** (`twoFactorEnabled` desde BD) — fix limpio y correcto
- **SAST-001** (`maskIp`) — ofuscación IPv4/IPv6 correcta, lógica bien separada
- **SAST-002** (rate limiting Bucket4j en `/profile/password`) — ya presente desde Sprint 14
- **`KycGuard` Angular** — `catchError` cubre fallo de servicio correctamente
- **Tests** — 29 escenarios con cobertura de happy path, error path y edge cases ✅

---

## Plan de corrección

| # | Finding | Responsable | Prioridad | Estimación |
|---|---|---|---|---|
| RV-021 | Crear `DocumentStoragePort` + refactorizar | Developer | BLOQUEANTE | 1h |
| RV-022 | Async con `ApplicationEventPublisher` | Developer | Próximo sprint si bloquea | 1h |
| RV-023 | Añadir `/api/v1/payments` a `FINANCIAL_PREFIXES` | Developer | Inmediato (5 min) | 5m |
| RV-024 | Eliminar `gracePeriodDays` o implementar | Developer | Inmediato (5 min) | 5m |

**RV-021, RV-023, RV-024 deben corregirse antes del re-review.** RV-022 puede diferirse a Sprint 16 si hay restricción de tiempo, documentando el trade-off.

---

*SOFIA Code Reviewer Agent — Step 5 · Sprint 15 · FEAT-013*
*CMMI Level 3 — VER SP 1.3 · VER SP 2.2 · VER SP 3.1*
*BankPortal — Banco Meridian — 2026-03-24*
