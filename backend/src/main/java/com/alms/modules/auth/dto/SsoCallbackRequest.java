package com.alms.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SsoCallbackRequest(
        @NotBlank String code,
        String state
) {}
