package com.alms.modules.acquisitions;

import com.alms.modules.users.User;
import com.alms.shared.entity.BaseEntity;
import com.alms.shared.enums.AcquisitionStatus;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "acquisition_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcquisitionRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Column(nullable = false, length = 500)
    private String title;

    private String author;

    @Column(length = 20)
    private String isbn;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AcquisitionStatus status = AcquisitionStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
