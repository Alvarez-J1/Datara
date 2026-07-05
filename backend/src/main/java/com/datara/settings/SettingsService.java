package com.datara.settings;

import com.datara.settings.dto.UpdateUserSettingsRequest;
import com.datara.user.User;
import com.datara.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private static final Set<Integer> ALLOWED_TABLE_PAGE_SIZES = Set.of(25, 50, 100);

    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserSettings getByUserId(Long userId) {
        return userSettingsRepository.findByUserId(userId)
            .orElseThrow(() -> new EntityNotFoundException(
                "User settings not found for user: " + userId
            ));
    }

    @Transactional
    public UserSettings updateByUserId(Long userId, UpdateUserSettingsRequest request) {
        validateTablePageSize(request.tablePageSize());

        UserSettings existing = getByUserId(userId);
        existing.setDefaultTimeRange(request.defaultTimeRange());
        existing.setTablePageSize(request.tablePageSize());
        existing.setCompactMode(request.compactMode());
        existing.setWeeklyReport(request.weeklyReport());
        existing.setEmailDigest(request.emailDigest());
        existing.setAnomalyAlerts(request.anomalyAlerts());
        existing.setTheme(request.theme());

        return userSettingsRepository.save(existing);
    }

    /**
     * Creates the default settings row for a brand-new user. Called from
     * registration (real sign-ups) and the dev demo seeder alike, so every
     * account - demo or real - has a settings row to read/update from day one.
     */
    @Transactional
    public UserSettings createDefaultForUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        UserSettings settings = UserSettings.builder()
            .user(user)
            .defaultTimeRange(DefaultTimeRange.LAST_12_MONTHS)
            .tablePageSize(25)
            .compactMode(false)
            .weeklyReport(true)
            .emailDigest(false)
            .anomalyAlerts(true)
            .theme(Theme.SYSTEM)
            .build();

        return userSettingsRepository.save(settings);
    }

    private void validateTablePageSize(int tablePageSize) {
        if (!ALLOWED_TABLE_PAGE_SIZES.contains(tablePageSize)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "tablePageSize must be one of " + ALLOWED_TABLE_PAGE_SIZES
            );
        }
    }
}
