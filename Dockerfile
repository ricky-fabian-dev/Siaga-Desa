# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build production assets
RUN npm run build

# Stage 2: Production Server with Nginx
FROM nginx:alpine

# Copy built static files to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config to handle SPA client-side routing
RUN echo 'server { \
    listen 80; \
    listen [::]:80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /sw.js { \
        root /usr/share/nginx/html; \
        add_header Cache-Control "no-cache"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
