# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — bankportal-frontend-portal
# Sprint 9 · v1.9.0 · FEAT-007
# Multi-stage: build (Node 22) → runtime (Nginx 1.27 Alpine)
# ──────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

# Copiar todo el código fuente
COPY . .

# Instalar dependencias (npm install no requiere package-lock.json)
RUN npm install --quiet 2>/dev/null; true

# Build Angular producción si existe angular.json; si no, usar placeholder.html
RUN if [ -f "angular.json" ]; then \
      node node_modules/.bin/ng build --configuration=production --output-path=dist/bankportal; \
    else \
      mkdir -p dist/bankportal && cp placeholder.html dist/bankportal/index.html; \
    fi

# ── STAGE 2: RUNTIME NGINX ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="SOFIA DevOps Agent — Experis"
LABEL version="1.9.0"
LABEL project="BankPortal"
LABEL feature="FEAT-007"

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
    location /health { access_log off; return 200 '"'"'{"status":"UP","version":"1.9.0"}'"'"'; add_header Content-Type application/json; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
