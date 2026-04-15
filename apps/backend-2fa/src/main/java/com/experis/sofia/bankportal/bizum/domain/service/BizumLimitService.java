package com.experis.sofia.bankportal.bizum.domain.service;
import com.experis.sofia.bankportal.bizum.domain.exception.BizumLimitExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

/** RN-F022-04/05: limites configurables en application.properties (patron DEBT-044) */
@Service
public class BizumLimitService {
    @Value("${bank.bizum.limit.per-operation:500}")
    private BigDecimal limitPerOperation;
    @Value("${bank.bizum.limit.per-day:2000}")
    private BigDecimal limitPerDay;

    public void checkPerOperation(BigDecimal amount) {
        if (amount.compareTo(limitPerOperation) > 0)
            throw new BizumLimitExceededException(
                "Importe " + amount + " EUR supera limite por operacion de " + limitPerOperation + " EUR");
    }
    public void checkDaily(BigDecimal usedToday, BigDecimal amount) {
        if (usedToday.add(amount).compareTo(limitPerDay) > 0)
            throw new BizumLimitExceededException(
                "Limite diario de " + limitPerDay + " EUR superado. Usado: " + usedToday + " EUR");
    }
}
