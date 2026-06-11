package com.eventhub.auth.config;

import com.eventhub.auth.client.UserServiceClient;
import com.eventhub.auth.dto.CreateUserProfileRequest;
import com.eventhub.auth.entity.AuthUser;
import com.eventhub.auth.entity.UserRole;
import com.eventhub.auth.repository.AuthUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DemoAuthUserSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoAuthUserSeeder.class);
    private static final String DEMO_PASSWORD = "Password123";

    private final AuthUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final UserServiceClient userServiceClient;

    public DemoAuthUserSeeder(
            AuthUserRepository repository,
            PasswordEncoder passwordEncoder,
            UserServiceClient userServiceClient
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.userServiceClient = userServiceClient;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed("user@example.com", "Demo User", UserRole.USER);
        seed("organizer@example.com", "Demo Organizer", UserRole.ORGANIZER);
        seed("admin@example.com", "Demo Admin", UserRole.ADMIN);
    }

    private void seed(String email, String fullName, UserRole role) {
        AuthUser user = repository.findByEmail(email).orElseGet(() -> {
            AuthUser created = repository.save(AuthUser.builder()
                    .email(email)
                    .password(passwordEncoder.encode(DEMO_PASSWORD))
                    .fullName(fullName)
                    .role(role.name())
                    .enabled(true)
                    .build());
            log.info("Seeded demo auth user email={} role={}", email, role);
            return created;
        });

        createProfileIfPossible(user);
    }

    private void createProfileIfPossible(AuthUser user) {
        try {
            userServiceClient.createProfile(new CreateUserProfileRequest(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getPhone()
            ));
        } catch (Exception ex) {
            log.warn("Demo user profile was not created or already exists for email={}", user.getEmail());
        }
    }
}
