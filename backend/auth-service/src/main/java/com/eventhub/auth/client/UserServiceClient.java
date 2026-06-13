package com.eventhub.auth.client;

import com.eventhub.auth.config.InternalFeignConfig;
import com.eventhub.auth.dto.CreateUserProfileRequest;
import com.eventhub.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "user-service", url = "${USER_SERVICE_URL:http://user-service:8082}", configuration = InternalFeignConfig.class)
public interface UserServiceClient {
    @PostMapping("/api/users")
    ApiResponse<Object> createProfile(@RequestBody CreateUserProfileRequest request);
}
