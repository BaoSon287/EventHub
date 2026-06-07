package com.eventhub.payment.security;

public record CustomUserPrincipal(Long userId, String email, String role) {
    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
