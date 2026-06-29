package com.alms.modules.users.dto;

import com.alms.shared.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String name,
        @NotNull UserRole role,
        String universityId,
        String department,
        Integer yearOfStudy,
        String password
) {}
