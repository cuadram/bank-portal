package com.experis.sofia.bankportal.scheduled.infrastructure;

import com.experis.sofia.bankportal.scheduled.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class ScheduledTransferExecutionRepositoryAdapter implements ScheduledTransferExecutionRepository {
    private final JdbcClient jdbc;

    @Override
    public ScheduledTransferExecution save(ScheduledTransferExecution e) {
        try {
            jdbc.sql("INSERT INTO scheduled_transfer_executions (id,scheduled_transfer_id,scheduled_date,status,executed_at) VALUES (:id,:tid,:date,:status,:exAt) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,executed_at=EXCLUDED.executed_at")
                .param("id",    e.getId())
                .param("tid",   e.getScheduledTransferId())
                .param("date",  e.getScheduledDate())
                .param("status",e.getStatus().name())
                .param("exAt",  e.getExecutedAt())
                .update();
        } catch (Exception ignored) {}
        return e;
    }

    @Override
    public Optional<ScheduledTransferExecution> findByTransferIdAndScheduledDate(UUID id, LocalDate date) { return Optional.empty(); }
    @Override
    public List<ScheduledTransferExecution> findByScheduledTransferId(UUID id) { return List.of(); }
}
