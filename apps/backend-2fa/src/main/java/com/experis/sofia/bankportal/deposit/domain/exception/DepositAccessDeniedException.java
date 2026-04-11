package com.experis.sofia.bankportal.deposit.domain.exception;

public class DepositAccessDeniedException extends RuntimeException {
    public DepositAccessDeniedException() {
        super("Acceso denegado al depósito");
    }
}
