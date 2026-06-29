package com.alms.modules.digital;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class DigitalService {

    public Page<DigitalResource> findAll(Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public DigitalResource findById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public DigitalResource upload(String catalogItemId, MultipartFile file, boolean drmEnabled, int maxConcurrentLoans) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public String generateDownloadUrl(String id, String userId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void delete(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
