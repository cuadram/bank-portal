import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

/**
 * AuthGuard — protege /dashboard redirigiendo a /login si no hay JWT.
 * US-1101 FEAT-011 Sprint 13.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    if (token) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
