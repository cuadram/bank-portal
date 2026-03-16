# Code Review Report — Sprint 6 · ACT-23/25 + DEBT-007 + FEAT-004 cont. + FEAT-005

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 6 · 2026-05-26 |
| **Rama** | `feature/FEAT-005-security-audit-panel` |
| **Reviewer** | SOFIA Code Reviewer Agent |
| **Fecha** | 2026-05-28 |
| **Archivos revisados** | 12 Java + 5 TypeScript + 1 spec Angular |

---

## Veredicto

**✅ APPROVED CON 2 NCs MENORES — resolver antes de QA**

| Severidad | Count |
|---|---|
| Mayores | 0 |
| Menores | 2 |
| Sugerencias | 2 |

---

## NCs Menores

### RV-S6-001 — Import no usado en `HmacKeyRotationMonitorJob.java`

**Archivo:** `trusteddevice/application/HmacKeyRotationMonitorJob.java`

```java
// Línea presente en imports — NO existe campo correspondiente en la clase
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
```

`@RequiredArgsConstructor` solo inyecta los campos `final` declarados. El único campo declarado es `AuditLogService auditLogService`. `TrustedDeviceRepository` es un import residuo que provoca warning de compilación y confusión sobre las dependencias reales del componente.

**Corrección:** eliminar el import.

---

### RV-S6-002 — Import `@Async` no usado en `ExportSecurityHistoryUseCase.java`

**Archivo:** `audit/application/ExportSecurityHistoryUseCase.java`

```java
import org.springframework.scheduling.annotation.Async; // no aplicado en ningún método
```

El Javadoc indica correctamente que la generación es síncrona (R-F5-001). La anotación `@Async` no está aplicada a ningún método — el import es un residuo. Genera warning de compilación.

**Corrección:** eliminar el import.

---

## Revisión detallada ✅

### ACT-23 — TrustedDevicesComponent.spec.ts

| Aspecto | Estado |
|---|---|
| Cobertura: ngOnInit, loading, error handling | ✅ |
| revokeOne happy path + error | ✅ |
| revokeAll completo | ✅ |
| Estado vacío | ✅ |
| fakeAsync para operaciones asíncronas | ✅ correcto |
| `afterEach: http.verify()` | ✅ sin requests sin consumir |
| 8 escenarios — CoD LLD-frontend-notification | ✅ |

### ACT-25 — HmacKeyRotationMonitorJob

| Aspecto | Estado |
|---|---|
| No revela el valor de `hmacKeyPrevious` en los logs | ✅ solo registra presencia, nunca el valor |
| `SYSTEM_UUID` como actor del evento en audit_log | ✅ convención correcta |
| Falla silenciosamente si clave vacía | ✅ early return con log.debug |
| Job separado de los otros cleanup (03:00 UTC, 30 min después) | ✅ sin solapamiento |
| `@RequiredArgsConstructor` inyecta solo lo necesario | ✅ (salvo import no usado — NC-001) |

### DEBT-007 — NotificationController (SSE headers ADR-010)

| Aspecto | Estado |
|---|---|
| `X-Accel-Buffering: no` presente | ✅ |
| `Cache-Control: no-cache, no-store` presente | ✅ |
| `Connection: keep-alive` presente | ✅ |
| JWT sigue siendo requerido en `/stream` | ✅ `@AuthenticationPrincipal Jwt jwt` |
| `HttpServletResponse` inyectado limpiamente | ✅ |

### FEAT-004 cont. — buildBody() exhaustivo

| Aspecto | Estado |
|---|---|
| Switch exhaustivo sobre enum `SecurityEventType` | ✅ Java verifica en compilación que todos los casos están cubiertos |
| Mensajes descriptivos con metadata dinámica | ✅ 10 de 12 tipos usan metadata; 2 son fijos |
| `meta.getOrDefault()` — sin NPE si metadata incompleta | ✅ |
| `@Transactional` y `@Async` en métodos separados (RV-S5-001) | ✅ correcto |

### FEAT-005 — SecurityDashboardUseCase

| Aspecto | Estado |
|---|---|
| Sin lógica de negocio en el controller | ✅ |
| `@Transactional(readOnly = true)` — correcto para lecturas | ✅ |
| `computeSecurityScore()` — 3 reglas simples y ordenadas correctamente | ✅ ALERT primero (caso más grave) |
| DEBT-008 documentado (consultas secuenciales → CompletableFuture futuro) | ✅ |
| Records de respuesta como tipos internos del use case | ✅ buen encapsulamiento |

### FEAT-005 — ExportSecurityHistoryUseCase

| Aspecto | Estado |
|---|---|
| `MAX_EVENTS = 1000` — límite explícito (R-F5-001) | ✅ |
| `Math.min(days, 90)` — validación defensiva del período | ✅ |
| Generación PDF con OpenPDF — sin librerías adicionales no aprobadas | ✅ |
| Hash SHA-256 en header `X-Content-SHA256` (controller) | ✅ |
| `Optional.empty()` para 204 — contrato claro | ✅ |
| `ByteArrayOutputStream` — no bloquea ni crea temp files | ✅ |

### FEAT-005 — Frontend Angular

| Aspecto | Estado |
|---|---|
| `SecurityDashboardComponent` — Signals sin Signal Store (estado local) | ✅ correcto para componente no compartido |
| `barHeight()` — computed con `maxCount` evita división por cero (`Math.max(1,...)`) | ✅ |
| `SecurityExportComponent` — `URL.revokeObjectURL()` tras click | ✅ sin memory leak |
| `observe: 'response'` para capturar 204 en exportación | ✅ |
| Rutas lazy — no carga el módulo hasta navegar | ✅ |
| `role="img"` + `aria-label` en gráfico | ✅ WCAG 2.1 AA |

---

## Sugerencias (no bloqueantes)

### SUG-S6-001 — `twoFaActive` extraído del JWT claim `twoFaEnabled`

**Archivo:** `audit/api/SecurityAuditController.java`

```java
boolean twoFaActive = Boolean.TRUE.equals(jwt.getClaim("twoFaEnabled"));
```

El claim `twoFaEnabled` debe estar presente en el JWT para que el `SecurityScore` funcione. Si el claim no se emite actualmente (los JWTs existentes solo tienen `scope`, `sub`, `jti`), el valor será siempre `false` → el score siempre dará `ALERT`. Verificar que el claim se emite en `JwtService.issueFullSession()`. Si no, añadirlo o consultar la BD directamente.

### SUG-S6-002 — Hash CSV es sobre los datos, no el archivo completo

**Archivo:** `ExportSecurityHistoryUseCase.generateCsv()`

El hash SHA-256 se calcula sobre los datos CSV antes de añadir la línea `#sha256=...`. Esto es correcto (es imposible incluir el hash del archivo dentro del propio archivo), pero debería documentarse en el pie del CSV con una nota: `#sha256-scope=data-rows-only`. Así el usuario entiende qué está verificando. Mejora para Sprint 7.

---

## Correcciones requeridas antes de QA

### RV-S6-001: eliminar `import TrustedDeviceRepository` en `HmacKeyRotationMonitorJob`
### RV-S6-002: eliminar `import @Async` en `ExportSecurityHistoryUseCase`

Ambas son eliminaciones de una línea — corrección inmediata, sin nuevo ciclo de CR.

---

*SOFIA Code Reviewer Agent · BankPortal · Sprint 6 · 2026-05-28*
