package com.eventhub.notification.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey secretKey;

    public JwtService(@Value("${eventhub.jwt.secret}") String secret) {
        this.secretKey = createKey(secret);
    }

    public CustomUserPrincipal parsePrincipal(String token) {
        Claims claims = claims(token);
        if (claims.getExpiration().before(new Date())) {
            throw new IllegalArgumentException("Token expired");
        }
        return new CustomUserPrincipal(
                ((Number) claims.get("userId")).longValue(),
                claims.get("email", String.class),
                claims.get("role", String.class)
        );
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey createKey(String secret) {
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        } catch (RuntimeException ignored) {
            return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
    }
}
