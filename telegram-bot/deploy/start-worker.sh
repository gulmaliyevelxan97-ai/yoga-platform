#!/bin/sh
set -eu
umask 077

data=/var/data/restart-telegram
install -d -m 0700 -o node -g node "$data"
export RESTART_BOT_DB="$data/restart.sqlite"
export RESTART_BOT_BACKUPS="$data/backups"

# A process holds the kernel lock for its whole lifetime, including graceful shutdown.
# The lock file can remain on the persistent disk safely after a crash.
exec setpriv --reuid=node --regid=node --init-groups -- \
  flock --nonblock --no-fork --conflict-exit-code 75 "$data/polling.lock" node /app/server.mjs
