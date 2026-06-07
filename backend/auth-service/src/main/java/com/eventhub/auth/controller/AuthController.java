package com.eventhub.auth.controller;

import com.eventhub.auth.dto.AuthResponse;
import com.eventhub.auth.dto.LoginRequest;
import com.eventhub.auth.dto.RegisterRequest;
import com.eventhub.auth.service.AuthService;
import com.eventhub.common.dto.ApiResponse;
import jakarta.validation.Valid;
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
        return ApiResponse.success("Registered successfully", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Logged in successfully", authService.login(request));
    }
}
