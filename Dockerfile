# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app

# better-sqlite3 native build deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Standalone output keeps runtime image small
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# App runtime files for Next.js standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Keep prisma directory for SQLite file mount
RUN mkdir -p /app/prisma

EXPOSE 3000

CMD ["node", "server.js"]
