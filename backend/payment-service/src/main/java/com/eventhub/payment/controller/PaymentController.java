package com.eventhub.payment.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.payment.dto.CreatePaymentRequest;
import com.eventhub.payment.dto.MockPaymentResultRequest;
import com.eventhub.payment.dto.PaymentPageResponse;
import com.eventhub.payment.dto.PaymentResponse;
import com.eventhub.payment.enums.PaymentTransactionStatus;
import com.eventhub.payment.security.CustomUserPrincipal;
import com.eventhub.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "PaymentController", description = "Payment APIs, mock payment flow, and user payment history")
@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @Operation(summary = "Payment service health check")
    @GetMapping("/health")
    public ApiResponse<Void> health() {
        return ApiResponse.success("Payment service is running", null);
    }

    @Operation(summary = "Create payment transaction for a booking")
    @PostMapping
    public ApiResponse<PaymentResponse> create(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Create payment successfully", service.create(request, principal));
    }

    @Operation(summary = "Get payment details")
    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> findById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get payment successfully", service.findById(id, principal));
    }

    @Operation(summary = "Get payment by code")
    @GetMapping("/code/{paymentCode}")
    public ApiResponse<PaymentResponse> findByPaymentCode(
            @PathVariable("paymentCode") String paymentCode,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get payment successfully", service.findByPaymentCode(paymentCode, principal));
    }

    @Operation(summary = "Get current user's payments")
    @GetMapping("/me")
    public ApiResponse<PaymentPageResponse> findMine(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) PaymentTransactionStatus status,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get my payments successfully", service.findMine(page, size, status, principal));
    }

    @Operation(summary = "Get payments by booking")
    @GetMapping("/booking/{bookingId}")
    public ApiResponse<PaymentPageResponse> findByBookingId(
            @PathVariable("bookingId") Long bookingId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get booking payments successfully", service.findByBookingId(bookingId, page, size, principal));
    }

    @Operation(summary = "Mock successful payment")
    @PatchMapping("/{id}/mock-success")
    public ApiResponse<PaymentResponse> mockSuccess(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Mock payment success successfully", service.mockSuccess(id, principal));
    }

    @Operation(summary = "Mock failed payment")
    @PatchMapping("/{id}/mock-fail")
    public ApiResponse<PaymentResponse> mockFail(
            @PathVariable("id") Long id,
            @Valid @RequestBody MockPaymentResultRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Mock payment fail successfully", service.mockFail(id, request, principal));
    }

    @Operation(summary = "Cancel pending payment")
    @PatchMapping("/{id}/cancel")
    public ApiResponse<PaymentResponse> cancel(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Cancel payment successfully", service.cancel(id, principal));
    }
}
