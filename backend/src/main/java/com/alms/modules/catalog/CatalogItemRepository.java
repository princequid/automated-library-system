package com.alms.modules.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CatalogItemRepository extends JpaRepository<CatalogItem, String>, JpaSpecificationExecutor<CatalogItem> {

    Optional<CatalogItem> findByIsbn(String isbn);

    boolean existsByIsbn(String isbn);

    @Modifying
    @Query("UPDATE CatalogItem c SET c.availableCopies = :count WHERE c.id = :id")
    void updateAvailableCopies(@Param("id") String id, @Param("count") int count);
}
