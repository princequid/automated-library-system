package com.alms.modules.users.dto;

import java.math.BigDecimal;

public record EligibilityResult(
        boolean eligible,
        String reason,
        int activeLoans,
        int maxLoans,
        BigDecimal unpaidFines,
        BigDecimal maxAllowedFines
) {}
