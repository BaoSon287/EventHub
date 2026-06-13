package com.eventhub.auth.service;

import com.eventhub.auth.client.UserServiceClient;
import com.eventhub.auth.dto.AuthResponse;
import com.eventhub.auth.dto.CreateUserProfileRequest;
import com.eventhub.auth.dto.CurrentUserResponse;
import com.eventhub.auth.dto.ForgotPasswordRequest;
import com.eventhub.auth.dto.LoginResponse;
import com.eventhub.auth.dto.LoginRequest;
import com.eventhub.auth.dto.RegisterRequest;
import com.eventhub.auth.dto.ResetPasswordRequest;
import com.eventhub.auth.entity.AuthUser;
import com.eventhub.auth.entity.EmailVerificationToken;
import com.eventhub.auth.entity.PasswordResetToken;
import com.eventhub.auth.entity.UserRole;
import com.eventhub.auth.repository.AuthUserRepository;
import com.eventhub.auth.repository.EmailVerificationTokenRepository;
import com.eventhub.auth.repository.PasswordResetTokenRepository;
import com.eventhub.auth.security.JwtService;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ForbiddenException;
import com.eventhub.common.exception.ServiceUnavailableException;
import com.eventhub.common.exception.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final int EMAIL_VERIFICATION_HOURS = 24;
    private static final int PASSWORD_RESET_MINUTES = 15;

    private final AuthUserRepository repository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserServiceClient userServiceClient;
    private final EmailService emailService;

    public AuthService(
            AuthUserRepository repository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserServiceClient userServiceClient,
            EmailService emailService
    ) {
        this.repository = repository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userServiceClient = userServiceClient;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (repository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }

        UserRole role = resolveRole(request.role());
        AuthUser user = repository.save(AuthUser.builder()
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(request.phone())
                .role(role.name())
                .enabled(false)
                .emailVerified(false)
                .build());

        createUserProfileIfPossible(user);
        String verificationToken = createVerificationToken(user);
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationToken);
        } catch (Exception ex) {
            log.error("Verification email could not be sent for userId={}. cause={}", user.getId(), rootCauseMessage(ex));
            throw new ServiceUnavailableException("Verification email could not be sent. Please check SMTP configuration.");
        }
        log.info("SECURITY_AUDIT action=REGISTER_SUCCESS userId={} role={}", user.getId(), user.getRole());
        return toAuthResponse(user);
    }

    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        AuthUser user = repository.findByEmail(email)
                .orElseThrow(() -> {
                    log.info("SECURITY_AUDIT action=LOGIN_FAILED email={}", email);
                    return new UnauthorizedException("Invalid email or password");
                });
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            log.info("SECURITY_AUDIT action=LOGIN_FAILED userId={} role={}", user.getId(), user.getRole());
            throw new UnauthorizedException("Invalid email or password");
        }
        if (!canLogin(user)) {
            log.info("SECURITY_AUDIT action=LOGIN_BLOCKED_EMAIL_NOT_VERIFIED userId={} role={}", user.getId(), user.getRole());
            throw new ForbiddenException("Please verify your email before logging in.");
        }
        log.info("SECURITY_AUDIT action=LOGIN_SUCCESS userId={} role={}", user.getId(), user.getRole());
        return new LoginResponse(jwtService.generateToken(user), toAuthResponse(user));
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));
        if (verificationToken.isUsed()) {
            throw new BadRequestException("Verification token has already been used");
        }
        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        AuthUser user = verificationToken.getUser();
        user.setEmailVerified(true);
        user.setEnabled(true);
        verificationToken.setUsed(true);
        log.info("SECURITY_AUDIT action=EMAIL_VERIFIED userId={} role={}", user.getId(), user.getRole());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        repository.findByEmail(email).ifPresent(user -> {
            String token = createPasswordResetToken(user);
            try {
                emailService.sendPasswordResetEmail(user.getEmail(), token);
            } catch (Exception ex) {
                log.error("Password reset email could not be sent for userId={}. cause={}", user.getId(), rootCauseMessage(ex));
                throw new ServiceUnavailableException("Password reset email could not be sent. Please check SMTP configuration.");
            }
            log.info("SECURITY_AUDIT action=PASSWORD_RESET_REQUESTED userId={} role={}", user.getId(), user.getRole());
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Password confirmation does not match");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new BadRequestException("Invalid password reset token"));
        if (resetToken.isUsed()) {
            throw new BadRequestException("Password reset token has already been used");
        }
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Password reset token has expired");
        }

        AuthUser user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        resetToken.setUsed(true);
        log.info("SECURITY_AUDIT action=PASSWORD_RESET_COMPLETED userId={} role={}", user.getId(), user.getRole());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public CurrentUserResponse getCurrentUser(String email) {
        AuthUser user = repository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Current user not found"));
        return new CurrentUserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(), user.getRole());
    }

    private void createUserProfileIfPossible(AuthUser user) {
        try {
            userServiceClient.createProfile(new CreateUserProfileRequest(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getPhone()
            ));
        } catch (Exception ex) {
            log.warn(
                    "User profile was not created during registration for authUserId={}. It can be synchronized later. cause={}",
                    user.getId(),
                    ex.toString()
            );
        }
    }

    private UserRole resolveRole(String role) {
        if (role == null || role.isBlank()) {
            return UserRole.USER;
        }
        try {
            UserRole resolvedRole = UserRole.valueOf(role.trim().toUpperCase());
            if (resolvedRole == UserRole.ADMIN) {
                throw new BadRequestException("Public registration cannot create ADMIN accounts");
            }
            return resolvedRole;
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid role. Allowed roles: USER, ORGANIZER");
        }
    }

    private AuthResponse toAuthResponse(AuthUser user) {
        return new AuthResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }

    private boolean canLogin(AuthUser user) {
        if (!user.isEnabled()) {
            return false;
        }
        return !Boolean.FALSE.equals(user.getEmailVerified());
    }

    private String createVerificationToken(AuthUser user) {
        EmailVerificationToken token = emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                .token(generateToken())
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(EMAIL_VERIFICATION_HOURS))
                .used(false)
                .build());
        return token.getToken();
    }

    private String createPasswordResetToken(AuthUser user) {
        PasswordResetToken token = passwordResetTokenRepository.save(PasswordResetToken.builder()
                .token(generateToken())
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(PASSWORD_RESET_MINUTES))
                .used(false)
                .build());
        return token.getToken();
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String rootCauseMessage(Exception exception) {
        Throwable root = exception;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getClass().getSimpleName() + ": " + root.getMessage();
    }
}
