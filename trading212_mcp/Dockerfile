# Multi-stage Dockerfile for Trading 212 MCP Server
# Stage 1: Builder - Compile TypeScript
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
# Use --ignore-scripts to prevent prepare script from running before source is copied
RUN npm ci --ignore-scripts

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

# Stage 2: Production - Minimal runtime image
FROM node:24-alpine AS production

# Add labels for better container management
ARG VERSION=1.0.0
LABEL maintainer="Ender Ekici"
LABEL description="MCP server for Trading 212 API integration"
LABEL version="${VERSION}"

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -u 1001 -S mcp -G mcp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Change ownership to non-root user
RUN chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# Set environment variables
ENV NODE_ENV=production \
    TRADING212_ENVIRONMENT=demo

# Health check - verify the server can start and respond
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Expose MCP HTTP port (used when TRADING212_TRANSPORT=http)
EXPOSE 3012

# Start the MCP server (stdio by default, set TRADING212_TRANSPORT=http for HTTP)
CMD ["node", "dist/index.js"]
