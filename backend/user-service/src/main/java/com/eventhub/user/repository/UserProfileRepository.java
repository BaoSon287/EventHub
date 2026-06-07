package com.eventhub.user.repository;

import com.eventhub.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByAuthUserId(Long authUserId);
    boolean existsByAuthUserId(Long authUserId);
    boolean existsByEmail(String email);
}
