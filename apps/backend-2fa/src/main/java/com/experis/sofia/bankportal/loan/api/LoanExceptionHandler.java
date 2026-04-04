package com.experis.sofia.bankportal.loan.api;

import com.experis.sofia.bankportal.loan.domain.exception.*;
import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * LA-TEST-003: todas las excepciones de dominio loans tienen handler HTTP explícito.
 * BUG-STG-022-002 FIX: InvalidOtpException desde paquete twofa no estaba cubierta
 *   por el scope de este handler → caía al handler por defecto de Spring → HTTP 500.
 *   Fix: handler explícito → 401 Unauthorized (OWASP A07: mensaje genérico).
 *
 * @author SOFIA Developer Agent — Sprint 22 STG-Verification
 */
@RestControllerAdvice(basePackages = "com.experis.sofia.bankportal.loan")
public class LoanExceptionHandler {

    /** BUG-STG-022-002: OTP inválido en solicitud de préstamo → 401 (no 500) */
    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidOtp(InvalidOtpException e) {
        return error(HttpStatus.UNAUTHORIZED, "OTP_INVALID", e.getMessage());
    }

    @ExceptionHandler(DuplicateLoanApplicationException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateLoanApplicationException e) {
        return error(HttpStatus.CONFLICT, "DUPLICATE_LOAN_APPLICATION", e.getMessage());
    }

    @ExceptionHandler(LoanApplicationNotCancellableException.class)
    public ResponseEntity<Map<String, Object>> handleNotCancellable(LoanApplicationNotCancellableException e) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "NOT_CANCELLABLE", e.getMessage());
    }

    @ExceptionHandler(LoanAccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(LoanAccessDeniedException e) {
        return error(HttpStatus.FORBIDDEN, "LOAN_ACCESS_DENIED", e.getMessage());
    }

    @ExceptionHandler(LoanSimulationException.class)
    public ResponseEntity<Map<String, Object>> handleSimulation(LoanSimulationException e) {
        return error(HttpStatus.BAD_REQUEST, "SIMULATION_ERROR", e.getMessage());
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String msg) {
        return ResponseEntity.status(status).body(Map.of(
                "error", code,
                "message", msg,
                "timestamp", Instant.now().toString()
        ));
    }
}
