package com.experis.sofia.bankportal.beneficiary.infrastructure;

import com.experis.sofia.bankportal.beneficiary.domain.Beneficiary;
import com.experis.sofia.bankportal.beneficiary.domain.BeneficiaryRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JdbcBeneficiaryRepository implements BeneficiaryRepositoryPort {
    private final JdbcClient jdbc;

    @Override
    public Beneficiary save(Beneficiary b) {
        int u = jdbc.sql("UPDATE beneficiaries SET alias=:alias, deleted_at=:del WHERE id=:id")
            .param("alias", b.getAlias()).param("del", b.getDeletedAt()).param("id", b.getId()).update();
        if (u == 0)
            jdbc.sql("INSERT INTO beneficiaries (id,user_id,alias,iban,holder_name,created_at) VALUES (:id,:uid,:alias,:iban,:hn,now())")
                .param("id",b.getId()).param("uid",b.getUserId()).param("alias",b.getAlias())
                .param("iban",b.getIban()).param("hn",b.getHolderName()).update();
        return b;
    }

    @Override
    public Optional<Beneficiary> findByIdAndUserId(UUID id, UUID userId) {
        return jdbc.sql("SELECT user_id,alias,iban,holder_name FROM beneficiaries WHERE id=:id AND user_id=:uid AND deleted_at IS NULL")
            .param("id",id).param("uid",userId)
            .query((rs,n)->new Beneficiary((UUID)rs.getObject("user_id"),rs.getString("alias"),rs.getString("iban"),rs.getString("holder_name")))
            .optional();
    }

    @Override
    public List<Beneficiary> findActiveByUserId(UUID userId) {
        return jdbc.sql("SELECT user_id,alias,iban,holder_name FROM beneficiaries WHERE user_id=:uid AND deleted_at IS NULL ORDER BY alias")
            .param("uid",userId)
            .query((rs,n)->new Beneficiary((UUID)rs.getObject("user_id"),rs.getString("alias"),rs.getString("iban"),rs.getString("holder_name")))
            .list();
    }

    @Override
    public boolean existsActiveByUserIdAndIban(UUID userId, String iban) {
        return Boolean.TRUE.equals(jdbc.sql("SELECT COUNT(*)>0 FROM beneficiaries WHERE user_id=:uid AND iban=:iban AND deleted_at IS NULL")
            .param("uid",userId).param("iban",iban).query(Boolean.class).single());
    }
}
