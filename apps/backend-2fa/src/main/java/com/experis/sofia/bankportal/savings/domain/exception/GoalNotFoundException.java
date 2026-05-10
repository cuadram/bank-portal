package com.experis.sofia.bankportal.savings.domain.exception;

public class GoalNotFoundException extends RuntimeException {
    public GoalNotFoundException() { super("Objetivo de ahorro no encontrado"); }
    public GoalNotFoundException(String message) { super(message); }
    public GoalNotFoundException(String message, Throwable cause) { super(message, cause); }
}
