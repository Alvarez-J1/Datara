package com.datara.auth.dto;

public record AuthResponse(
    String token,
    UserResponse user
) {
}
