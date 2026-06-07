package com.eventhub.auth.service;

import com.eventhub.auth.dto.AuthResponse;
import com.eventhub.auth.dto.LoginRequest;
import com.eventhub.auth.dto.RegisterRequest;
import com.eventhub.auth.entity.AuthUser;
import com.eventhub.auth.repository.AuthUserRepository;
import com.eventhub.auth.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AuthUserRepository repository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }
        AuthUser user = repository.save(AuthUser.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role("USER")
                .build());
        return new AuthResponse(user.getId(), user.getEmail(), jwtService.generateToken(user));
    }

    public AuthResponse login(LoginRequest request) {
        AuthUser user = repository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return new AuthResponse(user.getId(), user.getEmail(), jwtService.generateToken(user));
    }
}
