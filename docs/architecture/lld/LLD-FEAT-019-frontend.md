# LLD — Low Level Design Frontend
## FEAT-019: Centro de Privacidad y Perfil de Usuario
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 21 | **Stack:** Angular 17 / TypeScript  
**SOFIA Step:** 3 — Architect | **Fecha:** 2026-03-31

---

## 1. Estructura de módulos Angular

```
apps/frontend-portal/src/app/
├── features/
│   ├── profile/                          # Reemplaza placeholder existente
│   │   ├── profile.module.ts             # Lazy-loaded module
│   │   ├── profile-routing.module.ts
│   │   ├── components/
│   │   │   ├── profile-view/
│   │   │   │   ├── profile-view.component.ts
│   │   │   │   ├── profile-view.component.html
│   │   │   │   └── profile-view.component.scss
│   │   │   ├── profile-edit/
│   │   │   │   ├── profile-edit.component.ts
│   │   │   │   ├── profile-edit.component.html
│   │   │   │   └── profile-edit.component.scss
│   │   │   └── sessions-list/
│   │   │       ├── sessions-list.component.ts
│   │   │       ├── sessions-list.component.html
│   │   │       └── sessions-list.component.scss
│   │   └── services/
│   │       └── profile.service.ts        # HTTP client para /api/v1/profile
│   │
│   └── privacy/                          # Módulo nuevo
│       ├── privacy.module.ts             # Lazy-loaded module
│       ├── privacy-routing.module.ts
│       ├── components/
│       │   ├── privacy-center/
│       │   │   ├── privacy-center.component.ts  # Hub principal
│       │   │   ├── privacy-center.component.html
│       │   │   └── privacy-center.component.scss
│       │   ├── consent-manager/
│       │   │   ├── consent-manager.component.ts
│       │   │   ├── consent-manager.component.html
│       │   │   └── consent-manager.component.scss
│       │   ├── data-export/
│       │   │   ├── data-export.component.ts
│       │   │   ├── data-export.component.html
│       │   │   └── data-export.component.scss
│       │   └── deletion-request/
│       │       ├── deletion-request.component.ts  # Flujo multi-paso
│       │       ├── deletion-request.component.html
│       │       └── deletion-request.component.scss
│       └── services/
│           └── privacy.service.ts        # HTTP client para /api/v1/privacy
│
├── core/
│   └── models/
│       ├── profile.model.ts              # interfaces ProfileResponse, SessionResponse
│       └── privacy.model.ts             # interfaces ConsentResponse, GdprRequestResponse
```

---

## 2. Registro en router + shell (LA-FRONT-001 — BLOQUEANTE)

### app-routing.module.ts
```typescript
// OBLIGATORIO: registrar rutas lazy antes de cualquier merge
{
  path: 'perfil',
  loadChildren: () =>
    import('./features/profile/profile.module').then(m => m.ProfileModule),
  canActivate: [AuthGuard]
},
{
  path: 'privacidad',
  loadChildren: () =>
    import('./features/privacy/privacy.module').then(m => m.PrivacyModule),
  canActivate: [AuthGuard]
}
```

### shell.component.ts — nav items a añadir
```typescript
// Añadir a navItems array existente
{ label: 'Mi Perfil',             icon: 'person',   route: '/perfil'     },
{ label: 'Centro de Privacidad',  icon: 'lock',      route: '/privacidad' }
```

**Verificación Gate G-4 (LA-FRONT-001):**
```bash
grep -n "perfil\|privacidad" apps/frontend-portal/src/app/app-routing.module.ts
grep -n "perfil\|privacidad" apps/frontend-portal/src/app/core/components/shell/shell.component.ts
# Ambos grep deben devolver resultados — si no: BLOQUEANTE
```

---

## 3. ProfileService — contrato HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly baseUrl = '/api/v1/profile';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.baseUrl);
  }

  updateProfile(dto: ProfileUpdateRequest): Observable<ProfileResponse | OtpRequiredResponse> {
    return this.http.patch<ProfileResponse | OtpRequiredResponse>(this.baseUrl, dto);
  }

  confirmPhoneUpdate(dto: PhoneUpdateRequest): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(`${this.baseUrl}/phone-confirm`, dto);
  }

  getSessions(): Observable<SessionResponse[]> {
    return this.http.get<SessionResponse[]>(`${this.baseUrl}/sessions`);
  }

  closeSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sessions/${sessionId}`);
  }
}
```

---

## 4. PrivacyService — contrato HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly baseUrl = '/api/v1/privacy';

  constructor(private http: HttpClient) {}

  getConsents(): Observable<ConsentResponse[]> {
    return this.http.get<ConsentResponse[]>(`${this.baseUrl}/consents`);
  }

  updateConsent(dto: ConsentUpdateRequest): Observable<ConsentResponse> {
    return this.http.patch<ConsentResponse>(`${this.baseUrl}/consents`, dto);
  }

  requestDataExport(): Observable<DataExportResponse> {
    return this.http.post<DataExportResponse>(`${this.baseUrl}/data-export`, {});
  }

  getExportStatus(): Observable<DataExportResponse> {
    return this.http.get<DataExportResponse>(`${this.baseUrl}/data-export/status`);
  }

  requestDeletion(dto: DeletionRequestDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/deletion-request`, dto);
  }
}
```

---

## 5. Modelos TypeScript

```typescript
// profile.model.ts
export interface ProfileResponse {
  userId: string;
  nombre: string;
  apellidos: string;
  telefono: string;       // enmascarado: "+34 ***-**-89"
  email: string;          // solo lectura
  direccion: DireccionDto;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ProfileUpdateRequest {
  nombre?: string;
  apellidos?: string;
  telefonoNuevo?: string; // si presente → flujo OTP
  direccion?: DireccionDto;
}

export interface PhoneUpdateRequest {
  otpCode: string;
  otpToken: string;
}

export interface SessionResponse {
  sessionId: string;
  dispositivo: string;
  ipMasked: string;
  lastAccess: string;
  isCurrent: boolean;
  createdAt: string;
}

// privacy.model.ts
export type ConsentType = 'MARKETING' | 'ANALYTICS' | 'COMMUNICATIONS' | 'SECURITY';

export interface ConsentResponse {
  tipo: ConsentType;
  activo: boolean;
  updatedAt: string;
  version: number;
}

export interface ConsentUpdateRequest {
  tipo: ConsentType;
  activo: boolean;
}

export interface DataExportResponse {
  requestId: string;
  estado: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  slaDeadline?: string;
}

export interface DeletionRequestDto {
  otpCode: string;
}
```

---

## 6. ProfileViewComponent — Patrón ActivatedRoute (LA-019-11)

```typescript
@Component({
  selector: 'app-profile-view',
  changeDetection: ChangeDetectionStrategy.Default  // NO OnPush — evitar LA-019-14
})
export class ProfileViewComponent implements OnInit, OnDestroy {
  profile$: Observable<ProfileResponse>;
  sessions$: Observable<SessionResponse[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private route: ActivatedRoute  // SIEMPRE ActivatedRoute, nunca snapshot para rutas dinámicas
  ) {}

  ngOnInit(): void {
    // LA-019-11: suscribirse a paramMap observable, no snapshot
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.profileService.getProfile())
    ).subscribe(profile => {
      this.profile = profile;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## 7. DeletionRequestComponent — Flujo multi-paso

```typescript
@Component({ selector: 'app-deletion-request' })
export class DeletionRequestComponent {
  step: 1 | 2 | 3 = 1;
  otpCode = '';

  constructor(
    private privacyService: PrivacyService,
    private router: Router
  ) {}

  // Paso 1 → 2: usuario acepta información
  proceedToOtp(): void { this.step = 2; }

  // Paso 2 → 3: envío OTP al backend
  submitOtp(): void {
    this.privacyService.requestDeletion({ otpCode: this.otpCode })
      .subscribe({
        next: () => { this.step = 3; },
        error: (err) => { /* mostrar error OTP inválido */ }
      });
  }

  // Paso 3: usuario confirma haber visto el email
  close(): void { this.router.navigate(['/']); }
}
```

---

## 8. Checklist verificación antes de Gate G-4 (LA-FRONT-001, LA-FRONT-002, LA-FRONT-004)

```
□ features/profile/profile.module.ts registrado en app-routing.module.ts con ruta /perfil
□ features/privacy/privacy.module.ts registrado en app-routing.module.ts con ruta /privacidad
□ Ambas rutas añadidas a shell.component.ts nav items
□ ProfileViewComponent NO es placeholder — hace GET /api/v1/profile real
□ PrivacyCenterComponent NO es placeholder — hace GET /api/v1/privacy/consents real
□ /api/v1/profile endpoint existe en backend (implementado en mismo sprint)
□ /api/v1/privacy/consents endpoint existe en backend (implementado en mismo sprint)
□ Import paths calculados desde profundidad real del fichero (LA-FRONT-003)
□ docker compose build frontend ejecutado tras cambios en source (LA-FRONT-005)
```

---

*Generado por SOFIA v2.3 — Step 3 Architect (LLD Frontend) — Sprint 21 — 2026-03-31*  
*Estado: DRAFT — Pendiente Gate G-3 (aprobación Tech Lead)*
