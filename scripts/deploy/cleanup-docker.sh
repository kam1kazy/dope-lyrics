#!/usr/bin/env bash
# Чистка Docker после деплоя. Удаляет только неиспользуемые образы dope-lyrics, висячие слои и кэш сборки.
# Тома, контейнеры и образы Marzban / mtproxy / minecraft не трогает.
set -euo pipefail

SOURCE_LABEL=org.opencontainers.image.source=https://github.com/kam1kazy/dope-lyrics

df -h / | tail -1 | awk '{print "до: " $4 " свободно, " $5}'

# Старые SHA-образы из GHCR, на которых уже не стоит ни один контейнер
docker image prune -a -f --filter "label=$SOURCE_LABEL" | tail -1
# Локальные образы ручной сборки, если их уже никто не использует (занятые docker не удалит)
docker rmi dope-lyrics-backend:local dope-lyrics-frontend:local >/dev/null 2>&1 || true
docker image prune -f | tail -1
docker builder prune -f | tail -1

df -h / | tail -1 | awk '{print "после: " $4 " свободно, " $5}'
