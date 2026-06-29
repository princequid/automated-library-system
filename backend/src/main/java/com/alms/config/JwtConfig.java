package com.alms.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
    private String secret = "change-me-in-production-min-32-chars";
    private String refreshSecret = "change-me-refresh-min-32-chars-xx";
    private int accessTokenExpiryMinutes = 15;
    private int refreshTokenExpiryDays = 7;
}
