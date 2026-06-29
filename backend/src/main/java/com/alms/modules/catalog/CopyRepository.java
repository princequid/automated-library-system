package com.alms.modules.catalog;

import com.alms.shared.enums.CopyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CopyRepository extends JpaRepository<Copy, String> {

    Optional<Copy> findByBarcode(String barcode);

    Optional<Copy> findByRfidTag(String rfidTag);

    long countByCatalogItemIdAndStatus(String catalogItemId, CopyStatus status);

    @Modifying
    @Query("UPDATE Copy c SET c.status = :status WHERE c.id = :id")
    void updateStatus(@Param("id") String id, @Param("status") CopyStatus status);
}
