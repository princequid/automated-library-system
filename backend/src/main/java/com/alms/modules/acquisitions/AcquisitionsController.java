package com.alms.modules.acquisitions;

import com.alms.shared.dto.ApiResponse;
import com.alms.shared.dto.PageMeta;
import com.alms.shared.enums.AcquisitionStatus;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/acquisitions")
@Tag(name = "Acquisitions")
@RequiredArgsConstructor
public class AcquisitionsController {

    private final AcquisitionsService acquisitionsService;

    @Operation(summary = "Submit a new acquisition request")
    @PostMapping
    public ResponseEntity<ApiResponse<AcquisitionRequest>> create(
            @RequestBody AcquisitionRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(acquisitionsService.create(request, user.getId()), "Request submitted"));
    }

    @Operation(summary = "List acquisition requests")
    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<AcquisitionRequest>>> findAll(
            @RequestParam(required = false) AcquisitionStatus status,
            Pageable pageable) {
        Page<AcquisitionRequest> page = acquisitionsService.findAll(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Requests retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get acquisition request by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AcquisitionRequest>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(acquisitionsService.findById(id), "Request retrieved"));
    }

    @Operation(summary = "Update the status of an acquisition request")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AcquisitionRequest>> updateStatus(
            @PathVariable String id,
            @RequestParam AcquisitionStatus status,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(ApiResponse.ok(
                acquisitionsService.updateStatus(id, status, user.getId()), "Status updated"));
    }
}
