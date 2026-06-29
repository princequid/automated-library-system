package com.alms.modules.digital;

import com.alms.shared.dto.ApiResponse;
import com.alms.shared.dto.PageMeta;
import com.alms.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/digital")
@Tag(name = "Digital Resources")
@RequiredArgsConstructor
public class DigitalController {

    private final DigitalService digitalService;

    @Operation(summary = "List all digital resources")
    @GetMapping("/resources")
    public ResponseEntity<ApiResponse<Page<DigitalResource>>> findAll(Pageable pageable) {
        Page<DigitalResource> page = digitalService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Digital resources retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get digital resource by ID")
    @GetMapping("/resources/{id}")
    public ResponseEntity<ApiResponse<DigitalResource>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(digitalService.findById(id), "Digital resource retrieved"));
    }

    @Operation(summary = "Upload a digital resource")
    @PostMapping("/resources")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DigitalResource>> upload(
            @RequestParam String catalogItemId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "true") boolean drmEnabled,
            @RequestParam(defaultValue = "3") int maxConcurrentLoans) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(digitalService.upload(catalogItemId, file, drmEnabled, maxConcurrentLoans), "Resource uploaded"));
    }

    @Operation(summary = "Generate a temporary download URL")
    @GetMapping("/resources/{id}/download")
    public ResponseEntity<ApiResponse<String>> getDownloadUrl(
            @PathVariable String id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(ApiResponse.ok(digitalService.generateDownloadUrl(id, user.getId()), "Download URL generated"));
    }
}
