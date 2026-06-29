package com.alms.modules.users.dto;

import com.alms.shared.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull UserStatus status,
        String reason
) {}
