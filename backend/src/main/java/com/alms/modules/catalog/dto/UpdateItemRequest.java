package com.alms.modules.catalog.dto;

import com.alms.shared.enums.ItemFormat;

import java.util.Set;

public record UpdateItemRequest(
        String title,
        String author,
        String publisher,
        Integer year,
        String abstractText,
        String shelfLocation,
        ItemFormat format,
        String coverUrl,
        Set<String> subjectTags
) {}
