package com.experis.sofia.bankportal.bill.api;

import com.experis.sofia.bankportal.bill.application.BillLookupAndPayUseCase;
import com.experis.sofia.bankportal.bill.application.BillPaymentUseCase;
import com.experis.sofia.bankportal.bill.application.dto.BillDto;
import com.experis.sofia.bankportal.bill.application.dto.PayBillCommand;
import com.experis.sofia.bankportal.bill.application.dto.PayInvoiceCommand;
import com.experis.sofia.bankportal.bill.application.dto.PaymentResultDto;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort.BillLookupResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller — Pagos de servicios (recibos y facturas).
 * US-903 / US-904 — FEAT-009 Sprint 11
 *
 * Endpoints:
 *   GET  /api/v1/bills                   → listar recibos domiciliados PENDING
 *   POST /api/v1/bills/{id}/pay          → pagar recibo con OTP
 *   GET  /api/v1/bills/lookup?reference= → buscar factura por referencia
 *   POST /api/v1/bills/pay               → pagar factura con referencia + OTP
 *
 * @author SOFIA Developer Agent
 */
@Validated
@RestController
@RequestMapping("/api/v1/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillPaymentUseCase billPaymentUseCase;
    private final BillLookupAndPayUseCase billLookupAndPayUseCase;

    /**
     * GET /api/v1/bills
     * Lista los recibos domiciliados PENDING del usuario autenticado.
     */
    @GetMapping
    public ResponseEntity<List<BillDto>> listPending(
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(billPaymentUseCase.listPending(userId));
    }

    /**
     * POST /api/v1/bills/{id}/pay
     * Paga un recibo domiciliado con confirmación OTP (PSD2 SCA).
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<PaymentResultDto> payBill(
            @PathVariable UUID id,
            @Valid @RequestBody PayBillCommand cmd,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(billPaymentUseCase.pay(userId, id, cmd));
    }

    /**
     * GET /api/v1/bills/lookup?reference={20digits}
     * Consulta los datos de una factura por referencia en el core bancario.
     */
    @GetMapping("/lookup")
    public ResponseEntity<BillLookupResult> lookupBill(
            @RequestParam
            @Pattern(regexp = "\\d{20}", message = "La referencia debe tener exactamente 20 dígitos")
            String reference) {

        return ResponseEntity.ok(billLookupAndPayUseCase.lookup(reference));
    }

    /**
     * POST /api/v1/bills/pay
     * Paga una factura con referencia y confirmación OTP (PSD2 SCA).
     */
    @PostMapping("/pay")
    public ResponseEntity<PaymentResultDto> payInvoice(
            @Valid @RequestBody PayInvoiceCommand cmd,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(billLookupAndPayUseCase.pay(userId, cmd));
    }
}
