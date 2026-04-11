package com.experis.sofia.bankportal.loan.domain.exception;

public class LoanApplicationNotCancellableException extends RuntimeException {
    public LoanApplicationNotCancellableException(String id, String estado) {
        super("La solicitud " + id + " no puede cancelarse en estado: " + estado);
    }
}
