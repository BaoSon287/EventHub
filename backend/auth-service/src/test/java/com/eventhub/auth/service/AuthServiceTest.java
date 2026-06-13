package com.eventhub.auth.service;

import com.eventhub.auth.client.UserServiceClient;
import com.eventhub.auth.dto.*;
import com.eventhub.auth.entity.AuthUser;
import com.eventhub.auth.entity.EmailVerificationToken;
import com.eventhub.auth.entity.PasswordResetToken;
import com.eventhub.auth.repository.AuthUserRepository;
import com.eventhub.auth.repository.EmailVerificationTokenRepository;
import com.eventhub.auth.repository.PasswordResetTokenRepository;
import com.eventhub.auth.security.JwtService;
import com.eventhub.common.dto.ApiResponse;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ForbiddenException;
import com.eventhub.common.exception.UnauthorizedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private AuthUserRepository repository;
    private EmailVerificationTokenRepository emailVerificationTokenRepository;
    private PasswordResetTokenRepository passwordResetTokenRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private UserServiceClient userServiceClient;
    private EmailService emailService;
    private AuthService service;

    @BeforeEach
    void setUp() {
        repository = mock(AuthUserRepository.class);
        emailVerificationTokenRepository = mock(EmailVerificationTokenRepository.class);
        passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        userServiceClient = mock(UserServiceClient.class);
        emailService = mock(EmailService.class);
        service = new AuthService(
                repository,
                emailVerificationTokenRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                jwtService,
                userServiceClient,
                emailService
        );
    }

    @Test
    void registerCreatesDisabledUnverifiedUserAndSendsVerificationEmail() {
        when(repository.existsByEmail("user@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("123456")).thenReturn("bcrypt-hash");
        when(repository.save(any(AuthUser.class))).thenAnswer(invocation -> {
            AuthUser user = invocation.getArgument(0);
            user.setId(10L);
            return user;
        });
        when(emailVerificationTokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userServiceClient.createProfile(any())).thenReturn(ApiResponse.success("ok", null));

        AuthResponse response = service.register(new RegisterRequest(
                " User@Gmail.com ",
                "123456",
                " Nguyen Van A ",
                null,
                null
        ));

        ArgumentCaptor<AuthUser> userCaptor = ArgumentCaptor.forClass(AuthUser.class);
        verify(repository).save(userCaptor.capture());
        AuthUser savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("user@gmail.com");
        assertThat(savedUser.getPassword()).isEqualTo("bcrypt-hash");
        assertThat(savedUser.getPassword()).isNotEqualTo("123456");
        assertThat(savedUser.getRole()).isEqualTo("USER");
        assertThat(savedUser.isEnabled()).isFalse();
        assertThat(savedUser.getEmailVerified()).isFalse();
        assertThat(response.email()).isEqualTo("user@gmail.com");
        assertThat(response.fullName()).isEqualTo("Nguyen Van A");
        assertThat(response.role()).isEqualTo("USER");
        verify(emailService).sendVerificationEmail(eq("user@gmail.com"), any(String.class));
    }

    @Test
    void registerDuplicateEmailFails() {
        when(repository.existsByEmail("user@gmail.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(new RegisterRequest(
                "user@gmail.com",
                "123456",
                "Nguyen Van A",
                null,
                null
        ))).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email already registered");

        verify(repository, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(any(), any());
    }

    @Test
    void registerAdminRoleFails() {
        when(repository.existsByEmail("admin@gmail.com")).thenReturn(false);

        assertThatThrownBy(() -> service.register(new RegisterRequest(
                "admin@gmail.com",
                "123456",
                "Admin User",
                null,
                "ADMIN"
        ))).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot create ADMIN");

        verify(repository, never()).save(any());
    }

    @Test
    void loginReturnsTokenAndUserAfterVerification() {
        AuthUser user = verifiedUser();
        when(repository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "bcrypt-hash")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        LoginResponse response = service.login(new LoginRequest(" User@Gmail.com ", "123456"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.user().email()).isEqualTo("user@gmail.com");
    }

    @Test
    void loginUnverifiedUserFailsWithForbidden() {
        AuthUser user = verifiedUser();
        user.setEnabled(false);
        user.setEmailVerified(false);
        when(repository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "bcrypt-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.login(new LoginRequest("user@gmail.com", "123456")))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Please verify your email");

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void loginWrongPasswordFails() {
        AuthUser user = verifiedUser();
        when(repository.findByEmail("user@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "bcrypt-hash")).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("user@gmail.com", "wrong")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid email or password");

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void verifyEmailEnablesUserAndMarksTokenUsed() {
        AuthUser user = verifiedUser();
        user.setEnabled(false);
        user.setEmailVerified(false);
        EmailVerificationToken token = EmailVerificationToken.builder()
                .token("verify-token")
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        when(emailVerificationTokenRepository.findByToken("verify-token")).thenReturn(Optional.of(token));

        service.verifyEmail("verify-token");

        assertThat(user.isEnabled()).isTrue();
        assertThat(user.getEmailVerified()).isTrue();
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    void verifyEmailUsedTokenFails() {
        EmailVerificationToken token = EmailVerificationToken.builder()
                .token("verify-token")
                .user(verifiedUser())
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(true)
                .build();
        when(emailVerificationTokenRepository.findByToken("verify-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.verifyEmail("verify-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    void forgotPasswordDoesNotRevealMissingEmail() {
        when(repository.findByEmail("missing@gmail.com")).thenReturn(Optional.empty());

        service.forgotPassword(new ForgotPasswordRequest("missing@gmail.com"));

        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    void resetPasswordUpdatesPasswordAndMarksTokenUsed() {
        AuthUser user = verifiedUser();
        PasswordResetToken token = PasswordResetToken.builder()
                .token("reset-token")
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();
        when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("654321")).thenReturn("new-bcrypt-hash");

        service.resetPassword(new ResetPasswordRequest("reset-token", "654321", "654321"));

        assertThat(user.getPassword()).isEqualTo("new-bcrypt-hash");
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    void resetPasswordExpiredTokenFails() {
        PasswordResetToken token = PasswordResetToken.builder()
                .token("reset-token")
                .user(verifiedUser())
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false)
                .build();
        when(passwordResetTokenRepository.findByToken("reset-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest("reset-token", "654321", "654321")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    private AuthUser verifiedUser() {
        return AuthUser.builder()
                .id(10L)
                .email("user@gmail.com")
                .password("bcrypt-hash")
                .fullName("Nguyen Van A")
                .role("USER")
                .enabled(true)
                .emailVerified(true)
                .build();
    }
}
