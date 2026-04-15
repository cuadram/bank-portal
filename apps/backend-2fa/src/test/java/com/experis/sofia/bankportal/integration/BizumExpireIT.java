package com.experis.sofia.bankportal.integration;

import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.infrastructure.persistence.JpaBizumAdapter;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TC-F022-024 — expireOldRequests() actualiza status PENDING→EXPIRED en BD real
 * Verifica RN-F022-07: solicitudes expiradas se marcan automáticamente.
 *
 * NOTA: expirePendingRequests() es un bulk JPQL UPDATE que bypassa el
 * Hibernate first-level cache. Tras invocarlo, se hace em.flush()+em.clear()
 * para que findById() vea el estado real de BD y no el snapshot cacheado.
 */
@Transactional
class BizumExpireIT extends BizumIntegrationTestBase {

    @Autowired
    JpaBizumAdapter adapter;

    @Autowired
    EntityManager em;

    @Test
    void expiresPendingRequestsPastDeadline() {
        BizumRequest req = new BizumRequest();
        req.setId(UUID.randomUUID());
        req.setRequesterUserId(TEST_USER_ID); // FK → users(id) del fixture
        req.setRecipientPhone("+34699000002");
        req.setAmount(new BigDecimal("10.00"));
        req.setConcept("Test expirado");
        req.setStatus(BizumStatus.PENDING);
        req.setCreatedAt(Instant.now().minusSeconds(90000));
        req.setExpiresAt(Instant.now().minusSeconds(3600)); // ya expirado

        adapter.save(req);

        // Flush para que el bulk UPDATE vea la fila recién insertada
        em.flush();

        adapter.expireOldRequests(); // bulk JPQL UPDATE — RN-F022-07

        // Clear para invalidar el first-level cache y forzar re-lectura de BD
        em.clear();

        var found = adapter.findById(req.getId());
        assertTrue(found.isPresent());
        assertEquals(BizumStatus.EXPIRED, found.get().getStatus(),
                "Solicitud expirada debe tener status EXPIRED (RN-F022-07)");
    }

    @Test
    void doesNotExpireActivePending() {
        BizumRequest req = new BizumRequest();
        req.setId(UUID.randomUUID());
        req.setRequesterUserId(TEST_USER_ID); // FK → users(id) del fixture
        req.setRecipientPhone("+34699000003");
        req.setAmount(new BigDecimal("20.00"));
        req.setStatus(BizumStatus.PENDING);
        req.setCreatedAt(Instant.now());
        req.setExpiresAt(Instant.now().plusSeconds(86400)); // aún vigente

        adapter.save(req);
        em.flush();

        adapter.expireOldRequests();
        em.clear();

        var found = adapter.findById(req.getId());
        assertTrue(found.isPresent());
        assertEquals(BizumStatus.PENDING, found.get().getStatus(),
                "Solicitud vigente NO debe ser expirada");
    }
}
