# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — bankportal-frontend-portal
# Sprint 9 · v1.9.0 · FEAT-007
# Multi-stage: build (Node 22 / Angular) → runtime (Nginx Alpine)
# NOTA: Angular 17+ genera output en dist/<project>/browser/ (esbuild)
# ──────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

# Copiar package files para cachear dependencias
COPY package*.json ./
RUN npm install --legacy-peer-deps --quiet

# Copiar código y compilar con Angular en modo producción
COPY . .
RUN node node_modules/.bin/ng build --configuration=production \
        --output-path=dist/bankportal

# ── STAGE 2: RUNTIME NGINX ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="SOFIA DevOps Agent — Experis"
LABEL version="1.9.0"
LABEL project="BankPortal"
LABEL feature="FEAT-007"

# Angular 17+ (esbuild) genera los assets en dist/<project>/browser/
COPY --from=builder /build/dist/bankportal/browser /usr/share/nginx/html

# Configuración Nginx personalizada para Angular SPA + seguridad
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen       80;
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    # Cabeceras de seguridad
    add_header X-Frame-Options           "SAMEORIGIN"       always;
    add_header X-Content-Type-Options    "nosniff"          always;
    add_header X-XSS-Protection          "1; mode=block"    always;
    add_header Referrer-Policy           "no-referrer"      always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # index.html: nunca cachear
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        add_header Pragma "no-cache" always;
        expires 0;
        try_files $uri =404;
    }

    # SPA routing — todas las rutas Angular sirven index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache largo para assets con hash (Angular genera hashes en nombres)
    location ~* \.(js|css|png|jpg|gif|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check interno
    location /health {
        access_log off;
        return 200 '{"status":"UP"}';
        add_header Content-Type application/json;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
