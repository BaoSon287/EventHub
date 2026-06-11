package com.eventhub.user.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.user.dto.CreateUserProfileRequest;
import com.eventhub.user.dto.UpdateUserProfileRequest;
import com.eventhub.user.entity.UserProfile;
import com.eventhub.user.security.CustomUserPrincipal;
import com.eventhub.user.security.InternalApiKeyValidator;
import com.eventhub.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {
    private final UserProfileService service;
    private final InternalApiKeyValidator internalApiKeyValidator;

    public UserProfileController(UserProfileService service, InternalApiKeyValidator internalApiKeyValidator) {
        this.service = service;
        this.internalApiKeyValidator = internalApiKeyValidator;
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("User service is running", "OK");
    }

    @GetMapping("/{id}")
    public ApiResponse<UserProfile> getById(@PathVariable Long id, @AuthenticationPrincipal CustomUserPrincipal principal) {
        UserProfile profile = service.getById(id);
        requireOwnerOrAdmin(profile.getAuthUserId(), principal);
        return ApiResponse.success("User profile found", profile);
    }

    @GetMapping("/auth/{authUserId}")
    public ApiResponse<UserProfile> getByAuthUserId(
            @PathVariable Long authUserId,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        requireOwnerOrAdmin(authUserId, principal);
        return ApiResponse.success("User profile found", service.getByAuthUserId(authUserId));
    }

    @PostMapping
    public ApiResponse<UserProfile> create(
            @Valid @RequestBody CreateUserProfileRequest request,
            @RequestHeader(name = "X-Internal-Api-Key", required = false) String internalApiKey
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        return ApiResponse.success("User profile created", service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserProfile> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserProfileRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        UserProfile profile = service.getById(id);
        requireOwnerOrAdmin(profile.getAuthUserId(), principal);
        return ApiResponse.success("User profile updated", service.update(id, request));
    }

    private void requireOwnerOrAdmin(Long authUserId, CustomUserPrincipal principal) {
        if (principal == null || (!principal.isAdmin() && !principal.userId().equals(authUserId))) {
            throw new AccessDeniedException("User can only access own profile");
        }
    }
}
