package com.alms.modules.digital;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DigitalResourceRepository extends JpaRepository<DigitalResource, String> {

    Optional<DigitalResource> findByCatalogItemId(String catalogItemId);
}
