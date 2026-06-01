# ─── Builder ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# OpenSSL required by Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json turbo.json ./
COPY packages/types  ./packages/types
COPY packages/utils  ./packages/utils
COPY apps/api        ./apps/api

RUN npm install --workspaces --include-workspace-root --legacy-peer-deps

RUN cd apps/api && npx prisma generate

RUN cd apps/api && npm run build

RUN echo "=== DIST ==="
RUN find /app -type f | grep -E "main\.(js|mjs|cjs)$" || true
RUN find /app/apps/api -type d -name dist || true
RUN ls -R /app/apps/api/dist || true

# ─── Runner ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

RUN addgroup -S ponto && adduser -S ponto -G ponto

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./package.json

USER ponto

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/apps/api/src/main.js"]
