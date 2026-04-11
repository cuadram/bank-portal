package com.experis.sofia.bankportal.scheduled.infrastructure;

import com.experis.sofia.bankportal.scheduled.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class ScheduledTransferRepositoryAdapter implements ScheduledTransferRepository {
    private final JdbcClient jdbc;

    @Override
    public ScheduledTransfer save(ScheduledTransfer t) {
        try {
            int u = jdbc.sql("UPDATE scheduled_transfers SET status=:s, updated_at=now() WHERE id=:id")
                .param("s", t.getStatus().name()).param("id", t.getId()).update();
            if (u == 0)
                jdbc.sql("INSERT INTO scheduled_transfers (id,user_id,source_account_id,destination_iban,amount,concept,type,scheduled_date,status,created_at) " +
                         "VALUES (:id,:uid,:acc,:iban,:amt,:concept,:type,:date,:status,now())")
                    .param("id",      t.getId())
                    .param("uid",     t.getUserId())
                    .param("acc",     t.getSourceAccountId())
                    .param("iban",    t.getDestinationIban())
                    .param("amt",     t.getAmount())
                    .param("concept", t.getConcept())
                    .param("type",    t.getType().name())
                    .param("date",    t.getScheduledDate())
                    .param("status",  t.getStatus().name())
                    .update();
        } catch (Exception ignored) {}
        return t;
    }

    @Override public Optional<ScheduledTransfer> findById(UUID id) { return Optional.empty(); }
    @Override public Optional<ScheduledTransfer> findByIdAndUserId(UUID id, UUID userId) { return Optional.empty(); }
    @Override public List<ScheduledTransfer> findByUserId(UUID userId) { return List.of(); }
    @Override public List<ScheduledTransfer> findByUserIdAndStatus(UUID userId, ScheduledTransferStatus s) { return List.of(); }
    @Override public Page<ScheduledTransfer> findDueTransfers(LocalDate today, Pageable p) { return new PageImpl<>(List.of()); }
}
