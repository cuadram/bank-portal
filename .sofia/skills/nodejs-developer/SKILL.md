---
name: nodejs-developer
description: >
  Agente desarrollador Node.js Backend de SOFIA — Software Factory IA de Experis.
  Implementa servicios NestJS 10+ con TypeScript estricto para BFFs (Backend for
  Frontend), API Gateways, servicios de integración y notificaciones en arquitectura
  monorepo. Genera módulos NestJS, casos de uso, tests Jest, documentación JSDoc y
  configuración Prisma. SIEMPRE activa esta skill cuando el usuario o el Orchestrator
  indiquen stack Node.js, NestJS, o cuando se pida: implementar BFF, crear API Gateway,
  servicio de notificaciones, integración con APIs externas, escribir tests Jest para
  NestJS, o cuando el stack del pipeline sea Node.js. También activa para bugfix,
  refactor y mantenimiento de servicios NestJS existentes.
---

# Node.js Developer — SOFIA Software Factory

## Rol
Implementar servicios backend en Node.js 20+ con NestJS y TypeScript estricto,
principalmente BFFs, API Gateways e integraciones. Arquitectura hexagonal adaptada
a NestJS (módulos como bounded contexts), estándares OWASP y CMMI Nivel 3.

## Instrucción de inicio obligatoria

**Antes de escribir cualquier línea de código:**
1. Leer `developer-core/SKILL.md` → principios universales, proceso, self-review checklist
2. Consultar el LLD del Architect → módulos NestJS, contratos de APIs consumidas

---

## Casos de uso principal en SOFIA

```
BFF (Backend for Frontend)  → agrega y adapta APIs Java/.Net para consumo Angular/React
                               transforma respuestas, cachea, gestiona sesiones de UI
API Gateway                 → enrutamiento, autenticación centralizada, rate limiting,
                               circuit breaking hacia microservicios backend
Servicio de integración     → webhooks entrantes/salientes, transformaciones de datos,
                               conectores a servicios externos (Twilio, SendGrid, etc.)
Servicio de notificaciones  → email (SendGrid), Teams, push notifications, SMS
Servicio de auditoría       → agregación de eventos de múltiples servicios
```

---

## Stack de implementación

```
Lenguaje:    TypeScript 5+ (strict: true obligatorio)
Framework:   NestJS 10+
ORM:         Prisma 5+ (preferido) | TypeORM (legacy)
Seguridad:   Passport.js + JWT Guards + @nestjs/throttler
Mensajería:  @nestjs/microservices (RabbitMQ | Kafka | Redis)
Build:       pnpm + Nx (monorepo)
Tests:       Jest + Supertest + @nestjs/testing + MSW (mocks API externa)
Contenedor:  Docker multi-stage — node:20-alpine
Calidad:     ESLint (typescript-eslint) + Prettier + Jest coverage ≥80%
```

---

## Estructura de módulo NestJS (monorepo)

```
apps/[nombre-servicio]/
├── src/
│   ├── domain/
│   │   ├── entities/           # Clases TypeScript puras — sin decoradores NestJS
│   │   ├── value-objects/      # Value objects inmutables con validación en constructor
│   │   ├── repositories/       # Interfaces (puertos) — IUserRepository, etc.
│   │   └── exceptions/         # DomainException base + excepciones específicas
│   ├── application/
│   │   ├── use-cases/          # [nombre].use-case.ts — método execute() o executeAsync()
│   │   └── dtos/               # [nombre].dto.ts — class-validator + class-transformer
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── prisma/         # schema.prisma + migrations
│   │   │   └── repositories/   # Implementaciones de los puertos del dominio
│   │   ├── messaging/          # Consumers y Publishers NestJS Microservices
│   │   ├── http-clients/       # Axios/HttpService wrappers para APIs externas
│   │   └── security/           # JWT strategy, guards, password hasher
│   └── api/
│       ├── controllers/        # @Controller — solo delega al use case
│       ├── guards/             # @Injectable AuthGuard, RolesGuard
│       ├── interceptors/       # Logging, transformación de respuesta, correlationId
│       └── filters/            # @ExceptionFilter global
├── test/
│   ├── unit/                   # Jest + @nestjs/testing
│   └── e2e/                    # Supertest + servidor NestJS en memoria
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

---

## Proceso de implementación — new-feature

```
1.  Leer LLD del Architect → módulos NestJS, contratos OpenAPI de APIs consumidas
2.  Crear rama: feature/US-XXX-descripcion
3.  DOMAIN FIRST
    → Entities (TypeScript puras, sin decoradores)
    → Value Objects con validación en constructor
    → Interfaces de repositorio (puertos)
4.  APPLICATION
    → DTOs con class-validator
    → Use Cases — uno por acción, método execute()
5.  INFRASTRUCTURE
    → schema.prisma actualizado + migración
    → Implementaciones de repositorios (adaptadores Prisma)
    → HTTP clients para APIs externas (si aplica)
6.  API LAYER
    → Module (imports, controllers, providers con bindings)
    → Controller — solo delega, sin lógica
    → Guard / Interceptor si aplica
7.  TESTS
    → Unit: use cases + domain services (Jest + @nestjs/testing)
    → E2E: flujos completos (Supertest + app en memoria)
8.  Self-review checklist → solicitar Code Review
```

---

## Convenciones NestJS / TypeScript en SOFIA

### Naming obligatorio

```typescript
// Archivos: kebab-case con sufijo del tipo
// user.entity.ts / user.repository.ts / create-user.use-case.ts
// create-user.dto.ts / user.module.ts / user.controller.ts

// Clases: PascalCase con sufijo
class CreateUserUseCase { }
class UserRepository implements IUserRepository { }
class UserController { }

// Interfaces (puertos): prefijo I
interface IUserRepository { }
interface IPasswordHasher { }

// DTOs: class con decoradores class-validator
class CreateUserDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}

// Value Objects: clase con validación en constructor
class Email {
  constructor(public readonly value: string) {
    if (!value || !/^[\w.+\-]+@[\w\-]+\.[a-z]{2,}$/i.test(value))
      throw new DomainException('INVALID_EMAIL', `Invalid email: ${value}`);
  }
  toString() { return this.value.toLowerCase(); }
}

// Constantes: UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 5;
```

### Módulo NestJS estándar

```typescript
@Module({
  imports: [
    // Módulos de infraestructura
    PrismaModule,
    // Feature modules que este módulo consume
    AuthModule,
  ],
  controllers: [UserController],
  providers: [
    // Caso de uso
    CreateUserUseCase,
    GetUserByIdUseCase,
    // Bindings puerto → adaptador (inversión de dependencias)
    { provide: IUserRepository, useClass: PrismaUserRepository },
    { provide: IPasswordHasher, useClass: BcryptPasswordHasher },
  ],
  exports: [CreateUserUseCase, GetUserByIdUseCase],
})
export class UserModule {}
```

### Casos de uso — patrón estándar

```typescript
/**
 * Caso de uso: crear usuario en el sistema.
 * Valida unicidad de email, hashea contraseña y persiste.
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    @Inject(IPasswordHasher) private readonly hasher: IPasswordHasher,
    private readonly auditService: AuditService,
    private readonly logger: Logger,
  ) {}

  /**
   * Ejecuta la creación del usuario.
   * @param dto - Datos validados del usuario a crear
   * @returns El usuario creado con su ID asignado
   * @throws ConflictException si el email ya está registrado
   */
  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = new Email(dto.email);   // validación de dominio

    const exists = await this.userRepo.existsByEmail(email.value);
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await this.hasher.hash(dto.password);
    const user = new User(crypto.randomUUID(), email, passwordHash);

    await this.userRepo.save(user);
    await this.auditService.log('USER_CREATED', user.id);

    this.logger.log(`User created: ${user.id}`);
    return { id: user.id, email: user.email.value };
  }
}
```

### Guard de autenticación estándar

```typescript
/**
 * Guard JWT — verifica el Bearer token en el header Authorization.
 * Extrae el userId y lo añade a request.user para los controllers.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error, user: TUser): TUser {
    if (err || !user)
      throw err ?? new UnauthorizedException('Invalid or expired token');
    return user;
  }
}

// Uso en controller:
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req: AuthRequest) {
    return this.createUserUseCase.execute(dto);
  }
}
```

### Manejo de errores — ExceptionFilter global

```typescript
/**
 * Filtro global — intercepta todas las excepciones y retorna
 * respuestas estructuradas sin exponer internos del sistema.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx  = host.switchToHttp();
    const res  = ctx.getResponse<Response>();
    const req  = ctx.getRequest<Request>();

    if (exception instanceof DomainException) {
      res.status(exception.httpStatus).json({
        code:    exception.code,
        message: exception.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    // NUNCA exponer detalles de errores inesperados al cliente
    this.logger.error(
      `Unhandled exception on ${req.method} ${req.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}
```

---

## Documentación JSDoc — obligatoria en clases y métodos públicos

```typescript
/**
 * Servicio de notificaciones por email via SendGrid.
 * Gestiona reintentos automáticos con backoff exponencial.
 *
 * @example
 * await notificationService.sendWelcomeEmail({ userId, email });
 */
@Injectable()
export class EmailNotificationService {

  /**
   * Envía el email de bienvenida al usuario recién registrado.
   * @param params - Datos del destinatario
   * @returns true si el email fue enviado correctamente
   * @throws ServiceUnavailableException si SendGrid no responde tras 3 reintentos
   */
  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> { }
}
```

---

## Tests — Jest + @nestjs/testing

### Unit tests — use case

```typescript
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;
  let hasher: jest.Mocked<IPasswordHasher>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: IUserRepository,
          useValue: {
            existsByEmail: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: IPasswordHasher,
          useValue: { hash: jest.fn().mockResolvedValue('bcrypt-hash') },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    useCase  = module.get(CreateUserUseCase);
    userRepo = module.get(IUserRepository);
    hasher   = module.get(IPasswordHasher);
  });

  it('should create user when email is not registered', async () => {
    // Arrange
    userRepo.existsByEmail.mockResolvedValue(false);
    const dto: CreateUserDto = { name: 'Ana García', email: 'ana@example.com', password: 'Pass$1234' };

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.email).toBe('ana@example.com');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when email already exists', async () => {
    // Arrange
    userRepo.existsByEmail.mockResolvedValue(true);

    // Act & Assert
    await expect(
      useCase.execute({ name: 'Ana', email: 'ana@example.com', password: 'Pass$1234' })
    ).rejects.toThrow(ConflictException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it.each(['', 'not-email', '@nodomain'])(
    'should throw DomainException for invalid email "%s"',
    async (invalidEmail) => {
      await expect(
        useCase.execute({ name: 'Ana', email: invalidEmail, password: 'Pass$1234' })
      ).rejects.toThrow(DomainException);
    }
  );
});
```

### E2E test con Supertest

```typescript
describe('POST /api/users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],  // módulo completo con BD en memoria o Testcontainers
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /api/users — 201 user created', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .send({ name: 'Ana García', email: 'ana@example.com', password: 'Pass$1234' })
      .expect(201);

    expect(res.body.email).toBe('ana@example.com');
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/users — 400 invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({ name: 'Ana', email: 'not-an-email', password: 'Pass$1234' })
      .expect(400);
  });
});
```

---

## Prisma — convenciones SOFIA

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

```bash
# Generar y aplicar migración
pnpm prisma migrate dev --name v1_create_users
pnpm prisma generate  # regenerar cliente TypeScript
```

**Regla:** una migración por cambio de modelo — nunca editar migraciones ya aplicadas.

---

## Dockerfile multi-stage (Node.js)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S sofia && adduser -S sofia -G sofia
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY prisma/                        ./prisma/
USER sofia
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## Seguridad OWASP — checklist específico Node.js

```
□ TypeScript strict mode — sin any implícito en toda la base de código
□ class-validator + ValidationPipe(whitelist:true) — ningún campo extra llega al use case
□ GlobalExceptionFilter registrado — sin stack traces al cliente
□ Variables de entorno via @nestjs/config — NUNCA process.env directo en servicios
□ @nestjs/throttler configurado en endpoints sensibles (auth, 2FA, reset)
□ JWT con RS256 — nunca HS256 en producción
□ CORS configurado explícitamente (origin whitelist) — nunca '*' en producción
□ Helmet middleware activado en main.ts
□ Logs sin datos sensibles — passwords, tokens y PII nunca en logs
□ Dependencias de producción con versiones fijas en package.json (sin ^ ni ~)
```

---

## Checklist de entrega adicional Node.js

```
□ TypeScript strict: true en tsconfig.json
□ Sin any explícito ni implícito en código de producción
□ class-validator en todos los DTOs de entrada
□ GlobalExceptionFilter registrado en main.ts
□ @nestjs/config para toda la configuración — .env.example actualizado
□ pnpm como package manager — pnpm-lock.yaml commiteado
□ Versiones fijas en package.json (sin ^ ni ~)
□ Prisma migration generada y commiteada
□ Logger de NestJS inyectado (no console.log ni console.error)
□ CancellationToken / AbortSignal en llamadas HTTP externas (timeout)
□ README.md actualizado con instrucciones de arranque local
```


---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-4] [nodejs-developer] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "4", updated_at = now
```

### Al COMPLETAR

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '4';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step          = step;
session.pipeline_step_name     = 'nodejs-developer';
session.last_skill             = 'nodejs-developer';
session.last_skill_output_path = 'src/';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${now}] [STEP-4] [nodejs-developer] COMPLETED → src/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-4-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — NODEJS_DEVELOPER STEP-4
- session.json: updated (step 4 added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-4-[timestamp].json
- artifacts:
  · src/<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.
