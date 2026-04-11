package com.experis.sofia.bankportal.directdebit.dto.response;

import com.experis.sofia.bankportal.directdebit.domain.DebitStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/** FEAT-017 Sprint 19 */
@Data @Builder
public class DirectDebitResponse {
    private UUID id;
    private UUID mandateId;
    private BigDecimal amount;
    private String currency;
    private DebitStatus status;
    private LocalDate dueDate;
    private ZonedDateTime chargedAt;
    private String returnReason;
}
