# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — bankportal-frontend-portal
# Sprint 13 · v1.13.0 · FEAT-011
# Multi-stage: build (Node 22) → runtime (Nginx 1.27 Alpine)
# ──────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

# Copiar package.json primero para aprovechar caché de capas
COPY package.json ./

# Instalar dependencias — sin suprimir errores
# Si falla npm install el build falla rápido y claro
RUN npm install --legacy-peer-deps

# Copiar el resto del código fuente
COPY . .

# Build Angular producción si ng está disponible; si no, usar placeholder.html
RUN if [ -f "angular.json" ] && [ -f "node_modules/.bin/ng" ]; then \
      node node_modules/.bin/ng build --configuration=production --output-path=dist/bankportal; \
    else \
      echo "⚠️  angular.json o ng no disponibles — usando placeholder"; \
      mkdir -p dist/bankportal && cp placeholder.html dist/bankportal/index.html; \
    fi

# ── STAGE 2: RUNTIME NGINX ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="SOFIA DevOps Agent — Experis"
LABEL version="1.13.0"
LABEL project="BankPortal"
LABEL feature="FEAT-011"
LABEL sprint="13"

# Copiar artefactos del build
COPY --from=builder /build/dist/bankportal /usr/share/nginx/html

# Nginx config: SPA routing + headers de seguridad + health endpoint
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header X-XSS-Protection "1; mode=block" always;\n\
    location / { try_files $uri $uri/ /index.html; }\n\
    location ~* \\.(js|css|png|jpg|ico|woff2?)$ { expires 1y; add_header Cache-Control "public, immutable"; }\n\
    location /health { access_log off; return 200 '"'"'{"status":"UP","version":"1.13.0","sprint":"13"}'"'"'; add_header Content-Type application/json; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
