package com.experis.sofia.bankportal.scheduled.infrastructure;

import com.experis.sofia.bankportal.scheduled.application.usecase.CoreTransferPort;
import com.experis.sofia.bankportal.scheduled.application.usecase.CoreTransferResult;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;

@Service
public class CoreTransferAdapter implements CoreTransferPort {
    @Override
    public CoreTransferResult execute(UUID sourceAccountId, String destinationIban, BigDecimal amount, String concept) {
        return CoreTransferResult.failed("CORE_NOT_CONFIGURED_STG");
    }
}
