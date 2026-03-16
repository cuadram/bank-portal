/**
 * Modelos TypeScript del módulo session-management.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */

export interface DeviceInfo {
  os: string;
  browser: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

export interface ActiveSession {
  sessionId: string;
  os: string;
  browser: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ipMasked: string;
  lastActivity: string;   // ISO 8601
  createdAt: string;
  isCurrent: boolean;
}

export interface SessionState {
  sessions: ActiveSession[];
  timeoutMinutes: number;
  loading: boolean;
  revoking: string | null;   // sessionId en proceso de revocación
  error: string | null;
  evictedBannerVisible: boolean;
}

export interface UpdateTimeoutRequest {
  timeoutMinutes: 15 | 30 | 60;
}

export interface UpdateTimeoutResponse {
  timeoutMinutes: number;
}
