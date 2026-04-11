package com.experis.sofia.bankportal.auth.infrastructure;

import com.experis.sofia.bankportal.auth.domain.UnlockToken;
import com.experis.sofia.bankportal.auth.domain.UnlockTokenRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class JdbcUnlockTokenRepository implements UnlockTokenRepository {
    private final Map<String, UnlockToken> store = new ConcurrentHashMap<>();
    @Override public void save(UnlockToken t) { store.put(t.getToken(), t); }
    @Override public Optional<UnlockToken> findByRawToken(String t) { return findByToken(t); }
    @Override public Optional<UnlockToken> findByToken(String t) { return Optional.ofNullable(store.get(t)).filter(x -> !x.isExpired() && !x.isUsed()); }
    @Override public void deleteByToken(String t) { store.remove(t); }
    @Override public void deleteExpiredBefore(Instant cutoff) { store.entrySet().removeIf(e -> e.getValue().getExpiresAt().isBefore(cutoff)); }
    @Override public void invalidateAllForUser(UUID userId) { store.values().stream().filter(t -> userId.equals(t.getUserId())).forEach(t -> t.setUsed(true)); }
}
