package com.alms.modules.circulation.dto;

import jakarta.validation.constraints.NotBlank;

public record IssueLoanRequest(
        @NotBlank String copyId,
        @NotBlank String userId
) {}
