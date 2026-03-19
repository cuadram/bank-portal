# ──────────────────────────────────────────────────────────────────────────────
# Dockerfile — bankportal-frontend-portal
# Sprint 9 · v1.9.0 · FEAT-007
# Multi-stage: build (Node 22 / Angular) → runtime (Nginx Alpine)
# Nota: usa npm install (no npm ci) porque package-lock.json no está commiteado
# ──────────────────────────────────────────────────────────────────────────────

# ── STAGE 1: BUILD ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /build

# Copiar package files para cachear dependencias
COPY package*.json ./

# npm install en lugar de npm ci (no existe package-lock.json en el repo)
RUN npm install --quiet 2>/dev/null || npm install

# Copiar código fuente
COPY . .

# Build Angular producción — con fallback a placeholder si falta angular.json
RUN if [ -f "angular.json" ]; then \
      echo "✅ angular.json encontrado — build producción" && \
      node node_modules/.bin/ng build --configuration=production --output-path=dist/bankportal; \
    else \
      echo "⚠️  angular.json no encontrado — generando placeholder STG" && \
      mkdir -p dist/bankportal && \
      cat > dist/bankportal/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BankPortal — Banco Meridian</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #f4f6fb; display: flex;
           align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 48px;
            box-shadow: 0 4px 24px rgba(27,58,107,0.12); text-align: center;
            max-width: 480px; }
    .logo { width: 56px; height: 56px; background: #1B3A6B; border-radius: 12px;
            display: inline-flex; align-items: center; justify-content: center;
            margin-bottom: 24px; }
    .logo svg { fill: white; width: 32px; height: 32px; }
    h1 { color: #1B3A6B; font-size: 24px; margin-bottom: 8px; }
    p { color: #666; margin-bottom: 24px; line-height: 1.6; }
    .badge { display: inline-block; background: #e8f0fe; color: #1B3A6B;
             padding: 6px 16px; border-radius: 20px; font-size: 13px;
             font-weight: 600; }
    .version { margin-top: 32px; color: #aaa; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24"><path d="M11.5 1L2 6v2h19V6M16 10v7M12 10v7M8 10v7M2 19l1 2h18l1-2z"/></svg>
    </div>
    <h1>Banco Meridian</h1>
    <p>Portal de banca digital — Sprint 9 · FEAT-007<br>
       <strong>Build de producción pendiente</strong><br>
       El frontend Angular se desplegará cuando el angular.json esté disponible en el repositorio.</p>
    <span class="badge">v1.9.0-rc · STG</span>
    <div class="version">BankPortal · SOFIA DevOps Agent · 2026</div>
  </div>
</body>
</html>
HTMLEOF
    fi

# ── STAGE 2: RUNTIME NGINX ────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="SOFIA DevOps Agent — Experis"
LABEL version="1.9.0"
LABEL project="BankPortal"
LABEL feature="FEAT-007"

# Copiar artefactos del build (Angular compilado o placeholder)
COPY --from=builder /build/dist/bankportal /usr/share/nginx/html

# Configuración Nginx personalizada: SPA routing + headers de seguridad
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

    # SPA: todas las rutas sirven index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache largo para assets con hash
    location ~* \.(js|css|png|jpg|gif|ico|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check interno (para Docker + Compose)
    location /health {
        access_log off;
        return 200 '{"status":"UP","service":"bankportal-frontend","version":"1.9.0"}';
        add_header Content-Type application/json;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
