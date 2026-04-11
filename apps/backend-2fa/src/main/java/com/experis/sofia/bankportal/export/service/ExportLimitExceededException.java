package com.experis.sofia.bankportal.export.service;

/** Excepción lanzada cuando la exportación supera los 500 registros (ADR-031). */
public class ExportLimitExceededException extends RuntimeException {
    public ExportLimitExceededException(String message) { super(message); }
}
