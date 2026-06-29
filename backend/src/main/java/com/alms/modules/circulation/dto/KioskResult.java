package com.alms.modules.circulation.dto;

public record KioskResult(
        boolean success,
        String message,
        LoanDto loan
) {}
