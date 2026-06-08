package com.eventhub.user.security;

public record CustomUserPrincipal(Long userId, String email, String role) {
    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
