package com.datara.auth;

import com.datara.auth.dto.AuthResponse;
import com.datara.auth.dto.LoginRequest;
import com.datara.auth.dto.RegisterRequest;
import com.datara.auth.dto.UpdateProfileRequest;
import com.datara.auth.dto.UserResponse;
import com.datara.config.SampleDataService;
import com.datara.security.JwtService;
import com.datara.security.UserPrincipal;
import com.datara.settings.SettingsService;
import com.datara.user.User;
import com.datara.user.UserRepository;
import com.datara.user.UserRole;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SampleDataService sampleDataService;
    private final SettingsService settingsService;
    private final UserRepository userRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A user with this email already exists."
            );
        }

        User user = User.builder()
            .name(request.name().trim())
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .role(UserRole.USER)
            .build();

        User savedUser = userRepository.save(user);
        settingsService.createDefaultForUser(savedUser.getId());
        sampleDataService.seedFor(savedUser);

        return buildAuthResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password."
            );
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password."
            ));

        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse currentUser(UserPrincipal principal, String token) {
        if (principal == null) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authentication is required."
            );
        }

        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authenticated user no longer exists."
            ));

        return new AuthResponse(token, UserResponse.from(user));
    }

    /**
     * Updates the signed-in user's name/email. Because the JWT subject is the
     * user's email, a new token is issued whenever this succeeds - the caller
     * (frontend) must replace its stored token with the one in the response,
     * or the user will be signed out on their very next request.
     */
    @Transactional
    public AuthResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authenticated user no longer exists."
            ));

        if (user.getRole() == UserRole.ADMIN) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "The shared demo account can't be edited."
            );
        }

        String email = normalizeEmail(request.email());

        if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "A user with this email already exists."
            );
        }

        user.setName(request.name().trim());
        user.setEmail(email);

        User savedUser = userRepository.save(user);

        return buildAuthResponse(savedUser);
    }

    private AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
