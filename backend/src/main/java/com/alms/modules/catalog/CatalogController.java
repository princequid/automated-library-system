package com.alms.modules.catalog;

import com.alms.modules.catalog.dto.CatalogItemDto;
import com.alms.modules.catalog.dto.CreateCopyRequest;
import com.alms.modules.catalog.dto.CreateItemRequest;
import com.alms.modules.catalog.dto.ImportResult;
import com.alms.modules.catalog.dto.UpdateItemRequest;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/catalog")
@Tag(name = "Catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;
    private final MarcImportService marcImportService;
    private final IsbnLookupService isbnLookupService;

    @Operation(summary = "Search catalog items")
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<Page<CatalogItemDto>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String subject,
            Pageable pageable) {
        Page<CatalogItemDto> page = catalogService.search(q, format, subject, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Items retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get catalog item by ID")
    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<CatalogItemDto>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.findById(id), "Item retrieved"));
    }

    @Operation(summary = "Create a new catalog item")
    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CatalogItemDto>> create(
            @Valid @RequestBody CreateItemRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(catalogService.create(request, user.getId()), "Item created"));
    }

    @Operation(summary = "Update a catalog item")
    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CatalogItemDto>> update(@PathVariable String id,
                                                              @Valid @RequestBody UpdateItemRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.update(id, request), "Item updated"));
    }

    @Operation(summary = "Delete a catalog item")
    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        catalogService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Item deleted"));
    }

    @Operation(summary = "Import catalog items from MARC file")
    @PostMapping("/items/import/marc")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<ImportResult>> importMarc(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(ApiResponse.ok(marcImportService.importMarcFile(file, user.getId()), "Import complete"));
    }

    @Operation(summary = "Lookup a book by ISBN from Open Library")
    @GetMapping("/items/import/isbn-lookup")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CatalogItemDto>> isbnLookup(@RequestParam String isbn) {
        return ResponseEntity.ok(ApiResponse.ok(isbnLookupService.lookupByIsbn(isbn), "ISBN lookup complete"));
    }

    @Operation(summary = "Add a copy to a catalog item")
    @PostMapping("/items/{id}/copies")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Copy>> addCopy(@PathVariable String id,
                                                     @Valid @RequestBody CreateCopyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(catalogService.addCopy(id, request), "Copy added"));
    }

    @Operation(summary = "Get all copies for a catalog item")
    @GetMapping("/items/{id}/copies")
    public ResponseEntity<ApiResponse<List<Copy>>> getCopies(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getCopies(id), "Copies retrieved"));
    }

    @Operation(summary = "Update a copy")
    @PutMapping("/copies/{copyId}")
    @PreAuthorize("hasAnyRole('LIBRARIAN','SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Copy>> updateCopy(@PathVariable String copyId,
                                                        @Valid @RequestBody CreateCopyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.updateCopy(copyId, request), "Copy updated"));
    }

    @Operation(summary = "Delete a copy")
    @DeleteMapping("/copies/{copyId}")
    @PreAuthorize("hasAnyRole('SENIOR_LIBRARIAN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCopy(@PathVariable String copyId) {
        catalogService.deleteCopy(copyId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Copy deleted"));
    }
}
