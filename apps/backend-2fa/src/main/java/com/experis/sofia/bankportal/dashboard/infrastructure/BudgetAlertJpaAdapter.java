package com.experis.sofia.bankportal.dashboard.infrastructure;

import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;
import com.experis.sofia.bankportal.dashboard.domain.BudgetAlertRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class BudgetAlertJpaAdapter implements BudgetAlertRepositoryPort {

    private final JdbcClient jdbc;

    @Override public void saveAlert(UUID u, String p, BigDecimal budget, int pct, BigDecimal current) {
        jdbc.sql("INSERT INTO budget_alerts(user_id,period,monthly_budget,threshold_pct,current_amount) VALUES(:u,:p,:b,:pct,:c) ON CONFLICT(user_id,period) DO NOTHING")
                .param("u",u).param("p",p).param("b",budget).param("pct",pct).param("c",current).update();
    }
    @Override public List<BudgetAlertDto> findRecentAlerts(UUID u, String cur) {
        return jdbc.sql("SELECT monthly_budget,threshold_pct,current_amount,triggered_at FROM budget_alerts WHERE user_id=:u AND period>=TO_CHAR(TO_DATE(:p,'YYYY-MM')-INTERVAL '3 months','YYYY-MM') ORDER BY triggered_at DESC")
                .param("u",u).param("p",cur)
                .query((rs,n)->{
                    BigDecimal b=rs.getBigDecimal("monthly_budget"), a=rs.getBigDecimal("current_amount");
                    double used=b.compareTo(BigDecimal.ZERO)>0?a.multiply(BigDecimal.valueOf(100)).divide(b,1,RoundingMode.HALF_UP).doubleValue():0.0;
                    return new BudgetAlertDto("BUDGET_THRESHOLD",rs.getInt("threshold_pct"),b,a,used,rs.getTimestamp("triggered_at").toLocalDateTime());
                }).list();
    }
    @Override public void markNotified(UUID u, String p) {
        jdbc.sql("UPDATE budget_alerts SET notified=true WHERE user_id=:u AND period=:p").param("u",u).param("p",p).update();
    }
    @Override public boolean existsForPeriod(UUID u, String p) {
        Integer c=jdbc.sql("SELECT COUNT(*) FROM budget_alerts WHERE user_id=:u AND period=:p").param("u",u).param("p",p).query(Integer.class).single();
        return c!=null&&c>0;
    }
}
