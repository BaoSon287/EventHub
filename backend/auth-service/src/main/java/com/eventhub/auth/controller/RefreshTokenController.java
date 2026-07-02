package com.eventhub.auth.controller;

import com.eventhub.auth.dto.AuthResponse;
import com.eventhub.auth.dto.LoginRequest;
import com.eventhub.auth.dto.LoginResponse;
import com.eventhub.auth.security.CustomUserDetails;
import com.eventhub.auth.service.AuthService;
import com.eventhub.auth.service.RefreshTokenService;
import com.eventhub.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class RefreshTokenController {
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    public RefreshTokenController(AuthService authService, RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@RequestBody LoginRequest request) {
        String refreshToken = request.refreshToken();
        
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Refresh token is required", null));
        }

        if (!refreshTokenService.isTokenValid(refreshToken)) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Invalid or expired refresh token", null));
        }

        Long userId = refreshTokenService.getUserIdFromToken(refreshToken);
        AuthResponse user = authService.getCurrentUserById(userId);

        // Revoke old token and create new one (rotation)
        refreshTokenService.revokeToken(refreshToken);
        String newRefreshToken = refreshTokenService.createRefreshToken(userId);

        String newAccessToken = authService.generateTokenForUser(userId);

        LoginResponse response = new LoginResponse(
                newAccessToken,
                newRefreshToken,
                user
        );

        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal CustomUserDetails principal) {
        if (principal != null) {
            refreshTokenService.revokeAllTokensForUser(principal.getUserId());
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}