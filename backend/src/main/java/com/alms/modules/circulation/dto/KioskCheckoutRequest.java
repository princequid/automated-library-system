package com.alms.modules.circulation.dto;

import jakarta.validation.constraints.NotBlank;

public record KioskCheckoutRequest(
        @NotBlank String rfidTag,
        @NotBlank String universityId
) {}
