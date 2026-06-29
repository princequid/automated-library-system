package com.alms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableMethodSecurity
@EnableAsync
@EnableJpaAuditing
@ConfigurationPropertiesScan
public class AlmsApplication {
    public static void main(String[] args) {
        SpringApplication.run(AlmsApplication.class, args);
    }
}
