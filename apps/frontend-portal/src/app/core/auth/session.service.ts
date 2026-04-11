// DEBT-033: SessionService — extraído de AuthService monolítico
// Gestiona estado de sesión del usuario (roles, perfil, estado login)
import { Injectable, signal } from '@angular/core';
import { TokenService } from './token.service';

export interface SessionUser {
  userId: string;
  email: string;
  roles: string[];
  fullName: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {

  private readonly _user = signal<SessionUser | null>(null);
  readonly user = this._user.asReadonly();

  constructor(private tokenService: TokenService) {}

  isAuthenticated(): boolean {
    return !this.tokenService.isTokenExpired() && this._user() !== null;
  }

  hasRole(role: string): boolean {
    return this._user()?.roles.includes(role) ?? false;
  }

  setUser(user: SessionUser): void {
    this._user.set(user);
  }

  clearSession(): void {
    this._user.set(null);
    this.tokenService.clearTokens();
  }

  getCurrentUserId(): string | null {
    return this._user()?.userId ?? this.tokenService.getUserIdFromToken();
  }
}
