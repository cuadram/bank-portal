# ADR-008 — Trust token de dispositivo confiable: cookie HttpOnly vs localStorage

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-008 |
| **Feature** | FEAT-003 — Dispositivos de Confianza |
| **Fecha** | 2026-04-28 |
| **Estado** | Propuesto → Aprobado (pendiente Tech Lead) |
| **Relacionado** | ADR-001 (JWT RS256), ADR-006 (Redis blacklist), ADR-007 (HMAC deny link) |

---

## Contexto

US-201 requiere persistir un trust token en el cliente para que el navegador
lo reenvíe automáticamente en cada login, permitiendo al servidor verificar
que el dispositivo es de confianza y omitir el OTP (US-203).

El token es un valor firmado con HMAC-SHA256 que contiene:
- `userId` (UUID)
- `deviceFingerprintHash` (SHA-256 de UA + IP subnet)
- `expiresAt` (Unix timestamp)

La decisión crítica es **dónde almacenarlo en el cliente** y con qué
atributos enviarlo al servidor.

---

## Decisión

**Cookie HttpOnly + Secure + SameSite=Strict con nombre `bp_trust`.**

No se usa localStorage, sessionStorage ni ningún mecanismo accesible desde JavaScript.

```
Set-Cookie: bp_trust=<hmac_token>;
            HttpOnly;
            Secure;
            SameSite=Strict;
            Path=/api/v1/auth/login;
            Max-Age=2592000
```

El `Path` se limita a `/api/v1/auth/login` para que la cookie solo se envíe
en el endpoint de login — no en cada request autenticada.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Cookie HttpOnly Secure SameSite=Strict** ✅ | Inaccesible desde JS (XSS no puede leerlo) · enviada automáticamente por el navegador · SameSite=Strict bloquea CSRF · Path limitado reduce superficie | Requiere gestión de cookies en Spring Security · no funciona en apps móviles nativas sin workaround |
| localStorage | Simple de implementar en Angular · fácil de leer desde el frontend | Accesible desde JS → vulnerable a XSS · persiste indefinidamente sin TTL automático · cualquier script en la página puede exfiltrar el token |
| sessionStorage | Mejor que localStorage (limpiado al cerrar pestaña) | Aún accesible desde JS → vulnerable a XSS · no persiste entre sesiones → inutilizable para "recordar 30 días" |
| Cookie SameSite=Lax | Compatible con navegación desde links externos | CSRF posible en requests GET desde otros dominios — inaceptable para un endpoint de autenticación |
| Header custom `X-Trust-Token` en localStorage | Permite control explícito en Angular | Mismo problema que localStorage + requiere interceptor Angular para cada request |

---

## Consecuencias

### Positivas
- El trust token es completamente opaco para JavaScript — XSS no puede exfiltrarlo.
- `SameSite=Strict` elimina el vector CSRF de forma nativa sin necesidad de token CSRF adicional.
- `Path=/api/v1/auth/login` garantiza que la cookie solo viaja en el login, no en las ~100 requests autenticadas por sesión — sin overhead de ancho de banda.
- `Max-Age=2592000` (30 días) + renovación automática en cada uso (US-204) mantiene la cookie viva mientras el dispositivo se use regularmente.
- Binding al fingerprint del dispositivo: incluso si la cookie fuera copiada a otro dispositivo, el hash del UA+IP subnet no coincidiría.

### Trade-offs
- Spring Security necesita configuración explícita para leer la cookie `bp_trust` en el filtro de login (`TrustedDeviceAuthFilter`).
- Las apps móviles nativas (Android/iOS) no gestionan cookies automáticamente como los navegadores. Si en el futuro se desarrolla una app nativa, se necesitará un mecanismo alternativo (Secure Enclave + header custom). Registrado como DEBT-006 para evaluación futura.
- El endpoint `/api/v1/auth/login` debe devolver `Set-Cookie` en HTTPS — en local dev sin HTTPS la cookie `Secure` no se persiste. Requiere `application-local.yml` con `server.ssl.enabled=false` y override del atributo `Secure` solo en perfil `local`.

### Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cookie robada físicamente del navegador | Binding a fingerprint hace el token inútil en otro dispositivo |
| CSRF (aunque SameSite=Strict lo bloquea) | Además: el endpoint de login valida `Origin` y `Referer` headers |
| Trust token válido después de revocación | Verificación en BD en cada uso — Redis no se usa para trust tokens (a diferencia de session blacklist) |
| Cookie expirada rota UX | Flujo graceful: si `bp_trust` expirado → solicitar OTP + ofrecer "Recordar este dispositivo" |

### Impacto en servicios existentes
- `AuthService.login()`: lectura de cookie `bp_trust` antes de emitir pre-auth token — compatible hacia atrás (si la cookie no existe, flujo 2FA normal).
- `SecurityConfig`: añadir `TrustedDeviceAuthFilter` antes de `JwtAuthenticationFilter` — mismo patrón que `TokenBlacklistFilter` (ADR-006).
- CORS: no impacto — `SameSite=Strict` solo aplica a requests same-origin.

---

## Implementación de referencia

```java
// TrustedDeviceAuthFilter.java — se ejecuta en el login flow
@Component
@RequiredArgsConstructor
public class TrustedDeviceAuthFilter extends OncePerRequestFilter {

    private final TrustedDeviceService trustedDeviceService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Solo activo en el endpoint de login
        return !request.getRequestURI().equals("/api/v1/auth/login")
            || !request.getMethod().equals("POST");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String trustToken = Arrays.stream(
                Optional.ofNullable(request.getCookies()).orElse(new Cookie[0]))
            .filter(c -> "bp_trust".equals(c.getName()))
            .map(Cookie::getValue)
            .findFirst().orElse(null);

        if (trustToken != null) {
            // Inyectar en el request para que AuthService lo lea
            request.setAttribute("TRUST_TOKEN", trustToken);
        }
        chain.doFilter(request, response);
    }
}

// AuthService.login() — extensión
public LoginResponse login(LoginRequest req, HttpServletRequest httpReq) {
    // ... validar credenciales ...

    String trustToken = (String) httpReq.getAttribute("TRUST_TOKEN");
    if (trustToken != null && trustedDeviceService.isValid(trustToken, userId, fingerprint)) {
        // Emitir JWT de sesión completa directamente — sin pre-auth token
        trustedDeviceService.renewTrustToken(trustToken, response);
        return LoginResponse.fullSession(jwtService.issueFullSession(userId));
    }

    // Flujo normal 2FA
    return LoginResponse.preAuth(jwtService.issuePreAuth(userId));
}

// Set-Cookie al crear trust token (US-201)
ResponseCookie cookie = ResponseCookie.from("bp_trust", hmacToken)
    .httpOnly(true)
    .secure(true)                           // false en perfil local
    .sameSite("Strict")
    .path("/api/v1/auth/login")
    .maxAge(Duration.ofDays(30))
    .build();
response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
```

---

## Nuevo secret requerido

```bash
# Clave HMAC para trust tokens (independiente de SESSION_DENY_LINK_HMAC_KEY)
kubectl create secret generic bankportal-trusted-device-secrets \
  --from-literal=TRUSTED_DEVICE_HMAC_KEY=$(openssl rand -hex 32) \
  -n bankportal-stg

# Registrar en Jenkins Credentials Manager (ACT-15):
# ID: bankportal-trusted-device-hmac-key
# Description: HMAC key para trust tokens de dispositivos de confianza FEAT-003
```

---

## Registro en README-CREDENTIALS.md (ACT-15)

```markdown
| bankportal-trusted-device-hmac-key | Secret text | Clave HMAC para trust tokens FEAT-003 |
```

---

*Generado por SOFIA Architect Agent · BankPortal · FEAT-003 · 2026-04-28*
*🔒 GATE: aprobación Tech Lead requerida antes de iniciar US-201/203*
