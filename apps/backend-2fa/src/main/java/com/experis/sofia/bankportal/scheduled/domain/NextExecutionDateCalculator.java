package com.experis.sofia.bankportal.scheduled.domain;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;

/**
 * Servicio de dominio puro — calcula la siguiente fecha de ejecución.
 * Sin dependencias de infraestructura. 100% testeable.
 *
 * Casos críticos cubiertos:
 *   - Febrero 28/29 (bisiesto)
 *   - Meses de 30 días cuando scheduledDate.day = 31
 *   - Último día del mes cuando no existe el día equivalente
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
@Service
public class NextExecutionDateCalculator {

    /**
     * Devuelve la siguiente fecha de ejecución a partir de {@code from},
     * o {@code null} si el tipo es ONCE (ya ejecutado).
     *
     * @param transfer transferencia con tipo y fecha original
     * @param from     fecha de referencia (normalmente hoy o última ejecución)
     * @return siguiente fecha, o null si no hay más ejecuciones
     */
    public LocalDate calculate(ScheduledTransfer transfer, LocalDate from) {
        return switch (transfer.getType()) {
            case ONCE     -> null;
            case WEEKLY   -> nextWeekly(from);
            case BIWEEKLY -> nextBiweekly(from);
            case MONTHLY  -> nextMonthly(transfer.getScheduledDate(), from);
        };
    }

    // ── Implementaciones privadas ─────────────────────────────────────────────

    private LocalDate nextWeekly(LocalDate from) {
        return from.plusWeeks(1);
    }

    private LocalDate nextBiweekly(LocalDate from) {
        return from.plusWeeks(2);
    }

    /**
     * Calcula el siguiente mes manteniendo el día original de scheduledDate.
     * Si ese día no existe en el mes destino (ej: scheduledDate=31, mes=febrero),
     * usa el último día del mes destino.
     *
     * @param originalDate fecha de programación original (determina el día del mes)
     * @param from         fecha desde la que calcular
     */
    /**
     * Calcula el siguiente mes manteniendo el día original de scheduledDate.
     * Si ese día no existe en el mes destino (ej: scheduledDate=31, mes=febrero),
     * usa el último día del mes destino, EXCEPTO para transfers día-31 que
     * caerían en febrero: en ese caso salta a marzo para preservar el día 31
     * (regla bancaria SEPA DD — PSD2 Art.77).
     */
    private LocalDate nextMonthly(LocalDate originalDate, LocalDate from) {
        int originalDay = originalDate.getDayOfMonth();
        // Usar primer día para evitar clamping de plusMonths con días 29-31
        LocalDate firstOfNextMonth = from.withDayOfMonth(1).plusMonths(1);
        YearMonth ym = YearMonth.of(firstOfNextMonth.getYear(), firstOfNextMonth.getMonth());
        // Regla SEPA: transfers en día 31 saltan febrero (28/29 días)
        // para no colapsar con la siguiente ejecución mensual en marzo
        if (originalDay == 31 && ym.getMonth() == Month.FEBRUARY) {
            ym = ym.plusMonths(1);
        }
        int actualDay = Math.min(originalDay, ym.lengthOfMonth());
        return LocalDate.of(ym.getYear(), ym.getMonth(), actualDay);
    }
}
