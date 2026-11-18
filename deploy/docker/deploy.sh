#!/usr/bin/env bash
# Deploy one frontend commit on the ERG server. Started by the backend repo's ops/docker/ci-entry.sh
# (GitHub Actions -> SSH), which unpacks the commit into /opt/erg/fe-src and runs this copy:
#   bash /opt/erg/fe-src/deploy/docker/deploy.sh <git-sha>
# By hand from a checkout:
#   git -c core.autocrlf=false archive <sha> | ssh erg@ssh.erg.edu.vn \
#     'rm -rf /opt/erg/fe-src && mkdir -p /opt/erg/fe-src && tar xf - -C /opt/erg/fe-src && bash /opt/erg/fe-src/deploy/docker/deploy.sh <sha>'
# Steps: build the image, start it on 127.0.0.1:8081 (the Cloudflare tunnel's target), wait for /healthz,
# and go back to the previous image when the new one does not become healthy.
set -Eeuo pipefail
# The build takes every core for minutes, so it runs outside school hours, like the backend's deploy.sh.
in_school_hours() { local m=$((10#${1%:*} * 60 + 10#${1#*:})); [ "$m" -ge 390 ] && [ "$m" -lt 1290 ]; }
NOW_VN=${DEPLOY_NOW_HHMM:-$(TZ=Asia/Ho_Chi_Minh date +%H:%M)}
if in_school_hours "$NOW_VN" && [ "${FORCE:-0}" != 1 ]; then
  echo "Từ chối deploy frontend lúc $NOW_VN giờ Việt Nam: trong giờ học 06:30-21:30. Deploy sau 21:30 hoặc đặt FORCE=1." >&2
  exit 75
fi
SHA=${1:?usage: deploy.sh <git-sha>}
SRC=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
FE_DIR=${ERG_FE_DIR:-/opt/erg/fe}
# Public build-time values (VITE_FIREBASE_*); created empty on a new server. Not secrets, but kept off the repo.
FE_ENV=$FE_DIR/.env
OPS_ENV=${ERG_OPS_ENV:-/opt/erg/ops/docker/.env.production}
NAME=erg-system-fe
IMAGE=erg-system-fe:$SHA
STEP=start

log() { STEP=$*; echo "=== [$(date -u +%H:%M:%S)] $*"; }
# Telegram notice with the ops stack's bot token; the token goes through curl's stdin so it never shows in `ps`.
envval() { grep -E "^$1=" "$OPS_ENV" 2>/dev/null | tail -n1 | cut -d= -f2- || true; }
notify() {
  local token chat
  token=$(envval TELEGRAM_BOT_TOKEN); chat=$(envval TELEGRAM_CHAT_ID)
  [ -n "$token" ] && [ -n "$chat" ] || return 0
  curl -fsS -m 15 -o /dev/null -K - --data-urlencode "chat_id=$chat" --data-urlencode "text=$1" \
    <<<"url = \"https://api.telegram.org/bot$token/sendMessage\"" || true
}
trap 'trap - ERR; notify "❌ Deploy frontend ${SHA:0:7} lỗi ở bước \"$STEP\" (dòng $LINENO). Bản đang chạy không bị đổi."' ERR

up() { # $1 image
  FE_IMAGE=$1 FE_PORT=127.0.0.1:8081 BACKEND_UPSTREAM=http://nginx:8080 docker compose -p erg-fe \
    --project-directory "$SRC" -f "$SRC/docker-compose.yml" -f "$SRC/deploy/docker/compose.server.yml" up -d --no-build
}
wait_healthy() {
  local s
  for _ in $(seq 1 60); do
    s=$(docker inspect -f '{{.State.Health.Status}} {{.State.Running}}' "$NAME" 2>/dev/null || echo missing)
    case "$s" in "healthy true") return 0;; *false|unhealthy*|missing) break;; esac; sleep 2
  done
  echo "$NAME did not become healthy ($s)"; docker logs --tail 20 "$NAME" 2>&1 || true; return 1
}

install -d -m 700 "$FE_DIR"; [ -f "$FE_ENV" ] || install -m 600 /dev/null "$FE_ENV"

log "build $IMAGE"
build_args=()
while IFS= read -r line; do if [[ $line == VITE_*=* ]]; then build_args+=(--build-arg "$line"); fi; done < "$FE_ENV"
DOCKER_BUILDKIT=1 nice -n 10 docker build -q "${build_args[@]}" \
  --label org.opencontainers.image.revision="$SHA" -t "$IMAGE" "$SRC" >/dev/null

log "switch to $IMAGE"
PREVIOUS=$(docker inspect -f '{{.Config.Image}}' "$NAME" 2>/dev/null || true)
trap - ERR
up "$IMAGE"
if ! wait_healthy; then
  if [ -n "$PREVIOUS" ] && [ "$PREVIOUS" != "$IMAGE" ] && up "$PREVIOUS" && wait_healthy; then
    notify "❌ Frontend ${SHA:0:7} không healthy nên đã TỰ QUAY LẠI $PREVIOUS."
  else
    notify "❌ Frontend ${SHA:0:7} không healthy và không quay lại được bản trước: cần người xử lý ngay."
  fi
  exit 1
fi

# Keep this image and the previous one (for a manual rollback); drop older builds.
docker images erg-system-fe --format '{{.Repository}}:{{.Tag}}' | grep -vxF -e "$IMAGE" -e "${PREVIOUS:-$IMAGE}" \
  | xargs -r docker rmi >/dev/null 2>&1 || true
log "deployed $SHA (previous image: ${PREVIOUS:-none})"
notify "✅ Deploy frontend ${SHA:0:7} xong, đã healthy. Bản trước: ${PREVIOUS:-không có}."
