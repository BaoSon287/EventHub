package com.eventhub.auth.client;

import com.eventhub.auth.dto.CreateUserProfileRequest;
import com.eventhub.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "user-service")
public interface UserServiceClient {
    @PostMapping("/api/users")
    ApiResponse<Object> createProfile(@RequestBody CreateUserProfileRequest request);
}
