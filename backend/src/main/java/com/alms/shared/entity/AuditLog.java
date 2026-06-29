package com.alms.shared.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @UuidGenerator
    private String id;

    private String actorId;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(length = 100)
    private String entityType;

    @Column(length = 36)
    private String entityId;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
