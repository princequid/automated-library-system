package com.alms.modules.settings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BulkUpdateRequest(
        @NotEmpty List<Entry> updates
) {
    public record Entry(
            @NotBlank String key,
            @NotBlank String value
    ) {}
}
