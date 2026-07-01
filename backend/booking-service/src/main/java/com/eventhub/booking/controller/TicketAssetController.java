package com.eventhub.booking.controller;

import com.eventhub.booking.dto.TicketAssetResponse;
import com.eventhub.booking.dto.TicketTransferHistoryResponse;
import com.eventhub.booking.security.CustomUserPrincipal;
import com.eventhub.booking.service.TicketOwnershipService;
import com.eventhub.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "TicketAssetController", description = "Ticket asset ownership APIs")
@RestController
@RequestMapping("/api/tickets")
public class TicketAssetController {
    private final TicketOwnershipService ticketOwnershipService;

    public TicketAssetController(TicketOwnershipService ticketOwnershipService) {
        this.ticketOwnershipService = ticketOwnershipService;
    }

    @Operation(summary = "Get current user's owned ticket assets")
    @GetMapping("/my")
    public ApiResponse<List<TicketAssetResponse>> findMine(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get my tickets successfully", ticketOwnershipService.findMine(principal.userId()));
    }

    @Operation(summary = "Get owned ticket asset details")
    @GetMapping("/{id}")
    public ApiResponse<TicketAssetResponse> findById(
            @PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        try {
            return ApiResponse.success("Get ticket successfully", ticketOwnershipService.findOwnedByAssetId(UUID.fromString(id), principal.userId()));
        } catch (IllegalArgumentException ignored) {
            return ApiResponse.success("Get ticket successfully", ticketOwnershipService.findOwnedByTicketId(Long.valueOf(id), principal.userId()));
        }
    }

    @Operation(summary = "Get ticket transfer history")
    @GetMapping("/{id}/history")
    public ApiResponse<List<TicketTransferHistoryResponse>> findHistory(
            @PathVariable("id") String id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        try {
            return ApiResponse.success("Get ticket history successfully", ticketOwnershipService.findHistoryByAssetId(UUID.fromString(id), principal.userId()));
        } catch (IllegalArgumentException ignored) {
            return ApiResponse.success("Get ticket history successfully", ticketOwnershipService.findHistoryByTicketId(Long.valueOf(id), principal.userId()));
        }
    }
}
