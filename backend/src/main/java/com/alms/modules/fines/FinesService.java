package com.alms.modules.fines;

import com.alms.modules.circulation.Fine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinesService {

    public Page<Fine> findAll(Boolean paid, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Page<Fine> findByUser(String userId, Boolean paid, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Fine findById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Fine payFine(String id, String paidBy) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public BigDecimal getTotalUnpaid(String userId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
