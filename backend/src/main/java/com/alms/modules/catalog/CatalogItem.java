package com.alms.modules.catalog;

import com.alms.shared.entity.BaseEntity;
import com.alms.shared.enums.ItemFormat;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "catalog_items")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogItem extends BaseEntity {

    @Column(unique = true, length = 20)
    private String isbn;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false)
    private String author;

    private String publisher;

    private Integer year;

    @Column(name = "abstract_text", columnDefinition = "TEXT")
    private String abstractText;

    @Column(name = "shelf_location", length = 100)
    private String shelfLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ItemFormat format = ItemFormat.PHYSICAL;

    @Column(name = "cover_url", columnDefinition = "TEXT")
    private String coverUrl;

    @Column(name = "available_copies", nullable = false)
    @Builder.Default
    private int availableCopies = 0;

    @Column(name = "total_copies", nullable = false)
    @Builder.Default
    private int totalCopies = 0;

    @Column(name = "created_by")
    private String createdBy;

    private LocalDateTime deletedAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "catalog_item_subjects",
            joinColumns = @JoinColumn(name = "catalog_item_id"))
    @Column(name = "subject_tags")
    @Builder.Default
    private Set<String> subjectTags = new HashSet<>();

    @OneToMany(mappedBy = "catalogItem", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Copy> copies = new ArrayList<>();
}
