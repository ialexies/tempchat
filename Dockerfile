# Stage 1: Dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite-dev

# Copy package files
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies (devDependencies are needed for build)
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then \
      echo "Using npm ci (package-lock.json found)"; \
      npm ci; \
    else \
      echo "Using npm install (no package-lock.json)"; \
      npm install; \
    fi

# Copy all source files (excluding what's in .dockerignore)
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Verify required files exist
RUN echo "=== Checking Required Files ===" && \
    echo "Root files:" && ls -la | head -30 && \
    echo "" && \
    echo "Checking config files..." && \
    test -f next.config.js && echo "✓ next.config.js" || (echo "✗ ERROR: next.config.js missing" && exit 1) && \
    test -f tsconfig.json && echo "✓ tsconfig.json" || (echo "✗ ERROR: tsconfig.json missing" && exit 1) && \
    test -f postcss.config.js && echo "✓ postcss.config.js" || (echo "✗ ERROR: postcss.config.js missing" && exit 1) && \
    test -f tailwind.config.ts && echo "✓ tailwind.config.ts" || (echo "✗ ERROR: tailwind.config.ts missing" && exit 1) && \
    echo "" && \
    echo "Checking source directories..." && \
    test -d app && echo "✓ app/ directory exists" || (echo "✗ ERROR: app/ directory missing" && exit 1) && \
    test -d lib && echo "✓ lib/ directory exists" || (echo "✗ ERROR: lib/ directory missing" && exit 1) && \
    test -d types && echo "✓ types/ directory exists" || (echo "✗ ERROR: types/ directory missing" && exit 1) && \
    echo "" && \
    echo "=== All Required Files Found ==="

# Build arguments for environment variables needed at build time
ARG NEXT_PUBLIC_GIPHY_API_KEY
ENV NEXT_PUBLIC_GIPHY_API_KEY=${NEXT_PUBLIC_GIPHY_API_KEY:-}

# Build the application with maximum verbosity
RUN echo "=== Build Environment ===" && \
    node --version && \
    npm --version && \
    echo "PWD: $(pwd)" && \
    echo "" && \
    echo "=== Starting Next.js Build ===" && \
    NODE_OPTIONS="--max-old-space-size=4096" npm run build 2>&1 || { \
        echo ""; \
        echo "=== BUILD FAILED ==="; \
        echo "Exit code: $?"; \
        echo "Checking for error logs..."; \
        if [ -d .next ]; then \
            echo "Build directory exists, checking for error files..."; \
            find .next -name "*.log" -o -name "*error*" 2>/dev/null | head -10 || true; \
        fi; \
        exit 1; \
    } && \
    echo "" && \
    echo "=== Build Successful ===" && \
    echo "Checking build output..." && \
    ls -la .next/standalone 2>/dev/null && echo "✓ Standalone output exists" || echo "⚠ Standalone output check"

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies for native modules
RUN apk add --no-cache sqlite

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create data directory with proper permissions
RUN mkdir -p /app/data/uploads && \
    chown -R nextjs:nodejs /app/data /app/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

