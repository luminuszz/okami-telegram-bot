ARG NODE_VERSION=23.7.0
FROM node:${NODE_VERSION}-slim AS base
# NestJS app lives here
WORKDIR /app

# Install curl for healthcheck
# Install curl and wget
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=9.12.3
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install node modules
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Copy application code
COPY . .

# Build application
RUN pnpm run build


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

CMD  ["pnpm", "run", "start:prod"]
