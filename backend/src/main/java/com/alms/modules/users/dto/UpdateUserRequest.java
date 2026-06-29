package com.alms.modules.users.dto;

public record UpdateUserRequest(
        String name,
        String department,
        Integer yearOfStudy,
        String universityId
) {}
