package com.experis.sofia.bankportal.savings.domain.exception;

public class MaxGoalsReachedException extends RuntimeException {
    public MaxGoalsReachedException() { super("Limite de 10 objetivos activos alcanzado (RN-F024-01)"); }
    public MaxGoalsReachedException(String message) { super(message); }
    public MaxGoalsReachedException(String message, Throwable cause) { super(message, cause); }
}
