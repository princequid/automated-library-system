package com.alms.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record TwoFactorRequest(
        @NotBlank String userId,
        @NotBlank String totpCode
) {}
