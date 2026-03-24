package com.experis.sofia.bankportal.kyc.application;

import java.util.UUID;

/**
 * Evento publicado tras subida de documento — dispara validación asíncrona.
 * ADR-024: desacoplamiento upload → validate via ApplicationEventPublisher.
 * FEAT-013 US-1303 · RV-022 fix.
 */
public record KycDocumentSubmittedEvent(Object source, UUID kycId, UUID userId) {}
