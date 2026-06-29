package com.alms.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCopyRequest(
        @NotBlank String barcode,
        String rfidTag,
        String condition
) {}
