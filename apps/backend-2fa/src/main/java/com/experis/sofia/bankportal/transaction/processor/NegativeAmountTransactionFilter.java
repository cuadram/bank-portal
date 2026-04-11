package com.experis.sofia.bankportal.transaction.processor;

import com.experis.sofia.bankportal.account.domain.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.function.Predicate;

/**
 * DEBT-032: Named class extraída de TransactionService (lambda anónima).
 * Stack traces legibles: NegativeAmountTransactionFilter.test()
 * HOTFIX-S20: paquete corregido + import de Transaction real.
 */
@Slf4j
@Component
public class NegativeAmountTransactionFilter implements Predicate<Transaction> {
    @Override
    public boolean test(Transaction t) {
        if (t == null || t.getAmount() == null) return false;
        return t.getAmount().signum() < 0;
    }
}
