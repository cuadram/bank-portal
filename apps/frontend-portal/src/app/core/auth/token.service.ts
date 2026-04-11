// DEBT-033: TokenService — extraído de AuthService monolítico (380 líneas)
// Gestiona exclusivamente el ciclo de vida del JWT
import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'bp_access_token';
const REFRESH_KEY = 'bp_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenService {

  setTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  }

  clearTokens(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  }

  isTokenExpired(token: string | null = this.getAccessToken()): boolean {
    if (!token) return true;
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  getUserIdFromToken(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const decoded = jwtDecode<{ sub: string }>(token);
      return decoded.sub ?? null;
    } catch {
      return null;
    }
  }
}
