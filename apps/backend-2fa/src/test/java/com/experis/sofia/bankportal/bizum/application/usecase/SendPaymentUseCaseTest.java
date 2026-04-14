package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.application.dto.*;
import com.experis.sofia.bankportal.bizum.domain.exception.*;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.*;
import com.experis.sofia.bankportal.bizum.domain.service.*;
import com.experis.sofia.bankportal.bizum.infrastructure.corebanking.*;
import com.experis.sofia.bankportal.bizum.infrastructure.redis.BizumRateLimitAdapter;
import com.experis.sofia.bankportal.twofa.application.service.OtpValidationUseCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** TC-F022-006..010 — SendPaymentUseCase */
@ExtendWith(MockitoExtension.class)
class SendPaymentUseCaseTest {
    @Mock BizumActivationRepositoryPort activationRepo;
    @Mock BizumPaymentRepositoryPort paymentRepo;
    @Mock BizumLimitService limitService;
    @Mock BizumRateLimitAdapter rateLimitAdapter;
    @Mock SepaInstantPort sepaInstant;
    @Mock OtpValidationUseCase otpValidation;
    @InjectMocks SendPaymentUseCase useCase;

    private UUID userId;
    private BizumActivation activeActivation;

    @BeforeEach void setUp() {
        userId = UUID.randomUUID();
        activeActivation = new BizumActivation();
        activeActivation.setId(UUID.randomUUID());
        activeActivation.setUserId(userId);
        activeActivation.setStatus(BizumStatus.ACTIVE);
    }

    @Test void TC006_happy_path_pago_completado() {
        when(activationRepo.findByUserId(userId)).thenReturn(Optional.of(activeActivation));
        when(rateLimitAdapter.getDailyUsed(userId)).thenReturn(BigDecimal.ZERO);
        when(sepaInstant.executeTransfer(any(), any(), any(), any()))
            .thenReturn(new SepaInstantResult("BIZUM-test-ref", "COMPLETED", Instant.now()));
        when(paymentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new SendPaymentRequest("+34611111111", new BigDecimal("45.00"), "Cena", "123456");
        var resp = useCase.execute(userId, req);

        assertEquals("COMPLETED", resp.status());
        assertTrue(resp.ref().startsWith("BIZUM-"));
        verify(rateLimitAdapter).increment(userId, new BigDecimal("45.00"));
    }

    @Test void TC007_bizum_no_activo_excepcion() {
        when(activationRepo.findByUserId(userId)).thenReturn(Optional.empty());
        var req = new SendPaymentRequest("+34611111111", new BigDecimal("45.00"), "Test", "123456");
        assertThrows(BizumNotActiveException.class, () -> useCase.execute(userId, req));
        verify(sepaInstant, never()).executeTransfer(any(), any(), any(), any());
    }

    @Test void TC008_limite_diario_superado_excepcion() {
        when(activationRepo.findByUserId(userId)).thenReturn(Optional.of(activeActivation));
        when(rateLimitAdapter.getDailyUsed(userId)).thenReturn(new BigDecimal("1800"));
        doThrow(new BizumLimitExceededException()).when(limitService).checkDaily(any(), any());

        var req = new SendPaymentRequest("+34611111111", new BigDecimal("300.00"), "Test", "123456");
        assertThrows(BizumLimitExceededException.class, () -> useCase.execute(userId, req));
    }

    @Test void TC009_monto_bigdecimal_half_even() {
        when(activationRepo.findByUserId(userId)).thenReturn(Optional.of(activeActivation));
        when(rateLimitAdapter.getDailyUsed(userId)).thenReturn(BigDecimal.ZERO);
        when(sepaInstant.executeTransfer(any(), any(), any(), any()))
            .thenReturn(new SepaInstantResult("BIZUM-ref", "COMPLETED", Instant.now()));
        when(paymentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new SendPaymentRequest("+34611111111", new BigDecimal("45.555"), "Test", "123456");
        var resp = useCase.execute(userId, req);
        // HALF_EVEN: 45.555 -> 45.56
        assertEquals(new BigDecimal("45.56"), resp.amountSent());
    }

    @Test void TC010_pago_guardado_en_repo() {
        when(activationRepo.findByUserId(userId)).thenReturn(Optional.of(activeActivation));
        when(rateLimitAdapter.getDailyUsed(userId)).thenReturn(BigDecimal.ZERO);
        when(sepaInstant.executeTransfer(any(), any(), any(), any()))
            .thenReturn(new SepaInstantResult("BIZUM-ref", "COMPLETED", Instant.now()));
        when(paymentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute(userId, new SendPaymentRequest("+34611111111", new BigDecimal("50.00"), "OK", "123456"));
        verify(paymentRepo, times(1)).save(any());
    }
}
