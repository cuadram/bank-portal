package com.experis.sofia.bankportal.twofa.domain.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Generador de códigos de recuperación de un solo uso (RFC: Backup Codes).
 *
 * <p>Genera 10 códigos únicos con formato {@code XXXX-XXXX} usando un alfabeto
 * Base32 sin caracteres ambiguos (se excluyen 0, 1, O, I, L para evitar confusión
 * visual). Cada código tiene ~40 bits de entropía.</p>
 *
 * <p>FEAT-001 | US-003</p>
 *
 * @since 1.0.0
 */
@Service
public class RecoveryCodeGeneratorService {

    /** Alfabeto Base32 sin caracteres ambiguos: excluye 0, 1, I, L, O. */
    private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int SEGMENT_LEN  = 4;
    private static final int NUM_SEGMENTS = 2;
    private static final int NUM_CODES    = 10;

    private final SecureRandom secureRandom;

    /**
     * Construye el generador con un {@link SecureRandom} criptográficamente seguro.
     */
    public RecoveryCodeGeneratorService() {
        this.secureRandom = new SecureRandom();
    }

    /**
     * Genera una lista inmutable de 10 códigos de recuperación únicos.
     *
     * <p>Cada código sigue el formato {@code XXXX-XXXX} donde X es un carácter
     * del alfabeto Base32 sin ambiguos.</p>
     *
     * @return lista inmutable de 10 códigos en texto plano (para mostrar al usuario una vez)
     */
    public List<String> generate() {
        List<String> codes = new ArrayList<>(NUM_CODES);
        while (codes.size() < NUM_CODES) {
            String code = generateCode();
            if (!codes.contains(code)) {
                codes.add(code);
            }
        }
        return Collections.unmodifiableList(codes);
    }

    /**
     * Genera un único código en formato {@code XXXX-XXXX}.
     *
     * @return código de recuperación en texto plano
     */
    private String generateCode() {
        StringBuilder sb = new StringBuilder();
        for (int seg = 0; seg < NUM_SEGMENTS; seg++) {
            if (seg > 0) sb.append('-');
            for (int i = 0; i < SEGMENT_LEN; i++) {
                sb.append(ALPHABET.charAt(secureRandom.nextInt(ALPHABET.length())));
            }
        }
        return sb.toString();
    }
}
