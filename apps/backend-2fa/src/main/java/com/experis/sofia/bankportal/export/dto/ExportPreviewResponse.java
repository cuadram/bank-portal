package com.experis.sofia.bankportal.export.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Respuesta del endpoint GET /preview — indica cuántos registros exportaría la consulta.
 * RN-F018-11: si count > 500 el cliente debe acotar el rango.
 * HOTFIX-S20: paquete corregido.
 */
@Data
@AllArgsConstructor
public class ExportPreviewResponse {
    private long count;
    private boolean exceedsLimit;
    private int limitMaxRecords;

    public ExportPreviewResponse(long count, boolean exceedsLimit) {
        this(count, exceedsLimit, 500);
    }
}
