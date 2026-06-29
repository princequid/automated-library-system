package com.alms.modules.notifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationsService {

    public Page<Notification> findByUser(String userId, Boolean unreadOnly, Pageable pageable) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Notification findById(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public Notification markRead(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void markAllRead(String userId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public void delete(String id) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    public long countUnread(String userId) {
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
