package com.alms.modules.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    public Map<String, Object> search(String q, String type, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
