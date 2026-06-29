package com.alms.modules.acquisitions;

import com.alms.shared.enums.AcquisitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcquisitionRepository extends JpaRepository<AcquisitionRequest, String> {

    Page<AcquisitionRequest> findByStatus(AcquisitionStatus status, Pageable pageable);

    Page<AcquisitionRequest> findByRequestedById(String userId, Pageable pageable);
}
