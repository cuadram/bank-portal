package com.experis.sofia.bankportal.deposit.domain.exception;

public class DepositNotCancellableException extends RuntimeException {
    public DepositNotCancellableException(String reason) {
        super("El depósito no puede cancelarse: " + reason);
    }
}
