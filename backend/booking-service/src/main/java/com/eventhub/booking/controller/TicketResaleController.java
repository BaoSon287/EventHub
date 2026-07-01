package com.eventhub.booking.controller;

import com.eventhub.booking.dto.CreateResaleListingRequest;
import com.eventhub.booking.dto.ResaleListingResponse;
import com.eventhub.booking.dto.ResaleTicketDetailResponse;
import com.eventhub.booking.dto.ResaleTicketSummaryResponse;
import com.eventhub.booking.security.CustomUserPrincipal;
import com.eventhub.booking.service.TicketResaleService;
import com.eventhub.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "TicketResaleController", description = "Ticket resale marketplace APIs")
@RestController
public class TicketResaleController {
    private final TicketResaleService ticketResaleService;

    public TicketResaleController(TicketResaleService ticketResaleService) {
        this.ticketResaleService = ticketResaleService;
    }

    @Operation(summary = "List an owned ticket for resale")
    @PostMapping("/api/tickets/{ticketId}/resell")
    public ApiResponse<ResaleListingResponse> createListing(
            @PathVariable Long ticketId,
            @Valid @RequestBody CreateResaleListingRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Create resale listing successfully",
                ticketResaleService.createListing(ticketId, request.price(), principal.userId()));
    }

    @Operation(summary = "Get active resale ticket marketplace")
    @GetMapping("/api/resale-tickets")
    public ApiResponse<List<ResaleTicketSummaryResponse>> findMarketplace(
            @RequestParam(required = false) Long eventId,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ApiResponse.success("Get resale tickets successfully",
                ticketResaleService.findMarketplace(
                        eventId,
                        priceMin == null ? minPrice : priceMin,
                        priceMax == null ? maxPrice : priceMax,
                        date
                ));
    }

    @Operation(summary = "Get resale listing detail")
    @GetMapping("/api/resale-tickets/{listingId}")
    public ApiResponse<ResaleTicketDetailResponse> findListingDetail(@PathVariable UUID listingId) {
        return ApiResponse.success("Get resale listing successfully", ticketResaleService.findListingDetail(listingId));
    }

    @Operation(summary = "Purchase an active resale listing")
    @PostMapping("/api/resale-tickets/{listingId}/buy")
    public ApiResponse<ResaleListingResponse> purchaseListing(
            @PathVariable UUID listingId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Purchase resale ticket successfully",
                ticketResaleService.purchaseListing(listingId, principal.userId()));
    }

    @Operation(summary = "Cancel an active resale listing")
    @DeleteMapping("/api/resale-tickets/{listingId}")
    public ApiResponse<ResaleListingResponse> cancelListing(
            @PathVariable UUID listingId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Cancel resale listing successfully",
                ticketResaleService.cancelListing(listingId, principal.userId()));
    }
}
