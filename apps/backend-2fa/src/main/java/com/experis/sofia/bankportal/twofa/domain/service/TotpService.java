package com.experis.sofia.bankportal.twofa.domain.service;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrDataFactory;
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
 * <p>FEAT-001 | US-006 | ADR-004</p>
 *
 * @since 1.0.0
 */
@Service
public class TotpService {

    private final SecretGenerator secretGenerator;
    private final CodeVerifier codeVerifier;
    private final QrDataFactory qrDataFactory;

    public TotpService(
            SecretGenerator secretGenerator,
            CodeVerifier codeVerifier,
            QrDataFactory qrDataFactory) {
        this.secretGenerator = secretGenerator;
        this.codeVerifier = codeVerifier;
        this.qrDataFactory = qrDataFactory;
    }

    /**
     * Genera un secreto TOTP Base32 de 160 bits (20 bytes).
     *
     * <p>El secreto se cifra con {@link CryptoService#encrypt(String)}
     * antes de persistirse en base de datos.</p>
     *
     * @return secreto TOTP en Base32, listo para cifrar y persistir
     */
    public String generateSecret() {
        return secretGenerator.generate();
    }

    /**
     * Genera un data URI PNG del código QR para enrolamiento en app TOTP.
     *
     * <p>El URI sigue el formato {@code otpauth://totp/<issuer>:<account>?secret=...}
     * compatible con Google Authenticator, Authy y Microsoft Authenticator.</p>
     *
     * @param secret  secreto TOTP Base32 (en texto plano, no cifrado)
     * @param account identificador del usuario (email o username)
     * @return data URI {@code data:image/png;base64,...} listo para renderizar en frontend
     * @throws QrGenerationException si la generación del QR falla
     */
    public String generateQrDataUri(String secret, String account) {
        try {
            QrData qrData = qrDataFactory.label(account).build(secret);
            QrGenerator generator = new ZxingPngQrGenerator();
            byte[] imageBytes = generator.generate(qrData);
            return Utils.getDataUriForImage(imageBytes, generator.getImageMimeType());
        } catch (Exception e) {
            throw new QrGenerationException("Error al generar QR para enrolamiento TOTP.", e);
        }
    }

    /**
     * Valida un código OTP de 6 dígitos contra el secreto TOTP del usuario.
     *
     * <p>La verificación incluye tolerancia ±1 ventana temporal (30s),
     * configurada en {@code TotpConfig#codeVerifier()}.</p>
     *
     * @param secret  secreto TOTP Base32 en texto plano (descifrado previo requerido)
     * @param otpCode código OTP de 6 dígitos ingresado por el usuario
     * @return {@code true} si el código es válido en la ventana actual o adyacente
     */
    public boolean validateCode(String secret, String otpCode) {
        return codeVerifier.isValidCode(secret, otpCode);
    }

    /**
     * Excepción producida cuando falla la generación del QR (error de librería).
     */
    public static class QrGenerationException extends RuntimeException {
        public QrGenerationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
