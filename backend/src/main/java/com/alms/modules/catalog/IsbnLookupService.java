package com.alms.modules.catalog;

import com.alms.modules.catalog.dto.CatalogItemDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class IsbnLookupService {

    private final WebClient webClient;

    public CatalogItemDto lookupByIsbn(String isbn) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
