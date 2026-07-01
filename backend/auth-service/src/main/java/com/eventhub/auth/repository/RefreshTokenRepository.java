package com.eventhub.auth.repository;

import com.eventhub.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHashAndRevokedFalseAndExpiresAtAfter(String tokenHash, LocalDateTime now);
    
    List<RefreshToken> findByUserIdAndRevokedFalse(Long userId);
    
    long deleteByUserIdAndRevokedFalse(Long userId);
}