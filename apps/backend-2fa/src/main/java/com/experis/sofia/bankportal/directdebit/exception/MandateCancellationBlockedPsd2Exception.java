package com.experis.sofia.bankportal.directdebit.exception;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import java.time.LocalDate;
/** FEAT-017 Sprint 19 — PSD2 Art.80 D-2 rule */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
@Getter
public class MandateCancellationBlockedPsd2Exception extends RuntimeException {
    private final LocalDate dueDate;
    public MandateCancellationBlockedPsd2Exception(LocalDate dueDate) {
        super("Cannot cancel mandate — pending debit due in 2 business days");
        this.dueDate = dueDate;
    }
}
