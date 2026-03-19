# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

# Instalar dependencias (si existen)
COPY . .
RUN npm install --quiet 2>/dev/null; true

# Build Angular si existe angular.json, si no crear placeholder
RUN if [ -f "angular.json" ]; then \
      node node_modules/.bin/ng build --configuration=production --output-path=dist/bankportal; \
    else \
      mkdir -p dist/bankportal && \
      echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>BankPortal STG</title></head><body><h1>BankPortal v1.9.0-rc</h1><p>Frontend placeholder — STG</p></body></html>' > dist/bankportal/index.html; \
    fi

# ── STAGE 2: RUNTIME ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copiar dist desde builder
COPY --from=builder /build/dist/bankportal /usr/share/nginx/html

# Nginx config mínima con health endpoint
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    add_header X-Frame-Options "SAMEORIGIN";\n\
    add_header X-Content-Type-Options "nosniff";\n\
    location /health {\n\
        return 200 "ok";\n\
        add_header Content-Type text/plain;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
