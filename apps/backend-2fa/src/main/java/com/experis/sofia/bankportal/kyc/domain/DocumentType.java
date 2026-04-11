package com.experis.sofia.bankportal.kyc.domain;

/** Tipos de documento aceptados — FEAT-013 US-1302 RF-013-02. */
public enum DocumentType {
    DNI,        // 2 caras (FRONT + BACK)
    NIE,        // 2 caras (FRONT + BACK)
    PASSPORT    // 1 cara  (FRONT)
}
