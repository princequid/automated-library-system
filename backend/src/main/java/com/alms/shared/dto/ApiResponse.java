package com.alms.shared.dto;

public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        PageMeta meta
) {
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, null);
    }

    public static <T> ApiResponse<T> ok(T data, String message, PageMeta meta) {
        return new ApiResponse<>(true, data, message, meta);
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(false, null, message, null);
    }
}
