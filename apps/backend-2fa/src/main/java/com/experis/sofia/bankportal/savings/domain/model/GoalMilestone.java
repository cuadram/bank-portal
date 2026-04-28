package com.experis.sofia.bankportal.savings.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Hito de objetivo (25/50/75/100) — idempotente por UK (goal_id, percent).
 * RN-F024-09.
 */
public class GoalMilestone {
    private UUID id;
    private UUID goalId;
    private int percent;
    private Instant reachedAt;
    private UUID notificationId;

    public GoalMilestone() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }
    public int getPercent() { return percent; }
    public void setPercent(int percent) { this.percent = percent; }
    public Instant getReachedAt() { return reachedAt; }
    public void setReachedAt(Instant reachedAt) { this.reachedAt = reachedAt; }
    public UUID getNotificationId() { return notificationId; }
    public void setNotificationId(UUID notificationId) { this.notificationId = notificationId; }
}
