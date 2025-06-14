# Base image
FROM node:18-alpine AS base

# Common settings
WORKDIR /app

# ------------------------
# Dependencies stage
# ------------------------
FROM base AS deps

# Only install required system libs
RUN apk add --no-cache libc6-compat

# Copy lockfiles and install deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --no-frozen-lockfile; \
  else echo "No lockfile found" && exit 1; \
  fi

# ------------------------
# Build stage
# ------------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm run build; \
  else echo "No lockfile found" && exit 1; \
  fi

# ------------------------
# Production stage
# ------------------------
FROM base AS runner

# Create non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Setup app directory
WORKDIR /app

# Copy assets and standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prepare .next folder for caching (optional)
RUN mkdir -p .next && chown nextjs:nodejs .next

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
