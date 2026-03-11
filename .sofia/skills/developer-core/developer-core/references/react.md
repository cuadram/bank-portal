# React Developer — Reference
## SOFIA Software Factory — Experis

> Este archivo es leído por el agente `react-developer` junto con `developer-core/SKILL.md`.
> Aplica para frontend en React 18+ con TypeScript estricto.

---

## Stack oficial SOFIA — React Frontend

```
Lenguaje:        TypeScript 5+ (strict mode obligatorio)
Framework:       React 18+ (Functional Components + Hooks exclusivamente)
Estado global:   Redux Toolkit | Zustand (proyectos más simples)
Estado server:   TanStack Query (React Query) v5
Routing:         React Router v6
Estilos:         Tailwind CSS | CSS Modules
Tests:           Vitest + React Testing Library
Build:           Vite + Nx (monorepo)
Calidad:         ESLint + Prettier + Husky
```

---

## Estructura de proyecto React (monorepo Nx)

```
apps/[nombre-app]/
├── src/
│   ├── app/                       # Configuración raíz (router, providers, store)
│   ├── features/                  # Módulos de feature
│   │   └── [feature-name]/
│   │       ├── components/        # Componentes de presentación (sin lógica externa)
│   │       ├── hooks/             # Custom hooks del feature
│   │       ├── api/               # Llamadas a API (React Query hooks)
│   │       ├── store/             # Redux slice | Zustand store del feature
│   │       ├── types/             # Interfaces y types del feature
│   │       └── index.ts           # Barrel export
│   ├── shared/
│   │   ├── components/            # Componentes reutilizables (Button, Modal, etc.)
│   │   ├── hooks/                 # Custom hooks reutilizables
│   │   └── utils/                 # Funciones utilitarias puras
│   └── main.tsx
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

---

## Convenciones React en SOFIA

### Functional Components — únicos permitidos
```typescript
// Siempre tipar las props con interface
interface UserCardProps {
  user: User;
  onDelete: (userId: string) => void;
  isLoading?: boolean;
}

/**
 * Muestra la información de un usuario con opción de eliminación.
 */
export const UserCard: React.FC<UserCardProps> = ({
  user,
  onDelete,
  isLoading = false,
}) => {
  return (
    <div data-testid="user-card">
      <h3 data-testid="user-name">{user.name}</h3>
      <button
        data-testid="delete-btn"
        onClick={() => onDelete(user.id)}
        disabled={isLoading}
      >
        Eliminar
      </button>
    </div>
  );
};
```

### Custom Hooks — para lógica reutilizable
```typescript
/**
 * Hook para gestionar el perfil del usuario autenticado.
 * @returns datos del usuario, estado de carga y función de actualización
 */
export function useUserProfile() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userApi.getProfile(),
    staleTime: 5 * 60 * 1000,  // 5 minutos
  });

  const updateProfile = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  });

  return { user, isLoading, error, updateProfile };
}
```

### TanStack Query — para estado del servidor
```typescript
// PREFERIR TanStack Query sobre useEffect + fetch para datos del servidor
// ✅ Correcto
const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// ❌ Incorrecto — antipatrón en React 18
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers);
}, []);
```

### Redux Toolkit — para estado global complejo
```typescript
// Slice estándar
const userSlice = createSlice({
  name: 'user',
  initialState: { profile: null, status: 'idle' } as UserState,
  reducers: {
    setProfile: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.profile = action.payload;
      });
  },
});
```

### Rules of Hooks — obligatorio
```typescript
// Hooks solo en el nivel superior del componente o custom hook
// ✅ Correcto
function MyComponent() {
  const [count, setCount] = useState(0);  // siempre en el top level
}

// ❌ Incorrecto — nunca en condicionales o loops
function MyComponent({ show }) {
  if (show) { const [x] = useState(0); }  // PROHIBIDO
}
```

---

## Documentación JSDoc — obligatoria en componentes y hooks públicos

```typescript
/**
 * Formulario de creación de usuario con validación integrada.
 *
 * @example
 * <CreateUserForm onSuccess={(user) => navigate(`/users/${user.id}`)} />
 */
export const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => { };

/**
 * Hook para gestionar el ciclo de autenticación.
 * @returns estado de autenticación y funciones de login/logout
 */
export function useAuth() { }
```

---

## Tests — Vitest + React Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('UserCard', () => {
  const mockUser: User = { id: '1', name: 'Ana García', email: 'ana@test.com' };
  const mockOnDelete = vi.fn();

  it('should display user name', () => {
    // Arrange
    render(<UserCard user={mockUser} onDelete={mockOnDelete} />);

    // Assert
    expect(screen.getByTestId('user-name')).toHaveTextContent('Ana García');
  });

  it('should call onDelete with userId when delete button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UserCard user={mockUser} onDelete={mockOnDelete} />);

    // Act
    await user.click(screen.getByTestId('delete-btn'));

    // Assert
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});
```

### Reglas de testing React (obligatorias)
```
- Usar getByTestId con data-testid para seleccionar elementos
- Usar userEvent sobre fireEvent (simula comportamiento real)
- No testear implementación interna — testear lo que el usuario ve/hace
- Para componentes con providers (Router, Store): crear renderWithProviders helper
- Para hooks: usar renderHook de @testing-library/react
```

### Helper de render con providers
```typescript
// tests/utils/renderWithProviders.tsx
export function renderWithProviders(
  ui: React.ReactElement,
  { store = setupStore(), ...options }: RenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
```

---

## Checklist adicional React

```
□ Solo Functional Components + Hooks — cero Class Components
□ TypeScript strict mode activo ("strict": true en tsconfig.json)
□ Sin any implícito — tipado explícito en props, hooks y funciones
□ data-testid en elementos interactivos y con contenido dinámico
□ TanStack Query para llamadas a API — sin useEffect+fetch directo
□ No mutar el estado directamente en Redux o useState
□ Keys únicas y estables en listas (nunca usar index como key si la lista puede cambiar)
□ Variables de entorno en import.meta.env (Vite) — nunca hardcoded
□ ESLint react-hooks plugin sin errores (dependencias de useEffect correctas)
```
