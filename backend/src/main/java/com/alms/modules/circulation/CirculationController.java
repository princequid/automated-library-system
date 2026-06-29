package com.alms.modules.circulation;

import com.alms.modules.circulation.dto.IssueLoanRequest;
import com.alms.modules.circulation.dto.KioskCheckoutRequest;
import com.alms.modules.circulation.dto.KioskResult;
import com.alms.modules.circulation.dto.LoanDto;
import com.alms.modules.circulation.dto.RenewLoanRequest;
import com.alms.modules.circulation.dto.ReturnLoanRequest;
import com.alms.shared.dto.ApiResponse;
import com.alms.shared.dto.PageMeta;
import com.alms.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/circulation")
@Tag(name = "Circulation")
@RequiredArgsConstructor
public class CirculationController {

    private final CirculationService circulationService;

    @Operation(summary = "Issue a loan")
    @PostMapping("/loans")
    @PreAuthorize("hasAnyRole('DESK_STAFF','LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LoanDto>> issueLoan(
            @Valid @RequestBody IssueLoanRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(circulationService.issueLoan(request, user.getId()), "Loan issued"));
    }

    @Operation(summary = "List loans with filters")
    @GetMapping("/loans")
    @PreAuthorize("hasAnyRole('DESK_STAFF','LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<LoanDto>>> findLoans(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Boolean active,
            Pageable pageable) {
        Page<LoanDto> page = circulationService.findLoans(userId, active, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Loans retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get loan by ID")
    @GetMapping("/loans/{id}")
    @PreAuthorize("hasAnyRole('DESK_STAFF','LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LoanDto>> findLoanById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(circulationService.findLoanById(id), "Loan retrieved"));
    }

    @Operation(summary = "Return a loan")
    @PostMapping("/loans/{id}/return")
    @PreAuthorize("hasAnyRole('DESK_STAFF','LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<LoanDto>> returnLoan(
            @PathVariable String id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        ReturnLoanRequest request = new ReturnLoanRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(circulationService.returnLoan(request, user.getId()), "Loan returned"));
    }

    @Operation(summary = "Renew a loan")
    @PostMapping("/loans/{id}/renew")
    public ResponseEntity<ApiResponse<LoanDto>> renewLoan(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(circulationService.renewLoan(new RenewLoanRequest(id)), "Loan renewed"));
    }

    @Operation(summary = "Self-service kiosk checkout via RFID")
    @PostMapping("/kiosk/checkout")
    public ResponseEntity<ApiResponse<KioskResult>> kioskCheckout(@Valid @RequestBody KioskCheckoutRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(circulationService.kioskCheckout(request), "Kiosk checkout processed"));
    }
}
