package com.alms.modules.circulation.dto;

import jakarta.validation.constraints.NotBlank;

public record RenewLoanRequest(
        @NotBlank String loanId
) {}
