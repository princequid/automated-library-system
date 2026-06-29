package com.alms.modules.fines;

import com.alms.modules.circulation.Fine;
import com.alms.shared.dto.ApiResponse;
import com.alms.shared.dto.PageMeta;
import com.alms.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/fines")
@Tag(name = "Fines")
@RequiredArgsConstructor
public class FinesController {

    private final FinesService finesService;

    @Operation(summary = "List all fines")
    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<Fine>>> findAll(
            @RequestParam(required = false) Boolean paid,
            Pageable pageable) {
        Page<Fine> page = finesService.findAll(paid, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Fines retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get fines for a specific user")
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<Fine>>> findByUser(
            @PathVariable String userId,
            @RequestParam(required = false) Boolean paid,
            Pageable pageable) {
        Page<Fine> page = finesService.findByUser(userId, paid, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "User fines retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get fine by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Fine>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(finesService.findById(id), "Fine retrieved"));
    }

    @Operation(summary = "Pay a fine")
    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAnyRole('DESK_STAFF','LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Fine>> payFine(
            @PathVariable String id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(ApiResponse.ok(finesService.payFine(id, user.getId()), "Fine paid"));
    }

    @Operation(summary = "Get total unpaid fines for a user")
    @GetMapping("/user/{userId}/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalUnpaid(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(finesService.getTotalUnpaid(userId), "Total unpaid fines"));
    }
}
