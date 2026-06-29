package com.alms.modules.notifications;

import com.alms.shared.dto.ApiResponse;
import com.alms.shared.dto.PageMeta;
import com.alms.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@Tag(name = "Notifications")
@RequiredArgsConstructor
public class NotificationsController {

    private final NotificationsService notificationsService;

    @Operation(summary = "Get notifications for the current user")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> findAll(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Boolean unreadOnly,
            Pageable pageable) {
        Page<Notification> page = notificationsService.findByUser(user.getId(), unreadOnly, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page, "Notifications retrieved", PageMeta.of(page)));
    }

    @Operation(summary = "Get notification by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Notification>> findById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(notificationsService.findById(id), "Notification retrieved"));
    }

    @Operation(summary = "Mark a notification as read")
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markRead(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(notificationsService.markRead(id), "Notification marked as read"));
    }

    @Operation(summary = "Mark all notifications as read")
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal AuthenticatedUser user) {
        notificationsService.markAllRead(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "All notifications marked as read"));
    }

    @Operation(summary = "Delete a notification")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        notificationsService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Notification deleted"));
    }

    @Operation(summary = "Count unread notifications")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> countUnread(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(ApiResponse.ok(notificationsService.countUnread(user.getId()), "Unread count"));
    }
}
