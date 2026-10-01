# =============================================================================
# Frontend Dockerfile  — React + Vite → Nginx
# =============================================================================
# Stage 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
# Build with backend URL configurable at runtime via VITE_API_URL env var.
# During docker build we keep the default (Nginx reverse-proxy will handle /api/).
RUN npm run build

# =============================================================================
# Stage 2: Serve static assets via Nginx
# =============================================================================
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config that proxies /api to the backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
