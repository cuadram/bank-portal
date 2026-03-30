package com.experis.sofia.bankportal.export.service.generator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * Value object con metadatos del extracto para los generadores.
 * HOTFIX-S20: paquete corregido.
 */
@Data
@Builder
@AllArgsConstructor
public class ExportMetadata {
    private String    holderName;
    private String    iban;
    private LocalDate fechaDesde;
    private LocalDate fechaHasta;
    private String    tipoMovimiento;
}
