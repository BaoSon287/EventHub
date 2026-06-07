package com.eventhub.user.service;

import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.user.dto.CreateUserProfileRequest;
import com.eventhub.user.dto.UpdateUserProfileRequest;
import com.eventhub.user.entity.UserProfile;
import com.eventhub.user.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

@Service
public class UserProfileService {
    private final UserProfileRepository repository;

    public UserProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    public UserProfile getById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
    }

    public UserProfile getByAuthUserId(Long authUserId) {
        return repository.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));
    }

    public UserProfile create(CreateUserProfileRequest request) {
        if (repository.existsByAuthUserId(request.authUserId())) {
            throw new BadRequestException("Auth user profile already exists");
        }
        if (repository.existsByEmail(request.email())) {
            throw new BadRequestException("Email profile already exists");
        }
        return repository.save(UserProfile.builder()
                .authUserId(request.authUserId())
                .email(request.email())
                .fullName(request.fullName())
                .phone(request.phone())
                .build());
    }

    public UserProfile update(Long id, UpdateUserProfileRequest request) {
        UserProfile profile = getById(id);
        profile.setFullName(request.fullName());
        profile.setPhone(request.phone());
        profile.setAvatarUrl(request.avatarUrl());
        profile.setBio(request.bio());
        return repository.save(profile);
    }
}
