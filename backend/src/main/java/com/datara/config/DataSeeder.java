package com.datara.config;

import com.datara.settings.SettingsService;
import com.datara.settings.UserSettingsRepository;
import com.datara.user.User;
import com.datara.user.UserRepository;
import com.datara.user.UserRole;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile({"dev", "prod"})
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private static final String DEMO_EMAIL = "admin@datara.local";
    private static final String DEMO_PASSWORD = "DataraDemo123!";

    private final PasswordEncoder passwordEncoder;
    private final SampleDataService sampleDataService;
    private final SettingsService settingsService;
    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User demoUser = upsertDemoUser();
        ensureDefaultSettings(demoUser);
        sampleDataService.seedFor(demoUser);

        log.info("Datara demo seed complete for {}. Login password: {}", DEMO_EMAIL, DEMO_PASSWORD);
    }

    private User upsertDemoUser() {
        User demoUser = userRepository.findByEmail(DEMO_EMAIL)
            .orElseGet(() -> User.builder()
                .email(DEMO_EMAIL)
                .createdAt(Instant.now())
                .build());

        demoUser.setName("Datara Admin");
        demoUser.setRole(UserRole.ADMIN);
        demoUser.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));

        return userRepository.save(demoUser);
    }

    private void ensureDefaultSettings(User demoUser) {
        if (userSettingsRepository.findByUserId(demoUser.getId()).isPresent()) {
            return;
        }

        settingsService.createDefaultForUser(demoUser.getId());
    }
}
