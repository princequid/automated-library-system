package com.alms.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        boolean success,
        String error,
        List<FieldError> details,
        LocalDateTime timestamp
) {
    public record FieldError(String field, String message) {}

    public static ErrorResponse of(String error) {
        return new ErrorResponse(false, error, List.of(), LocalDateTime.now());
    }

    public static ErrorResponse of(String error, List<FieldError> details) {
        return new ErrorResponse(false, error, details, LocalDateTime.now());
    }
}
