package com.experis.sofia.bankportal.dashboard.infrastructure;

import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class DashboardJpaAdapter implements DashboardRepositoryPort {

    private final JdbcClient jdbc;

    @Override public BigDecimal sumIncome(UUID u, String p) {
        return jdbc.sql("SELECT COALESCE(SUM(amount),0) FROM transfers WHERE target_account_id IN (SELECT id FROM accounts WHERE user_id=:u) AND status='COMPLETED' AND TO_CHAR(created_at,'YYYY-MM')=:p")
                .param("u",u).param("p",p).query(BigDecimal.class).single();
    }
    @Override public BigDecimal sumExpenses(UUID u, String p) {
        return jdbc.sql("SELECT COALESCE(SUM(amount),0) FROM (SELECT amount FROM transfers WHERE user_id=:u AND status='COMPLETED' AND TO_CHAR(created_at,'YYYY-MM')=:p UNION ALL SELECT amount FROM bill_payments WHERE user_id=:u AND status='COMPLETED' AND TO_CHAR(paid_at,'YYYY-MM')=:p) AS c")
                .param("u",u).param("p",p).query(BigDecimal.class).single();
    }
    @Override public int countTransactions(UUID u, String p) {
        return jdbc.sql("SELECT COUNT(*) FROM (SELECT id FROM transfers WHERE user_id=:u AND status='COMPLETED' AND TO_CHAR(created_at,'YYYY-MM')=:p UNION ALL SELECT id FROM bill_payments WHERE user_id=:u AND status='COMPLETED' AND TO_CHAR(paid_at,'YYYY-MM')=:p) AS c")
                .param("u",u).param("p",p).query(Integer.class).single();
    }
    @Override public List<RawSpendingRecord> findRawSpendings(UUID u, String p) {
        return jdbc.sql("SELECT concept, NULL AS issuer, amount FROM transfers WHERE user_id=:u AND status='COMPLETED' AND TO_CHAR(created_at,'YYYY-MM')=:p UNION ALL SELECT NULL AS concept, issuer, amount FROM bill_payments WHERE user_id=:u AND status='COMPLETED' AND TO_CHAR(paid_at,'YYYY-MM')=:p")
                .param("u",u).param("p",p)
                .query((rs,n)->new RawSpendingRecord(rs.getString("concept"),rs.getString("issuer"),rs.getBigDecimal("amount"))).list();
    }
    @Override public List<TopMerchantDto> findTopMerchants(UUID u, String p, int limit) {
        return jdbc.sql("SELECT issuer, SUM(amount) AS ta, COUNT(*) AS cnt FROM bill_payments WHERE user_id=:u AND status='COMPLETED' AND TO_CHAR(paid_at,'YYYY-MM')=:p AND issuer IS NOT NULL GROUP BY issuer ORDER BY ta DESC LIMIT :l")
                .param("u",u).param("p",p).param("l",limit)
                .query((rs,n)->new TopMerchantDto(rs.getString("issuer"),rs.getBigDecimal("ta"),rs.getInt("cnt"))).list();
    }
    @Override public List<SpendingCategoryDto> findCachedCategories(UUID u, String p) {
        return jdbc.sql("SELECT category, amount, tx_count FROM spending_categories WHERE user_id=:u AND period=:p")
                .param("u",u).param("p",p)
                .query((rs,n)->new SpendingCategoryDto(rs.getString("category"),rs.getBigDecimal("amount"),0.0,rs.getInt("tx_count"))).list();
    }
    @Override @Transactional
    public void upsertSpendingCategories(UUID u, String p, List<SpendingCategoryDto> cats) {
        for (SpendingCategoryDto c : cats)
            jdbc.sql("INSERT INTO spending_categories(user_id,period,category,amount,tx_count) VALUES(:u,:p,:cat,:amt,:cnt) ON CONFLICT(user_id,period,category) DO UPDATE SET amount=EXCLUDED.amount,tx_count=EXCLUDED.tx_count,computed_at=now()")
                    .param("u",u).param("p",p).param("cat",c.category()).param("amt",c.amount()).param("cnt",c.count()).update();
    }
    @Override public void deleteCachedCategories(UUID u, String p) {
        jdbc.sql("DELETE FROM spending_categories WHERE user_id=:u AND period=:p").param("u",u).param("p",p).update();
    }
}
