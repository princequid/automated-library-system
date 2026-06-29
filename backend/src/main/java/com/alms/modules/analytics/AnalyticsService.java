package com.alms.modules.analytics;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    public Map<String, Object> getDashboard() {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Map<String, Object> getLoanReport(LocalDate from, LocalDate to) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Map<String, Object> getPopularItems(int limit) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
