package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.application.dto.ApplyLoanRequest;
import com.experis.sofia.bankportal.loan.application.dto.LoanApplicationResponse;
import com.experis.sofia.bankportal.loan.domain.exception.DuplicateLoanApplicationException;
import com.experis.sofia.bankportal.loan.domain.model.LoanApplication;
import com.experis.sofia.bankportal.loan.domain.model.LoanPurpose;
import com.experis.sofia.bankportal.loan.domain.model.LoanStatus;
import com.experis.sofia.bankportal.loan.domain.repository.LoanApplicationRepositoryPort;
import com.experis.sofia.bankportal.loan.infrastructure.scoring.CoreBankingMockScoringClient;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ApplyLoanUseCase {

    private static final int SCORE_THRESHOLD = 600;

    private final LoanApplicationRepositoryPort applicationRepository;
    private final CoreBankingMockScoringClient scoringClient;

    public ApplyLoanUseCase(LoanApplicationRepositoryPort applicationRepository,
                            CoreBankingMockScoringClient scoringClient) {
        this.applicationRepository = applicationRepository;
        this.scoringClient = scoringClient;
    }

    /**
     * Crea una solicitud de préstamo con OTP ya validado en el Controller.
     * RN-F020-11: 409 si ya existe PENDING para el usuario.
     * RN-F020-08: scoring mock determinista.
     */
    public LoanApplicationResponse execute(UUID userId, ApplyLoanRequest req) {
        // RN-F020-11 — duplicado PENDING
        applicationRepository.findPendingByUserId(userId).ifPresent(existing -> {
            throw new DuplicateLoanApplicationException(userId.toString());
        });

        int score = scoringClient.score(userId);
        LoanStatus estado = score > SCORE_THRESHOLD ? LoanStatus.PENDING : LoanStatus.REJECTED;

        Instant now = Instant.now();
        LoanApplication app = new LoanApplication(
                UUID.randomUUID(), userId, req.importe(), req.plazo(),
                LoanPurpose.valueOf(req.finalidad()), estado,
                score, true, now, now
        );
        LoanApplication saved = applicationRepository.save(app);

        String mensaje = estado == LoanStatus.PENDING
                ? "Solicitud en revisión. Le notificaremos el resultado."
                : "Solicitud rechazada por scoring crediticio.";

        return new LoanApplicationResponse(saved.getId(), saved.getEstado().name(), mensaje);
    }
}
