# .Net Developer — ASP.NET Core Reference
## SOFIA Software Factory — Experis

> Este archivo es leído por el agente `dotnet-developer` junto con `developer-core/SKILL.md`.
> Aplica para servicios backend en .Net 8+ con ASP.NET Core.

---

## Stack oficial SOFIA — .Net Backend

```
Lenguaje:        C# 12+
Framework:       ASP.NET Core 8.x (Minimal APIs o Controllers)
ORM:             Entity Framework Core 8
Seguridad:       ASP.NET Core Identity + JWT Bearer
Mensajería:      MassTransit (RabbitMQ / Azure Service Bus)
Build:           dotnet CLI + .csproj / .sln
Tests:           xUnit + Moq + FluentAssertions
Contenedor:      Docker (mcr.microsoft.com/dotnet/aspnet:8.0)
Calidad:         SonarQube, Roslyn Analyzers, StyleCop
```

---

## Estructura de proyecto ASP.NET Core (monorepo)

```
apps/[NombreServicio]/
├── src/
│   ├── [NombreServicio].Domain/
│   │   ├── Entities/             # Entidades de dominio (POCO puro)
│   │   ├── Repositories/         # Interfaces (puertos)
│   │   ├── Services/             # Lógica de negocio del dominio
│   │   ├── ValueObjects/         # Value objects inmutables
│   │   └── Exceptions/           # Excepciones de dominio
│   ├── [NombreServicio].Application/
│   │   ├── UseCases/             # Un archivo por caso de uso
│   │   └── DTOs/                 # Request/Response records
│   ├── [NombreServicio].Infrastructure/
│   │   ├── Persistence/          # DbContext, implementaciones EF Core
│   │   │   └── Migrations/       # Migraciones EF Core
│   │   ├── Messaging/            # Consumers/Producers MassTransit
│   │   └── HttpClients/          # Typed HttpClients externos
│   └── [NombreServicio].Api/
│       ├── Controllers/          # Controllers o Minimal API endpoints
│       ├── Middleware/           # Auth, logging, error handling
│       └── Validators/           # FluentValidation validators
├── tests/
│   ├── [NombreServicio].Unit.Tests/
│   ├── [NombreServicio].Integration.Tests/
│   └── [NombreServicio].Tests.Common/   # Fixtures y builders compartidos
├── [NombreServicio].sln
├── Dockerfile
└── README.md
```

---

## Convenciones C# en SOFIA

### Naming
```csharp
// Namespaces: PascalCase con puntos
namespace Experis.Sofia.UserService.Domain.Entities;

// Interfaces: prefijo I obligatorio
public interface IUserRepository { }
public interface IPasswordHasher { }

// Clases: PascalCase
public class UserAccount { }

// Implementaciones: sin sufijo especial (el nombre describe)
public class UserRepository : IUserRepository { }

// DTOs: sufijo Request / Response — preferir records
public record CreateUserRequest(string Name, string Email);
public record UserResponse(Guid Id, string Name, string Email);

// Excepciones de dominio: sufijo Exception
public class UserNotFoundException : DomainException { }

// Constantes: PascalCase (no UPPER_SNAKE en C#)
public const int MaxLoginAttempts = 5;

// Campos privados: _camelCase con guion bajo
private readonly IUserRepository _userRepository;
```

### Value Objects inmutables con records
```csharp
public record Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidEmailException("Email cannot be empty");
        if (!Regex.IsMatch(value, @"^[\w.]+@[\w.]+\.[a-z]{2,}$"))
            throw new InvalidEmailException($"Invalid email format: {value}");
        Value = value.ToLowerInvariant();
    }
}
```

### Casos de uso — patrón estándar
```csharp
public class CreateUserUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    // Inyección por constructor SIEMPRE
    public CreateUserUseCase(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    /// <summary>
    /// Crea un nuevo usuario en el sistema.
    /// </summary>
    /// <param name="request">Datos del usuario a crear.</param>
    /// <returns>Respuesta con el usuario creado.</returns>
    /// <exception cref="UserAlreadyExistsException">
    /// Si el email ya está registrado.
    /// </exception>
    public async Task<UserResponse> ExecuteAsync(CreateUserRequest request)
    {
        // lógica aquí
    }
}
```

### Manejo de errores — middleware global
```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException ex)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(
                new ErrorResponse(ex.Code, ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error processing request");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(
                new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
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
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("Invalid email format");
    }
}
```

---

## Documentación XML Doc — obligatoria en miembros públicos

```csharp
/// <summary>
/// Procesa el pago de una orden validando fondos suficientes.
/// </summary>
/// <remarks>
/// El proceso incluye verificación de fondos, reserva temporal y
/// confirmación con el proveedor de pagos externo.
/// </remarks>
/// <param name="orderId">Identificador único de la orden.</param>
/// <param name="paymentMethod">Datos del método de pago.</param>
/// <returns>
/// <see cref="PaymentResult"/> con estado y referencia de transacción.
/// </returns>
/// <exception cref="InsufficientFundsException">
/// Si el saldo es insuficiente.
/// </exception>
public async Task<PaymentResult> ProcessPaymentAsync(
    Guid orderId, PaymentMethod paymentMethod) { }
```

---

## Tests — xUnit + Moq + FluentAssertions

```csharp
public class CreateUserUseCaseTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly CreateUserUseCase _useCase;

    public CreateUserUseCaseTests()
    {
        _useCase = new CreateUserUseCase(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldCreateUser_WhenEmailNotRegistered()
    {
        // Arrange
        var request = new CreateUserRequest("Ana García", "ana@example.com");
        _userRepositoryMock
            .Setup(r => r.ExistsByEmailAsync("ana@example.com"))
            .ReturnsAsync(false);

        // Act
        var result = await _useCase.ExecuteAsync(request);

        // Assert
        result.Email.Should().Be("ana@example.com");
        _userRepositoryMock.Verify(r => r.SaveAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldThrow_WhenEmailAlreadyRegistered()
    {
        // Arrange
        _userRepositoryMock
            .Setup(r => r.ExistsByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<UserAlreadyExistsException>(
            () => _useCase.ExecuteAsync(new CreateUserRequest("Ana", "ana@example.com")));
    }
}
```

### Naming de tests (obligatorio)
```
MethodName_ShouldExpectedBehavior_WhenCondition()
```

---

## Migraciones EF Core

```bash
# Crear nueva migración (desde carpeta del proyecto Infrastructure)
dotnet ef migrations add V{version}_{descripcion} --project ../Infrastructure --startup-project ../Api

# Aplicar migraciones
dotnet ef database update --project ../Infrastructure --startup-project ../Api
```

**Regla:** nunca editar una migración ya aplicada — crear una nueva.

---

## Checklist adicional .Net

```
□ Records usados para DTOs y Value Objects inmutables
□ FluentValidation configurado para todos los requests
□ GlobalExceptionMiddleware registrado en Program.cs
□ appsettings.json usa secrets en env vars (no hardcoded)
□ Ningún campo con [Inject] o instanciación directa — solo constructor DI
□ ILogger<T> inyectado, nivel correcto (Information/Warning/Error)
□ Dependencias en .csproj con versión fija
□ Migraciones EF Core creadas para cambios de esquema
```
