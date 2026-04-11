package com.experis.sofia.bankportal.deposit.domain.exception;

public class DepositSimulationException extends RuntimeException {
    public DepositSimulationException(String reason) {
        super("Error en simulación de depósito: " + reason);
    }
}
