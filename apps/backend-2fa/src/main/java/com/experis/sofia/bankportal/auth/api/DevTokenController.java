package com.experis.sofia.bankportal.auth.api;

import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Endpoint de desarrollo — genera JWT para usuario STG sin autenticación.
 * Solo activo con perfil staging/development. NUNCA en producción.
 *
 * GET /dev/token?email=a.delacuadra@nemtec.es
 *
 * @author SOFIA DevOps — STG helper
 */
@RestController
@RequiredArgsConstructor
@Profile("!production")
public class DevTokenController {

    private final JdbcClient       jdbc;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/dev/token")
    public ResponseEntity<?> getToken(
            @RequestParam(defaultValue = "a.delacuadra@nemtec.es") String email) {

        return jdbc.sql("SELECT id, username FROM users WHERE email = :email OR username = :email")
                .param("email", email)
                .query((rs, i) -> new Object[]{
                        (UUID) rs.getObject("id"),
                        rs.getString("username")})
                .optional()
                .map(row -> {
                    String token = jwtTokenProvider.generate((UUID) row[0], (String) row[1]);
                    return ResponseEntity.ok(new TokenResponse(token, (String) row[1]));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    public record TokenResponse(String accessToken, String username) {}
}
