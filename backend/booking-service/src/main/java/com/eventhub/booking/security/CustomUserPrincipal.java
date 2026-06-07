package com.eventhub.booking.security;

public record CustomUserPrincipal(Long userId, String email, String role) {
    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isOrganizer() {
        return "ORGANIZER".equals(role);
    }
}
