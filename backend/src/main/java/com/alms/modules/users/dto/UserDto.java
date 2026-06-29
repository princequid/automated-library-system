package com.alms.modules.users.dto;

import com.alms.shared.enums.UserRole;
import com.alms.shared.enums.UserStatus;

import java.time.LocalDateTime;

public record UserDto(
        String id,
        String email,
        String universityId,
        String name,
        String department,
        Integer yearOfStudy,
        UserRole role,
        UserStatus status,
        boolean totpEnabled,
        LocalDateTime createdAt
) {}
