package com.datara.common;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private static final Map<String, String> OK_RESPONSE = Map.of("status", "ok");

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return OK_RESPONSE;
    }
}
