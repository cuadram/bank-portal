package com.experis.sofia.bankportal.kyc.infrastructure;

import com.experis.sofia.bankportal.kyc.domain.DocumentStoragePort;
import lombok.extern.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Almacenamiento seguro de documentos KYC.
 *
 * <p>ADR-023: ficheros cifrados AES-256-GCM en disco. El IV (12 bytes)
 * se prefixa al ciphertext en el fichero almacenado. La clave se carga
 * desde la variable de entorno {@code KYC_ENCRYPTION_KEY} (64 hex chars = 32 bytes).
 *
 * <p>FEAT-013 US-1302 — Sprint 15 — RGPD Art.9.
 *
 * @author SOFIA Developer Agent — Sprint 15
 */
@Slf4j
@Component
public class DocumentStorageService implements DocumentStoragePort {

    private static final String AES_ALGO     = "AES/GCM/NoPadding";
    private static final int    GCM_TAG_BITS = 128;
    private static final int    IV_LEN       = 12;

    private final Path       storagePath;
    private final SecretKey  encryptionKey;

    public DocumentStorageService(
            @Value("${kyc.storage.path:/tmp/kyc-docs}") String storagePath,
            @Value("${kyc.storage.encryption-key:}") String encKeyHex) {

        this.storagePath = Paths.get(storagePath);
        initStoragePath(this.storagePath);

        if (encKeyHex == null || encKeyHex.length() != 64) {
            log.warn("[ADR-023] KYC_ENCRYPTION_KEY no configurada — usando clave de desarrollo (NO usar en PROD)");
            encKeyHex = "0".repeat(64);
        }
        byte[] keyBytes = HexFormat.of().parseHex(encKeyHex);
        this.encryptionKey = new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Almacena el fichero cifrado AES-256-GCM y calcula su SHA-256.
     *
     * @param file  fichero recibido del cliente (multipart)
     * @return      ruta relativa del fichero + hash SHA-256 del contenido original
     */
    @Override
    public DocumentStoragePort.StorageResult store(MultipartFile file) {
        byte[] plainBytes;
        try (InputStream in = file.getInputStream()) {
            plainBytes = in.readAllBytes();
        } catch (IOException e) {
            throw new StorageException("No se puede leer el fichero: " + e.getMessage(), e);
        }

        String sha256 = sha256Hex(plainBytes);
        byte[] iv     = generateIv();
        byte[] cipher = encrypt(plainBytes, iv);

        // Fichero en disco = IV (12 bytes) + ciphertext
        byte[] stored = new byte[IV_LEN + cipher.length];
        System.arraycopy(iv, 0, stored, 0, IV_LEN);
        System.arraycopy(cipher, 0, stored, IV_LEN, cipher.length);

        String filename = UUID.randomUUID() + ".enc";
        Path   dest     = storagePath.resolve(filename);
        try {
            Files.write(dest, stored);
        } catch (IOException e) {
            throw new StorageException("No se puede escribir en " + dest, e);
        }

        log.debug("[ADR-023] Documento almacenado: {} (sha256={})", filename, sha256.substring(0, 8) + "…");
        return new DocumentStoragePort.StorageResult(filename, sha256);
    }

    /**
     * Verifica la integridad del fichero almacenado recalculando el SHA-256
     * del contenido descifrado y comparando con el hash persistido en BD.
     */
    @Override
    public boolean verifyIntegrity(String filePath, String expectedHash) {
        Path file = storagePath.resolve(filePath);
        if (!Files.exists(file)) {
            log.warn("[ADR-023] Fichero no encontrado: {}", filePath);
            return false;
        }
        try {
            byte[] stored = Files.readAllBytes(file);
            if (stored.length <= IV_LEN) return false;

            byte[] iv         = new byte[IV_LEN];
            byte[] cipherText = new byte[stored.length - IV_LEN];
            System.arraycopy(stored, 0, iv, 0, IV_LEN);
            System.arraycopy(stored, IV_LEN, cipherText, 0, cipherText.length);

            byte[] plain = decrypt(cipherText, iv);
            return expectedHash.equalsIgnoreCase(sha256Hex(plain));
        } catch (Exception e) {
            log.error("[ADR-023] Error verificando integridad {}: {}", filePath, e.getMessage());
            return false;
        }
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private byte[] encrypt(byte[] data, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance(AES_ALGO);
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return cipher.doFinal(data);
        } catch (Exception e) {
            throw new StorageException("Error cifrando documento", e);
        }
    }

    private byte[] decrypt(byte[] cipherText, byte[] iv) {
        try {
            Cipher cipher = Cipher.getInstance(AES_ALGO);
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return cipher.doFinal(cipherText);
        } catch (Exception e) {
            throw new StorageException("Error descifrando documento", e);
        }
    }

    private byte[] generateIv() {
        byte[] iv = new byte[IV_LEN];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    private static String sha256Hex(byte[] data) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(data));
        } catch (Exception e) {
            throw new StorageException("Error calculando SHA-256", e);
        }
    }

    private static void initStoragePath(Path path) {
        try {
            Files.createDirectories(path);
        } catch (IOException e) {
            throw new StorageException("No se puede crear directorio KYC: " + path, e);
        }
    }

    // ── public types ─────────────────────────────────────────────────────────

    /** Excepción de operaciones de almacenamiento. */
    public static class StorageException extends RuntimeException {
        public StorageException(String msg)            { super(msg); }
        public StorageException(String msg, Throwable t) { super(msg, t); }
    }
}
