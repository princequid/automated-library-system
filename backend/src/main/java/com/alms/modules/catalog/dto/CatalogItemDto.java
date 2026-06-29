package com.alms.modules.catalog.dto;

import com.alms.shared.enums.ItemFormat;

import java.time.LocalDateTime;
import java.util.Set;

public record CatalogItemDto(
        String id,
        String isbn,
        String title,
        String author,
        String publisher,
        Integer year,
        String abstractText,
        String shelfLocation,
        ItemFormat format,
        String coverUrl,
        int availableCopies,
        int totalCopies,
        Set<String> subjectTags,
        LocalDateTime createdAt
) {}
