package com.experis.sofia.bankportal.loan.infrastructure.persistence;

import com.experis.sofia.bankportal.loan.domain.model.Loan;
import com.experis.sofia.bankportal.loan.domain.model.LoanStatus;
import com.experis.sofia.bankportal.loan.domain.repository.LoanRepositoryPort;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/** LA-019-08: @Primary sin profile annotations — activo siempre en dev, staging y production */
@Repository
@Primary
public class JpaLoanRepositoryAdapter implements LoanRepositoryPort {

    private final LoanJpaRepository jpaRepository;

    public JpaLoanRepositoryAdapter(LoanJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Page<Loan> findByUserId(UUID userId, Pageable pageable) {
        return jpaRepository.findByUserId(userId, pageable).map(this::toDomain);
    }

    @Override
    public Optional<Loan> findByIdAndUserId(UUID id, UUID userId) {
        return jpaRepository.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public Loan save(Loan loan) {
        LoanEntity entity = toEntity(loan);
        return toDomain(jpaRepository.save(entity));
    }

    private Loan toDomain(LoanEntity e) {
        return new Loan(e.getId(), e.getUserId(), e.getTipo(),
                e.getImporteOriginal(), e.getImportePendiente(), e.getPlazo(),
                e.getTae(), e.getCuotaMensual(),
                LoanStatus.valueOf(e.getEstado()),
                e.getFechaInicio(), e.getFechaFin(), e.getCreatedAt(), e.getUpdatedAt());
    }

    private LoanEntity toEntity(Loan l) {
        LoanEntity e = new LoanEntity();
        e.setId(l.getId());
        e.setUserId(l.getUserId());
        e.setTipo(l.getTipo());
        e.setImporteOriginal(l.getImporteOriginal());
        e.setImportePendiente(l.getImportePendiente());
        e.setPlazo(l.getPlazo());
        e.setTae(l.getTae());
        e.setCuotaMensual(l.getCuotaMensual());
        e.setEstado(l.getEstado().name());
        e.setFechaInicio(l.getFechaInicio());
        e.setFechaFin(l.getFechaFin());
        return e;
    }
}
