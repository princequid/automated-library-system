package com.alms.modules.auth.dto;

public record RefreshResponse(
        String accessToken,
        String refreshToken
) {}
