package com.experis.sofia.bankportal.auth.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de subredes conocidas — FEAT-006 ADR-011.
 */
public interface KnownSubnetRepository {
    boolean existsByUserIdAndSubnet(UUID userId, String subnet);
    void save(KnownSubnet knownSubnet);
}
