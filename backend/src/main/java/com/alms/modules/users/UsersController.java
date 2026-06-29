package com.alms.modules.users;

import com.alms.modules.users.dto.CreateUserRequest;
import com.alms.modules.users.dto.EligibilityResult;
import com.alms.modules.users.dto.UpdateStatusRequest;
import com.alms.modules.users.dto.UpdateUserRequest;
import com.alms.modules.users.dto.UserDto;
import com.alms.shared.dto.ApiResponse;
import com.alms.shared.dto.PageMeta;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@Tag(name = "Users")
@RequiredArgsConstructor
public class UsersController {

    private final UsersService usersService;

    @Operation(summary = "List all users with filtering and pagination")
    @GetMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserDto>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        Page<UserDto> page = usersService.findAll(search, role, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Users retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get user by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(usersService.findById(id), "User retrieved"));
    }

    @Operation(summary = "Create a new user")
    @PostMapping
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(usersService.create(request), "User created"));
    }

    @Operation(summary = "Update user details")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> update(@PathVariable String id,
                                                       @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(usersService.update(id, request), "User updated"));
    }

    @Operation(summary = "Delete a user (soft delete)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        usersService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "User deleted"));
    }

    @Operation(summary = "Update user status")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateStatus(@PathVariable String id,
                                                             @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(usersService.updateStatus(id, request), "Status updated"));
    }

    @Operation(summary = "Check borrowing eligibility for a user")
    @GetMapping("/{id}/eligibility")
    public ResponseEntity<ApiResponse<EligibilityResult>> checkEligibility(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(usersService.checkEligibility(id), "Eligibility checked"));
    }

    @Operation(summary = "Bulk import users from CSV")
    @PostMapping("/bulk-import")
    @PreAuthorize("hasAnyRole('SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Object>> bulkImport(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.ok(usersService.bulkImport(file), "Bulk import complete"));
    }
}
