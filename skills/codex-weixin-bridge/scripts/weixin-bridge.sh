#!/usr/bin/env bash
set -euo pipefail

bridge_dir="${CODEXBRIDGE_DIR:-$HOME/CodexBridge}"
state_dir="${CODEX_WX_STATE_DIR:-$HOME/.codexbridge}"
action="${1:-status}"

if [[ ! -x "$bridge_dir/scripts/hpc-node24.sh" ]]; then
  echo "CodexBridge wrapper not found: $bridge_dir/scripts/hpc-node24.sh" >&2
  exit 1
fi

cd "$bridge_dir"

case "$action" in
  status)
    printf 'checkout: %s\n' "$bridge_dir"
    printf 'node_modules: %s\n' "$(readlink -f node_modules)"
    printf 'node24-bin: %s\n' "${CODEXBRIDGE_NODE24_DIR:-not configured}"
    printf 'npm-cache: %s\n' "$(./scripts/hpc-node24.sh npm config get cache)"
    ./scripts/hpc-node24.sh node --version
    [[ -f .env.local ]] && echo 'config: present' || echo 'config: missing'
    "$bridge_dir/scripts/codex-wx" status
    ;;
  login)
    exec ./scripts/hpc-node24.sh npm run weixin:login -- --state-dir "$state_dir"
    ;;
  serve)
    exec ./scripts/hpc-node24.sh npm run weixin:serve -- --state-dir "$state_dir"
    ;;
  stop)
    exec "$bridge_dir/scripts/codex-wx" stop
    ;;
  *)
    echo "usage: $0 {status|login|serve|stop}" >&2
    exit 2
    ;;
esac
