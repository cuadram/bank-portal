package com.experis.sofia.bankportal.export.service;

/** Excepción lanzada cuando el rango de fechas es inválido o excede el límite PSD2 Art.47. */
public class ExportRangeException extends RuntimeException {
    public ExportRangeException(String message) { super(message); }
}
