# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.11 AS build

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Keep the browser same-origin in the container. Nginx routes /api to the
# runtime-configurable BE upstream, so changing BE does not require rebuilding.
ARG VITE_API_BASE=
ENV VITE_API_BASE=${VITE_API_BASE}
RUN bun run build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /opt/erg-dist
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/docker/promote-release.sh /docker-entrypoint.d/15-promote-erg-release.sh
RUN chmod +x /docker-entrypoint.d/15-promote-erg-release.sh

ENV BACKEND_UPSTREAM=http://erg-spring:8080

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/healthz || exit 1

# The official nginx image performs envsubst on /etc/nginx/templates at start.
# BACKEND_UPSTREAM can therefore be changed with a container recreate only.
