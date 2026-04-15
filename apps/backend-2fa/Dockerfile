# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — bankportal-backend-2fa
# Sprint 18 · v1.18.0 · FEAT-016 Gestión de Tarjetas
# Multi-stage: build (Maven 3.9 / Java 21) → runtime (JRE 21 Alpine)
# ──────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Copiar solo el pom.xml primero para cachear dependencias Maven
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copiar código fuente y construir
COPY src ./src
RUN mvn package -Dmaven.test.skip=true -q

# ── STAGE 2: RUNTIME ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Metadatos de imagen
LABEL maintainer="SOFIA DevOps Agent — Experis"
LABEL version="1.18.0"
LABEL project="BankPortal"
LABEL feature="FEAT-016"
LABEL sprint="18"
LABEL pci_dss="req3-req8-req10"

WORKDIR /app

# Usuario no-root — seguridad OWASP / PCI-DSS
RUN addgroup -S meridian && adduser -S meridian -G meridian
USER meridian

# Copiar JAR desde builder — artifactId: bankportal-backend-2fa
COPY --from=builder --chown=meridian:meridian \
     /build/target/bankportal-backend-2fa-*.jar app.jar

# Variables de entorno (valores por defecto no sensibles)
# Secrets inyectados en runtime por Kubernetes SecretRef / docker .env
ENV SERVER_PORT=8080
ENV SPRING_PROFILES_ACTIVE=production
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

# Puerto expuesto
EXPOSE 8080

# Health check — Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:${SERVER_PORT}/actuator/health/liveness || exit 1

# Entrypoint
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar"]
