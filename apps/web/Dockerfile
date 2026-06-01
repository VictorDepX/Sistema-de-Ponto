# ─── Builder ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN pwd
RUN ls -la

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN find . -maxdepth 3 -type d

RUN npm install --workspaces --include-workspace-root --legacy-peer-deps
RUN cd apps/web && npm run build

# ─── Nginx ────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
