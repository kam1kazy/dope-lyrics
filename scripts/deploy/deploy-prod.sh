#!/usr/bin/env bash
# Деплой на прод из CI (и руками). В конце — чистка Docker. Трогает только сервисы dope-lyrics: Marzban, mtproxy и прочие контейнеры хоста не задеваются.
#
# Переменные:
#   DEPLOY_SHA        — коммит, который выкатываем (образы в GHCR с этим тегом)
#   DEPLOY_BACKEND    — true: бэкап БД, backend (миграции при старте) и бот
#   DEPLOY_FRONTEND   — true: frontend
#   DEPLOY_NGINX      — true: проверить nginx.prod.conf и перезапустить legoblokk-nginx
#   GHCR_USER, GHCR_TOKEN — вход в ghcr.io на время pull
set -euo pipefail

cd "$(dirname "$0")/../.."

COMPOSE=(docker compose -p dope-lyrics -f docker-compose.prod.yml -f docker-compose.prod.images.yml --profile app --profile bot)
BACKUP_DIR=/root/backups/dope-lyrics
BACKUP_KEEP=10
HEALTH_TIMEOUT_SEC=120

: "${DEPLOY_SHA:?DEPLOY_SHA обязателен}"

log() { echo "=== $*"; }

backup_db() {
  mkdir -p "$BACKUP_DIR"
  local file
  file="$BACKUP_DIR/deploy-$(date +%Y%m%d-%H%M%S)-${DEPLOY_SHA:0:7}.dump"
  docker exec dope-lyrics-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$file" || {
    rm -f "$file"
    echo "Бэкап не удался — деплой остановлен" >&2
    exit 1
  }
  log "бэкап $(du -h "$file" | cut -f1) → $file"
  ls -1t "$BACKUP_DIR"/deploy-*.dump | tail -n +$((BACKUP_KEEP + 1)) | xargs -r rm --
}

wait_backend() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SEC))
  until docker exec legoblokk-nginx wget -qO- http://backend:4000/health >/dev/null 2>&1; do
    if ((SECONDS >= deadline)); then
      echo "Backend не ответил на /health за ${HEALTH_TIMEOUT_SEC} с" >&2
      docker logs --tail 40 dope-lyrics-backend >&2 || true
      exit 1
    fi
    sleep 3
  done
  log "backend отвечает на /health"
}

check_and_restart_nginx() {
  local network
  network=$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' legoblokk-nginx | awk '{print $1}')
  docker run --rm --network "$network" \
    -v "$PWD/nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro" \
    -v "$PWD/.htpasswd:/etc/nginx/.htpasswd:ro" \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    -v /opt/lucky:/usr/share/nginx/html:ro \
    nginx:stable-alpine nginx -t
  # Конфиг примонтирован одиночным файлом: без рестарта контейнер видит старую версию
  docker restart legoblokk-nginx >/dev/null
  log "nginx перезапущен с новым конфигом"
}

log "код → ${DEPLOY_SHA}"
git fetch -q origin main
git merge --ff-only -q "$DEPLOY_SHA"

finish() {
  docker logout ghcr.io >/dev/null 2>&1 || true
  bash scripts/deploy/cleanup-docker.sh || true
}
trap finish EXIT

if [[ "${DEPLOY_BACKEND:-false}" == true || "${DEPLOY_FRONTEND:-false}" == true ]]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null
fi

if [[ "${DEPLOY_BACKEND:-false}" == true ]]; then
  backup_db
  export BACKEND_TAG="$DEPLOY_SHA"
  log "backend и бот → $BACKEND_TAG"
  "${COMPOSE[@]}" pull -q backend
  "${COMPOSE[@]}" up -d --no-build --no-deps backend
  wait_backend
  "${COMPOSE[@]}" up -d --no-build --no-deps --force-recreate telegram-bot
fi

if [[ "${DEPLOY_FRONTEND:-false}" == true ]]; then
  export FRONTEND_TAG="$DEPLOY_SHA"
  log "frontend → $FRONTEND_TAG"
  "${COMPOSE[@]}" pull -q frontend
  "${COMPOSE[@]}" up -d --no-build --no-deps frontend
fi

if [[ "${DEPLOY_NGINX:-false}" == true ]]; then
  check_and_restart_nginx
fi

docker ps --filter name=dope-lyrics --filter name=legoblokk-nginx --format '{{.Names}} | {{.Image}} | {{.Status}}'
