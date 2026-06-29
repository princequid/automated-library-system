package com.alms.interceptor;

import com.alms.shared.entity.AuditLog;
import com.alms.shared.repository.AuditLogRepository;
import com.alms.shared.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditInterceptor implements HandlerInterceptor {

    private final AuditLogRepository auditLogRepository;

    private static final Set<String> AUDITED_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    private static final Pattern ENTITY_PATTERN = Pattern.compile("/([a-z-]+)/([a-z0-9-]+)$");

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        String method = request.getMethod();
        if (!AUDITED_METHODS.contains(method)) return;
        if (response.getStatus() >= 400) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user)) return;

        String entityType = null;
        String entityId = null;
        Matcher matcher = ENTITY_PATTERN.matcher(request.getRequestURI());
        if (matcher.find()) {
            entityType = matcher.group(1);
            entityId = matcher.group(2);
        }

        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorId(user.getId())
                    .action(method)
                    .entityType(entityType)
                    .entityId(entityId)
                    .timestamp(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Failed to write audit log", e);
        }
    }
}
