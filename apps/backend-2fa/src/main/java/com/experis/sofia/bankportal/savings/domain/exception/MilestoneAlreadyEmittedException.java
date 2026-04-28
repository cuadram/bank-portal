package com.experis.sofia.bankportal.savings.domain.exception;

public class MilestoneAlreadyEmittedException extends RuntimeException {
    public MilestoneAlreadyEmittedException() { super("Hito ya emitido para este objetivo (idempotencia RN-F024-09)"); }
    public MilestoneAlreadyEmittedException(String message) { super(message); }
    public MilestoneAlreadyEmittedException(String message, Throwable cause) { super(message, cause); }
}
