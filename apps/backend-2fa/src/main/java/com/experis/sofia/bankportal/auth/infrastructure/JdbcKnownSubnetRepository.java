package com.experis.sofia.bankportal.auth.infrastructure;

import com.experis.sofia.bankportal.auth.domain.KnownSubnet;
import com.experis.sofia.bankportal.auth.domain.KnownSubnetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JdbcKnownSubnetRepository implements KnownSubnetRepository {
    private final JdbcClient jdbc;
    @Override
    public boolean existsByUserIdAndSubnet(UUID userId, String subnet) {
        try {
            return Boolean.TRUE.equals(jdbc.sql("SELECT COUNT(*)>0 FROM known_subnets WHERE user_id=:uid AND subnet=:subnet")
                .param("uid", userId).param("subnet", subnet).query(Boolean.class).single());
        } catch (Exception e) { return false; }
    }
    @Override
    public void save(KnownSubnet ks) {
        try {
            jdbc.sql("INSERT INTO known_subnets (user_id, subnet, confirmed_at) VALUES (:uid,:subnet,now()) ON CONFLICT (user_id,subnet) DO NOTHING")
                .param("uid", ks.getUserId()).param("subnet", ks.getSubnet()).update();
        } catch (Exception ignored) {}
    }
}
