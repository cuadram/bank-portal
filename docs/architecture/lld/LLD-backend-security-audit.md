# LLD — Backend: Panel de Auditoría de Seguridad

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-backend-security-audit |
| **Feature** | FEAT-005 — Panel de Auditoría |
| **Sprint** | 6 |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-05-26 |
| **Versión** | 1.0.0 |
| **ADRs** | ADR-004 (audit_log inmutable) |
| **Relacionado** | LLD-frontend-security-audit.md |

---

## 1. Responsabilidad del módulo

El módulo `audit` expone al usuario sus propios registros de auditoría de seguridad
(lectura sobre `audit_log` ya existente) y genera exportaciones en PDF y CSV.

- **US-401:** resumen estadístico (dashboard) — lecturas agregadas de `audit_log` y tablas relacionadas
- **US-402:** exportación PDF/CSV con hash de integridad SHA-256
- **US-403:** preferencias de seguridad unificadas (lectura/escritura de múltiples módulos)

---

## 2. Arquitectura de capas

```
API
  SecurityAuditController
    GET /api/v1/security/dashboard        ← US-401 resumen
    GET /api/v1/security/export?format=pdf|csv&days=30|60|90  ← US-402
    GET /api/v1/security/preferences      ← US-403 leer
    PUT /api/v1/security/preferences      ← US-403 actualizar

Application
  SecurityDashboardUseCase              ← agrega datos de audit_log + sesiones + dispositivos
  ExportSecurityHistoryUseCase          ← genera PDF/CSV @Async (R-F5-001)
  SecurityPreferencesUseCase            ← lee y actualiza preferencias de múltiples módulos

Domain
  SecurityDashboardSummary (record)     ← DTO de dominio con los KPIs del dashboard
  SecurityPreferences (record)          ← preferencias unificadas del usuario

Infrastructure
  AuditLogQueryRepository               ← consultas de lectura sobre audit_log (sin escritura)
  SecurityExportService                 ← OpenPDF / Apache Commons CSV
```

---

## 3. Flujo US-401 — Dashboard

```
GET /api/v1/security/dashboard
  → SecurityDashboardUseCase.execute(userId)
      Consultas paralelas (CompletableFuture):
        1. auditLogRepo.countEventsByType(userId, 30d)   → Map<eventType, count>
        2. sessionRepo.countActiveByUserId(userId)        → int activeSessions
        3. trustedDeviceRepo.countActiveByUserId(userId)  → int trustedDevices
        4. notifRepo.countUnreadByUserId(userId)          → long unreadNotifs
        5. auditLogRepo.findRecent(userId, 10)            → List<AuditEvent>
      → SecurityDashboardSummary(
            loginCount30d, failedAttempts30d,
            activeSessions, trustedDevices, unreadNotifs,
            recentEvents, securityScore)

SecurityScore (enum): SECURE | REVIEW | ALERT
  SECURE: 2FA activo + ≤3 sesiones + 0 intentos fallidos recientes
  REVIEW: 2FA activo pero ≥ 1 alerta abierta
  ALERT:  2FA desactivado O intentos fallidos > umbral
```

**DTO de respuesta:**
```java
public record SecurityDashboardResponse(
    int    loginCount30d,
    int    failedAttempts30d,
    int    activeSessions,
    int    trustedDevices,
    long   unreadNotifications,
    String securityScore,           // SECURE | REVIEW | ALERT
    List<AuditEventSummary> recentEvents,
    List<DailyActivityPoint> activityChart  // 30 puntos (1 por día)
) {}

public record AuditEventSummary(
    String eventType,
    String description,
    String ipMasked,
    LocalDateTime occurredAt
) {}

public record DailyActivityPoint(
    LocalDate date,
    int count
) {}
```

---

## 4. Flujo US-402 — Exportación PDF/CSV

**R-F5-001:** generación @Async para no bloquear el response thread.

```
GET /api/v1/security/export?format=pdf&days=30
  → ExportSecurityHistoryUseCase.execute(userId, format, days)
      1. auditLogRepo.findByUserIdAndPeriod(userId, days)  → List<AuditEvent>
      2. Si lista vacía → ResponseEntity.noContent() (HTTP 204)
      3. Generar PDF (OpenPDF) o CSV (Apache Commons CSV) en ByteArrayOutputStream
      4. Calcular hash SHA-256 del contenido generado
      5. Para PDF: incrustar hash en pie de página
         Para CSV: añadir línea de metadata al final: #sha256=<hash>
      6. Devolver como StreamingResponseBody para streaming eficiente
```

**PDF — estructura:**
```
Cabecera: "Banco Meridian — Historial de Seguridad"
          Usuario: {nombre}  |  Período: {fecha inicio} → {fecha fin}
          Generado: {timestamp ISO 8601}

Tabla:
  | Fecha/Hora | Tipo de evento | Descripción | Dispositivo | IP enmascarada |

Pie de página:
  SHA-256: {hash} — Para verificar: sha256sum <archivo.pdf>
  Banco Meridian · Confidencial · PCI-DSS req. 10.7
```

**Dependencia nueva en pom.xml:**
```xml
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>1.3.30</version>
</dependency>
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-csv</artifactId>
    <version>1.10.0</version>
</dependency>
```

---

## 5. Flujo US-403 — Preferencias unificadas

**GET /api/v1/security/preferences:**
```java
public record SecurityPreferencesResponse(
    boolean twoFactorEnabled,
    int     sessionTimeoutMinutes,  // de users.session_timeout_minutes
    int     trustedDevicesCount,
    boolean notificationsEnabled,
    Map<String, Boolean> notificationsByType  // por SecurityEventType
) {}
```

**PUT /api/v1/security/preferences:**
```java
public record UpdateSecurityPreferencesRequest(
    Integer sessionTimeoutMinutes,    // null = no cambiar (5–60, PCI-DSS)
    Map<String, Boolean> notificationsByType  // null = no cambiar
) {}
```

**R-F5-003 — separación visible vs audit_log:**
```
Las preferencias de notificaciones controlan:
  ✅ Si la notificación aparece en user_notifications (visible al usuario)
  ✅ Si se envía SSE / email
  ❌ NO controlan el registro en audit_log (siempre activo, inmutable)
```

Si se necesita persistir las preferencias de notificación → **Flyway V8:**
```sql
CREATE TABLE user_notification_preferences (
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    enabled    BOOLEAN     NOT NULL DEFAULT true,
    updated_at TIMESTAMP   NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_type)
);
```

---

## 6. AuditLogQueryRepository — lectura segura

```java
public interface AuditLogQueryRepository {
    /** US-401: cuenta eventos por tipo en los últimos N días para el usuario. */
    Map<String, Long> countEventsByTypeAndPeriod(UUID userId, int days);

    /** US-401: últimos N eventos del usuario para la tabla "Actividad reciente". */
    List<AuditEvent> findRecentByUserId(UUID userId, int limit);

    /** US-401: actividad diaria para el gráfico de barras (30 días). */
    List<DailyActivityPoint> findDailyActivityByUserId(UUID userId, int days);

    /** US-402: eventos del usuario en un período para exportación. */
    List<AuditEvent> findByUserIdAndPeriod(UUID userId, int days);
}
```

**Importante:** `audit_log` es inmutable (trigger PostgreSQL desde V4). Este repositorio
es de **solo lectura** — nunca escribe ni modifica registros de auditoría.

---

## 7. Variables de entorno nuevas

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `EXPORT_PDF_MAX_EVENTS` | No | `1000` | Límite de eventos por exportación (R-F5-001) |
| `EXPORT_PDF_TIMEOUT_SECONDS` | No | `30` | Timeout de generación PDF |

---

## 8. Tests requeridos (DoD Sprint 6)

| Test | Tipo | Cobertura |
|---|---|---|
| `SecurityDashboardUseCaseTest` | Unit | KPIs calculados correctamente · score SECURE/REVIEW/ALERT |
| `ExportSecurityHistoryUseCaseTest` | Unit | PDF generado con hash · CSV con metadata · 204 sin eventos |
| `SecurityPreferencesUseCaseTest` | Unit | R-F5-003: audit_log no afectado por preferencias |
| `SecurityAuditControllerTest` | Slice | GET dashboard 200 · GET export 200/204 · GET/PUT preferences |

---

*SOFIA Architect Agent · BankPortal · FEAT-005 · LLD Backend · 2026-05-26 (ACT-22)*
