package com.experis.sofia.bankportal.bizum.infrastructure.persistence;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.*;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.*;

/** @Primary — activo en todos los entornos (LA-019-08: NUNCA @Profile("!production")) */
@Primary @Repository
public class JpaBizumAdapter implements BizumActivationRepositoryPort, BizumPaymentRepositoryPort, BizumRequestRepositoryPort {
    private final JpaBizumActivationRepository actRepo;
    private final JpaBizumPaymentRepository payRepo;
    private final JpaBizumRequestRepository reqRepo;

    public JpaBizumAdapter(JpaBizumActivationRepository a, JpaBizumPaymentRepository p, JpaBizumRequestRepository r) {
        this.actRepo = a; this.payRepo = p; this.reqRepo = r;
    }

    @Override public Optional<BizumActivation> findByUserId(UUID userId) {
        return actRepo.findByUserId(userId).map(this::toDomain);
    }
    @Override public Optional<BizumActivation> findByPhone(String phone) {
        return actRepo.findByPhone(phone).map(this::toDomain);
    }
    @Override public BizumActivation save(BizumActivation a) {
        return toDomain(actRepo.save(toEntity(a)));
    }
    @Override public BizumPayment save(BizumPayment p) {
        return toDomain(payRepo.save(toEntity(p)));
    }
    @Override public List<BizumPayment> findBySenderUserId(UUID userId, int page, int size) {
        return payRepo.findBySenderUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
            .stream().map(this::toDomain).toList();
    }
    @Override public BizumRequest save(BizumRequest r) {
        return toDomain(reqRepo.save(toEntity(r)));
    }
    @Override public Optional<BizumRequest> findById(UUID id) {
        return reqRepo.findById(id).map(this::toDomain);
    }
    @Override public List<BizumRequest> findByRequesterUserId(UUID userId, int page, int size) {
        return reqRepo.findByRequesterUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
            .stream().map(this::toDomain).toList();
    }
    @Override public void expireOldRequests() { reqRepo.expirePendingRequests(Instant.now()); }

    private BizumActivation toDomain(BizumActivationEntity e) {
        BizumActivation a = new BizumActivation();
        a.setId(e.getId()); a.setUserId(e.getUserId()); a.setAccountId(e.getAccountId());
        a.setPhone(e.getPhone()); a.setStatus(BizumStatus.valueOf(e.getStatus()));
        a.setGdprConsentAt(e.getGdprConsentAt()); a.setActivatedAt(e.getActivatedAt());
        return a;
    }
    private BizumActivationEntity toEntity(BizumActivation a) {
        BizumActivationEntity e = new BizumActivationEntity();
        e.setId(a.getId()); e.setUserId(a.getUserId()); e.setAccountId(a.getAccountId());
        e.setPhone(a.getPhone()); e.setStatus(a.getStatus().name());
        e.setGdprConsentAt(a.getGdprConsentAt()); e.setActivatedAt(a.getActivatedAt());
        return e;
    }
    private BizumPayment toDomain(BizumPaymentEntity e) {
        BizumPayment p = new BizumPayment();
        p.setId(e.getId()); p.setSenderUserId(e.getSenderUserId()); p.setRecipientPhone(e.getRecipientPhone());
        p.setAmount(e.getAmount()); p.setConcept(e.getConcept()); p.setStatus(BizumStatus.valueOf(e.getStatus()));
        p.setSepaRef(e.getSepaRef()); p.setCreatedAt(e.getCreatedAt()); p.setCompletedAt(e.getCompletedAt());
        return p;
    }
    private BizumPaymentEntity toEntity(BizumPayment p) {
        BizumPaymentEntity e = new BizumPaymentEntity();
        e.setId(p.getId()); e.setSenderUserId(p.getSenderUserId()); e.setRecipientPhone(p.getRecipientPhone());
        e.setAmount(p.getAmount()); e.setConcept(p.getConcept()); e.setStatus(p.getStatus().name());
        e.setSepaRef(p.getSepaRef()); e.setCreatedAt(p.getCreatedAt()); e.setCompletedAt(p.getCompletedAt());
        return e;
    }
    private BizumRequest toDomain(BizumRequestEntity e) {
        BizumRequest r = new BizumRequest();
        r.setId(e.getId()); r.setRequesterUserId(e.getRequesterUserId()); r.setRecipientPhone(e.getRecipientPhone());
        r.setAmount(e.getAmount()); r.setConcept(e.getConcept()); r.setStatus(BizumStatus.valueOf(e.getStatus()));
        r.setExpiresAt(e.getExpiresAt()); r.setCreatedAt(e.getCreatedAt()); r.setResolvedAt(e.getResolvedAt());
        r.setPaymentId(e.getPaymentId());
        return r;
    }
    private BizumRequestEntity toEntity(BizumRequest r) {
        BizumRequestEntity e = new BizumRequestEntity();
        e.setId(r.getId()); e.setRequesterUserId(r.getRequesterUserId()); e.setRecipientPhone(r.getRecipientPhone());
        e.setAmount(r.getAmount()); e.setConcept(r.getConcept()); e.setStatus(r.getStatus().name());
        e.setExpiresAt(r.getExpiresAt()); e.setCreatedAt(r.getCreatedAt()); e.setResolvedAt(r.getResolvedAt());
        e.setPaymentId(r.getPaymentId());
        return e;
    }
}
