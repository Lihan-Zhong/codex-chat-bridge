#!/usr/bin/env bash
set -euo pipefail

skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_candidate="$(cd "$skill_dir/../.." 2>/dev/null && pwd)/packages/discord-bridge"
bridge_root="${CODEX_DISCORD_BRIDGE_ROOT:-$repo_candidate}"
state_root="${CODEX_DISCORD_STATE_ROOT:-$HOME/.codex-discord}"
command_name="${1:-paths}"
instance_name="${2:-$(basename "$PWD")}"

case "$command_name" in
  paths)
    printf 'project=%s\nstate_root=%s\n' "$bridge_root" "$state_root"
    ;;
  test)
    cd "$bridge_root"
    npm test
    ;;
  status)
    instance_dir="$state_root/$instance_name"
    printf 'instance=%s\n' "$instance_dir"
    if [[ ! -d "$instance_dir" ]]; then
      printf 'state=not-initialized\n'
      exit 0
    fi
    for item in thread-id app-server.pid bridge.pid; do
      if [[ -f "$instance_dir/$item" ]]; then
        printf '%s=%s\n' "$item" "$(<"$instance_dir/$item")"
      else
        printf '%s=missing\n' "$item"
      fi
    done
    if [[ -d "$instance_dir/logs" ]]; then
      find "$instance_dir/logs" -maxdepth 1 -type f -printf 'log=%p\n' | sort
    fi
    ;;
  *)
    printf 'Usage: %s {paths|test|status [instance]}\n' "$0" >&2
    exit 2
    ;;
esac
