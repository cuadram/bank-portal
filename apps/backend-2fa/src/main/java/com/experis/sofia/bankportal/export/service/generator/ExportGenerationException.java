package com.experis.sofia.bankportal.export.service.generator;

/** Excepción lanzada cuando falla la generación del documento (PDF o CSV). */
public class ExportGenerationException extends RuntimeException {
    public ExportGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
