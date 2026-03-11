# Angular Developer — Reference
## SOFIA Software Factory — Experis

> Este archivo es leído por el agente `angular-developer` junto con `developer-core/SKILL.md`.
> Aplica para frontend en Angular 17+ con TypeScript estricto.

---

## Stack oficial SOFIA — Angular Frontend

```
Lenguaje:        TypeScript 5+ (strict mode obligatorio)
Framework:       Angular 17+ (Standalone Components)
Estado:          NgRx Signal Store | NgRx (proyectos complejos)
HTTP:            HttpClient con interceptors
Reactividad:     RxJS 7+ (Observables) + Angular Signals
Estilos:         SCSS + Angular Material | Tailwind
Tests:           Jest + Angular Testing Library
Build:           Angular CLI + Nx (monorepo)
Calidad:         ESLint + Prettier + Husky
```

---

## Estructura de proyecto Angular (monorepo Nx)

```
apps/[nombre-app]/
├── src/
│   ├── app/
│   │   ├── core/                  # Singleton services, guards, interceptors
│   │   │   ├── auth/
│   │   │   ├── interceptors/
│   │   │   └── guards/
│   │   ├── shared/                # Componentes, pipes, directivas reutilizables
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   ├── features/              # Módulos de feature (lazy loaded)
│   │   │   └── [feature-name]/
│   │   │       ├── components/    # Componentes de presentación (dumb)
│   │   │       ├── containers/    # Componentes de contenedor (smart)
│   │   │       ├── services/      # Servicios de feature
│   │   │       ├── store/         # NgRx state (actions, reducers, effects)
│   │   │       └── models/        # Interfaces y types del feature
│   │   └── app.config.ts          # Configuración standalone (no app.module)
│   ├── environments/
│   └── assets/
├── angular.json
├── jest.config.ts
└── README.md
```

---

## Convenciones Angular en SOFIA

### Standalone Components (Angular 17+)
```typescript
// Todos los componentes son standalone — NO usar NgModule
@Component({
  selector: 'sofia-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, UserAvatarComponent],
  templateUrl: './user-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,  // OBLIGATORIO
})
export class UserProfileComponent {
  // Signals para estado local
  readonly user = input.required<User>();
  readonly isLoading = signal(false);

  // inject() en lugar de constructor DI
  private readonly userService = inject(UserService);
}
```

### Smart vs Dumb Components
```typescript
// DUMB (presentación): solo @Input/@Output, sin servicios
@Component({ selector: 'sofia-user-card', standalone: true })
export class UserCardComponent {
  readonly user = input.required<User>();
  readonly delete = output<string>();   // emite userId
}

// SMART (contenedor): conecta store/servicios con dumb components
@Component({ selector: 'sofia-user-list-page', standalone: true })
export class UserListPageComponent {
  private readonly store = inject(Store);
  readonly users$ = this.store.select(selectAllUsers);
}
```

### Servicios — patrón estándar
```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);  // token de configuración

  /**
   * Obtiene el perfil del usuario autenticado.
   * @returns Observable con los datos del usuario
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // loguear internamente, nunca exponer al template
    return throwError(() => new Error(error.error?.message ?? 'Unknown error'));
  }
}
```

### RxJS — reglas de uso
```typescript
// SIEMPRE usar async pipe en templates — no suscribirse manualmente en componentes
// ✅ Correcto
<div *ngIf="users$ | async as users">

// ❌ Incorrecto — genera memory leaks
ngOnInit() { this.userService.getUsers().subscribe(u => this.users = u); }

// Cuando sea necesario suscribirse: usar takeUntilDestroyed()
private readonly destroy$ = inject(DestroyRef);
ngOnInit() {
  this.service.getData().pipe(
    takeUntilDestroyed(this.destroy$)
  ).subscribe();
}
```

### Angular Signals — para estado local y reactividad simple
```typescript
// Preferir Signals sobre BehaviorSubject para estado local
readonly count = signal(0);
readonly doubled = computed(() => this.count() * 2);

increment() { this.count.update(c => c + 1); }
```

---

## Documentación JSDoc — obligatoria en servicios y métodos públicos

```typescript
/**
 * Servicio para gestión de autenticación y sesión de usuario.
 *
 * @example
 * const auth = inject(AuthService);
 * auth.login(credentials).subscribe(token => console.log(token));
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  /**
   * Autentica al usuario y almacena el token de sesión.
   * @param credentials - Email y contraseña del usuario
   * @returns Observable con el token JWT
   * @throws {UnauthorizedException} Si las credenciales son inválidas
   */
  login(credentials: LoginCredentials): Observable<AuthToken> { }
}
```

---

## Tests — Jest + Angular Testing Library

```typescript
describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],  // standalone: importar directamente
      providers: [
        provideHttpClientTesting(),
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  });

  it('should display user name', () => {
    // Arrange
    const user = { id: '1', name: 'Ana García', email: 'ana@test.com' };
    fixture.componentRef.setInput('user', user);

    // Act
    fixture.detectChanges();

    // Assert
    const nameEl = fixture.nativeElement.querySelector('[data-testid="user-name"]');
    expect(nameEl.textContent).toBe('Ana García');
  });
});
```

### Atributos de test en templates (obligatorio)
```html
<!-- Usar data-testid para seleccionar elementos en tests -->
<h2 data-testid="user-name">{{ user().name }}</h2>
<button data-testid="delete-btn" (click)="onDelete()">Eliminar</button>
```

---

## Checklist adicional Angular

```
□ Todos los componentes son standalone (no NgModule)
□ ChangeDetectionStrategy.OnPush en todos los componentes
□ async pipe en templates — sin suscripciones manuales sin takeUntilDestroyed
□ TypeScript strict mode activo (tsconfig.json: "strict": true)
□ Sin any implícito — tipado explícito en toda la base de código
□ data-testid en elementos de UI interactivos o con contenido dinámico
□ Lazy loading configurado para todos los feature modules/routes
□ Variables de entorno en environment.ts (no hardcoded en servicios)
□ ESLint sin errores ni warnings ignorados
```
