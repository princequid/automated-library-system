package com.alms.modules.catalog;

import com.alms.modules.catalog.dto.CatalogItemDto;
import com.alms.modules.catalog.dto.CreateCopyRequest;
import com.alms.modules.catalog.dto.CreateItemRequest;
import com.alms.modules.catalog.dto.UpdateItemRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CatalogService {

    public Page<CatalogItemDto> search(String q, String format, String subject, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public CatalogItemDto findById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public CatalogItemDto create(CreateItemRequest request, String createdBy) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public CatalogItemDto update(String id, UpdateItemRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void delete(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Copy addCopy(String catalogItemId, CreateCopyRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public List<Copy> getCopies(String catalogItemId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Copy updateCopy(String copyId, CreateCopyRequest request) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void deleteCopy(String copyId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
