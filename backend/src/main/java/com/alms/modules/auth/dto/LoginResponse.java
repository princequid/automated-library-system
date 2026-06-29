package com.alms.modules.auth.dto;

import com.alms.shared.enums.UserRole;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String userId,
        String email,
        UserRole role,
        boolean totpRequired
) {}
