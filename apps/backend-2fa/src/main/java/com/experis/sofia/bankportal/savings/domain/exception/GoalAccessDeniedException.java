package com.experis.sofia.bankportal.savings.domain.exception;

public class GoalAccessDeniedException extends RuntimeException {
    public GoalAccessDeniedException() { super("Acceso denegado al objetivo (no pertenece al usuario)"); }
    public GoalAccessDeniedException(String message) { super(message); }
    public GoalAccessDeniedException(String message, Throwable cause) { super(message, cause); }
}
