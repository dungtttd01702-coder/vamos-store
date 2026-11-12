# Multi-stage Dockerfile for VAMOS STORE
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including Tailwind for CSS build)
RUN npm ci --ignore-scripts

# Copy application files
COPY . .

# Build production Tailwind CSS
RUN npm run build:css

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js

USER node

EXPOSE 3000

CMD ["node", "server.js"]

