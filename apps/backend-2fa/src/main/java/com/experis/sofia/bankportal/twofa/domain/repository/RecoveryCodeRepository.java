package com.experis.sofia.bankportal.twofa.domain.repository;

import java.util.List;
import java.util.UUID;

/**
 * Puerto de salida — repositorio de códigos de recuperación.
 *
 * <p>Los recovery codes se almacenan como hashes BCrypt (cost=10).
 * Nunca se guarda el código en texto plano — solo su hash.</p>
 *
 * <p>FEAT-001 | US-003</p>
 *
 * @since 1.0.0
 */
public interface RecoveryCodeRepository {

    /**
     * Guarda los hashes BCrypt de los recovery codes generados.
     *
     * <p>Borra los códigos previos del usuario antes de insertar los nuevos
     * (regeneración completa, no acumulación).</p>
     *
     * @param userId    UUID del usuario
     * @param codeHashes lista de 10 hashes BCrypt
     */
    void saveAll(UUID userId, List<String> codeHashes);

    /**
     * Retorna el número de recovery codes disponibles (no usados) del usuario.
     *
     * @param userId UUID del usuario
     * @return cantidad de códigos disponibles (0-10)
     */
    int countAvailable(UUID userId);

    /**
     * Busca y consume un recovery code si coincide con alguno disponible.
     *
     * <p>Itera sobre los hashes BCrypt del usuario y verifica el código
     * en texto plano. Si hay coincidencia, marca {@code used = true} y
     * registra {@code used_at = NOW()}.</p>
     *
     * @param userId   UUID del usuario
     * @param rawCode  código de recuperación en texto plano (formato XXXX-XXXX)
     * @return true si el código era válido y fue consumido exitosamente
     */
    boolean findAndConsume(UUID userId, String rawCode);

    /**
     * Elimina todos los recovery codes del usuario.
     *
     * @param userId UUID del usuario
     */
    void deleteAll(UUID userId);
}
