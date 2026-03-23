package com.experis.sofia.bankportal.bill.infrastructure;

import com.experis.sofia.bankportal.bill.domain.BillLookupResult;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de infraestructura — pagos de facturas y recibos al core bancario.
 * Implementa BillPaymentPort usando el mismo RestClient que BankCoreRestAdapter.
 * ADR-017 — Resilience4j aplicado en todas las llamadas al core.
 *
 * US-903/904 — FEAT-009 Sprint 11
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BillCoreAdapter implements BillPaymentPort {

    private final RestClient restClient;

    @Value("${bank.core.base-url}")
    private String baseUrl;

    @Value("${bank.core.api-key}")
    private String apiKey;

    @Override
    @CircuitBreaker(name = "bankCore", fallbackMethod = "fallbackPayment")
    @Retry(name = "bankCore")
    @TimeLimiter(name = "bankCore")
    public String executePayment(UUID sourceAccountId, BigDecimal amount,
                                 String concept, UUID idempotencyKey) {
        var response = restClient.post()
                .uri(baseUrl + "/core/v1/bills/pay")
                .header("X-API-Key", apiKey)
                .header("X-Idempotency-Key", idempotencyKey.toString())
                .body(Map.of(
                        "sourceAccountId", sourceAccountId,
                        "amount", amount,
                        "concept", concept
                ))
                .retrieve()
                .body(CorePaymentResponse.class);

        log.info("[US-903/904] Bill payment OK: txnId={} amount={}", response.transactionId(), amount);
        return response.transactionId();
    }

    @SuppressWarnings("unused")
    public String fallbackPayment(UUID srcId, BigDecimal amount, String concept,
                                  UUID idempotencyKey, Exception ex) {
        log.error("[US-903/904] Circuit OPEN — bill payment fallback: {}", ex.getMessage());
        throw new BillCoreUnavailableException();
    }

    @Override
    @CircuitBreaker(name = "bankCore", fallbackMethod = "fallbackLookup")
    @Retry(name = "bankCore")
    @TimeLimiter(name = "bankCore")
    public BillLookupResult lookupBill(String reference) {
        var response = restClient.post()
                .uri(baseUrl + "/core/v1/bills/lookup")
                .header("X-API-Key", apiKey)
                .body(Map.of("reference", reference))
                .retrieve()
                .body(CoreLookupResponse.class);

        return new BillLookupResult(
                response.billId(),
                response.issuer(),
                response.concept(),
                response.amount(),
                response.expiryDate()
        ); // DEBT-018: BillLookupResult es ahora top-level en domain
    }

    @SuppressWarnings("unused")
    public BillLookupResult fallbackLookup(String reference, Exception ex) {
        log.error("[US-904] Circuit OPEN — bill lookup fallback: {}", ex.getMessage());
        throw new BillCoreUnavailableException();
    }

    // ── Records internos ──────────────────────────────────────────────────────

    private record CorePaymentResponse(String transactionId, String status) {}

    private record CoreLookupResponse(String billId, String issuer, String concept,
                                      BigDecimal amount, String expiryDate) {}

    // ── Excepción ─────────────────────────────────────────────────────────────

    public static class BillCoreUnavailableException extends RuntimeException {
        public BillCoreUnavailableException() {
            super("Core bancario no disponible para pago de facturas");
        }

        public String getErrorCode() { return "CORE_CIRCUIT_OPEN"; }
    }
}
