package com.experis.sofia.bankportal.loan.domain.exception;

public class LoanAccessDeniedException extends RuntimeException {
    public LoanAccessDeniedException(String resourceId) {
        super("Acceso denegado al recurso: " + resourceId);
    }
}
