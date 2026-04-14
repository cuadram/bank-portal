package com.experis.sofia.bankportal.bizum.api;
import com.experis.sofia.bankportal.bizum.application.dto.*;
import com.experis.sofia.bankportal.bizum.application.usecase.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bizum")
public class BizumController {
    private final ActivateBizumUseCase activateUC;
    private final SendPaymentUseCase sendUC;
    private final RequestMoneyUseCase requestUC;
    private final AcceptRequestUseCase acceptUC;
    private final RejectRequestUseCase rejectUC;
    private final ListTransactionsUseCase listUC;

    public BizumController(ActivateBizumUseCase a, SendPaymentUseCase s,
        RequestMoneyUseCase r, AcceptRequestUseCase ac, RejectRequestUseCase re,
        ListTransactionsUseCase l) {
        this.activateUC=a; this.sendUC=s; this.requestUC=r;
        this.acceptUC=ac; this.rejectUC=re; this.listUC=l;
    }

    /** US-F022-01: Activar Bizum */
    @PostMapping("/activate")
    public ResponseEntity<ActivateBizumResponse> activate(
            @RequestBody ActivateBizumRequest req, HttpServletRequest http) {
        UUID userId = (UUID) http.getAttribute("authenticatedUserId"); // LA-TEST-001
        return ResponseEntity.created(URI.create("/api/v1/bizum/status"))
            .body(activateUC.execute(userId, req));
    }

    /** US-F022-02: Enviar pago — SCA OTP obligatorio */
    @PostMapping("/payments")
    public ResponseEntity<SendPaymentResponse> sendPayment(
            @RequestBody SendPaymentRequest req, HttpServletRequest http) {
        UUID userId = (UUID) http.getAttribute("authenticatedUserId");
        return ResponseEntity.status(201).body(sendUC.execute(userId, req));
    }

    /** US-F022-03: Solicitar dinero */
    @PostMapping("/requests")
    public ResponseEntity<RequestMoneyResponse> requestMoney(
            @RequestBody RequestMoneyRequest req, HttpServletRequest http) {
        UUID userId = (UUID) http.getAttribute("authenticatedUserId");
        return ResponseEntity.status(201).body(requestUC.execute(userId, req));
    }

    /** US-F022-04: Aceptar o rechazar solicitud */
    @PatchMapping("/requests/{id}")
    public ResponseEntity<Void> resolveRequest(
            @PathVariable UUID id, @RequestBody ResolveRequestRequest req,
            HttpServletRequest http) {
        UUID userId = (UUID) http.getAttribute("authenticatedUserId");
        if ("ACCEPTED".equals(req.action())) acceptUC.execute(userId, id, req.otp());
        else rejectUC.execute(userId, id);
        return ResponseEntity.ok().build();
    }

    /** US-F022-05: Historial paginado */
    @GetMapping("/transactions")
    public ResponseEntity<List<BizumTransactionDTO>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest http) {
        UUID userId = (UUID) http.getAttribute("authenticatedUserId");
        return ResponseEntity.ok(listUC.execute(userId, page, size));
    }
}
