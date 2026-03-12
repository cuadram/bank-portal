package com.experis.sofia.bankportal.twofa.domain.service;

import com.experis.sofia.bankportal.twofa.infrastructure.config.TotpProperties;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Servicio de cifrado AES-256-CBC para secretos TOTP en reposo (ADR-004).
 *
 * <p>Cada llamada a {@link #encrypt(String)} genera un IV aleatorio de 16 bytes,
 * garantizando que el mismo texto plano produzca ciphertexts distintos.
 * El formato persitido es {@code Base64(IV):Base64(ciphertext)}.</p>
 *
 * <p>FEAT-001 | US-006 | OWASP A02 (Cryptographic Failures)</p>
 *
 * @since 1.0.0
 */
@Service
public class CryptoService {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_BYTES = 16;
    private static final int KEY_BYTES = 32;   // AES-256 = 32 bytes

    private final SecretKeySpec keySpec;
    private final SecureRandom secureRandom;

    /**
     * Construye el servicio validando que la clave tenga exactamente 32 bytes (AES-256).
     *
     * @param totpProperties propiedades TOTP — {@code totp.aes-key} en Base64
     * @throws IllegalStateException si la clave decodificada no tiene 32 bytes
     */
    public CryptoService(TotpProperties totpProperties) {
        byte[] keyBytes = Base64.getDecoder().decode(totpProperties.aesKey());
        if (keyBytes.length != KEY_BYTES) {
            throw new IllegalStateException(
                "TOTP_AES_KEY debe ser exactamente 32 bytes en Base64 (AES-256). " +
                "Longitud actual: " + keyBytes.length + " bytes."
            );
        }
        this.keySpec = new SecretKeySpec(keyBytes, "AES");
        this.secureRandom = new SecureRandom();
    }

    /**
     * Cifra el texto plano con AES-256-CBC y un IV aleatorio.
     *
     * @param plainText texto a cifrar (secreto TOTP Base32)
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
            byte[] cipherBytes = cipher.doFinal(plainText.getBytes());

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
     * @return texto plano original
     * @throws CryptoException si el formato es inválido o el descifrado falla
     */
    public String decrypt(String encryptedText) {
        String[] parts = encryptedText.split(":", 2);
        if (parts.length != 2) {
            throw new CryptoException("Formato de texto cifrado inválido. Esperado: iv:ciphertext");
        }
        try {
            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] cipherBytes = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new IvParameterSpec(iv));
            return new String(cipher.doFinal(cipherBytes));
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
