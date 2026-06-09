# syntax=docker/dockerfile:1

# --- Build stage: install deps, generate Prisma client, build Next ---
FROM node:22-slim AS builder
WORKDIR /app

# OpenSSL is required by Prisma's query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Any valid sqlite URL satisfies `prisma generate` / `next build`; the real
# value is provided at runtime via CHOREDAY_DATABASE_URL.
ENV CHOREDAY_DATABASE_URL=file:./build.db

RUN npx prisma generate
RUN npm run build

# --- Runtime stage ---
FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Bring over the built app plus the deps needed to run it and apply migrations.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3500

# Apply any pending migrations against the volume DB, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
