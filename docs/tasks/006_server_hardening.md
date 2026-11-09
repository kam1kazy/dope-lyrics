# 006 — Защита сервера marzban

Статус: шаги 1–2 применены 9.11.2026; шаг 3 — в репо, ждёт выката и cron; шаг 4 (перезагрузка) и 5 (вопросы автору) — открыты.
Дорожка: F (хост).

## Зачем

На одном хосте живут VPN (Marzban/xray), каталог, nginx лендинга, minecraft. По SSH идёт перебор паролей (~100 попыток в час, 269 тыс. всего), а защита от него сейчас не работает. Главное условие — **VPN не должен отвалиться**.

## Что уже в порядке

- UFW: по умолчанию deny incoming; Docker публикует наружу только 80/443 (nginx).
- Postgres наружу не торчит; панель Marzban слушает `127.0.0.1:8000`.
- TLS до 31.01.2027, `certbot.timer` + deploy-hook перезагружает `legoblokk-nginx`.
- `unattended-upgrades` включён, fail2ban запущен.

## Порядок

Шаги 1–3 VPN не задевают: Marzban в `network_mode: host`, xray не зависит от sshd и fail2ban. Шаги делать по одному, после каждого — проверка. **Перед шагами 1–2 держать открытой текущую SSH-сессию** и проверять вход из второй.

### 1. fail2ban банит не тот порт — ✅ 9.11 (`jail.d/sshd-port.local`, `reload --restart sshd`)

Сейчас jail `sshd` без `port`, по умолчанию `ssh` = 22, а sshd слушает **2222**. Баны в `inet f2b-table` стоят на `tcp dport 22` — перебор на 2222 не блокируется.

```bash
printf '[sshd]\nport = 2222\n' > /etc/fail2ban/jail.d/sshd-port.local
fail2ban-client reload --restart sshd   # просто reload не пересоздаёт правило nft
nft list table inet f2b-table | grep dport   # ждём: tcp dport 2222
```

Откат: `rm /etc/fail2ban/jail.d/sshd-port.local && fail2ban-client reload sshd`.

### 2. SSH только по ключу — ✅ 9.11 (`sshd_config.d/00-hardening.conf`, правило UFW 22 удалено)

В `/etc/ssh/sshd_config` уже `PasswordAuthentication no`, но `sshd_config.d/50-cloud-init.conf` ставит `yes` и выигрывает (Include в начале файла, первое значение побеждает). Root тоже пускается по паролю (`PermitRootLogin yes`). Ключей у root два.

```bash
cat > /etc/ssh/sshd_config.d/00-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
X11Forwarding no
EOF
sshd -t && systemctl reload ssh
sshd -T | grep -E '^(passwordauthentication|permitrootlogin|x11forwarding) '
# из второго терминала: ssh marzban true
```

Файл `00-` читается раньше `50-cloud-init.conf`, поэтому его значения побеждают; cloud-init при обновлении свой файл не перепишет поверх нашего. Откат: `rm /etc/ssh/sshd_config.d/00-hardening.conf && systemctl reload ssh`.

Заодно убрать открытый порт без сервиса: `ufw delete allow 22/tcp` (удаляет и v4, и v6).

### 3. Логи и бэкапы — 🟡

- **Ротация логов Docker только для сервисов каталога** — блок `logging` (json-file, `max-size: 10m`, `max-file: 3`) в `docker-compose.prod.yml`, выкатится обычным деплоем. Глобально через `/etc/docker/daemon.json` — нельзя без перезапуска dockerd, а он перезапустит и Marzban; это в окно шага 4.
- **Ежедневный бэкап базы** — скрипт в `scripts/deploy/` + `/etc/cron.d/dope-lyrics-backup` (ночью, хранить 14 дней). Сейчас бэкап делает только деплой бэкенда.

### 4. Обновления и перезагрузка — 🟡, VPN пропадёт на 1–2 минуты

Работает ядро `6.8.0-136`, установлено до `147`, плюс `libc6`; 84 пакета ждут обновления; аптайм 13 недель.

Окно ночью, заранее предупредить тех, кто сидит на VPN:

```bash
apt update && apt upgrade -y && apt autoremove -y   # autoremove уберёт старые ядра
# здесь же, если решили: /etc/docker/daemon.json с log-opts max-size/max-file
reboot
```

После перезагрузки проверить: `docker ps` (marzban `always`, каталог и nginx `unless-stopped` поднимаются сами; `mtproxy` давно остановлен — так и останется), `systemctl status minecraft`, VPN-клиент подключается, `https://legoblokk.ru/essence` открывается.

### 5. Проверить руками

- Входы root за сентябрь–октябрь с `176.193.x.x`, `95.220.116.201`, `212.233.85.185` — твои? Если нет — сменить ключи.
- Minecraft открыт всем на 25565 — так и задумано?
- Память: minecraft `-Xmx4G` на 6 ГБ сервера, лимиты контейнеров каталога ~2 ГБ. Пока хватает (свободно ~3 ГБ), но при росте — первым кандидатом на OOM будет кто-то из них.

## Не делаем

Смена порта SSH, закрытие SSH по IP (адрес меняется), перенос Marzban на другой хост.
