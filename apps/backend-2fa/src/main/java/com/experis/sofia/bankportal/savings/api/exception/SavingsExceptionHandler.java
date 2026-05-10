package com.experis.sofia.bankportal.savings.api.exception;

import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.exception.InsufficientFundsException;
import com.experis.sofia.bankportal.savings.domain.exception.MaxGoalsReachedException;
import com.experis.sofia.bankportal.savings.domain.exception.MilestoneAlreadyEmittedException;
import com.experis.sofia.bankportal.savings.domain.exception.OptimisticLockExhaustedException;
import com.experis.sofia.bankportal.savings.domain.exception.ReservedExceedsTargetException;
import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manejador de excepciones del bounded context savings (FEAT-024).
 *
 * <p>Mapeo dominio → HTTP:
 * <ul>
 *   <li>{@link GoalNotFoundException}            → 404 NOT_FOUND</li>
 *   <li>{@link GoalAccessDeniedException}        → 403 FORBIDDEN</li>
 *   <li>{@link MaxGoalsReachedException}         → 409 CONFLICT (RN-F024-02)</li>
 *   <li>{@link InsufficientFundsException}       → 422 UNPROCESSABLE_ENTITY</li>
 *   <li>{@link ReservedExceedsTargetException}   → 422 UNPROCESSABLE_ENTITY</li>
 *   <li>{@link MilestoneAlreadyEmittedException} → 409 CONFLICT (idempotencia)</li>
 *   <li>{@link OptimisticLockExhaustedException} → 409 CONFLICT (concurrencia BUG-Q-008)</li>
 *   <li>{@link InvalidOtpException}              → 401 UNAUTHORIZED (SCA RN-F024-12)</li>
 *   <li>{@link IllegalStateException}            → 409 CONFLICT (transiciones invalidas)</li>
 *   <li>{@link IllegalArgumentException}         → 400 BAD_REQUEST</li>
 *   <li>{@link MethodArgumentNotValidException}  → 400 BAD_REQUEST (jakarta.validation)</li>
 * </ul>
 *
 * <p>Scoped a {@code basePackages} savings (LA-TEST-003) — no captura excepciones
 * de otros bounded contexts.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase E
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.experis.sofia.bankportal.savings")
public class SavingsExceptionHandler {

    @ExceptionHandler(GoalNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(GoalNotFoundException e) {
        return error(HttpStatus.NOT_FOUND, "GOAL_NOT_FOUND", e.getMessage());
    }

    @ExceptionHandler(GoalAccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(GoalAccessDeniedException e) {
        return error(HttpStatus.FORBIDDEN, "GOAL_ACCESS_DENIED", e.getMessage());
    }

    @ExceptionHandler(MaxGoalsReachedException.class)
    public ResponseEntity<Map<String, Object>> handleMaxGoals(MaxGoalsReachedException e) {
        return error(HttpStatus.CONFLICT, "MAX_GOALS_REACHED", e.getMessage());
    }

    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientFunds(InsufficientFundsException e) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_FUNDS", e.getMessage());
    }

    @ExceptionHandler(ReservedExceedsTargetException.class)
    public ResponseEntity<Map<String, Object>> handleReservedExceedsTarget(ReservedExceedsTargetException e) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "RESERVED_EXCEEDS_TARGET", e.getMessage());
    }

    @ExceptionHandler(MilestoneAlreadyEmittedException.class)
    public ResponseEntity<Map<String, Object>> handleMilestoneEmitted(MilestoneAlreadyEmittedException e) {
        return error(HttpStatus.CONFLICT, "MILESTONE_ALREADY_EMITTED", e.getMessage());
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidOtp(InvalidOtpException e) {
        // El controller traduce 'OTP_REQUIRED' (cuando body.otp == null) a 401 con
        // codigo OTP_REQUIRED. Aqui solo capturamos OTPs invalidos enviados.
        return error(HttpStatus.UNAUTHORIZED, "INVALID_OTP", e.getMessage());
    }

    @ExceptionHandler(OptimisticLockExhaustedException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLockExhausted(OptimisticLockExhaustedException e) {
        // BUG-S26-Q-008 fix: tras retry agotado en concurrencia, devolvemos 409
        log.warn("savings.concurrency.conflict {}", e.getMessage());
        return error(HttpStatus.CONFLICT, "CONCURRENCY_CONFLICT", e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException e) {
        return error(HttpStatus.CONFLICT, "ILLEGAL_STATE", e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        return error(HttpStatus.BAD_REQUEST, "BAD_REQUEST", e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        String firstError = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("validation error");
        log.debug("savings.validation.failed {}", firstError);
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", firstError);
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", code);
        body.put("message", message);
        body.put("status", status.value());
        return ResponseEntity.status(status).body(body);
    }
}
