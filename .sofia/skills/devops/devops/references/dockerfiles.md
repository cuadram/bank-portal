# Dockerfiles por stack — SOFIA

## Java / Spring Boot

```dockerfile
# Stage 1: Build con Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
# Cachear dependencias separado del código fuente
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Producción con JRE slim (sin JDK)
FROM eclipse-temurin:17-jre-alpine AS production
WORKDIR /app

# Mínimo privilegio
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/target/*.jar app.jar

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
```

**Variables de entorno esperadas (Spring Boot):**
```
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
```

---

## .Net / ASP.NET Core

```dockerfile
# Stage 1: Build con SDK completo
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS builder
WORKDIR /src
COPY *.csproj .
RUN dotnet restore --runtime linux-musl-x64
COPY . .
RUN dotnet publish -c Release \
    --runtime linux-musl-x64 \
    --self-contained false \
    -o /app/publish

# Stage 2: Producción con runtime slim
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS production
WORKDIR /app

# Mínimo privilegio
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "[NombreServicio].dll"]
```

**Variables de entorno esperadas (ASP.NET Core):**
```
ConnectionStrings__DefaultConnection
Jwt__Secret
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
```

---

## Angular

```dockerfile
# Stage 1: Build con Node
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Pasar configuración de ambiente al build
ARG ENVIRONMENT=production
RUN npm run build -- --configuration=${ENVIRONMENT}

# Stage 2: Servir estáticos con Nginx
FROM nginx:alpine AS production

# Copiar config Nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiar artefactos del build
COPY --from=builder /app/dist/[nombre-app]/browser /usr/share/nginx/html

# Mínimo privilegio — Nginx en modo no-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid
USER nginx

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf para Angular (SPA routing):**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión
    gzip on;
    gzip_types text/plain text/css application/json
               application/javascript text/xml application/xml;

    # Cache de assets estáticos con hash en nombre
    location ~* \.[0-9a-f]{16}\.(js|css|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — todas las rutas al index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

---

## React

```dockerfile
# Stage 1: Build con Node
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Variables de entorno de build — pasar como ARG
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 2: Servir estáticos con Nginx
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid
USER nginx

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

> **Nota React + Vite:** las variables `VITE_*` se embeben en el bundle
> en tiempo de build — no son secretos. Las URLs de API y feature flags
> se pasan como `ARG` en el pipeline. Los secrets nunca van en el frontend.

**nginx.conf para React (idéntica a Angular SPA):**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json
               application/javascript text/xml application/xml;
    location ~* \.[0-9a-f]{8}\.(js|css|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

---

## Node.js / NestJS (BFF / Gateway / Integraciones)

```dockerfile
# Stage 1: Instalar dependencias de producción
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Producción minimal
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup
USER appuser

COPY --from=deps     --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder  --chown=appuser:appgroup /app/dist         ./dist
COPY --from=builder  --chown=appuser:appgroup /app/package.json ./package.json

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

**Variables de entorno esperadas (NestJS):**
```
PORT=3000
NODE_ENV=production
DATABASE_URL
JWT_SECRET
UPSTREAM_API_URL
```
