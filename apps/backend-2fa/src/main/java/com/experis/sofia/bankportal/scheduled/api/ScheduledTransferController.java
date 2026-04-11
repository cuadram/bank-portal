package com.experis.sofia.bankportal.scheduled.api;

import com.experis.sofia.bankportal.scheduled.application.dto.*;
import com.experis.sofia.bankportal.scheduled.application.usecase.*;
import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransferStatus;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller — Transferencias Programadas (FEAT-015).
 *
 * Endpoints:
 *   POST   /v1/scheduled-transfers           → crear
 *   GET    /v1/scheduled-transfers           → listar (con filtro status opcional)
 *   GET    /v1/scheduled-transfers/{id}      → detalle
 *   PATCH  /v1/scheduled-transfers/{id}/pause   → pausar
 *   PATCH  /v1/scheduled-transfers/{id}/resume  → reanudar
 *   DELETE /v1/scheduled-transfers/{id}         → cancelar
 *   GET    /v1/scheduled-transfers/{id}/executions → historial
 *
 * Nota: Las anotaciones Spring (@RestController, @RequestMapping, @PreAuthorize,
 * @AuthenticationPrincipal) se añaden en el adaptador Spring del módulo infra.
 * Este controller es POJO puro para mantener la capa de aplicación independiente
 * del framework (Clean Architecture — TS SP 1.1).
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public class ScheduledTransferController {

    private final CreateScheduledTransferUseCase  createUC;
    private final UpdateScheduledTransferUseCase  updateUC;
    private final GetScheduledTransfersUseCase    getUC;
    private final GetScheduledTransferExecutionsUseCase executionsUC;

    public ScheduledTransferController(CreateScheduledTransferUseCase createUC,
                                       UpdateScheduledTransferUseCase updateUC,
                                       GetScheduledTransfersUseCase getUC,
                                       GetScheduledTransferExecutionsUseCase executionsUC) {
        this.createUC     = createUC;
        this.updateUC     = updateUC;
        this.getUC        = getUC;
        this.executionsUC = executionsUC;
    }

    // POST /v1/scheduled-transfers
    public ScheduledTransferResponse create(UUID userId, CreateScheduledTransferRequest req) {
        return createUC.execute(userId, req);
    }

    // GET /v1/scheduled-transfers?status=ACTIVE
    public List<ScheduledTransferResponse> list(UUID userId, String status) {
        if (status != null) {
            return getUC.getByStatus(userId, ScheduledTransferStatus.valueOf(status));
        }
        return getUC.getAll(userId);
    }

    // GET /v1/scheduled-transfers/{id}
    public ScheduledTransferResponse getById(UUID userId, UUID id) {
        return getUC.getById(userId, id);
    }

    // PATCH /v1/scheduled-transfers/{id}/pause
    public ScheduledTransferResponse pause(UUID userId, UUID id) {
        return updateUC.pause(userId, id);
    }

    // PATCH /v1/scheduled-transfers/{id}/resume
    public ScheduledTransferResponse resume(UUID userId, UUID id) {
        return updateUC.resume(userId, id);
    }

    // DELETE /v1/scheduled-transfers/{id}
    public ScheduledTransferResponse cancel(UUID userId, UUID id) {
        return updateUC.cancel(userId, id);
    }

    // GET /v1/scheduled-transfers/{id}/executions
    public List<ScheduledTransferExecutionResponse> executions(UUID userId, UUID id) {
        return executionsUC.getExecutions(userId, id);
    }
}
