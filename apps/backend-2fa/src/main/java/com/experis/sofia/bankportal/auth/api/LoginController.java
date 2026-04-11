package com.experis.sofia.bankportal.auth.api;

import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

/**
 * Endpoint de autenticación para STG (sin 2FA).
 * POST /auth/login → valida email/password → devuelve JWT HMAC HS256.
 *
 * Acepta tanto email como username en el campo "email".
 *
 * @author SOFIA Developer Agent — STG auth endpoint
 */
@RestController
@RequiredArgsConstructor
public class LoginController {

    private final JdbcClient       jdbc;
    private final PasswordEncoder  passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    record UserRow(UUID id, String username, String passwordHash) {}

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {

        Optional<UserRow> userOpt = jdbc.sql(
                "SELECT id, username, password_hash FROM users WHERE email = :login OR username = :login")
                .param("login", req.email())
                .query((rs, i) -> new UserRow(
                        (UUID) rs.getObject("id"),
                        rs.getString("username"),
                        rs.getString("password_hash")))
                .optional();

        if (userOpt.isEmpty() ||
                !passwordEncoder.matches(req.password(), userOpt.get().passwordHash())) {
            return ResponseEntity.status(401).body("Credenciales incorrectas");
        }

        UserRow u = userOpt.get();
        String token = jwtTokenProvider.generate(u.id(), u.username());
        return ResponseEntity.ok(new LoginResponse(token));
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password) {}

    public record LoginResponse(String accessToken) {}
}
