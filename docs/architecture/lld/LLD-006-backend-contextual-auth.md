# LLD-006-backend — Autenticación Contextual (Backend)
## FEAT-006 · US-603 · Sprint 7

| Campo | Valor |
|---|---|
| **Documento** | LLD-006-backend-contextual-auth.md |
| **Feature** | FEAT-006 — Autenticación Contextual |
| **US** | US-603 |
| **Estado** | 🔒 PROPUESTO — Pendiente aprobación Tech Lead |
| **Fecha** | 2026-06-09 |
| **Autor** | SOFIA Architect Agent |
| **ADR relacionado** | ADR-011 (scope context-pending), ADR-007 (token HMAC) |

---

## 1. Alcance

Este LLD cubre el diseño técnico backend para US-603 (Login contextual). El frontend se cubre en LLD-006-frontend-security-prefs.md.

---

## 2. Nuevos componentes backend

### 2.1 SubnetExtractionService

```java
@Service
public class SubnetExtractionService {

    /**
     * Extrae la subnet /16 de una IP.
     * Ej: "192.168.1.100" → "192.168"
     *     "10.20.30.40"   → "10.20"
     * IPv6: toma los primeros 2 grupos del prefijo /32.
     */
    public String extractSubnet(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) return "unknown";
        String[] parts = ipAddress.split("\\.");
        if (parts.length >= 2) {
            return parts[0] + "." + parts[1];
        }
        // IPv6: simplificado para MVP — usar primeros 4 chars del bloque
        return ipAddress.contains(":") ? ipAddress.substring(0, ipAddress.indexOf(":", 5)) : "unknown";
    }
}
```

### 2.2 KnownSubnetRepository

```java
@Repository
public interface KnownSubnetRepository extends JpaRepository<KnownSubnet, UUID> {

    boolean existsByUserIdAndSubnetAndConfirmedTrue(UUID userId, String subnet);

    Optional<KnownSubnet> findByUserIdAndSubnet(UUID userId, String subnet);

    @Modifying
    @Query("UPDATE KnownSubnet s SET s.confirmed = true, s.lastSeen = :now WHERE s.userId = :userId AND s.subnet = :subnet")
    void confirmSubnet(UUID userId, String subnet, LocalDateTime now);
}
```

### 2.3 ContextPendingTokenService

```java
@Service
@RequiredArgsConstructor
public class ContextPendingTokenService {

    private final JwtService jwtService;
    private final HmacTokenService hmacTokenService;  // reutiliza ADR-007
    private final NotificationService notificationService;
    private final KnownSubnetRepository knownSubnetRepo;

    /**
     * Determina si el login requiere confirmación contextual.
     * Retorna true si la subnet es nueva (no confirmada previamente).
     */
    public boolean requiresContextConfirmation(UUID userId, String clientIp) {
        String subnet = subnetExtractionService.extractSubnet(clientIp);
        return !knownSubnetRepo.existsByUserIdAndSubnetAndConfirmedTrue(userId, subnet);
    }

    /**
     * Emite JWT context-pending y envía email de confirmación.
     */
    public ContextPendingResult initiateContextConfirmation(UUID userId, String clientIp) {
        String subnet = subnetExtractionService.extractSubnet(clientIp);

        // Registrar subnet como no confirmada (si no existe)
        knownSubnetRepo.findByUserIdAndSubnet(userId, subnet).ifPresentOrElse(
            s -> { s.setLastSeen(LocalDateTime.now()); knownSubnetRepo.save(s); },
            () -> knownSubnetRepo.save(new KnownSubnet(userId, subnet))
        );

        // Emitir JWT context-pending (ADR-011)
        String contextJwt = jwtService.issueContextPending(userId, subnet);

        // Generar token HMAC para enlace de email (reutiliza ADR-007, TTL 15min)
        String hmacToken = hmacTokenService.generate(userId.toString(), Duration.ofMinutes(15));

        // Enviar email de confirmación
        notificationService.sendContextConfirmationEmail(userId, subnet, hmacToken);

        // Registrar en audit_log
        auditLogRepository.save(AuditLog.of(userId, SecurityEventType.LOGIN_NEW_CONTEXT, clientIp));

        return new ContextPendingResult(contextJwt, subnet);
    }
}
```

### 2.4 ContextConfirmationUseCase

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ContextConfirmationUseCase {

    private final HmacTokenService hmacTokenService;
    private final JwtService jwtService;
    private final KnownSubnetRepository knownSubnetRepo;
    private final TokenBlacklistService blacklistService;
    private final AuditLogRepository auditLogRepository;

    public FullSessionResult confirmContext(String hmacToken, String contextJwtJti,
                                            UUID userId, String subnet, String clientIp) {
        // 1. Validar token HMAC del email (TTL, one-time)
        hmacTokenService.validateAndConsume(hmacToken, userId.toString());

        // 2. Invalidar JWT context-pending en blacklist Redis
        blacklistService.blacklist(contextJwtJti, Duration.ofMinutes(15));

        // 3. Confirmar subnet como conocida
        knownSubnetRepo.confirmSubnet(userId, subnet, LocalDateTime.now());

        // 4. Emitir JWT full-session
        String fullSessionJwt = jwtService.issueFullSession(userId);

        // 5. Audit log
        auditLogRepository.save(AuditLog.of(userId, SecurityEventType.LOGIN_NEW_CONTEXT_CONFIRMED, clientIp));

        return new FullSessionResult(fullSessionJwt);
    }
}
```

### 2.5 ContextConfirmationController

```java
@RestController
@RequestMapping("/auth/context")
@RequiredArgsConstructor
public class ContextConfirmationController {

    private final ContextConfirmationUseCase confirmationUseCase;
    private final ContextPendingTokenService contextPendingService;

    /**
     * POST /auth/context/confirm
     * Requiere JWT context-pending en Authorization header.
     * Body: { "token": "<hmac-token-from-email>" }
     */
    @PostMapping("/confirm")
    public ResponseEntity<AuthResponse> confirm(
            @RequestBody ContextConfirmRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String subnet = jwt.getClaimAsString("detectedSubnet");
        String jti = jwt.getId();

        FullSessionResult result = confirmationUseCase.confirmContext(
            request.token(), jti, userId, subnet, extractClientIp());

        return ResponseEntity.ok(new AuthResponse(result.fullSessionJwt()));
    }

    /**
     * POST /auth/context/resend
     * Reenvía email de confirmación (invalidando el anterior).
     */
    @PostMapping("/resend")
    public ResponseEntity<Void> resend(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        String subnet = jwt.getClaimAsString("detectedSubnet");
        contextPendingService.resendConfirmationEmail(userId, subnet);
        return ResponseEntity.accepted().build();
    }
}
```

---

## 3. Modificaciones a componentes existentes

### 3.1 AuthenticationService — integrar flujo contextual

```java
// En el método postOtpVerification(), tras validar OTP:
if (contextPendingTokenService.requiresContextConfirmation(userId, clientIp)) {
    ContextPendingResult result = contextPendingTokenService.initiateContextConfirmation(userId, clientIp);
    return AuthResult.contextPending(result.contextJwt(), result.subnet());
}
// else: flujo normal → emitir full-session
return AuthResult.fullSession(jwtService.issueFullSession(userId));
```

### 3.2 JwtService — nuevo método issueContextPending

```java
public String issueContextPending(UUID userId, String detectedSubnet) {
    return Jwts.builder()
        .subject(userId.toString())
        .claim("scope", "context-pending")
        .claim("detectedSubnet", detectedSubnet)
        .id(UUID.randomUUID().toString())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + 900_000L))  // 15 min
        .signWith(privateKey, Jwts.SIG.RS256)
        .compact();
}
```

### 3.3 SecurityEventType — nuevos valores

```java
LOGIN_NEW_CONTEXT,           // Intento de login desde subnet nueva (context-pending emitido)
LOGIN_NEW_CONTEXT_CONFIRMED, // Contexto nuevo confirmado por email
```

---

## 4. Tests obligatorios

| Test | Capa | Descripción |
|---|---|---|
| `SubnetExtractionServiceTest` | Unitario | IPv4 /16, IPv6, null, malformed |
| `ContextPendingTokenServiceTest` | Unitario | Mock repos — subnet nueva vs conocida |
| `ContextConfirmationUseCaseTest` | Unitario | HMAC válido/expirado/ya usado |
| `SecurityFilterChainContextPendingTest` | Integración | `context-pending` bloqueado en `/api/**`; `full-session` accede a `/auth/context/**` |
| `ContextConfirmationControllerTest` | Integración (MockMvc) | Happy path + HMAC expirado + JWT sin scope |

---

## 5. Trazabilidad CMMI Nivel 3

| Área | Evidencia |
|---|---|
| REQM | US-603 criterios de aceptación trazados a cada componente |
| TS | Diseño antes del código — gate Tech Lead requerido |
| VER | 5 tests definidos antes del código |
| RSKM | R-F6-002 (falsos positivos VPN): SubnetExtractionService usa /16, whitelist corporativa configurable |
| R-F6-003 | SecurityFilterChainContextPendingTest verifica el orden de requestMatchers |

---

*SOFIA Architect Agent · BankPortal · LLD-006-backend · 2026-06-09*
*🔒 GATE: aprobación Tech Lead requerida antes de iniciar US-603*
