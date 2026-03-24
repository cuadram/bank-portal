package com.experis.sofia.bankportal.kyc.domain;

/**
 * Estados del proceso KYC — FEAT-013 US-1301.
 * Transiciones válidas documentadas en SRS-FEAT-013 RF-013-01.
 */
public enum KycStatus {
    NONE,       // usuario pre-existente sin KYC iniciado
    PENDING,    // proceso iniciado, documentos no enviados
    SUBMITTED,  // documentos enviados — pendiente revisión
    APPROVED,   // verificación exitosa — acceso financiero completo
    REJECTED,   // verificación fallida — puede reintentar
    EXPIRED     // documentos caducados — debe reenviar
}
