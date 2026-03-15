package com.experis.sofia.bankportal.twofa.domain.service;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Servicio de cifrado AES-256-CBC para secretos TOTP en reposo (ADR-003).
 *
 * <p>Cada llamada a {@link #encrypt(String)} genera un IV aleatorio de 16 bytes,
 * garantizando que el mismo texto plano produzca ciphertexts distintos.
 * El formato persistido es {@code Base64(IV):Base64(ciphertext)}.</p>
 *
 * <p><strong>NC-BANKPORTAL-003 fix (RV-003):</strong> Esta clase ya no importa
 * {@code TotpProperties} de la capa infrastructure. Recibe la clave AES
 * como {@code String} Base64 inyectada por {@code TotpConfig#cryptoService()}.
 * Esto respeta el flujo de dependencias hexagonal: Domain ← Infrastructure.</p>
 *
 * <p><strong>RV-006 fix:</strong> Se usa {@code StandardCharsets.UTF_8} en todas
 * las conversiones String↔bytes para garantizar consistencia entre plataformas.</p>
 *
 * <p>FEAT-001 | US-006 | OWASP A02 (Cryptographic Failures)</p>
 *
 * @since 1.0.0
 */
@Service
public class CryptoService {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_BYTES  = 16;
    private static final int KEY_BYTES = 32;   // AES-256 = 32 bytes

    private final SecretKeySpec keySpec;
    private final SecureRandom secureRandom;

    /**
     * Construye el servicio validando que la clave tenga exactamente 32 bytes (AES-256).
     *
     * <p>La clave se recibe como String Base64 — inyectada desde {@code TotpConfig}.</p>
     *
     * @param aesKeyBase64 clave AES-256 en Base64 (44 caracteres = 32 bytes decodificados)
     * @throws IllegalStateException si la clave decodificada no tiene exactamente 32 bytes
     */
    public CryptoService(String aesKeyBase64) {
        byte[] keyBytes = Base64.getDecoder().decode(aesKeyBase64);
        if (keyBytes.length != KEY_BYTES) {
            throw new IllegalStateException(
                "TOTP_AES_KEY debe ser exactamente 32 bytes en Base64 (AES-256). " +
                "Longitud actual: " + keyBytes.length + " bytes."
            );
        }
        this.keySpec      = new SecretKeySpec(keyBytes, "AES");
        this.secureRandom = new SecureRandom();
    }

    /**
     * Cifra el texto plano con AES-256-CBC y un IV aleatorio.
     *
     * @param plainText texto a cifrar (secreto TOTP Base32 en UTF-8)
     * @return {@code Base64(IV):Base64(ciphertext)}
     * @throws CryptoException si el cifrado falla (JCA error inesperado)
     */
    public String encrypt(String plainText) {
        try {
            byte[] iv = new byte[IV_BYTES];
            secureRandom.nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
            // RV-006 fix: charset explícito UTF-8 para consistencia entre plataformas
            byte[] cipherBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(iv)
                + ":"
                + Base64.getEncoder().encodeToString(cipherBytes);
        } catch (Exception e) {
            throw new CryptoException("Error al cifrar secreto TOTP.", e);
        }
    }

    /**
     * Descifra un texto cifrado con AES-256-CBC.
     *
     * @param encryptedText formato {@code Base64(IV):Base64(ciphertext)}
     * @return texto plano original (UTF-8)
     * @throws CryptoException si el formato es inválido o el descifrado falla
     */
    public String decrypt(String encryptedText) {
        String[] parts = encryptedText.split(":", 2);
        if (parts.length != 2) {
            throw new CryptoException("Formato de texto cifrado inválido. Esperado: iv:ciphertext");
        }
        try {
            byte[] iv          = Base64.getDecoder().decode(parts[0]);
            byte[] cipherBytes = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new IvParameterSpec(iv));
            // RV-006 fix: charset explícito UTF-8
            return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Error al descifrar secreto TOTP.", e);
        }
    }

    /**
     * Excepción de cifrado — wrappea errores JCA sin exponer detalles internos.
     */
    public static class CryptoException extends RuntimeException {
        public CryptoException(String message) {
            super(message);
        }
        public CryptoException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
