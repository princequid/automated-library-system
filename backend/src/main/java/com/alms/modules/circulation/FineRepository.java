package com.alms.modules.circulation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface FineRepository extends JpaRepository<Fine, String> {

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fine f WHERE f.user.id = :userId AND f.paid = false")
    BigDecimal sumUnpaidByUserId(@Param("userId") String userId);

    @Modifying
    @Query(value = "UPDATE fines SET user_id = :newUserId WHERE user_id = :oldUserId", nativeQuery = true)
    void reassignUser(@Param("oldUserId") String oldUserId, @Param("newUserId") String newUserId);
}
