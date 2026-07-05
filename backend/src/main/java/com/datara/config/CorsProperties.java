package com.datara.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "datara.cors")
public record CorsProperties(
    List<String> allowedOrigins,
    List<String> allowedMethods,
    List<String> allowedHeaders,
    List<String> exposedHeaders
) {
}
