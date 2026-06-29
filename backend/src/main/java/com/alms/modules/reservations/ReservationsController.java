package com.alms.modules.reservations;

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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reservations")
@Tag(name = "Reservations")
@RequiredArgsConstructor
public class ReservationsController {

    private final ReservationsService reservationsService;

    @Operation(summary = "Place a reservation for a catalog item")
    @PostMapping
    public ResponseEntity<ApiResponse<Reservation>> create(
            @RequestParam String catalogItemId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(reservationsService.create(catalogItemId, user.getId()), "Reservation created"));
    }

    @Operation(summary = "List reservations")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Reservation>>> findAll(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<Reservation> page = reservationsService.findAll(userId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Reservations retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get reservation by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Reservation>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(reservationsService.findById(id), "Reservation retrieved"));
    }

    @Operation(summary = "Cancel a reservation")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable String id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        reservationsService.cancel(id, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Reservation cancelled"));
    }
}
