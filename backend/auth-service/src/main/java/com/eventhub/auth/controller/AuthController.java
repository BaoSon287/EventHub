package com.eventhub.auth.controller;

import com.eventhub.auth.dto.AuthResponse;
import com.eventhub.auth.dto.CurrentUserResponse;
import com.eventhub.auth.dto.ForgotPasswordRequest;
import com.eventhub.auth.dto.LoginResponse;
import com.eventhub.auth.dto.LoginRequest;
import com.eventhub.auth.dto.RegisterRequest;
import com.eventhub.auth.dto.ResetPasswordRequest;
import com.eventhub.auth.security.CustomUserDetails;
import com.eventhub.auth.service.AuthService;
import com.eventhub.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Auth service is running", "OK");
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Register successfully. Please check your email to verify your account.", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login successfully", authService.login(request));
    }

    @GetMapping("/verify-email")
    public ApiResponse<Void> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ApiResponse.success("Email verified successfully", null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.success("If this email exists, a reset link has been sent.", null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success("Password reset successfully", null);
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(@AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.success("Get current user successfully", authService.getCurrentUser(principal.getUsername()));
    }
}
