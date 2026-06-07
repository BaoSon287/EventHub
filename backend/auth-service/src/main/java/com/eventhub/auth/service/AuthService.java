package com.eventhub.auth.service;

import com.eventhub.auth.client.UserServiceClient;
import com.eventhub.auth.dto.AuthResponse;
import com.eventhub.auth.dto.CreateUserProfileRequest;
import com.eventhub.auth.dto.CurrentUserResponse;
import com.eventhub.auth.dto.LoginResponse;
import com.eventhub.auth.dto.LoginRequest;
import com.eventhub.auth.dto.RegisterRequest;
import com.eventhub.auth.entity.AuthUser;
import com.eventhub.auth.entity.UserRole;
import com.eventhub.auth.repository.AuthUserRepository;
import com.eventhub.auth.security.JwtService;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AuthUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserServiceClient userServiceClient;

    public AuthService(
            AuthUserRepository repository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserServiceClient userServiceClient
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userServiceClient = userServiceClient;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already registered");
        }

        UserRole role = resolveRole(request.role());
        AuthUser user = repository.save(AuthUser.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(role.name())
                .enabled(true)
                .build());

        createUserProfile(user);
        return toAuthResponse(user);
    }

    public LoginResponse login(LoginRequest request) {
        AuthUser user = repository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return new LoginResponse(jwtService.generateToken(user), toAuthResponse(user));
    }

    public CurrentUserResponse getCurrentUser(String email) {
        AuthUser user = repository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Current user not found"));
        return new CurrentUserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(), user.getRole());
    }

    private void createUserProfile(AuthUser user) {
        try {
            userServiceClient.createProfile(new CreateUserProfileRequest(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getPhone()
            ));
        } catch (Exception ex) {
            log.error("Failed to create user profile for authUserId={}", user.getId(), ex);
            throw new BadRequestException("Register failed because user profile could not be created");
        }
    }

    private UserRole resolveRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.USER;
        }
        try {
            return UserRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid role. Allowed roles: USER, ORGANIZER, ADMIN");
        }
    }

    private AuthResponse toAuthResponse(AuthUser user) {
        return new AuthResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
