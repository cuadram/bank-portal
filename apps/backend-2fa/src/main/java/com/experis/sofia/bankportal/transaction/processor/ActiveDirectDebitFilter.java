package com.experis.sofia.bankportal.transaction.processor;

import com.experis.sofia.bankportal.directdebit.domain.DirectDebit;
import com.experis.sofia.bankportal.directdebit.domain.DebitStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.function.Predicate;

/**
 * DEBT-032: Named class extraída de DirectDebitService.
 * Antes: .filter(d -> d.getStatus() == DebitStatus.PENDING && d.getMandateId() != null)
 * HOTFIX-S20: paquete corregido + usa DebitStatus enum real.
 */
@Slf4j
@Component
public class ActiveDirectDebitFilter implements Predicate<DirectDebit> {
    @Override
    public boolean test(DirectDebit d) {
        return d != null
            && DebitStatus.PENDING.equals(d.getStatus())
            && d.getMandateId() != null;
    }
}
