# Node.js Developer — Reference
## SOFIA Software Factory — Experis

> Este archivo es leído por el agente `nodejs-developer` junto con `developer-core/SKILL.md`.
> Aplica para servicios backend en Node.js con NestJS y TypeScript estricto.
> Uso principal en SOFIA: BFFs (Backend for Frontend), API Gateways, integraciones.

---

## Stack oficial SOFIA — Node.js Backend

```
Lenguaje:        TypeScript 5+ (strict mode obligatorio)
Framework:       NestJS 10+
ORM:             Prisma | TypeORM
Seguridad:       Passport.js + JWT + Guards de NestJS
Mensajería:      NestJS Microservices (RabbitMQ / Kafka)
Build:           pnpm + package.json / Nx (monorepo)
Tests:           Jest + Supertest (integración)
Contenedor:      Docker (node:20-alpine)
Calidad:         ESLint + Prettier + Husky
```

---

## Estructura de proyecto NestJS (monorepo)

```
apps/[nombre-servicio]/
├── src/
│   ├── domain/
│   │   ├── entities/              # Clases de dominio puras (sin decoradores NestJS)
│   │   ├── repositories/          # Interfaces (puertos)
│   │   └── services/              # Lógica de negocio del dominio
│   ├── application/
│   │   ├── use-cases/             # Un archivo por caso de uso
│   │   └── dtos/                  # Request/Response DTOs (class-validator)
│   ├── infrastructure/
│   │   ├── database/              # Prisma schema, implementaciones repositorios
│   │   ├── messaging/             # Producers/Consumers
│   │   └── http/                  # Axios clients externos
│   └── api/
│       ├── controllers/           # @Controller
│       ├── guards/                # @Guard (auth, roles)
│       ├── interceptors/          # Logging, transformación de respuesta
│       └── filters/               # @ExceptionFilter global
├── test/
│   ├── unit/
│   └── e2e/
├── prisma/
│   └── schema.prisma
├── package.json
├── Dockerfile
└── README.md
```

---

## Convenciones NestJS / TypeScript en SOFIA

### Naming
```typescript
// Archivos: kebab-case con sufijo del tipo
user.service.ts / user.controller.ts / user.repository.ts
create-user.use-case.ts / create-user.dto.ts

// Clases: PascalCase con sufijo
class UserService { }
class CreateUserUseCase { }
class UserController { }

// Interfaces: prefijo I
interface IUserRepository { }

// DTOs: class-validator con decoradores
class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;
}
```

### Módulo NestJS estándar
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [
    // Caso de uso
    CreateUserUseCase,
    // Binding del puerto al adaptador
    { provide: IUserRepository, useClass: UserRepository },
  ],
  exports: [CreateUserUseCase],
})
export class UserModule {}
```

### Casos de uso
```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(IUserRepository) private readonly userRepo: IUserRepository,
    private readonly passwordHasher: PasswordHasherService,
  ) {}

  /**
   * Crea un nuevo usuario en el sistema.
   * @param dto - Datos del usuario a crear
   * @returns Respuesta con el usuario creado
   * @throws ConflictException si el email ya está registrado
   */
  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const exists = await this.userRepo.existsByEmail(dto.email);
    if (exists) throw new ConflictException('Email already registered');
    // lógica...
  }
}
```

### Manejo de errores — ExceptionFilter global
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        code: exception.name,
        message: exception.message,
      });
    }

    // Nunca exponer detalles de errores inesperados
    this.logger.error('Unexpected error', exception);
    return response.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
}
```

---

## Documentación JSDoc — obligatoria en métodos públicos

```typescript
/**
 * Servicio para procesamiento de pagos con reintentos automáticos.
 *
 * @example
 * const result = await paymentService.process({ orderId, amount });
 */
@Injectable()
export class PaymentService {

  /**
   * Procesa un pago con reintentos en caso de fallo temporal.
   * @param dto - Datos del pago a procesar
   * @returns Resultado del pago con referencia de transacción
   * @throws ServiceUnavailableException si el proveedor no responde
   */
  async process(dto: ProcessPaymentDto): Promise<PaymentResultDto> { }
}
```

---

## Tests — Jest + Supertest

```typescript
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepo: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        { provide: IUserRepository, useValue: { existsByEmail: jest.fn(), save: jest.fn() } },
        { provide: PasswordHasherService, useValue: { hash: jest.fn().mockResolvedValue('hashed') } },
      ],
    }).compile();

    useCase = module.get(CreateUserUseCase);
    userRepo = module.get(IUserRepository);
  });

  it('should create user when email is not registered', async () => {
    // Arrange
    userRepo.existsByEmail.mockResolvedValue(false);
    const dto = { name: 'Ana García', email: 'ana@example.com' } as CreateUserDto;

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.email).toBe('ana@example.com');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException when email already exists', async () => {
    userRepo.existsByEmail.mockResolvedValue(true);
    await expect(useCase.execute({ name: 'Ana', email: 'ana@example.com' } as CreateUserDto))
      .rejects.toThrow(ConflictException);
  });
});
```

---

## Checklist adicional Node.js

```
□ TypeScript strict mode activo ("strict": true)
□ Sin any implícito — tipado explícito en toda la base de código
□ class-validator en todos los DTOs de entrada
□ GlobalExceptionFilter registrado en main.ts
□ Variables de entorno via @nestjs/config — nunca process.env directo en servicios
□ pnpm como package manager (no npm ni yarn)
□ package-lock equivalente (pnpm-lock.yaml) commiteado
□ Versiones fijas en package.json (sin ^ ni ~ en dependencias de producción)
□ Prisma schema actualizado y migración generada para cambios de modelo
```
