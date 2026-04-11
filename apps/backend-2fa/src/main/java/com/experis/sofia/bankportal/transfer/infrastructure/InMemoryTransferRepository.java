package com.experis.sofia.bankportal.transfer.infrastructure;
import com.experis.sofia.bankportal.transfer.domain.Transfer;
import com.experis.sofia.bankportal.transfer.domain.TransferRepositoryPort;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
@Repository
public class InMemoryTransferRepository implements TransferRepositoryPort {
    private final Map<UUID,Transfer> store = new ConcurrentHashMap<>();
    @Override public Transfer save(Transfer t) { store.put(t.getId(),t); return t; }
    @Override public List<Transfer> findByUserIdOrderByCreatedAtDesc(UUID userId) { return List.of(); }
    @Override public boolean existsCompletedTransferToBeneficiary(UUID u, UUID b) { return false; }
}
