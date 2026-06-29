package com.alms.modules.settings;

import com.alms.shared.enums.SettingType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Setting {

    @Id
    @Column(name = "key", length = 100)
    private String key;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettingType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    private String updatedBy;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
