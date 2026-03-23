package com.experis.sofia.bankportal.auth.api;

import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Endpoints de desarrollo STG — solo activos con perfil !production.
 *
 * GET /dev/token?email=   → JWT válido sin login
 * GET /dev/hash?password= → BCrypt hash con el PasswordEncoder de Spring
 *
 * @author SOFIA DevOps — STG helper
 */
@RestController
@RequiredArgsConstructor
@Profile("!production")
public class DevTokenController {

    private final JdbcClient       jdbc;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder  passwordEncoder;

    /** Genera JWT válido para el usuario indicado por email o username. */
    @GetMapping("/dev/token")
    public ResponseEntity<?> getToken(
            @RequestParam(defaultValue = "a.delacuadra@nemtec.es") String email) {

        return jdbc.sql(
                "SELECT id, username FROM users WHERE email = :v OR username = :v")
                .param("v", email)
                .query((rs, i) -> Map.of(
                        "id",       (UUID) rs.getObject("id"),
                        "username", rs.getString("username")))
                .optional()
                .map(row -> {
                    String token = jwtTokenProvider.generate(
                            (UUID) row.get("id"),
                            (String) row.get("username"));
                    return ResponseEntity.ok(Map.of(
                            "accessToken", token,
                            "username",    row.get("username")));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Genera BCrypt hash con el mismo PasswordEncoder que usa el backend (cost=12). */
    @GetMapping("/dev/hash")
    public ResponseEntity<?> getHash(@RequestParam String password) {
        return ResponseEntity.ok(Map.of("hash", passwordEncoder.encode(password)));
    }
}
