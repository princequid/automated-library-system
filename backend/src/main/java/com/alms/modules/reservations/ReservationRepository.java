package com.alms.modules.reservations;

import com.alms.shared.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, String> {

    boolean existsByCatalogItemIdAndStatusIn(String catalogItemId, List<ReservationStatus> statuses);

    Optional<Reservation> findFirstByCatalogItemIdAndStatusOrderByCreatedAtAsc(String catalogItemId, ReservationStatus status);

    @Modifying
    @Query(value = "UPDATE reservations SET user_id = :newUserId WHERE user_id = :oldUserId", nativeQuery = true)
    void reassignUser(@Param("oldUserId") String oldUserId, @Param("newUserId") String newUserId);
}
