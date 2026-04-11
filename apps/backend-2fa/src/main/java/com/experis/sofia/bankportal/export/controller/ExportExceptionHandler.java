package com.experis.sofia.bankportal.export.controller;

import com.experis.sofia.bankportal.export.service.ExportLimitExceededException;
import com.experis.sofia.bankportal.export.service.ExportRangeException;
import com.experis.sofia.bankportal.export.service.generator.ExportGenerationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.stream.Collectors;

/**
 * Manejador global de excepciones para el módulo de exportación.
 * FEAT-018 Sprint 20. BUG-FIX-003: mapeo correcto de excepciones de dominio a HTTP.
 *
 * ExportRangeException        → 400 Bad Request
 * ExportLimitExceededException → 422 Unprocessable Entity
 * ExportGenerationException   → 500 (con log — fallo técnico)
 * AccessDeniedException       → 403 Forbidden (DEBT-038)
 * MethodArgumentNotValidException → 400 (validación @Valid)
 */
@Slf4j
@RestControllerAdvice(assignableTypes = ExportController.class)
public class ExportExceptionHandler {

    @ExceptionHandler(ExportRangeException.class)
    public ProblemDetail handleRangeException(ExportRangeException ex) {
        log.debug("Export rango invalido: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Rango de fechas inválido");
        pd.setDetail(ex.getMessage());
        pd.setType(URI.create("urn:bankportal:export:invalid-range"));
        return pd;
    }

    @ExceptionHandler(ExportLimitExceededException.class)
    public ProblemDetail handleLimitException(ExportLimitExceededException ex) {
        log.debug("Export limite superado: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        pd.setTitle("Límite de exportación superado");
        pd.setDetail(ex.getMessage());
        pd.setType(URI.create("urn:bankportal:export:limit-exceeded"));
        return pd;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        log.warn("Export denegado: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        pd.setTitle("Acceso denegado");
        pd.setDetail("La cuenta indicada no pertenece al usuario autenticado");
        pd.setType(URI.create("urn:bankportal:export:access-denied"));
        return pd;
    }

    @ExceptionHandler(ExportGenerationException.class)
    public ProblemDetail handleGenerationException(ExportGenerationException ex) {
        log.error("Error generando documento export: {}", ex.getMessage(), ex);
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        pd.setTitle("Error generando documento");
        pd.setDetail("Error interno al generar el documento. Contacte con soporte.");
        pd.setType(URI.create("urn:bankportal:export:generation-error"));
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.debug("Export validacion fallida: {}", detail);
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Error de validación");
        pd.setDetail(detail);
        pd.setType(URI.create("urn:bankportal:export:validation-error"));
        return pd;
    }
}
