package com.datara.user;

import com.datara.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Void>> currentUser() {
        return ResponseEntity
            .status(HttpStatus.NOT_IMPLEMENTED)
            .body(ApiResponse.error("Current user profile is not implemented yet."));
    }
}
