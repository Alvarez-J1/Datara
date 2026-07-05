package com.datara.settings;

import com.datara.user.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {

    Optional<UserSettings> findByUser(User user);

    Optional<UserSettings> findByUserId(Long userId);
}
