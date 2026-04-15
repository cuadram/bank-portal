package com.experis.sofia.bankportal.bizum.domain.service;
import com.experis.sofia.bankportal.bizum.domain.exception.BizumLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

/** TC-F022-001..005 — BizumLimitService */
class BizumLimitServiceTest {
    private BizumLimitService service;

    @BeforeEach void setUp() {
        service = new BizumLimitService();
        ReflectionTestUtils.setField(service, "limitPerOperation", new BigDecimal("500"));
        ReflectionTestUtils.setField(service, "limitPerDay", new BigDecimal("2000"));
    }

    @Test void TC001_importe_igual_limite_op_OK() {
        assertDoesNotThrow(() -> service.checkPerOperation(new BigDecimal("500.00")));
    }
    @Test void TC002_importe_supera_limite_op_excepcion() {
        assertThrows(BizumLimitExceededException.class,
            () -> service.checkPerOperation(new BigDecimal("500.01")));
    }
    @Test void TC003_daily_disponible_OK() {
        assertDoesNotThrow(() -> service.checkDaily(new BigDecimal("1500"), new BigDecimal("500")));
    }
    @Test void TC004_daily_superado_excepcion() {
        assertThrows(BizumLimitExceededException.class,
            () -> service.checkDaily(new BigDecimal("1800"), new BigDecimal("300")));
    }
    @Test void TC005_importe_cero_OK() {
        assertDoesNotThrow(() -> service.checkPerOperation(BigDecimal.ZERO));
    }
}
