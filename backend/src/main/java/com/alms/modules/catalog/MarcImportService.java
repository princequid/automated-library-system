package com.alms.modules.catalog;

import com.alms.modules.catalog.dto.ImportResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarcImportService {

    public ImportResult importMarcFile(MultipartFile file, String importedBy) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
