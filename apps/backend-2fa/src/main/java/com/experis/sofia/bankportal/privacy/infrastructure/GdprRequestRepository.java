package com.experis.sofia.bankportal.privacy.infrastructure;

import com.experis.sofia.bankportal.privacy.domain.GdprRequest;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA — solicitudes de derechos GDPR.
 * RN-F019-36: retención 6 años — nunca borrar registros.
 * RN-F019-37: append-only lógico — no DELETE físico.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Repository
public interface GdprRequestRepository extends JpaRepository<GdprRequest, UUID> {

    /** Solicitudes activas (PENDING / IN_PROGRESS) de un usuario. */
    List<GdprRequest> findByUserIdAndEstadoIn(UUID userId, List<GdprRequestStatus> estados);

    /** Export activo del usuario — RN-F019-19: solo uno simultáneo. */
    @Query("""
        SELECT r FROM GdprRequest r
        WHERE r.userId = :userId
          AND r.tipo   = :tipo
          AND r.estado IN ('PENDING','IN_PROGRESS')
        """)
    Optional<GdprRequest> findActiveByUserIdAndTipo(UUID userId, GdprRequestType tipo);

    /** Panel admin — búsqueda paginada con filtros opcionales (RF-019-07). */
    @Query("""
        SELECT r FROM GdprRequest r
        WHERE (:tipo   IS NULL OR r.tipo   = :tipo)
          AND (:estado IS NULL OR r.estado = :estado)
          AND (:desde  IS NULL OR r.createdAt >= :desde)
          AND (:hasta  IS NULL OR r.createdAt <= :hasta)
        ORDER BY r.createdAt DESC
        """)
    Page<GdprRequest> findByFilters(
            GdprRequestType tipo,
            GdprRequestStatus estado,
            LocalDateTime desde,
            LocalDateTime hasta,
            Pageable pageable);

    /**
     * Export más reciente del usuario (cualquier estado) — para cooldown de 24h.
     * RN-F019-12: no se permite nuevo export si ya hay uno en las últimas 24h.
     */
    @Query("""
        SELECT r FROM GdprRequest r
        WHERE r.userId = :userId
          AND r.tipo   = :tipo
          AND r.createdAt >= :since
        ORDER BY r.createdAt DESC
        """)
    List<GdprRequest> findRecentByUserIdAndTipo(UUID userId, GdprRequestType tipo, LocalDateTime since);

    /**
     * Export más reciente del usuario para mostrar estado (incluyendo COMPLETED).
     * RF-019-05: getExportStatus retorna el export más reciente del usuario.
     */
    @Query("""
        SELECT r FROM GdprRequest r
        WHERE r.userId = :userId
          AND r.tipo   = :tipo
        ORDER BY r.createdAt DESC
        LIMIT 1
        """)
    Optional<GdprRequest> findLatestByUserIdAndTipo(UUID userId, GdprRequestType tipo);

    /** SLA job — solicitudes próximas a vencer sin alerta enviada. */
    @Query("""
        SELECT r FROM GdprRequest r
        WHERE r.estado NOT IN ('COMPLETED','REJECTED')
          AND r.slaAlertSent = false
          AND r.slaDeadline <= :threshold
        """)
    List<GdprRequest> findExpiringSoon(LocalDateTime threshold);
}
