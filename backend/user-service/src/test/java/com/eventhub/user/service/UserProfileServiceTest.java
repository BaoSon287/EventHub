package com.eventhub.user.service;

import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.user.dto.UpdateUserProfileRequest;
import com.eventhub.user.entity.UserProfile;
import com.eventhub.user.repository.UserProfileRepository;
import com.eventhub.user.security.CustomUserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserProfileRepository repository;

    @InjectMocks
    private UserProfileService service;

    @Test
    @DisplayName("getByAuthUserId - returns existing profile")
    void getByAuthUserIdSuccess() {
        UserProfile existing = new UserProfile();
        existing.setId(1L);
        existing.setAuthUserId(10L);
        existing.setEmail("user@example.com");
        existing.setFullName("Test User");
        when(repository.findByAuthUserId(10L)).thenReturn(Optional.of(existing));

        UserProfile profile = service.getByAuthUserId(10L);

        assertThat(profile.getId()).isEqualTo(1L);
        assertThat(profile.getEmail()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("getByAuthUserId - throws not found if absent")
    void getByAuthUserIdNotFound() {
        when(repository.findByAuthUserId(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getByAuthUserId(10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User profile not found");
    }

    @Test
    @DisplayName("create - creates new profile")
    void createSuccess() {
        when(repository.existsByAuthUserId(10L)).thenReturn(false);
        when(repository.existsByEmail("new@example.com")).thenReturn(false);
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> {
            UserProfile p = invocation.getArgument(0);
            p.setId(2L);
            return p;
        });

        var request = new com.eventhub.user.dto.CreateUserProfileRequest(10L, "new@example.com", "New User", null, null);
        UserProfile created = service.create(request);

        assertThat(created.getId()).isEqualTo(2L);
        assertThat(created.getEmail()).isEqualTo("new@example.com");
        verify(repository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("create - throws if duplicate authUserId")
    void createDuplicateAuthUserId() {
        when(repository.existsByAuthUserId(10L)).thenReturn(true);

        var request = new com.eventhub.user.dto.CreateUserProfileRequest(10L, "new@example.com", "New User", null, null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Auth user profile already exists");
    }

    @Test
    @DisplayName("create - throws if duplicate email")
    void createDuplicateEmail() {
        when(repository.existsByAuthUserId(10L)).thenReturn(false);
        when(repository.existsByEmail("new@example.com")).thenReturn(true);

        var request = new com.eventhub.user.dto.CreateUserProfileRequest(10L, "new@example.com", "New User", null, null);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email profile already exists");
    }

    @Test
    @DisplayName("update - updates profile fields and saves")
    void updateSuccess() {
        UserProfile profile = new UserProfile();
        profile.setId(1L);
        profile.setAuthUserId(10L);
        profile.setEmail("user@example.com");
        profile.setFullName("Old Name");
        profile.setPhone("0900000000");
        when(repository.findByAuthUserId(10L)).thenReturn(Optional.of(profile));
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfile updated = service.update(10L, new UpdateUserProfileRequest("New Name", "0911111111", null, null));

        assertThat(updated.getFullName()).isEqualTo("New Name");
        assertThat(updated.getPhone()).isEqualTo("0911111111");
        verify(repository).save(profile);
    }

    @Test
    @DisplayName("update - throws not found if profile absent")
    void updateNotFound() {
        when(repository.findByAuthUserId(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(10L, new UpdateUserProfileRequest("New Name", null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User profile not found");
    }

    @Test
    @DisplayName("upsertCurrentUser - creates new profile when not exists")
    void upsertCreatesNew() {
        when(repository.findByAuthUserId(10L)).thenReturn(Optional.empty());
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> {
            UserProfile p = invocation.getArgument(0);
            p.setId(2L);
            return p;
        });

        var principal = new CustomUserPrincipal(10L, "user@example.com", "USER");
        UserProfile profile = service.upsertCurrentUser(principal, new UpdateUserProfileRequest("New Name", null, null, null));

        assertThat(profile.getId()).isEqualTo(2L);
        assertThat(profile.getEmail()).isEqualTo("user@example.com");
        verify(repository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("upsertCurrentUser - updates existing profile")
    void upsertUpdatesExisting() {
        UserProfile existing = new UserProfile();
        existing.setId(1L);
        existing.setAuthUserId(10L);
        existing.setEmail("user@example.com");
        existing.setFullName("Old Name");
        when(repository.findByAuthUserId(10L)).thenReturn(Optional.of(existing));
        when(repository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var principal = new CustomUserPrincipal(10L, "user@example.com", "USER");
        UserProfile profile = service.upsertCurrentUser(principal, new UpdateUserProfileRequest("New Name", "0911111111", null, null));

        assertThat(profile.getId()).isEqualTo(1L);
        assertThat(profile.getFullName()).isEqualTo("New Name");
        verify(repository).save(existing);
    }
}
</parameter3_name>
<parameter4_name>
task_progress</parameter4_name>
<parameter5_name>
- [x] Bước 1: Testing Audit - Hoàn thành báo cáo
- [x] Bước 2: Setup Test Environment - Thêm test profiles
- [x] Bước 3: Unit Test Service Layer - user-service test đang tạo
- [ ] Bước 4: Repository Test
- [ ] Bước 5: Controller API Test
- [ ] Bước 6: Security Test
- [ ] Bước 7-9: Business Flow, Concurrency, Error Case Tests
- [ ] Bước 10-12: Frontend Test, Coverage, CI
- [ ] Tạo báo cáo và commit
</parameter5_name>
</parameter4_name>
</parameter2_name>
</parameter1_name>