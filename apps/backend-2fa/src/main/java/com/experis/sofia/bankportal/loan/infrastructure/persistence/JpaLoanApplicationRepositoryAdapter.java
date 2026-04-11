package com.experis.sofia.bankportal.loan.infrastructure.persistence;

import com.experis.sofia.bankportal.loan.domain.model.LoanApplication;
import com.experis.sofia.bankportal.loan.domain.model.LoanPurpose;
import com.experis.sofia.bankportal.loan.domain.model.LoanStatus;
import com.experis.sofia.bankportal.loan.domain.repository.LoanApplicationRepositoryPort;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@Primary
public class JpaLoanApplicationRepositoryAdapter implements LoanApplicationRepositoryPort {

    private final LoanApplicationJpaRepository jpaRepository;

    public JpaLoanApplicationRepositoryAdapter(LoanApplicationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<LoanApplication> findByIdAndUserId(UUID id, UUID userId) {
        return jpaRepository.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public Optional<LoanApplication> findPendingByUserId(UUID userId) {
        return jpaRepository.findPendingByUserId(userId).map(this::toDomain);
    }

    @Override
    public LoanApplication save(LoanApplication app) {
        return toDomain(jpaRepository.save(toEntity(app)));
    }

    private LoanApplication toDomain(LoanApplicationEntity e) {
        return new LoanApplication(e.getId(), e.getUserId(), e.getImporte(), e.getPlazo(),
                LoanPurpose.valueOf(e.getFinalidad()), LoanStatus.valueOf(e.getEstado()),
                e.getScoringResult(), e.isOtpVerified(), e.getCreatedAt(), e.getUpdatedAt());
    }

    private LoanApplicationEntity toEntity(LoanApplication app) {
        LoanApplicationEntity e = new LoanApplicationEntity();
        e.setId(app.getId());
        e.setUserId(app.getUserId());
        e.setImporte(app.getImporte());
        e.setPlazo(app.getPlazo());
        e.setFinalidad(app.getFinalidad().name());
        e.setEstado(app.getEstado().name());
        e.setScoringResult(app.getScoringResult());
        e.setOtpVerified(app.isOtpVerified());
        return e;
    }
}
