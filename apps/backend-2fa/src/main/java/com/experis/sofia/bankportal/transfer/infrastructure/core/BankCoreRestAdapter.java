package com.experis.sofia.bankportal.transfer.infrastructure.core;

import com.experis.sofia.bankportal.transfer.domain.BankCoreTransferPort;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de infraestructura — integración con el core bancario real.
 * Implementa BankCoreTransferPort mediante llamadas HTTP REST.
 * Activo exclusivamente en perfil 'production'.
 *
 * Resiliencia (ADR-017):
 *   @TimeLimiter  → timeout 5s por llamada
 *   @Retry        → 2 reintentos con backoff 500ms (solo errores de red)
 *   @CircuitBreaker → abre al 50% de fallos en ventana de 10 llamadas
 *
 * Idempotencia: cada escritura incluye X-Idempotency-Key para evitar dobles cargos.
 *
 * US-901 / US-902 — FEAT-009 Sprint 11
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Component
@Profile("production")
@RequiredArgsConstructor
public class BankCoreRestAdapter implements BankCoreTransferPort {

    private final RestClient restClient;

    @Value("${bank.core.base-url}")
    private String baseUrl;

    @Value("${bank.core.api-key}")
    private String apiKey;

    // ── Transferencia entre cuentas propias ───────────────────────────────────

    @Override
    @CircuitBreaker(name = "bankCore", fallbackMethod = "fallbackOwnTransfer")
    @Retry(name = "bankCore")
    @TimeLimiter(name = "bankCore")
    public TransferResult executeOwnTransfer(UUID sourceAccountId, UUID targetAccountId,
                                             BigDecimal amount, String concept) {
        String idempotencyKey = UUID.randomUUID().toString();
        try {
            var response = restClient.post()
                    .uri(baseUrl + "/core/v1/transfers/own")
                    .header("X-API-Key", apiKey)
                    .header("X-Idempotency-Key", idempotencyKey)
                    .body(Map.of(
                            "sourceAccountId", sourceAccountId,
                            "targetAccountId", targetAccountId,
                            "amount", amount,
                            "concept", concept
                    ))
                    .retrieve()
                    .body(CoreTransferResponse.class);

            log.info("[US-901] Own transfer OK: txnId={} src={} amount={}",
                    response.transactionId(), sourceAccountId, amount);
            return new BankCoreTransferPort.TransferResult(true, response.sourceBalance(),
                    response.targetBalance(), null);

        } catch (HttpClientErrorException e) {
            log.error("[US-901] Core 4xx error: {} {}", e.getStatusCode(), e.getMessage());
            return new BankCoreTransferPort.TransferResult(false,
                    BigDecimal.ZERO, BigDecimal.ZERO, "CORE_CLIENT_ERROR");
        }
    }

    @SuppressWarnings("unused")
    public BankCoreTransferPort.TransferResult fallbackOwnTransfer(UUID src, UUID tgt,
                                              BigDecimal amt, String concept, Exception ex) {
        log.error("[US-901] Circuit OPEN — own transfer fallback: {}", ex.getMessage());
        return new BankCoreTransferPort.TransferResult(false,
                BigDecimal.ZERO, BigDecimal.ZERO, "CORE_CIRCUIT_OPEN");
    }

    // ── Transferencia a beneficiario externo (IBAN) ───────────────────────────

    @Override
    @CircuitBreaker(name = "bankCore", fallbackMethod = "fallbackExternalTransfer")
    @Retry(name = "bankCore")
    @TimeLimiter(name = "bankCore")
    public TransferResult executeExternalTransfer(UUID sourceAccountId, String targetIban,
                                                  BigDecimal amount, String concept) {
        String idempotencyKey = UUID.randomUUID().toString();
        try {
            var response = restClient.post()
                    .uri(baseUrl + "/core/v1/transfers/external")
                    .header("X-API-Key", apiKey)
                    .header("X-Idempotency-Key", idempotencyKey)
                    .body(Map.of(
                            "sourceAccountId", sourceAccountId,
                            "targetIban", targetIban,
                            "amount", amount,
                            "concept", concept
                    ))
                    .retrieve()
                    .body(CoreTransferResponse.class);

            log.info("[US-901] External transfer OK: txnId={} src={} iban=****{}",
                    response.transactionId(), sourceAccountId,
                    targetIban.substring(targetIban.length() - 4));
            return new BankCoreTransferPort.TransferResult(true,
                    response.sourceBalance(), BigDecimal.ZERO, null);

        } catch (HttpClientErrorException e) {
            log.error("[US-901] Core 4xx error (external): {} {}", e.getStatusCode(), e.getMessage());
            return new BankCoreTransferPort.TransferResult(false,
                    BigDecimal.ZERO, BigDecimal.ZERO, "CORE_CLIENT_ERROR");
        }
    }

    @SuppressWarnings("unused")
    public BankCoreTransferPort.TransferResult fallbackExternalTransfer(UUID src, String iban,
                                                   BigDecimal amt, String concept, Exception ex) {
        log.error("[US-901] Circuit OPEN — external transfer fallback: {}", ex.getMessage());
        return new BankCoreTransferPort.TransferResult(false,
                BigDecimal.ZERO, BigDecimal.ZERO, "CORE_CIRCUIT_OPEN");
    }

    // ── Consulta de saldo real ────────────────────────────────────────────────

    @Override
    @CircuitBreaker(name = "bankCore", fallbackMethod = "fallbackBalance")
    @Retry(name = "bankCore")
    @TimeLimiter(name = "bankCore")
    public BigDecimal getAvailableBalance(UUID accountId) {
        var response = restClient.get()
                .uri(baseUrl + "/core/v1/accounts/{id}/balance", accountId)
                .header("X-API-Key", apiKey)
                .retrieve()
                .body(CoreBalanceResponse.class);
        return response.available();
    }

    @SuppressWarnings("unused")
    public BigDecimal fallbackBalance(UUID accountId, Exception ex) {
        log.error("[US-901] Circuit OPEN — balance fallback: {}", ex.getMessage());
        throw new CoreUnavailableException("CORE_CIRCUIT_OPEN");
    }

    // ── Records internos ──────────────────────────────────────────────────────

    private record CoreTransferResponse(String transactionId,
                                        BigDecimal sourceBalance,
                                        BigDecimal targetBalance) {}

    private record CoreBalanceResponse(UUID accountId,
                                       BigDecimal available,
                                       BigDecimal retained) {}

    // ── Excepción de dominio ──────────────────────────────────────────────────

    public static class CoreUnavailableException extends RuntimeException {
        private final String errorCode;

        public CoreUnavailableException(String errorCode) {
            super("Core bancario no disponible: " + errorCode);
            this.errorCode = errorCode;
        }

        public String getErrorCode() { return errorCode; }
    }
}
