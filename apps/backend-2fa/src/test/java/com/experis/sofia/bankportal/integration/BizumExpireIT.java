package com.experis.sofia.bankportal.integration;
import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.infrastructure.persistence.JpaBizumAdapter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.boot.test.context.SpringBootTest;
import com.experis.sofia.bankportal.twofa.BackendTwoFactorApplication;

/**
 * TC-F022-024 — expireOldRequests() actualiza status PENDING→EXPIRED en BD real
 * Verifica RN-F022-07: solicitudes expiradas se marcan automáticamente
 */
@Transactional
@SpringBootTest(classes = BackendTwoFactorApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BizumExpireIT extends IntegrationTestBase {
    @Autowired JpaBizumAdapter adapter;

    @Test
    void expiresPendingRequestsPastDeadline() {
        BizumRequest req = new BizumRequest();
        req.setId(UUID.randomUUID());
        req.setRequesterUserId(UUID.randomUUID());
        req.setRecipientPhone("+34699000002");
        req.setAmount(new BigDecimal("10.00"));
        req.setConcept("Test expirado");
        req.setStatus(BizumStatus.PENDING);
        req.setCreatedAt(Instant.now().minusSeconds(90000));
        req.setExpiresAt(Instant.now().minusSeconds(3600)); // ya expirado

        adapter.save(req);
        adapter.expireOldRequests(); // @Scheduled — RN-F022-07

        var found = adapter.findById(req.getId());
        assertTrue(found.isPresent());
        assertEquals(BizumStatus.EXPIRED, found.get().getStatus(),
            "Solicitud expirada debe tener status EXPIRED");
    }

    @Test
    void doesNotExpireActivePending() {
        BizumRequest req = new BizumRequest();
        req.setId(UUID.randomUUID());
        req.setRequesterUserId(UUID.randomUUID());
        req.setRecipientPhone("+34699000003");
        req.setAmount(new BigDecimal("20.00"));
        req.setStatus(BizumStatus.PENDING);
        req.setCreatedAt(Instant.now());
        req.setExpiresAt(Instant.now().plusSeconds(86400)); // aún vigente

        adapter.save(req);
        adapter.expireOldRequests();

        var found = adapter.findById(req.getId());
        assertTrue(found.isPresent());
        assertEquals(BizumStatus.PENDING, found.get().getStatus(),
            "Solicitud vigente NO debe ser expirada");
    }
}
