package com.experis.sofia.bankportal.twofa.unit.domain.service;

import com.experis.sofia.bankportal.twofa.domain.service.RecoveryCodeGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.*;

@DisplayName("RecoveryCodeGeneratorService")
class RecoveryCodeGeneratorServiceTest {

    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$");

    private RecoveryCodeGeneratorService service;

    @BeforeEach
    void setUp() {
        service = new RecoveryCodeGeneratorService();
    }

    @Test
    @DisplayName("genera exactamente 10 códigos")
    void generate_returns10Codes() {
        assertThat(service.generate()).hasSize(10);
    }

    @Test
    @DisplayName("todos los códigos cumplen formato XXXX-XXXX")
    void generate_allCodesMatchFormat() {
        service.generate().forEach(code ->
            assertThat(code).matches(CODE_PATTERN));
    }

    @Test
    @DisplayName("los 10 códigos son únicos entre sí")
    void generate_allCodesAreUnique() {
        List<String> codes = service.generate();
        assertThat(new HashSet<>(codes)).hasSize(10);
    }

    @Test
    @DisplayName("no contiene caracteres ambiguos 0,1,I,L,O")
    void generate_noAmbiguousCharacters() {
        service.generate().forEach(code ->
            assertThat(code).doesNotContainAnyWhitespaces()
                .doesNotContain("0", "1", "I", "L", "O"));
    }

    @Test
    @DisplayName("dos llamadas consecutivas producen listas distintas")
    void generate_twoCalls_produceDifferentLists() {
        List<String> first  = service.generate();
        List<String> second = service.generate();
        // Con 31^8 combinaciones posibles, la probabilidad de colisión es despreciable
        assertThat(first).isNotEqualTo(second);
    }

    @Test
    @DisplayName("la lista devuelta es inmutable")
    void generate_returnsImmutableList() {
        List<String> codes = service.generate();
        assertThatThrownBy(() -> codes.add("XXXX-YYYY"))
            .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    @DisplayName("genera 10 códigos en múltiples llamadas sin degradación")
    void generate_multipleCalls_alwaysReturn10() {
        for (int i = 0; i < 5; i++) {
            assertThat(service.generate()).hasSize(10);
        }
    }
}
