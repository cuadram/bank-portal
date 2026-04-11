package com.experis.sofia.bankportal.auth.infrastructure;

import com.experis.sofia.bankportal.auth.domain.ContextConfirmToken;
import com.experis.sofia.bankportal.auth.domain.ContextConfirmTokenRepository;
import org.springframework.stereotype.Repository;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class JdbcContextConfirmTokenRepository implements ContextConfirmTokenRepository {
    private final Map<String, ContextConfirmToken> store = new ConcurrentHashMap<>();
    @Override public void save(ContextConfirmToken t) { store.put(t.getRawToken(), t); }
    @Override public Optional<ContextConfirmToken> findByRawToken(String t) { return Optional.ofNullable(store.get(t)); }
    @Override public void deleteByRawToken(String t) { store.remove(t); }
}
