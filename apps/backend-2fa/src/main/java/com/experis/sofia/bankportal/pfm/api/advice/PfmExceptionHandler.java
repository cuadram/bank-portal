package com.experis.sofia.bankportal.pfm.api.advice;

import com.experis.sofia.bankportal.pfm.domain.service.BudgetService.*;
import com.experis.sofia.bankportal.pfm.domain.service.UserRuleService.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

/**
 * Manejador de excepciones del dominio PFM.
 * FEAT-023 Sprint 25.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@RestControllerAdvice(basePackages = "com.experis.sofia.bankportal.pfm")
public class PfmExceptionHandler {

    @ExceptionHandler(BudgetLimitExceededException.class)
    public ResponseEntity<Map<String,String>> handleBudgetLimit(BudgetLimitExceededException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(DuplicateBudgetException.class)
    public ResponseEntity<Map<String,String>> handleDuplicate(DuplicateBudgetException e) {
        return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(BudgetNotFoundException.class)
    public ResponseEntity<Map<String,String>> handleNotFound(BudgetNotFoundException e) {
        return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(RuleLimitExceededException.class)
    public ResponseEntity<Map<String,String>> handleRuleLimit(RuleLimitExceededException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,String>> handleValidation(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
