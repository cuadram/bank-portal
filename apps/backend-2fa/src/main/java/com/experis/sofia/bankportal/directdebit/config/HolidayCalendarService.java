package com.experis.sofia.bankportal.directdebit.config;

import org.springframework.stereotype.Service;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;

/**
 * Business day calendar — Spain + TARGET2 2026.
 * PSD2 Art.80 D-2 rule implementation.
 * FEAT-017 Sprint 19
 */
@Service
public class HolidayCalendarService {

    /** Spanish national + TARGET2 holidays 2026 */
    private static final Set<LocalDate> HOLIDAYS_2026 = Set.of(
        LocalDate.of(2026, 1, 1),   // New Year
        LocalDate.of(2026, 1, 6),   // Epiphany
        LocalDate.of(2026, 4, 3),   // Good Friday (TARGET2)
        LocalDate.of(2026, 4, 6),   // Easter Monday (TARGET2)
        LocalDate.of(2026, 5, 1),   // Labour Day
        LocalDate.of(2026, 8, 15),  // Assumption
        LocalDate.of(2026, 10, 12), // Fiesta Nacional
        LocalDate.of(2026, 11, 1),  // All Saints
        LocalDate.of(2026, 12, 6),  // Constitution Day
        LocalDate.of(2026, 12, 8),  // Immaculate Conception
        LocalDate.of(2026, 12, 25), // Christmas Day (TARGET2)
        LocalDate.of(2026, 12, 26)  // Boxing Day (TARGET2)
    );

    /**
     * Returns the date that is {@code businessDays} business days from {@code from}.
     * PSD2 D-2: call with businessDays=2 to get the cutoff date.
     */
    public LocalDate getBusinessDayCutoff(LocalDate from, int businessDays) {
        LocalDate date = from;
        int counted = 0;
        while (counted < businessDays) {
            date = date.plusDays(1);
            if (isBusinessDay(date)) counted++;
        }
        return date;
    }

    public boolean isBusinessDay(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow != DayOfWeek.SATURDAY
            && dow != DayOfWeek.SUNDAY
            && !HOLIDAYS_2026.contains(date);
    }
}
