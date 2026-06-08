package com.eventhub.user.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {
    private final SecretKey secretKey;

    public JwtService(@Value("${eventhub.jwt.secret}") String secret) {
        this.secretKey = createKey(secret);
    }

    public CustomUserPrincipal parsePrincipal(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Long userId = ((Number) claims.get("userId")).longValue();
        String email = claims.get("email", String.class);
        String role = claims.get("role", String.class);
        return new CustomUserPrincipal(userId, email, role);
    }

    private SecretKey createKey(String secret) {
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        } catch (RuntimeException ignored) {
            return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
    }
}
