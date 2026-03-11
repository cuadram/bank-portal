# Java Developer — Spring Boot Reference
## SOFIA Software Factory — Experis

> Este archivo es leído por el agente `java-developer` junto con `developer-core/SKILL.md`.
> Aplica para servicios backend en Java 17+ con Spring Boot 3.x.

---

## Stack oficial SOFIA — Java Backend

```
Lenguaje:        Java 17+ (LTS)
Framework:       Spring Boot 3.x
ORM:             Spring Data JPA + Hibernate
Seguridad:       Spring Security + JWT
Mensajería:      Spring AMQP (RabbitMQ) | Spring Kafka
Build:           Maven 3.x (pom.xml)
Tests:           JUnit 5 + Mockito + AssertJ
Contenedor:      Docker (OpenJDK 17 slim)
Calidad:         SonarQube, Checkstyle, SpotBugs
```

---

## Estructura de proyecto Spring Boot (monorepo)

```
apps/[nombre-servicio]/
├── src/
│   ├── main/
│   │   ├── java/com/experis/sofia/[servicio]/
│   │   │   ├── domain/
│   │   │   │   ├── model/           # Entidades de dominio (@Entity o POJO puro)
│   │   │   │   ├── repository/      # Interfaces (puertos) — extienden JpaRepository
│   │   │   │   ├── service/         # Lógica de negocio del dominio
│   │   │   │   └── exception/       # Excepciones de dominio
│   │   │   ├── application/
│   │   │   │   ├── usecase/         # Un archivo por caso de uso
│   │   │   │   └── dto/             # Request/Response DTOs (record o clase)
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/     # Implementaciones JPA de repositorios
│   │   │   │   ├── messaging/       # Producers/Consumers
│   │   │   │   └── client/          # Feign clients o RestTemplate
│   │   │   └── api/
│   │   │       ├── controller/      # @RestController
│   │   │       ├── advice/          # @ControllerAdvice (manejo de errores)
│   │   │       └── validator/       # Validadores custom (@Constraint)
│   │   └── resources/
│   │       ├── application.yml      # Config por ambiente con profiles
│   │       └── db/migration/        # Flyway migrations (V1__init.sql, ...)
│   └── test/
│       └── java/com/experis/sofia/[servicio]/
│           ├── unit/
│           ├── integration/
│           └── fixture/             # Builders de datos de prueba
├── pom.xml
├── Dockerfile
└── README.md
```

---

## Convenciones Java en SOFIA

### Naming
```java
// Paquetes: lowercase con puntos
com.experis.sofia.userservice.domain.model

// Clases e interfaces: PascalCase
public class UserAccount { }
public interface UserRepository { }

// Interfaces de servicio: sufijo Service
public interface UserService { }

// Implementaciones: sufijo Impl
public class UserServiceImpl implements UserService { }

// DTOs: sufijo Request / Response
public record CreateUserRequest(String name, String email) { }
public record UserResponse(UUID id, String name) { }

// Excepciones de dominio: sufijo Exception
public class UserNotFoundException extends RuntimeException { }

// Constantes: UPPER_SNAKE_CASE
public static final int MAX_LOGIN_ATTEMPTS = 5;
```

### Entidades de dominio
```java
// Preferir Java Records para Value Objects inmutables
public record Email(String value) {
    public Email {
        Objects.requireNonNull(value);
        if (!value.matches("^[\\w.]+@[\\w.]+\\.[a-z]{2,}$"))
            throw new InvalidEmailException(value);
    }
}

// Entidades JPA: usar @Entity solo en infrastructure layer
// En domain layer las entidades son POJOs puros
```

### Casos de uso
```java
// Un caso de uso = una clase con un método execute()
@UseCase  // anotación custom o @Service
public class CreateUserUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Inyección por constructor SIEMPRE
    public CreateUserUseCase(UserRepository userRepository,
                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Crea un nuevo usuario en el sistema.
     * @param request datos del usuario a crear
     * @return respuesta con el usuario creado
     * @throws UserAlreadyExistsException si el email ya está registrado
     */
    public CreateUserResponse execute(CreateUserRequest request) {
        // lógica aquí
    }
}
```

### Manejo de errores — @ControllerAdvice
```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse("USER_NOT_FOUND", ex.getMessage()));
    }

    // NUNCA exponer stack traces al cliente
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);  // loguear internamente
        return ResponseEntity.status(500)
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

---

## Documentación Javadoc — obligatoria en métodos públicos

```java
/**
 * Procesa el pago de una orden validando fondos suficientes.
 *
 * <p>El proceso incluye verificación de fondos, reserva temporal
 * y confirmación con el proveedor de pagos externo.</p>
 *
 * @param orderId identificador único de la orden
 * @param paymentMethod datos del método de pago
 * @return {@link PaymentResult} con estado y referencia de transacción
 * @throws InsufficientFundsException si el saldo es insuficiente
 * @throws PaymentProviderException si el proveedor externo falla
 * @since 1.0.0
 */
public PaymentResult processPayment(UUID orderId, PaymentMethod paymentMethod) { }
```

---

## Tests — JUnit 5 + Mockito + AssertJ

```java
@ExtendWith(MockitoExtension.class)
class CreateUserUseCaseTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private CreateUserUseCase useCase;

    @Test
    @DisplayName("should create user when email is not registered")
    void execute_shouldCreateUser_whenEmailNotRegistered() {
        // Arrange
        var request = new CreateUserRequest("Ana García", "ana@example.com");
        when(userRepository.existsByEmail("ana@example.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        // Act
        var result = useCase.execute(request);

        // Assert
        assertThat(result.email()).isEqualTo("ana@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("should throw exception when email already exists")
    void execute_shouldThrow_whenEmailAlreadyRegistered() {
        // Arrange
        when(userRepository.existsByEmail(any())).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> useCase.execute(new CreateUserRequest("Ana", "ana@example.com")))
            .isInstanceOf(UserAlreadyExistsException.class);
    }
}
```

### Naming de tests (obligatorio)
```
methodName_shouldExpectedBehavior_whenCondition()
```

---

## Migraciones de base de datos — Flyway

```sql
-- Naming: V{version}__{descripcion_en_snake_case}.sql
-- Ejemplo: V1__create_users_table.sql

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Regla:** nunca modificar una migración ya ejecutada — crear una nueva.

---

## Checklist adicional Java

```
□ Usar Java Records para DTOs y Value Objects inmutables
□ @ControllerAdvice cubre todas las excepciones del dominio
□ Flyway migration creada para cambios de esquema
□ application.yml usa profiles (dev / stg / prod) con secrets en env vars
□ Ningún @Autowired en campo — solo inyección por constructor
□ Logs con SLF4J (@Slf4j de Lombok), nivel correcto (info/warn/error)
□ Dependencias en pom.xml con versión fija (no rangos LATEST)
```
