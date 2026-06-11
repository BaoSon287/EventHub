package com.eventhub.user.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.user.dto.AvatarUploadResponse;
import com.eventhub.user.dto.CreateUserProfileRequest;
import com.eventhub.user.dto.UpdateUserProfileRequest;
import com.eventhub.user.entity.UserProfile;
import com.eventhub.user.security.CustomUserPrincipal;
import com.eventhub.user.security.InternalApiKeyValidator;
import com.eventhub.user.service.AvatarStorageService;
import com.eventhub.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {
    private final UserProfileService service;
    private final AvatarStorageService avatarStorageService;
    private final InternalApiKeyValidator internalApiKeyValidator;

    public UserProfileController(
            UserProfileService service,
            AvatarStorageService avatarStorageService,
            InternalApiKeyValidator internalApiKeyValidator
    ) {
        this.service = service;
        this.avatarStorageService = avatarStorageService;
        this.internalApiKeyValidator = internalApiKeyValidator;
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("User service is running", "OK");
    }

    @GetMapping("/{id}")
    public ApiResponse<UserProfile> getById(@PathVariable("id") Long id, @AuthenticationPrincipal CustomUserPrincipal principal) {
        UserProfile profile = service.getById(id);
        requireOwnerOrAdmin(profile.getAuthUserId(), principal);
        return ApiResponse.success("User profile found", profile);
    }

    @GetMapping("/auth/{authUserId}")
    public ApiResponse<UserProfile> getByAuthUserId(
            @PathVariable("authUserId") Long authUserId,
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

    @PostMapping("/me")
    public ApiResponse<UserProfile> upsertCurrentUser(
            @Valid @RequestBody UpdateUserProfileRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        if (principal == null) {
            throw new AccessDeniedException("Authenticated user is required");
        }
        return ApiResponse.success("User profile saved", service.upsertCurrentUser(principal, request));
    }

    @PostMapping("/avatar/upload")
    public ApiResponse<AvatarUploadResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        if (principal == null) {
            throw new AccessDeniedException("Authenticated user is required");
        }
        return ApiResponse.success("Avatar uploaded", avatarStorageService.store(file, principal.userId()));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserProfile> update(
            @PathVariable("id") Long id,
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
