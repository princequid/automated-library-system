package com.alms.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
        @Email String email,
        String token,
        @Size(min = 8) String newPassword
) {}
