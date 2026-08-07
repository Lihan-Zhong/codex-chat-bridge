#!/usr/bin/env bash
set -euo pipefail

node24_dir="${CODEXBRIDGE_NODE24_DIR:-}"
if [[ -z "$node24_dir" || ! -x "$node24_dir/node" ]]; then
  printf 'Set CODEXBRIDGE_NODE24_DIR to a Node 24 bin directory.\n' >&2
  exit 1
fi

export PATH="$node24_dir:/usr/local/bin:/usr/bin:/bin"
exec "$@"
