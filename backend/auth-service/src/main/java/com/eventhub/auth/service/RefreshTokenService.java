package com.eventhub.auth.service;

import com.eventhub.auth.entity.RefreshToken;
import com.eventhub.auth.repository.RefreshTokenRepository;
import com.eventhub.common.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RefreshTokenService {
    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final int REFRESH_TOKEN_DAYS = 7;

    private final RefreshTokenRepository repository;

    public RefreshTokenService(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public String createRefreshToken(Long userId) {
        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);
        
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_DAYS))
                .revoked(false)
                .build();
        
        repository.save(refreshToken);
        log.info("SECURITY_AUDIT action=REFRESH_TOKEN_CREATED userId={}", userId);
        return rawToken;
    }

    @Transactional
    public void revokeToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        repository.findByTokenHashAndRevokedFalseAndExpiresAtAfter(tokenHash, LocalDateTime.now())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    repository.save(token);
                    log.info("SECURITY_AUDIT action=REFRESH_TOKEN_REVOKED userId={}", token.getUserId());
                });
    }

    @Transactional
    public void revokeAllTokensForUser(Long userId) {
        long count = repository.deleteByUserIdAndRevokedFalse(userId);
        log.info("SECURITY_AUDIT action=REFRESH_TOKENS_REVOKED_ALL userId={}, count={}", userId, count);
    }

    public boolean isTokenValid(String rawToken) {
        String tokenHash = hashToken(rawToken);
        return repository.findByTokenHashAndRevokedFalseAndExpiresAtAfter(tokenHash, LocalDateTime.now())
                .map(token -> {
                    if (token.isExpired()) {
                        log.warn("SECURITY_AUDIT action=REFRESH_TOKEN_EXPIRED userId={}", token.getUserId());
                        return false;
                    }
                    return true;
                })
                .orElse(false);
    }

    public Long getUserIdFromToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        return repository.findByTokenHashAndRevokedFalseAndExpiresAtAfter(tokenHash, LocalDateTime.now())
                .map(RefreshToken::getUserId)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
    }

    public void cleanupExpiredTokens() {
        List<RefreshToken> expired = repository.findAll()
                .stream()
                .filter(RefreshToken::isExpired)
                .toList();
        
        for (RefreshToken token : expired) {
            repository.delete(token);
        }
        
        if (!expired.isEmpty()) {
            log.info("Cleaned up {} expired refresh tokens", expired.size());
        }
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return bytesToHex(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to hash refresh token", ex);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}