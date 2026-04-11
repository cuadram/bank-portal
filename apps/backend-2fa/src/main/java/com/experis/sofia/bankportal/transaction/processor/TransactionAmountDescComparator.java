package com.experis.sofia.bankportal.transaction.processor;

import com.experis.sofia.bankportal.account.domain.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;

/**
 * DEBT-032: Named class extraída de TransactionService.
 * Antes: .sorted((a,b) -> b.getAmount().abs().compareTo(a.getAmount().abs()))
 * HOTFIX-S20: paquete corregido + import de Transaction real.
 */
@Slf4j
@Component
public class TransactionAmountDescComparator implements Comparator<Transaction> {
    @Override
    public int compare(Transaction a, Transaction b) {
        BigDecimal amtA = a.getAmount() != null ? a.getAmount().abs() : BigDecimal.ZERO;
        BigDecimal amtB = b.getAmount() != null ? b.getAmount().abs() : BigDecimal.ZERO;
        return amtB.compareTo(amtA); // desc por valor absoluto
    }
}
