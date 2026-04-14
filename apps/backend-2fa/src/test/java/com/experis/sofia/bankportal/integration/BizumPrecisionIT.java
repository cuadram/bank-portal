package com.experis.sofia.bankportal.integration;

import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.infrastructure.persistence.JpaBizumAdapter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TC-F022-025 — NUMERIC(12,2) preserva escala en PostgreSQL real
 * Verifica ADR-034: BigDecimal HALF_EVEN persiste correctamente.
 * Usa TEST_USER_ID del fixture idempotente para satisfacer FK → users(id).
 */
@Transactional
class BizumPrecisionIT extends BizumIntegrationTestBase {

    @Autowired
    JpaBizumAdapter adapter;

    @Test
    void amountScalePreservedInDb() {
        BizumPayment p = new BizumPayment();
        p.setId(UUID.randomUUID());
        p.setSenderUserId(TEST_USER_ID);     // FK → users(id) del fixture
        p.setRecipientPhone("+34699000004");
        p.setAmount(new BigDecimal("45.56")); // resultado HALF_EVEN de 45.555
        p.setStatus(BizumStatus.COMPLETED);
        p.setCreatedAt(Instant.now());

        adapter.save(p);

        var found = adapter.findBySenderUserId(TEST_USER_ID, 0, 10);
        assertFalse(found.isEmpty());
        // NUMERIC(12,2) debe preservar exactamente 45.56 sin drift de coma flotante
        assertEquals(0, new BigDecimal("45.56").compareTo(found.get(0).getAmount()),
                "NUMERIC(12,2) debe preservar 45.56 exacto (ADR-034)");
    }

    @Test
    void amountScaleForRequests() {
        BizumRequest req = new BizumRequest();
        req.setId(UUID.randomUUID());
        req.setRequesterUserId(TEST_USER_ID); // FK → users(id) del fixture
        req.setRecipientPhone("+34699000005");
        req.setAmount(new BigDecimal("30.00"));
        req.setStatus(BizumStatus.PENDING);
        req.setCreatedAt(Instant.now());
        req.setExpiresAt(Instant.now().plusSeconds(86400));

        adapter.save(req);

        var found = adapter.findByRequesterUserId(TEST_USER_ID, 0, 10);
        assertFalse(found.isEmpty());
        assertEquals(0, new BigDecimal("30.00").compareTo(found.get(0).getAmount()));
    }
}
