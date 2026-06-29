package com.alms.modules.circulation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, String> {

    Optional<Loan> findFirstByCopyIdAndReturnedAtIsNull(String copyId);

    int countByUserIdAndReturnedAtIsNull(String userId);

    @Modifying
    @Query(value = "UPDATE loans SET user_id = :newUserId WHERE user_id = :oldUserId", nativeQuery = true)
    void reassignUser(@Param("oldUserId") String oldUserId, @Param("newUserId") String newUserId);
}
