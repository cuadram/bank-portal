package com.experis.sofia.bankportal.kyc.application;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Almacenamiento seguro de documentos KYC — cifrado AES-256 en reposo.
 * ADR-023: filesystem local cifrado — migración a S3 en Sprint 18+.
 * FEAT-013 US-1302.
 */
@Slf4j
@Service
public class DocumentStorageApplicationService {

    private static final String ALGORITHM = "AES";

    private final Path    storagePath;
    private final SecretKey secretKey;

    public DocumentStorageApplicationService(
            @Value("${kyc.storage-path:/data/kyc-documents}") String storagePath,
            @Value("${kyc.encryption-key:dGhpcnR5LXR3by1ieXRlLWtleS1mb3ItYWVzLTI1Ng==}") String keyBase64) {
        this.storagePath = Paths.get(storagePath);
        byte[] keyBytes = Base64.getDecoder().decode(keyBase64);
        this.secretKey  = new SecretKeySpec(keyBytes, 0, 32, ALGORITHM);
        try { Files.createDirectories(this.storagePath); }
        catch (IOException e) { log.warn("No se pudo crear directorio KYC: {}", e.getMessage()); }
    }

    /**
     * Almacena el fichero cifrado con AES-256 y devuelve path + hash SHA-256.
     * @param file fichero recibido del controller
     * @return {@link StorageResult} con filePath y sha256Hash del contenido original
     */
    public StorageResult store(MultipartFile file) {
        try {
            byte[] raw = file.getBytes();
            String hash = sha256Hex(raw);

            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(raw);

            String fileName = UUID.randomUUID() + ".enc";
            Path target = storagePath.resolve(fileName);
            Files.write(target, encrypted);

            log.debug("[DocumentStorage] Fichero almacenado: {}", fileName);
            return new StorageResult(target.toString(), hash);

        } catch (Exception e) {
            throw new StorageException("Error almacenando documento KYC: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica la integridad del fichero almacenado recalculando el hash SHA-256.
     * @param filePath ruta del fichero cifrado
     * @param expectedHash hash SHA-256 del contenido original (sin cifrar)
     * @return true si el hash coincide
     */
    public boolean verifyIntegrity(String filePath, String expectedHash) {
        try {
            byte[] encrypted = Files.readAllBytes(Paths.get(filePath));
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decrypted = cipher.doFinal(encrypted);
            return expectedHash.equals(sha256Hex(decrypted));
        } catch (Exception e) {
            log.error("[DocumentStorage] Error verificando integridad: {}", e.getMessage());
            return false;
        }
    }

    private String sha256Hex(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(data));
    }

    public record StorageResult(String filePath, String sha256Hash) {}

    public static class StorageException extends RuntimeException {
        public StorageException(String msg, Throwable cause) { super(msg, cause); }
    }
}
