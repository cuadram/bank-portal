package com.experis.sofia.bankportal.directdebit;

import com.experis.sofia.bankportal.directdebit.config.HolidayCalendarService;
import org.junit.jupiter.api.*;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for HolidayCalendarService — PSD2 D-2 rule.
 * FEAT-017 Sprint 19 · US-1704
 */
@DisplayName("HolidayCalendarService — PSD2 D-2 rule")
class HolidayCalendarServiceTest {

    private HolidayCalendarService calendar;

    @BeforeEach
    void setUp() { calendar = new HolidayCalendarService(); }

    @Test
    @DisplayName("Next 2 business days skips weekend")
    void skipWeekend() {
        // Friday 2026-05-08 + 2 business days = Tuesday 2026-05-12 (skips Sat+Sun)
        LocalDate friday = LocalDate.of(2026, 5, 8);
        LocalDate result = calendar.getBusinessDayCutoff(friday, 2);
        assertThat(result).isEqualTo(LocalDate.of(2026, 5, 12));
    }

    @Test
    @DisplayName("Saturday is not a business day")
    void saturdayIsNotBusinessDay() {
        assertThat(calendar.isBusinessDay(LocalDate.of(2026, 5, 9))).isFalse();
    }

    @Test
    @DisplayName("Monday is a business day")
    void mondayIsBusinessDay() {
        assertThat(calendar.isBusinessDay(LocalDate.of(2026, 5, 11))).isTrue();
    }

    @Test
    @DisplayName("Spanish national holiday is not a business day")
    void nationalHolidayIsNotBusinessDay() {
        // 2026-05-01 Labour Day
        assertThat(calendar.isBusinessDay(LocalDate.of(2026, 5, 1))).isFalse();
    }
}
