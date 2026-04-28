package com.experis.sofia.bankportal.savings.domain.exception;

public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException() { super("Saldo disponible insuficiente para la aportacion"); }
    public InsufficientFundsException(String message) { super(message); }
    public InsufficientFundsException(String message, Throwable cause) { super(message, cause); }
}
