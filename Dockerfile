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
# Public Firebase web config for FCM push (build-time; .env.* files are not in the build context).
ARG VITE_FIREBASE_API_KEY=
ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ARG VITE_FIREBASE_AUTH_DOMAIN=
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ARG VITE_FIREBASE_PROJECT_ID=
ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ARG VITE_FIREBASE_STORAGE_BUCKET=
ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
ARG VITE_FIREBASE_APP_ID=
ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
ARG VITE_FIREBASE_VAPID_KEY=
ENV VITE_FIREBASE_VAPID_KEY=${VITE_FIREBASE_VAPID_KEY}
RUN bun run build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /opt/erg-dist
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY deploy/docker/promote-release.sh /docker-entrypoint.d/15-promote-erg-release.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/15-promote-erg-release.sh && chmod +x /docker-entrypoint.d/15-promote-erg-release.sh

ENV BACKEND_UPSTREAM=http://erg-spring:8080

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/healthz || exit 1

# The official nginx image performs envsubst on /etc/nginx/templates at start.
# BACKEND_UPSTREAM can therefore be changed with a container recreate only.
