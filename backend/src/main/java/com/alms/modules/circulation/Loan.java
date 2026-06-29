package com.alms.modules.circulation;

import com.alms.modules.catalog.Copy;
import com.alms.modules.users.User;
import com.alms.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "loans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Loan extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "copy_id", nullable = false)
    private Copy copy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    @Column(name = "renewal_count", nullable = false)
    @Builder.Default
    private int renewalCount = 0;

    @Column(name = "issued_by", nullable = false)
    private String issuedBy;

    @Column(name = "returned_by")
    private String returnedBy;

    @OneToMany(mappedBy = "loan", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Fine> fines = new ArrayList<>();
}
