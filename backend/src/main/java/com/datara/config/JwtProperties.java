package com.datara.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "datara.jwt")
public record JwtProperties(
    String secret,
    String issuer,
    long accessTokenExpirationMinutes,
    long refreshTokenExpirationDays
) {
}
