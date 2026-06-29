package com.alms.modules.settings;

import com.alms.modules.settings.dto.BulkUpdateRequest;
import com.alms.modules.settings.dto.UpdateSettingRequest;
import com.alms.shared.dto.ApiResponse;
import com.alms.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/settings")
@Tag(name = "Settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @Operation(summary = "Get all settings")
    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(settingsService.getAll(), "Settings retrieved"));
    }

    @Operation(summary = "Get a single setting by key")
    @GetMapping("/{key}")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> get(@PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.ok(settingsService.get(key), "Setting retrieved"));
    }

    @Operation(summary = "Update a single setting")
    @PutMapping("/{key}")
    @PreAuthorize("hasAnyRole('SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> set(@PathVariable String key,
                                                 @Valid @RequestBody UpdateSettingRequest request,
                                                 @AuthenticationPrincipal AuthenticatedUser user) {
        settingsService.set(key, request.value(), user.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Setting updated"));
    }

    @Operation(summary = "Bulk update multiple settings")
    @PutMapping("/bulk")
    @PreAuthorize("hasAnyRole('SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> setMany(@Valid @RequestBody BulkUpdateRequest request,
                                                     @AuthenticationPrincipal AuthenticatedUser user) {
        settingsService.setMany(request.updates(), user.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Settings updated"));
    }
}
