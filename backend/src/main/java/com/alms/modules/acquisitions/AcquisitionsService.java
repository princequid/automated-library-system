package com.alms.modules.acquisitions;

import com.alms.shared.enums.AcquisitionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcquisitionsService {

    public AcquisitionRequest create(AcquisitionRequest request, String requestedById) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Page<AcquisitionRequest> findAll(AcquisitionStatus status, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public AcquisitionRequest findById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public AcquisitionRequest updateStatus(String id, AcquisitionStatus newStatus, String updatedBy) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
