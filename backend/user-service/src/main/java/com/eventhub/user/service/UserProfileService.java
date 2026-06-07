package com.eventhub.user.service;

import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.user.dto.UserProfileRequest;
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

    public UserProfile update(Long id, UserProfileRequest request) {
        UserProfile profile = getById(id);
        profile.setUserId(request.userId());
        profile.setFullName(request.fullName());
        profile.setEmail(request.email());
        profile.setPhone(request.phone());
        profile.setAvatarUrl(request.avatarUrl());
        return repository.save(profile);
    }
}
