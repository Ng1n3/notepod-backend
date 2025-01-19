FROM node:lts-alpine AS base

# Install additional security updates and requiired packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl tzdata postgresql-client && \
    rm -rf /var/cache/apk/*

# Create a non-root user and group if it doesn't exist
RUN getent group node || addgroup --system node && \
    id -u node &>/dev/null || adduser --system --ingroup node node

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

RUN pnpm install --frozen-lockfle --prod

COPY . .

# Change ownership to non-root user
RUN chown -R node:node /app

# Define the production stage
FROM base AS production

# Switch to non-root user
USER node

EXPOSE 4000

# Add health checks
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \ 
  CMD curl -f http://localhost:4000/graphql/health || exit 1

# Command to run the application in production
CMD [ "pnpm", "start" ]

# Definie the development stage
FROM base AS development

#switch to non-root user
USER node

EXPOSE 4000

CMD [ "pnpm", "dev" ]
