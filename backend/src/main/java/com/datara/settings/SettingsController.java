package com.datara.settings;

import com.datara.security.UserPrincipal;
import com.datara.settings.dto.UpdateUserSettingsRequest;
import com.datara.settings.dto.UserSettingsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<UserSettingsResponse> getSettings(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserSettings settings = settingsService.getByUserId(principal.getId());
        return ResponseEntity.ok(UserSettingsResponse.from(settings));
    }

    @PutMapping
    public ResponseEntity<UserSettingsResponse> updateSettings(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateUserSettingsRequest request
    ) {
        UserSettings settings = settingsService.updateByUserId(principal.getId(), request);
        return ResponseEntity.ok(UserSettingsResponse.from(settings));
    }
}
