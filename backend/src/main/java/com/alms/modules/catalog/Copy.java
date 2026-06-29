package com.alms.modules.catalog;

import com.alms.shared.entity.BaseEntity;
import com.alms.shared.enums.CopyStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "copies")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Copy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalog_item_id", nullable = false)
    private CatalogItem catalogItem;

    @Column(unique = true, nullable = false, length = 100)
    private String barcode;

    @Column(name = "rfid_tag", unique = true, length = 100)
    private String rfidTag;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private CopyStatus status = CopyStatus.AVAILABLE;

    @Column(name = "condition")
    private String condition;
}
