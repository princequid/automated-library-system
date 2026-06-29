package com.alms.modules.reservations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationsService {

    public Reservation create(String catalogItemId, String userId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Page<Reservation> findAll(String userId, String status, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Reservation findById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void cancel(String id, String requestingUserId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
