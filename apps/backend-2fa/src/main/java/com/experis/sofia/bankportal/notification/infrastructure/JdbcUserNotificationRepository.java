package com.experis.sofia.bankportal.notification.infrastructure;

import com.experis.sofia.bankportal.notification.application.NotificationHistoryUseCase;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementacion JDBC de UserNotificationRepository - FEAT-004/014.
 */
@Repository
@RequiredArgsConstructor
public class JdbcUserNotificationRepository implements UserNotificationRepository {

    private final JdbcClient jdbc;

    @Override
    public UserNotification save(UserNotification n) {
        if (n.getId() == null) n.setId(UUID.randomUUID());
        try {
            int u = jdbc.sql("UPDATE user_notifications SET read_at=:ra WHERE id=:id")
                .param("ra", n.getReadAt() != null ? Timestamp.from(n.getReadAt()) : null)
                .param("id", n.getId()).update();
            if (u == 0)
                jdbc.sql("INSERT INTO user_notifications (id,user_id,event_type,title,body,action_url,created_at,unusual_location) " +
                         "VALUES (:id,:uid,:et,:title,:body,:url,:ca,:ul)")
                    .param("id",  n.getId()).param("uid",   n.getUserId())
                    .param("et",  n.getEventType()).param("title", n.getTitle())
                    .param("body",n.getBody()).param("url",  n.getActionUrl())
                    .param("ca",  n.getCreatedAt() != null ? n.getCreatedAt() : LocalDateTime.now())
                    .param("ul",  n.isUnusualLocation()).update();
        } catch (Exception ignored) {}
        return n;
    }

    @Override
    public Page<UserNotification> findByUserId(UUID userId, String eventTypeFilter, Pageable pageable) {
        try {
            String where = eventTypeFilter != null ? " AND event_type=:et" : "";
            var q = jdbc.sql("SELECT * FROM user_notifications WHERE user_id=:uid" + where +
                             " ORDER BY created_at DESC LIMIT :lim OFFSET :off")
                .param("uid", userId).param("lim", pageable.getPageSize()).param("off", pageable.getOffset());
            if (eventTypeFilter != null) q = q.param("et", eventTypeFilter);
            List<UserNotification> items = q.query(this::map).list();
            long total = Long.parseLong(
                jdbc.sql("SELECT COUNT(*) FROM user_notifications WHERE user_id=:uid" + where)
                    .param("uid", userId).query(Long.class).single().toString());
            return new PageImpl<>(items, pageable, total);
        } catch (Exception e) { return new PageImpl<>(List.of(), pageable, 0); }
    }

    @Override
    public Optional<UserNotification> findByIdAndUserId(UUID notificationId, UUID userId) {
        try {
            return jdbc.sql("SELECT * FROM user_notifications WHERE id=:id AND user_id=:uid")
                .param("id", notificationId).param("uid", userId).query(this::map).optional();
        } catch (Exception e) { return Optional.empty(); }
    }

    @Override
    public long countUnreadByUserId(UUID userId) {
        try {
            return jdbc.sql("SELECT COUNT(*) FROM user_notifications WHERE user_id=:uid AND read_at IS NULL")
                .param("uid", userId).query(Long.class).single();
        } catch (Exception e) { return 0L; }
    }

    @Override
    public List<UserNotification> findUnreadByUserId(UUID userId) {
        try {
            return jdbc.sql("SELECT * FROM user_notifications WHERE user_id=:uid AND read_at IS NULL")
                .param("uid", userId).query(this::map).list();
        } catch (Exception e) { return List.of(); }
    }

    @Override
    @Transactional
    public int markAllReadByUserId(UUID userId, Instant readAt) {
        try {
            return jdbc.sql("UPDATE user_notifications SET read_at=:ra WHERE user_id=:uid AND read_at IS NULL")
                .param("ra", Timestamp.from(readAt)).param("uid", userId).update();
        } catch (Exception e) { return 0; }
    }

    @Override
    @Transactional
    public int deleteExpiredBefore(Instant cutoff) {
        try {
            return jdbc.sql("DELETE FROM user_notifications WHERE created_at < :cutoff")
                .param("cutoff", Timestamp.from(cutoff)).update();
        } catch (Exception e) { return 0; }
    }

    private UserNotification map(java.sql.ResultSet rs, int n) throws java.sql.SQLException {
        UserNotification un = new UserNotification();
        un.setId((UUID) rs.getObject("id"));
        un.setUserId((UUID) rs.getObject("user_id"));
        un.setEventType(rs.getString("event_type"));
        un.setTitle(rs.getString("title"));
        un.setBody(rs.getString("body"));
        un.setActionUrl(rs.getString("action_url"));
        un.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        if (rs.getTimestamp("read_at") != null) un.setReadAt(rs.getTimestamp("read_at").toInstant());
        un.setUnusualLocation(rs.getBoolean("unusual_location"));
        return un;
    }
}
