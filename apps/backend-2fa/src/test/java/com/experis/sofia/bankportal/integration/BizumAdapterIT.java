package com.experis.sofia.bankportal.integration;

import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.infrastructure.persistence.JpaBizumAdapter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TC-F022-023 — JpaBizumAdapter save + findByUserId (schema real PostgreSQL)
 * Verifica que el mapping JPA funciona contra la BD real del Docker Compose.
 * Usa TEST_USER_ID / TEST_ACCOUNT_ID del fixture idempotente cargado en setUp.
 */
@Transactional
class BizumAdapterIT extends BizumIntegrationTestBase {

    @Autowired
    JpaBizumAdapter adapter;

    @Test
    void saveAndFindActivationByUserId() {
        BizumActivation a = new BizumActivation();
        a.setId(UUID.randomUUID());
        a.setUserId(TEST_USER_ID);          // FK → users(id) del fixture
        a.setAccountId(TEST_ACCOUNT_ID);    // FK → accounts(id) del fixture
        a.setPhone("+34699" + (int) (Math.random() * 900000 + 100000));
        a.setStatus(BizumStatus.ACTIVE);
        a.setGdprConsentAt(Instant.now());  // RN-F022-02
        a.setActivatedAt(Instant.now());

        adapter.save(a);

        var found = adapter.findByUserId(TEST_USER_ID);
        assertTrue(found.isPresent(), "Debe encontrar la activacion por userId");
        assertEquals(BizumStatus.ACTIVE, found.get().getStatus());
        assertNotNull(found.get().getGdprConsentAt(),
                "gdprConsentAt NO debe ser null (RN-F022-02)");
    }

    @Test
    void savePaymentAndRetrieve() {
        BizumPayment p = new BizumPayment();
        p.setId(UUID.randomUUID());
        p.setSenderUserId(TEST_USER_ID);    // FK → users(id) del fixture
        p.setRecipientPhone("+34699000001");
        p.setAmount(new java.math.BigDecimal("45.56"));
        p.setConcept("Test pago");
        p.setStatus(BizumStatus.COMPLETED);
        p.setSepaRef("BIZUM-" + UUID.randomUUID());
        p.setCreatedAt(Instant.now());
        p.setCompletedAt(Instant.now());

        adapter.save(p);

        var list = adapter.findBySenderUserId(TEST_USER_ID, 0, 10);
        assertFalse(list.isEmpty(), "Debe haber al menos 1 pago para el userId");
        assertEquals(new java.math.BigDecimal("45.56"), list.get(0).getAmount());
    }
}
