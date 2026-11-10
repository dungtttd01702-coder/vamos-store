# Multi-stage Dockerfile for VAMOS STORE
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including Tailwind for CSS build)
RUN npm ci

# Copy application files
COPY . .

# Build production Tailwind CSS
RUN npx tailwindcss -i ./src/public/css/input.css -o ./src/public/css/style.css --minify

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js

EXPOSE 3000

CMD ["node", "server.js"]

