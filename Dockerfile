# ==========================================
# Phase 3 - AIRRA Production Stage Dockerfile
# Optimized for Cloud Run & Railway Hosting
# ==========================================

# 1. Dependency Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies including build tools
COPY package*.json ./
RUN npm ci

# Copy codebase and compile TypeScript bundle
COPY . .
RUN NODE_ENV=production npm run build

# 2. Production Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary runtime assets and compiled CommonJS server bundle
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose production port
EXPOSE 3000

# Execute AIRRA's self-contained Node server
CMD ["npm", "run", "start"]
