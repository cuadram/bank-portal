package com.experis.sofia.bankportal.bill.infrastructure;

import com.experis.sofia.bankportal.bill.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class JdbcBillRepository implements BillRepositoryPort {

    private final JdbcClient jdbc;

    @Override
    public List<Bill> findPendingByUserId(UUID userId) {
        try {
            return jdbc.sql("SELECT id,user_id,issuer,concept,amount,due_date,status,created_at FROM bills WHERE user_id=:uid AND status='PENDING' ORDER BY due_date")
                .param("uid", userId)
                .query((rs,n) -> new Bill((UUID)rs.getObject("id"),(UUID)rs.getObject("user_id"),
                    rs.getString("issuer"),rs.getString("concept"),rs.getBigDecimal("amount"),
                    rs.getDate("due_date").toLocalDate(),BillStatus.valueOf(rs.getString("status")),
                    rs.getTimestamp("created_at").toLocalDateTime()))
                .list();
        } catch(Exception e) { return List.of(); }
    }

    @Override
    public Optional<Bill> findByIdAndUserId(UUID billId, UUID userId) {
        try {
            return jdbc.sql("SELECT id,user_id,issuer,concept,amount,due_date,status,created_at FROM bills WHERE id=:id AND user_id=:uid")
                .param("id",billId).param("uid",userId)
                .query((rs,n) -> new Bill((UUID)rs.getObject("id"),(UUID)rs.getObject("user_id"),
                    rs.getString("issuer"),rs.getString("concept"),rs.getBigDecimal("amount"),
                    rs.getDate("due_date").toLocalDate(),BillStatus.valueOf(rs.getString("status")),
                    rs.getTimestamp("created_at").toLocalDateTime()))
                .optional();
        } catch(Exception e) { return Optional.empty(); }
    }

    @Override
    public Bill save(Bill bill) {
        try {
            int u = jdbc.sql("UPDATE bills SET status=:s WHERE id=:id").param("s",bill.status().name()).param("id",bill.id()).update();
            if(u==0) {
                UUID id = bill.id()!=null ? bill.id() : UUID.randomUUID();
                jdbc.sql("INSERT INTO bills (id,user_id,issuer,concept,amount,due_date,status,created_at) VALUES (:id,:uid,:issuer,:concept,:amount,:dueDate,:status,now())")
                    .param("id",id).param("uid",bill.userId()).param("issuer",bill.issuer())
                    .param("concept",bill.concept()).param("amount",bill.amount())
                    .param("dueDate",bill.dueDate()).param("status",bill.status().name()).update();
                return new Bill(id,bill.userId(),bill.issuer(),bill.concept(),bill.amount(),bill.dueDate(),bill.status(),bill.createdAt());
            }
        } catch(Exception ignored) {}
        return bill;
    }
}
