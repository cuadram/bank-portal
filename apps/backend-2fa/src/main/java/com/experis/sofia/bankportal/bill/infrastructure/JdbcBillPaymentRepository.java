package com.experis.sofia.bankportal.bill.infrastructure;

import com.experis.sofia.bankportal.bill.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JdbcBillPaymentRepository implements BillPaymentRepositoryPort {

    private final JdbcClient jdbc;

    @Override
    public BillPayment save(BillPayment p) {
        try {
            UUID id = p.id()!=null ? p.id() : UUID.randomUUID();
            jdbc.sql("INSERT INTO bill_payments (id,user_id,bill_id,reference,issuer,amount,source_account,status,core_txn_id,paid_at) " +
                     "VALUES (:id,:uid,:billId,:ref,:issuer,:amount,:srcAcc,:status,:coreTxn,:paidAt) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,core_txn_id=EXCLUDED.core_txn_id")
                .param("id",id).param("uid",p.userId()).param("billId",p.billId())
                .param("ref",p.reference()).param("issuer",p.issuer()).param("amount",p.amount())
                .param("srcAcc",p.sourceAccount()).param("status",p.status())
                .param("coreTxn",p.coreTxnId()).param("paidAt",p.paidAt()).update();
            return new BillPayment(id,p.userId(),p.billId(),p.reference(),p.issuer(),p.amount(),p.sourceAccount(),p.status(),p.coreTxnId(),p.paidAt());
        } catch(Exception e) { return p; }
    }
}
