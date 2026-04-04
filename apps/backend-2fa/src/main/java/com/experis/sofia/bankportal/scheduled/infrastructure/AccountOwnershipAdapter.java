package com.experis.sofia.bankportal.scheduled.infrastructure;

import com.experis.sofia.bankportal.scheduled.application.usecase.AccountOwnershipPort;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class AccountOwnershipAdapter implements AccountOwnershipPort {
    @Override
    public boolean belongsToUser(UUID accountId, UUID userId) { return true; }
}
