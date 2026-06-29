package com.alms.shared.dto;

import org.springframework.data.domain.Page;

public record PageMeta(long total, int page, int limit, int totalPages) {

    public static PageMeta of(Page<?> page) {
        return new PageMeta(
                page.getTotalElements(),
                page.getNumber(),
                page.getSize(),
                page.getTotalPages()
        );
    }
}
