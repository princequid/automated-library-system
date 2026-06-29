package com.alms.modules.circulation.dto;

import java.time.LocalDateTime;

public record LoanDto(
        String id,
        String copyId,
        String barcode,
        String userId,
        String userName,
        LocalDateTime issuedAt,
        LocalDateTime dueDate,
        LocalDateTime returnedAt,
        int renewalCount,
        boolean overdue
) {}
