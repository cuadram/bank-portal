package com.experis.sofia.bankportal.twofa.domain.service;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.util.Utils;
import org.springframework.stereotype.Service;

/**
 * Servicio de dominio para operaciones TOTP (RFC 6238).
 *
 * <p>Genera secretos, produce data URIs de QR para enrolamiento,
 * y valida códigos OTP delegando en la librería {@code dev.samstevens.totp}.</p>
 *
 * <p>Usa {@link QrData.Builder} directamente (API v1.7.1) en lugar de
 * {@code QrDataFactory.label()} — método inexistente en esta versión.</p>
 *
 * <p>FEAT-001 | US-006 | ADR-004</p>
 *
 * @since 1.0.0
 */
@Service
public class TotpService {

    private final SecretGenerator secretGenerator;
    private final CodeVerifier codeVerifier;
    private final ZxingPngQrGenerator qrGenerator;
    private final String issuer;
    private final int codeDigits;
    private final int period;

    public TotpService(
            SecretGenerator secretGenerator,
            CodeVerifier codeVerifier,
            ZxingPngQrGenerator qrGenerator,
            String issuer,
            int codeDigits,
            int period) {
        this.secretGenerator = secretGenerator;
        this.codeVerifier    = codeVerifier;
        this.qrGenerator     = qrGenerator;
        this.issuer          = issuer;
        this.codeDigits      = codeDigits;
        this.period          = period;
    }

    /**
     * Genera un secreto TOTP Base32 de 160 bits (20 bytes).
     *
     * @return secreto TOTP en Base32, listo para cifrar y persistir
     */
    public String generateSecret() {
        return secretGenerator.generate();
    }

    /**
     * Genera un data URI PNG del código QR para enrolamiento en app TOTP.
     *
     * <p>Usa {@link QrData.Builder} (API dev.samstevens.totp v1.7.1).
     * El URI sigue el formato {@code otpauth://totp/<issuer>:<account>?secret=...}.</p>
     *
     * @param secret  secreto TOTP Base32 en texto plano (no cifrado)
     * @param account identificador del usuario (email)
     * @return data URI {@code data:image/png;base64,...}
     * @throws QrGenerationException si la generación del QR falla
     */
    public String generateQrDataUri(String secret, String account) {
        try {
            QrData qrData = new QrData.Builder()
                    .label(account)
                    .secret(secret)
                    .issuer(issuer)
                    .algorithm(HashingAlgorithm.SHA1)
                    .digits(codeDigits)
                    .period(period)
                    .build();

            byte[] imageBytes = qrGenerator.generate(qrData);
            return Utils.getDataUriForImage(imageBytes, qrGenerator.getImageMimeType());
        } catch (Exception e) {
            throw new QrGenerationException("Error al generar QR para enrolamiento TOTP.", e);
        }
    }

    /**
     * Valida un código OTP de 6 dígitos contra el secreto TOTP del usuario.
     *
     * @param secret  secreto TOTP Base32 en texto plano (descifrado previo requerido)
     * @param otpCode código OTP de 6 dígitos ingresado por el usuario
     * @return {@code true} si el código es válido en la ventana actual o adyacente
     */
    public boolean validateCode(String secret, String otpCode) {
        return codeVerifier.isValidCode(secret, otpCode);
    }

    /**
     * Excepción producida cuando falla la generación del QR.
     */
    public static class QrGenerationException extends RuntimeException {
        public QrGenerationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
