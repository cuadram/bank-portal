package com.experis.sofia.bankportal.loan.domain.exception;

public class DuplicateLoanApplicationException extends RuntimeException {
    public DuplicateLoanApplicationException(String userId) {
        super("Ya existe una solicitud PENDING para el usuario: " + userId);
    }
}
