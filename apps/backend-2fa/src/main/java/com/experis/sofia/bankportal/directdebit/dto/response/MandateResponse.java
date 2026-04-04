package com.experis.sofia.bankportal.directdebit.dto.response;

import com.experis.sofia.bankportal.directdebit.domain.MandateStatus;
import com.experis.sofia.bankportal.directdebit.domain.MandateType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/** FEAT-017 Sprint 19 */
@Data @Builder
public class MandateResponse {
    private UUID id;
    private UUID accountId;
    private String creditorName;
    private String creditorIban;
    private String mandateRef;
    private MandateType mandateType;
    private MandateStatus status;
    private LocalDate signedAt;
    private LocalDate cancelledAt;
    private ZonedDateTime createdAt;
}
