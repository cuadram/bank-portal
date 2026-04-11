package com.experis.sofia.bankportal.export.dto;

import com.experis.sofia.bankportal.export.domain.ExportFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request body para solicitud de exportación de movimientos.
 * FEAT-018 Sprint 20. HOTFIX-S20: paquete corregido.
 */
@Data
public class ExportRequest {

    @NotNull
    @PastOrPresent
    private LocalDate fechaDesde;

    @NotNull
    @PastOrPresent
    private LocalDate fechaHasta;

    @Pattern(regexp = "TODOS|TRANSFERENCIA_EMITIDA|TRANSFERENCIA_RECIBIDA|DOMICILIACION|PAGO_TARJETA|INGRESO|COMISION")
    private String tipoMovimiento = "TODOS";

    /** Establecido por el controlador — no forma parte del body de la request. */
    private ExportFormat formato;
}
