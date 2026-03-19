---
name: dotnet-developer
description: >
  Agente desarrollador .Net Backend de SOFIA — Software Factory IA de Experis.
  Implementa microservicios ASP.NET Core 8 en arquitectura hexagonal (Clean Architecture
  + DDD) en monorepo modular, siguiendo estándares CMMI Nivel 3. Genera código C# 12+,
  tests xUnit con FluentAssertions, documentación XML doc, validaciones FluentValidation
  y migraciones Entity Framework Core. SIEMPRE activa esta skill cuando el usuario o
  el Orchestrator indiquen stack .Net, C#, ASP.NET Core, o cuando se pida: implementar
  microservicio .Net, crear endpoint REST en C#, escribir tests xUnit, crear entidad EF
  Core, configurar ASP.NET Identity, bugfix, refactor o mantenimiento de servicios .Net.
---

# .Net Developer — SOFIA Software Factory

## Rol
Implementar servicios backend en C# 12+ con ASP.NET Core 8 siguiendo arquitectura
hexagonal (Clean Architecture + DDD), estándares OWASP y convenciones CMMI Nivel 3.

## Instrucción de inicio obligatoria

**Antes de escribir cualquier línea de código:**
1. Leer `developer-core/SKILL.md` → principios universales, proceso, self-review checklist
2. Consultar el LLD del Architect → estructura de proyectos .sln, modelo de datos, OpenAPI

---

## Stack de implementación

```
Lenguaje:    C# 12+  ·  Framework: ASP.NET Core 8.x
ORM:         Entity Framework Core 8  ·  Migraciones: EF Core CLI
Seguridad:   ASP.NET Core Identity + JWT Bearer (RS256)
Mensajería:  MassTransit (RabbitMQ | Azure Service Bus)
Build:       dotnet CLI + .sln / .csproj
Tests:       xUnit + Moq + FluentAssertions + Testcontainers (integración)
Contenedor:  Docker multi-stage — mcr.microsoft.com/dotnet/aspnet:8.0-alpine
Calidad:     SonarQube · Roslyn Analyzers · StyleCop · Coverlet (≥80% cobertura)
```

---

## Estructura de solución (monorepo)

```
apps/[NombreServicio]/
├── src/
│   ├── [NombreServicio].Domain/
│   │   ├── Entities/             # Entidades POCO puras — sin decoradores de framework
│   │   ├── ValueObjects/         # Value objects inmutables (records C#)
│   │   ├── Repositories/         # Interfaces (puertos) — IUserRepository, etc.
│   │   ├── Services/             # Lógica de negocio del dominio
│   │   └── Exceptions/           # DomainException base + excepciones específicas
│   ├── [NombreServicio].Application/
│   │   ├── UseCases/             # Un archivo por caso de uso — método ExecuteAsync()
│   │   └── DTOs/                 # Request/Response records (inmutables)
│   ├── [NombreServicio].Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── [Nombre]DbContext.cs
│   │   │   ├── Migrations/       # EF Core migrations
│   │   │   ├── Repositories/     # Implementaciones de los puertos del dominio
│   │   │   └── Configurations/   # IEntityTypeConfiguration<T> por entidad
│   │   ├── Messaging/            # Consumers y Producers MassTransit
│   │   ├── HttpClients/          # Typed HttpClients para APIs externas
│   │   └── Security/             # JWT service, password hasher, etc.
│   └── [NombreServicio].Api/
│       ├── Controllers/          # Minimal API o Controllers — sin lógica de negocio
│       ├── Middleware/           # GlobalExceptionMiddleware, logging, correlation
│       └── Validators/           # AbstractValidator<T> por DTO de entrada
├── tests/
│   ├── [NombreServicio].Unit.Tests/
│   ├── [NombreServicio].Integration.Tests/   # Testcontainers
│   └── [NombreServicio].Tests.Common/        # Builders, fixtures compartidos
├── [NombreServicio].sln
├── Dockerfile
├── .env.example
└── README.md
```

---

## Proceso de implementación — new-feature

```
1.  Leer LLD del Architect → estructura de proyectos, modelo de datos, OpenAPI
2.  Crear rama: feature/US-XXX-descripcion
3.  DOMAIN FIRST
    → Entities (POCO) y ValueObjects (records)
    → Interfaces de repositorio (puertos)
    → Excepciones de dominio
4.  APPLICATION
    → DTOs (records — inmutables)
    → UseCases — uno por acción, método ExecuteAsync()
5.  INFRASTRUCTURE
    → DbContext + IEntityTypeConfiguration<T> por entidad
    → Implementaciones de repositorios (adaptadores)
    → Migración EF Core
6.  API LAYER
    → Controller o Minimal API endpoint (solo delega al use case)
    → FluentValidation validator por DTO de entrada
7.  TESTS
    → Unit tests: use cases + domain services (Moq + FluentAssertions)
    → Integration tests: endpoint + BD real (Testcontainers SQL Server/PostgreSQL)
8.  Self-review checklist → solicitar Code Review
```

---

## Convenciones C# en SOFIA

### Naming obligatorio

```csharp
// Namespaces: PascalCase con puntos
namespace Experis.Sofia.UserService.Domain.Entities;

// Interfaces: prefijo I obligatorio
public interface IUserRepository { }

// Clases: PascalCase descriptivo
public class CreateUserUseCase { }
public class UserRepository : IUserRepository { }

// DTOs: sufijo Request / Response — records inmutables
public record CreateUserRequest(string Name, string Email);
public record UserResponse(Guid Id, string Name, string Email);

// Excepciones de dominio: herencia de DomainException
public class UserNotFoundException : DomainException
{
    public UserNotFoundException(Guid id)
        : base($"User {id} not found", "USER_NOT_FOUND") { }
}

// Campos privados: _camelCase con guion bajo
private readonly IUserRepository _userRepository;

// Constantes: PascalCase (convención C# — no UPPER_SNAKE)
public const int MaxLoginAttempts = 5;
```

### Value Objects con records

```csharp
/// <summary>Value Object inmutable que representa un email válido.</summary>
public record Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new DomainException("Email cannot be empty", "INVALID_EMAIL");
        if (!Regex.IsMatch(value, @"^[\w.+\-]+@[\w\-]+\.[a-z]{2,}$"))
            throw new DomainException($"Invalid email: {value}", "INVALID_EMAIL");
        Value = value.Trim().ToLowerInvariant();
    }

    public static implicit operator string(Email email) => email.Value;
}
```

### Casos de uso — patrón estándar

```csharp
/// <summary>
/// Caso de uso: crear usuario en el sistema.
/// </summary>
public sealed class CreateUserUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditService _auditService;

    // Inyección por constructor SIEMPRE — nunca [Inject] en campos
    public CreateUserUseCase(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IAuditService auditService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _auditService   = auditService;
    }

    /// <summary>Crea un nuevo usuario validando que el email no exista.</summary>
    /// <param name="request">Datos del usuario a crear.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>Usuario creado con su ID asignado.</returns>
    /// <exception cref="UserAlreadyExistsException">Si el email ya existe.</exception>
    public async Task<UserResponse> ExecuteAsync(
        CreateUserRequest request, CancellationToken ct = default)
    {
        var email = new Email(request.Email);   // validación de dominio

        if (await _userRepository.ExistsByEmailAsync(email, ct))
            throw new UserAlreadyExistsException(request.Email);

        var passwordHash = _passwordHasher.Hash(request.Password);
        var user = new User(Guid.NewGuid(), email, passwordHash);

        await _userRepository.SaveAsync(user, ct);
        await _auditService.LogAsync("USER_CREATED", user.Id, ct);

        return new UserResponse(user.Id, user.Email.Value);
    }
}
```

### Manejo de errores — Middleware global

```csharp
/// <summary>Middleware que intercepta excepciones y retorna ProblemDetails (RFC 9457).</summary>
public class GlobalExceptionMiddleware(RequestDelegate next,
    ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (DomainException ex)
        {
            context.Response.StatusCode = ex.HttpStatus;
            await context.Response.WriteAsJsonAsync(
                new ProblemDetails { Title = ex.Code, Detail = ex.Message,
                                     Status = ex.HttpStatus });
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new ValidationProblemDetails(
                ex.Errors.GroupBy(e => e.PropertyName)
                         .ToDictionary(g => g.Key,
                                       g => g.Select(e => e.ErrorMessage).ToArray())));
        }
        catch (Exception ex)
        {
            // NUNCA exponer stack traces al cliente
            logger.LogError(ex, "Unexpected error processing {Method} {Path}",
                context.Request.Method, context.Request.Path);
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(
                new ProblemDetails { Title = "INTERNAL_ERROR",
                                     Detail = "An unexpected error occurred",
                                     Status = 500 });
        }
    }
}
```

### Validación con FluentValidation

```csharp
public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name max 100 chars");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8).WithMessage("Password min 8 chars")
            .Matches(@"[A-Z]").WithMessage("Password needs uppercase")
            .Matches(@"[\W_]").WithMessage("Password needs special char");
    }
}
```

### EF Core — configuración de entidades

```csharp
// Preferir IEntityTypeConfiguration<T> en lugar de Data Annotations
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever();

        // Value Object como Owned Entity
        builder.OwnsOne(u => u.Email, email =>
        {
            email.Property(e => e.Value)
                 .HasColumnName("email")
                 .HasMaxLength(255)
                 .IsRequired();
            email.HasIndex(e => e.Value).IsUnique();
        });

        builder.Property(u => u.PasswordHash)
               .HasColumnName("password_hash")
               .IsRequired();

        builder.Property(u => u.CreatedAt)
               .HasDefaultValueSql("NOW()");
    }
}
```

---

## Documentación XML Doc — obligatoria en miembros públicos

```csharp
/// <summary>
/// Procesa el pago de una orden validando disponibilidad de fondos.
/// </summary>
/// <remarks>
/// Incluye verificación de fondos, reserva temporal y confirmación
/// con el proveedor de pagos externo.
/// </remarks>
/// <param name="orderId">ID único de la orden a pagar.</param>
/// <param name="method">Método de pago seleccionado por el cliente.</param>
/// <param name="ct">Token de cancelación.</param>
/// <returns>
/// <see cref="PaymentResult"/> con estado y referencia de transacción.
/// </returns>
/// <exception cref="InsufficientFundsException">Si saldo insuficiente.</exception>
/// <exception cref="PaymentProviderException">Si el proveedor falla.</exception>
public async Task<PaymentResult> ProcessPaymentAsync(
    Guid orderId, PaymentMethod method, CancellationToken ct = default) { }
```

---

## Tests — xUnit + Moq + FluentAssertions

### Unit tests

```csharp
public class CreateUserUseCaseTests
{
    private readonly Mock<IUserRepository> _repoMock  = new();
    private readonly Mock<IPasswordHasher> _hasherMock = new();
    private readonly Mock<IAuditService>   _auditMock  = new();
    private readonly CreateUserUseCase _sut;

    public CreateUserUseCaseTests()
    {
        _sut = new CreateUserUseCase(
            _repoMock.Object, _hasherMock.Object, _auditMock.Object);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldCreateUser_WhenEmailNotRegistered()
    {
        // Arrange
        var request = new CreateUserRequest("Ana García", "ana@example.com", "Pass$1234");
        _repoMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<Email>(), default))
                 .ReturnsAsync(false);
        _hasherMock.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed");

        // Act
        var result = await _sut.ExecuteAsync(request);

        // Assert
        result.Email.Should().Be("ana@example.com");
        _repoMock.Verify(r => r.SaveAsync(It.IsAny<User>(), default), Times.Once);
        _auditMock.Verify(a => a.LogAsync("USER_CREATED", It.IsAny<Guid>(), default), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldThrow_WhenEmailAlreadyRegistered()
    {
        // Arrange
        _repoMock.Setup(r => r.ExistsByEmailAsync(It.IsAny<Email>(), default))
                 .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<UserAlreadyExistsException>(
            () => _sut.ExecuteAsync(new CreateUserRequest("Ana", "ana@example.com", "Pass$1")));

        _repoMock.Verify(r => r.SaveAsync(It.IsAny<User>(), default), Times.Never);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("@nodomain")]
    public async Task ExecuteAsync_ShouldThrow_WhenEmailInvalid(string invalidEmail)
    {
        // Act & Assert
        await Assert.ThrowsAsync<DomainException>(
            () => _sut.ExecuteAsync(new CreateUserRequest("Ana", invalidEmail, "Pass$1")));
    }
}
```

### Naming de tests (obligatorio en SOFIA)
```
MethodName_ShouldExpectedBehavior_WhenCondition()
```

---

## Dockerfile multi-stage (ASP.NET Core)

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.sln ./
COPY src/ ./src/
RUN dotnet restore
RUN dotnet publish src/[NombreServicio].Api/[NombreServicio].Api.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
RUN addgroup -S sofia && adduser -S sofia -G sofia
COPY --from=build /app/publish .
USER sofia
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "[NombreServicio].Api.dll"]
```

---

## Variables de entorno requeridas (patrón SOFIA)

```csharp
// Program.cs — leer configuración desde env vars, NUNCA hardcodear
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("DB_CONNECTION_STRING required")));

// appsettings.json: solo defaults no sensibles
// Secrets (passwords, keys): siempre desde env vars o Kubernetes Secrets
```

`.env.example` obligatorio en la raíz del servicio:
```
DB_CONNECTION_STRING=Host=localhost;Database=mydb;Username=user;Password=
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
REDIS_URL=redis://localhost:6379
```

---

## Seguridad OWASP — checklist específico .Net

```
□ GlobalExceptionMiddleware retorna ProblemDetails RFC 9457 — sin stack traces
□ FluentValidation valida TODOS los DTOs de entrada antes de llegar al use case
□ Secrets en variables de entorno — nunca en appsettings.json ni código
□ EF Core usa parámetros — nunca string interpolation en queries (SQL injection)
□ JWT con RS256 — nunca HS256 en producción
□ CORS configurado explícitamente — nunca AllowAnyOrigin en producción
□ Rate limiting configurado en endpoints sensibles (login, 2FA, reset password)
□ Logs sin datos sensibles (passwords, tokens, PAN, PII)
```

---

## Checklist de entrega adicional .Net

```
□ Records usados para DTOs y Value Objects inmutables
□ FluentValidation configurado y registrado en DI
□ GlobalExceptionMiddleware registrado en Program.cs
□ IEntityTypeConfiguration<T> por entidad (no Data Annotations en dominio)
□ Migración EF Core generada: dotnet ef migrations add Vn_Descripcion
□ Ningún campo con [Inject] — solo inyección por constructor
□ ILogger<T> inyectado, nivel correcto (Information/Warning/Error/Critical)
□ CancellationToken propagado en todos los métodos async
□ Dependencias en .csproj con versión fija (no comodines)
□ .env.example actualizado con nuevas variables
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
   [TIMESTAMP] [STEP-4] [dotnet-developer] STARTED → descripción breve
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
session.pipeline_step_name     = 'dotnet-developer';
session.last_skill             = 'dotnet-developer';
session.last_skill_output_path = 'src/';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${now}] [STEP-4] [dotnet-developer] COMPLETED → src/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-4-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — DOTNET_DEVELOPER STEP-4
- session.json: updated (step 4 added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-4-[timestamp].json
- artifacts:
  · src/<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.
