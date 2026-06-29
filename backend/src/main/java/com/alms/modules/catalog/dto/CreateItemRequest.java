package com.alms.modules.catalog.dto;

import com.alms.shared.enums.ItemFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record CreateItemRequest(
        String isbn,
        @NotBlank String title,
        @NotBlank String author,
        String publisher,
        Integer year,
        String abstractText,
        String shelfLocation,
        @NotNull ItemFormat format,
        String coverUrl,
        Set<String> subjectTags
) {}
