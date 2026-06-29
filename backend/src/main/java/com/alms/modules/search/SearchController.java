package com.alms.modules.search;

import com.alms.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/search")
@Tag(name = "Search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @Operation(summary = "Full-text search across catalog, users, and loans")
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(
            @RequestParam String q,
            @RequestParam(required = false) String type,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(searchService.search(q, type, pageable), "Search results"));
    }
}
