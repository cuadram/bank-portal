package com.experis.sofia.bankportal.deposit.infrastructure.persistence;

import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import com.experis.sofia.bankportal.deposit.domain.repository.DepositRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JpaDepositAdapter implements DepositRepositoryPort {

    private final JpaDepositRepository jpa;

    @Override
    public Page<Deposit> findByUserId(UUID userId, Pageable pageable) {
        return jpa.findByUserId(userId, pageable).map(this::toDomain);
    }

    @Override
    public Optional<Deposit> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public Deposit save(Deposit deposit) {
        return toDomain(jpa.save(toEntity(deposit)));
    }

    @Override
    public Deposit update(Deposit deposit) {
        return toDomain(jpa.save(toEntity(deposit)));
    }

    private Deposit toDomain(DepositEntity e) {
        Deposit d = new Deposit();
        d.setId(e.getId());
        d.setUserId(e.getUserId());
        d.setImporte(e.getImporte());
        d.setPlazoMeses(e.getPlazoMeses());
        d.setTin(e.getTin());
        d.setTae(e.getTae());
        d.setEstado(DepositStatus.valueOf(e.getEstado()));
        d.setRenovacion(RenewalInstruction.valueOf(e.getRenovacion()));
        d.setCuentaOrigenId(e.getCuentaOrigenId());
        d.setFechaApertura(e.getFechaApertura());
        d.setFechaVencimiento(e.getFechaVencimiento());
        d.setPenalizacion(e.getPenalizacion());
        d.setCreatedAt(e.getCreatedAt());
        d.setUpdatedAt(e.getUpdatedAt());
        return d;
    }

    private DepositEntity toEntity(Deposit d) {
        DepositEntity e = new DepositEntity();
        if (d.getId() != null) e.setId(d.getId());
        e.setUserId(d.getUserId());
        e.setImporte(d.getImporte());
        e.setPlazoMeses(d.getPlazoMeses());
        e.setTin(d.getTin());
        e.setTae(d.getTae());
        e.setEstado(d.getEstado().name());
        e.setRenovacion(d.getRenovacion().name());
        e.setCuentaOrigenId(d.getCuentaOrigenId());
        e.setFechaApertura(d.getFechaApertura());
        e.setFechaVencimiento(d.getFechaVencimiento());
        e.setPenalizacion(d.getPenalizacion());
        return e;
    }
}
