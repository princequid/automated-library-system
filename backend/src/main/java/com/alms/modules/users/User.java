package com.alms.modules.users;

import com.alms.modules.circulation.Fine;
import com.alms.modules.circulation.Loan;
import com.alms.modules.reservations.Reservation;
import com.alms.shared.entity.BaseEntity;
import com.alms.shared.enums.UserRole;
import com.alms.shared.enums.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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
import java.util.List;

@Entity
@Table(name = "users")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "university_id", unique = true)
    private String universityId;

    @Column(nullable = false)
    private String name;

    private String department;

    private Integer yearOfStudy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    private String passwordHash;

    private String totpSecret;

    private boolean totpEnabled;

    private int failedLoginCount;

    private LocalDateTime lockedUntil;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Loan> loans = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Fine> fines = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Reservation> reservations = new ArrayList<>();
}
