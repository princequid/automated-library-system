package com.alms.modules.integrations;

import com.alms.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/integrations")
@Tag(name = "Integrations")
@RequiredArgsConstructor
public class IntegrationsController {

    private final IntegrationsService integrationsService;

    @Operation(summary = "Trigger SIS student sync")
    @PostMapping("/sis/sync")
    @PreAuthorize("hasAnyRole('SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncSis() {
        return ResponseEntity.ok(ApiResponse.ok(integrationsService.syncSis(), "SIS sync triggered"));
    }

    @Operation(summary = "Scan RFID tag and return associated item")
    @GetMapping("/rfid/scan")
    @PreAuthorize("hasAnyRole('DESK_STAFF','LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> scanRfid(@RequestParam String rfidTag) {
        return ResponseEntity.ok(ApiResponse.ok(integrationsService.scanRfid(rfidTag), "RFID scan complete"));
    }
}
