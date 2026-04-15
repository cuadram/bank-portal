package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.application.dto.BizumTransactionDTO;
import com.experis.sofia.bankportal.bizum.domain.repository.*;
import com.experis.sofia.bankportal.bizum.domain.service.PhoneValidationService;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** US-F022-05: Historial paginado — RN-F022-09 enmascaramiento */
@Service
public class ListTransactionsUseCase {
    private final BizumPaymentRepositoryPort paymentRepo;
    private final BizumRequestRepositoryPort requestRepo;

    public ListTransactionsUseCase(BizumPaymentRepositoryPort p, BizumRequestRepositoryPort r) {
        this.paymentRepo = p; this.requestRepo = r;
    }

    public List<BizumTransactionDTO> execute(UUID userId, int page, int size) {
        List<BizumTransactionDTO> result = new ArrayList<>();
        paymentRepo.findBySenderUserId(userId, page, size).forEach(p ->
            result.add(new BizumTransactionDTO(p.getId(), "SENT", p.getAmount(),
                PhoneValidationService.mask(p.getRecipientPhone()), // RN-F022-09
                p.getConcept(), p.getStatus().name(), p.getCreatedAt())));
        requestRepo.findByRequesterUserId(userId, page, size).forEach(r ->
            result.add(new BizumTransactionDTO(r.getId(), "REQUEST_SENT", r.getAmount(),
                PhoneValidationService.mask(r.getRecipientPhone()),
                r.getConcept(), r.getStatus().name(), r.getCreatedAt())));
        return result;
    }
}
