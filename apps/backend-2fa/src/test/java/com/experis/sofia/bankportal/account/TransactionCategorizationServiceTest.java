package com.experis.sofia.bankportal.account;

import com.experis.sofia.bankportal.account.application.TransactionCategorizationService;
import com.experis.sofia.bankportal.account.application.TransactionCategorizationService.Category;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * US-705 — Tests unitarios TransactionCategorizationService.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
class TransactionCategorizationServiceTest {

    private final TransactionCategorizationService service = new TransactionCategorizationService();

    @ParameterizedTest(name = "[{index}] concept=''{0}'' → {1}")
    @CsvSource({
        "NOMINA EMPRESA SL OCTUBRE,         NOMINA",
        "SALARY PAYMENT NOV,                NOMINA",
        "SUELDO MENSUAL,                    NOMINA",
        "BIZUM RECIBIDO DE MARIA,           BIZUM",
        "BIZUM ENVIADO A JUAN,              BIZUM",
        "DEVOLUCION AMAZON PEDIDO 123,      DEVOLUCION",
        "REFUND ORDER 456,                  DEVOLUCION",
        "COMISION MANTENIMIENTO CUENTA,     COMISION",
        "TRANSFERENCIA RECIBIDA JOSE,       TRANSFERENCIA",
        "TRNSF ENVIADA,                     TRANSFERENCIA",
        "CAJERO REINTEGRO 200EUR,           CAJERO",
        "ATM WITHDRAWAL,                    CAJERO",
        "RECIBO LUZ ENDESA,                 RECIBO_UTIL",
        "FACTURA VODAFONE OCTUBRE,          RECIBO_UTIL",
        "RECIBO DOMICILIADO AGUA,           DOMICILIACION",
        "COMPRA TPV MERCADONA,              COMPRA",
        "PAGO AMAZON MARKETPLACE,           COMPRA",
        "CONCEPTO DESCONOCIDO XYZ 999,      OTRO"
    })
    @DisplayName("US-705: categorización por concepto")
    void categorize_knownConcepts(String concept, String expectedCategory) {
        String result = service.categorizeAsString(concept);
        assertThat(result).isEqualTo(expectedCategory);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @DisplayName("US-705: concepto null o vacío → OTRO")
    void categorize_nullOrEmpty_returnsOtro(String concept) {
        assertThat(service.categorize(concept)).isEqualTo(Category.OTRO);
    }

    @ParameterizedTest(name = "[{index}] MAIUSCULAS ''{0}'' → {1}")
    @CsvSource({
        "BIZUM RECIBIDO,    BIZUM",
        "Nomina Empresa,    NOMINA",
        "compra carrefour,  COMPRA"
    })
    @DisplayName("US-705: categorización case-insensitive")
    void categorize_caseInsensitive(String concept, String expectedCategory) {
        assertThat(service.categorizeAsString(concept)).isEqualTo(expectedCategory);
    }
}
