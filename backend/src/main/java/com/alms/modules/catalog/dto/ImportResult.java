package com.alms.modules.catalog.dto;

import java.util.List;

public record ImportResult(
        int total,
        int imported,
        int skipped,
        int failed,
        List<String> errors
) {}
