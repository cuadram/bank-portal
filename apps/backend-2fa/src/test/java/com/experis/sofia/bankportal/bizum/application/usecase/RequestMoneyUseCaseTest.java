package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.application.dto.*;
import com.experis.sofia.bankportal.bizum.domain.exception.*;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** TC-F022-011..014 — RequestMoneyUseCase */
@ExtendWith(MockitoExtension.class)
class RequestMoneyUseCaseTest {
    @Mock BizumActivationRepositoryPort activationRepo;
    @Mock BizumRequestRepositoryPort requestRepo;
    @InjectMocks RequestMoneyUseCase useCase;

    private UUID userId;

    @BeforeEach void setUp() {
        userId = UUID.randomUUID();
        ReflectionTestUtils.setField(useCase, "ttlHours", 24);
        BizumActivation act = new BizumActivation();
        act.setStatus(BizumStatus.ACTIVE);
        when(activationRepo.findByUserId(userId)).thenReturn(Optional.of(act));
        when(requestRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test void TC011_solicitud_creada_PENDING() {
        var req = new RequestMoneyRequest("+34622222222", new BigDecimal("30.00"), "Split");
        var resp = useCase.execute(userId, req);
        assertEquals("PENDING", resp.status());
        assertNotNull(resp.requestId());
        assertTrue(resp.expiresAt().isAfter(Instant.now()));
    }

    @Test void TC012_TTL_24h_aplicado() {
        var req = new RequestMoneyRequest("+34622222222", new BigDecimal("30.00"), "Test");
        var resp = useCase.execute(userId, req);
        long seconds = resp.expiresAt().getEpochSecond() - Instant.now().getEpochSecond();
        assertTrue(seconds >= 86395 && seconds <= 86405, "TTL debe ser ~24h");
    }

    @Test void TC013_bizum_no_activo_excepcion() {
        when(activationRepo.findByUserId(userId)).thenReturn(Optional.empty());
        assertThrows(BizumNotActiveException.class,
            () -> useCase.execute(userId, new RequestMoneyRequest("+34622222222", new BigDecimal("30"), "X")));
    }

    @Test void TC014_importe_scaled_HALF_EVEN() {
        var req = new RequestMoneyRequest("+34622222222", new BigDecimal("30.555"), "Test");
        useCase.execute(userId, req);
        verify(requestRepo).save(argThat(r -> new BigDecimal("30.56").equals(r.getAmount())));
    }
}
