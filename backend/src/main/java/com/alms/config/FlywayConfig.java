package com.alms.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class FlywayConfig {

    @Bean
    FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            log.info("Running Flyway migrations...");
            flyway.migrate();
            log.info("Flyway migrations complete");
        };
    }
}
