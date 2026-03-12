package com.experis.sofia.bankportal.twofa.unit.domain.service;

import com.experis.sofia.bankportal.twofa.domain.service.CryptoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.*;

@DisplayName("CryptoService — AES-256-CBC")
class CryptoServiceTest {

    // 32 bytes en Base64 (AES-256)
    private static final String VALID_KEY =
        Base64.getEncoder().encodeToString(new byte[32]);

    private CryptoService cryptoService;

    @BeforeEach
    void setUp() {
        cryptoService = new CryptoService(VALID_KEY);
    }

    @Test
    @DisplayName("encrypt luego decrypt devuelve el texto original")
    void encryptDecrypt_roundTrip() {
        // Arrange
        String plainText = "JBSWY3DPEHPK3PXP";

        // Act
        String encrypted = cryptoService.encrypt(plainText);
        String decrypted = cryptoService.decrypt(encrypted);

        // Assert
        assertThat(decrypted).isEqualTo(plainText);
    }

    @Test
    @DisplayName("encrypt produce formato iv:ciphertext en Base64")
    void encrypt_producesCorrectFormat() {
        // Act
        String encrypted = cryptoService.encrypt("secreto");

        // Assert
        assertThat(encrypted).contains(":");
        String[] parts = encrypted.split(":", 2);
        assertThat(parts).hasSize(2);
        // Ambas partes deben ser Base64 válido
        assertThatCode(() -> Base64.getDecoder().decode(parts[0])).doesNotThrowAnyException();
        assertThatCode(() -> Base64.getDecoder().decode(parts[1])).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("encrypt genera IV distinto en cada llamada (ciphertexts distintos)")
    void encrypt_generatesDifferentCiphertextEachTime() {
        // Act
        String enc1 = cryptoService.encrypt("mismoTexto");
        String enc2 = cryptoService.encrypt("mismoTexto");

        // Assert — IVs distintos → ciphertexts distintos
        assertThat(enc1).isNotEqualTo(enc2);
    }

    @Test
    @DisplayName("decrypt con formato inválido lanza CryptoException")
    void decrypt_invalidFormat_throwsCryptoException() {
        assertThatThrownBy(() -> cryptoService.decrypt("sinDosPuntos"))
            .isInstanceOf(CryptoService.CryptoException.class)
            .hasMessageContaining("inválido");
    }

    @Test
    @DisplayName("constructor con clave de longitud incorrecta lanza IllegalStateException")
    void constructor_invalidKeyLength_throwsIllegalStateException() {
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]); // AES-128, no AES-256
        assertThatThrownBy(() -> new CryptoService(shortKey))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("32 bytes");
    }
}
