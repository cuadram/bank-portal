package com.experis.sofia.bankportal.deposit.domain.exception;

public class DepositNotFoundException extends RuntimeException {
    public DepositNotFoundException(String id) {
        super("Depósito no encontrado: " + id);
    }
}
