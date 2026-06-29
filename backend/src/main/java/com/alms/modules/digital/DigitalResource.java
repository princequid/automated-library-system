package com.alms.modules.digital;

import com.alms.modules.catalog.CatalogItem;
import com.alms.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "digital_resources")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DigitalResource extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalog_item_id", nullable = false, unique = true)
    private CatalogItem catalogItem;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "drm_enabled", nullable = false)
    @Builder.Default
    private boolean drmEnabled = true;

    @Column(name = "max_concurrent_loans", nullable = false)
    @Builder.Default
    private int maxConcurrentLoans = 3;
}
