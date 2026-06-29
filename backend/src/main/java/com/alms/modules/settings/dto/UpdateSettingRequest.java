package com.alms.modules.settings.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSettingRequest(
        @NotBlank String value
) {}
