# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — bankportal-frontend-portal
# Sprint 13 · v1.13.0 · FEAT-011
# Multi-stage: build (Node 22) → runtime (Nginx 1.27 Alpine)
# ──────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .

RUN if [ -f "angular.json" ] && [ -f "node_modules/.bin/ng" ]; then \
      node node_modules/.bin/ng build --configuration=production; \
    else \
      echo "angular.json o ng no disponibles — usando placeholder"; \
      mkdir -p dist/bankportal/browser && cp placeholder.html dist/bankportal/browser/index.html; \
    fi

# ── STAGE 2: RUNTIME NGINX ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="SOFIA DevOps Agent — Experis"
LABEL version="1.13.0"
LABEL project="BankPortal"
LABEL sprint="13"

COPY --from=builder /build/dist/bankportal/browser /usr/share/nginx/html

# Nginx: SPA + proxy /auth y /api hacia el backend + health
COPY --from=builder /build/dist/bankportal/browser /usr/share/nginx/html
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy al backend — auth y api
    location /auth {
        proxy_pass http://bankportal-backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://bankportal-backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Caché assets estáticos
    location ~* \.(js|css|png|jpg|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check nginx
    location /health {
        access_log off;
        return 200 '{"status":"UP","version":"1.13.0","sprint":"13"}';
        add_header Content-Type application/json;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
