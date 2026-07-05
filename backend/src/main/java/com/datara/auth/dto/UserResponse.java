package com.datara.auth.dto;

import com.datara.user.User;
import com.datara.user.UserRole;

public record UserResponse(
    String id,
    String name,
    String email,
    UserRole role
) {

    public static UserResponse from(User user) {
        return new UserResponse(
            String.valueOf(user.getId()),
            user.getName(),
            user.getEmail(),
            user.getRole()
        );
    }
}
