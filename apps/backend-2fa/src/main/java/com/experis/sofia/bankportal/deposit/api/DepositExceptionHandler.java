package com.experis.sofia.bankportal.deposit.api;

import com.experis.sofia.bankportal.deposit.domain.exception.*;
import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * Handler de excepciones del módulo deposit.
 * LA-TEST-003: toda excepción de dominio custom tiene handler HTTP explícito.
 * BUG-STG-022-002 patrón: InvalidOtpException cubierto explícitamente.
 */
@RestControllerAdvice(assignableTypes = DepositController.class)
public class DepositExceptionHandler {

    @ExceptionHandler(DepositNotFoundException.class)
    ResponseEntity<Map<String,Object>> handle(DepositNotFoundException e) {
        return ResponseEntity.status(404).body(err("DEPOSIT_NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(DepositAccessDeniedException.class)
    ResponseEntity<Map<String,Object>> handle(DepositAccessDeniedException e) {
        return ResponseEntity.status(403).body(err("ACCESS_DENIED", e.getMessage()));
    }

    @ExceptionHandler(DepositNotCancellableException.class)
    ResponseEntity<Map<String,Object>> handle(DepositNotCancellableException e) {
        return ResponseEntity.status(409).body(err("NOT_CANCELLABLE", e.getMessage()));
    }

    @ExceptionHandler(DepositSimulationException.class)
    ResponseEntity<Map<String,Object>> handle(DepositSimulationException e) {
        return ResponseEntity.status(400).body(err("SIMULATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(InvalidOtpException.class)
    ResponseEntity<Map<String,Object>> handle(InvalidOtpException e) {
        return ResponseEntity.status(401).body(err("OTP_INVALID", e.getMessage()));
    }

    private Map<String,Object> err(String code, String msg) {
        return Map.of("error", code, "message", msg, "timestamp", Instant.now().toString());
    }
}
