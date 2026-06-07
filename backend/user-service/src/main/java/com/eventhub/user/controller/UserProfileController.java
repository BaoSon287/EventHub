package com.eventhub.user.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.user.dto.CreateUserProfileRequest;
import com.eventhub.user.dto.UpdateUserProfileRequest;
import com.eventhub.user.entity.UserProfile;
import com.eventhub.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {
    private final UserProfileService service;

    public UserProfileController(UserProfileService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("User service is running", "OK");
    }

    @GetMapping("/{id}")
    public ApiResponse<UserProfile> getById(@PathVariable Long id) {
        return ApiResponse.success("User profile found", service.getById(id));
    }

    @GetMapping("/auth/{authUserId}")
    public ApiResponse<UserProfile> getByAuthUserId(@PathVariable Long authUserId) {
        return ApiResponse.success("User profile found", service.getByAuthUserId(authUserId));
    }

    @PostMapping
    public ApiResponse<UserProfile> create(@Valid @RequestBody CreateUserProfileRequest request) {
        return ApiResponse.success("User profile created", service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserProfile> update(@PathVariable Long id, @Valid @RequestBody UpdateUserProfileRequest request) {
        return ApiResponse.success("User profile updated", service.update(id, request));
    }
}
