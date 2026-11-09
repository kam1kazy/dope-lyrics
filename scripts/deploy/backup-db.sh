#!/usr/bin/env bash
# Бэкап базы каталога в /root/backups/dope-lyrics: backup-db.sh <вид> <сколько хранить> [метка]
# Вид: daily (cron) или deploy (перед выкаткой backend). Старые файлы того же вида удаляются.
set -euo pipefail

kind="${1:?вид бэкапа: daily | deploy}"
keep="${2:?сколько файлов хранить}"
label="${3:-}"
dir=/root/backups/dope-lyrics

mkdir -p "$dir"
file="$dir/$kind-$(date +%Y%m%d-%H%M%S)${label:+-$label}.dump"

docker exec dope-lyrics-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$file" || {
  rm -f "$file"
  echo "Бэкап не удался" >&2
  exit 1
}
echo "бэкап $(du -h "$file" | cut -f1) → $file"

find "$dir" -maxdepth 1 -name "$kind-*.dump" -printf '%T@ %p\n' |
  sort -rn | tail -n +$((keep + 1)) | cut -d' ' -f2- | xargs -r rm --
