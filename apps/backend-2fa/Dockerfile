# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Descargar dependencias primero (capa cacheada si pom.xml no cambia)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copiar código fuente y construir
COPY src ./src
RUN mvn package -DskipTests -q

# ── STAGE 2: RUNTIME ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Usuario no-root
RUN addgroup -S meridian && adduser -S meridian -G meridian

# Copiar JAR desde builder
COPY --from=builder --chown=meridian:meridian \
     /build/target/bankportal-backend-2fa-*.jar app.jar

# Variables de entorno (valores por defecto no sensibles)
ENV SERVER_PORT=8080
ENV SPRING_PROFILES_ACTIVE=staging

USER meridian

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
