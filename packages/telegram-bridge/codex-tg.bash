# Shell functions for one Telegram bot + one directly visible Codex TUI per project.
#
# This file is intentionally NOT installed into ~/.bashrc automatically.
# State and secrets live under ${CODEX_TELEGRAM_STATE_ROOT:-$HOME/.codex-telegram}, separate
# from Claude Code's ~/.claude-telegram/ and from ~/.env.

unalias codex-tg codex-tg-init codex-tg-alt codex-tg-allow codex-tg-status 2>/dev/null

_codex_tg_root() {
  printf '%s\n' "${CODEX_TELEGRAM_STATE_ROOT:-$HOME/.codex-telegram}"
}

_codex_tg_repo() {
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
}

_codex_tg_state() {
  local variant="${1:-}"
  local suffix="$(basename "$PWD")"
  [[ -n "$variant" ]] && suffix="${suffix}-${variant}"
  printf '%s/%s\n' "$(_codex_tg_root)" "$suffix"
}

_codex_tg_run() {
  local variant="$1"
  shift
  local state repo
  state=$(_codex_tg_state "$variant")
  repo=$(_codex_tg_repo)
  if [[ ! -f "$state/instance.env" ]]; then
    echo "⚠️  $state/instance.env not found" >&2
    if [[ -n "$variant" ]]; then
      echo "   Initialize it with: codex-tg-init $variant" >&2
    else
      echo "   Initialize it with: codex-tg-init" >&2
    fi
    return 1
  fi
  "$repo/scripts/run-direct.sh" "$state/instance.env" "$@"
}

codex-tg() {
  _codex_tg_run "" "$@"
}

codex-tg-alt() {
  local variant
  if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
    variant="$1"
    shift
  else
    variant="2"
  fi
  _codex_tg_run "$variant" "$@"
}

codex-tg-init() {
  local variant=""
  if [[ "${1:-}" =~ ^[0-9]+$ ]]; then variant="$1"; fi
  local state suffix default_port token users chats port
  state=$(_codex_tg_state "$variant")
  suffix=$(basename "$state")
  mkdir -p "$state"
  chmod 700 "$state"
  if [[ -e "$state/instance.env" ]]; then
    echo "⚠️  Refusing to overwrite existing $state/instance.env" >&2
    echo "   Move it aside manually if you truly want to reinitialize." >&2
    return 1
  fi

  echo "Telegram bot token (input hidden):"
  read -r -s token
  echo
  [[ -z "$token" || "$token" == *$'\n'* ]] && { echo "Invalid empty token" >&2; return 1; }

  echo "Allowed Telegram user ID(s), comma-separated (required):"
  read -r users
  if [[ ! "$users" =~ ^[0-9]+(,[0-9]+)*$ ]]; then
    echo "Invalid Telegram user ID list" >&2
    return 1
  fi

  echo "Allowed Telegram chat ID(s), comma-separated (optional; groups are usually negative IDs):"
  read -r chats
  if [[ -n "$chats" && ! "$chats" =~ ^-?[0-9]+(,-?[0-9]+)*$ ]]; then
    echo "Invalid Telegram chat ID list" >&2
    return 1
  fi

  default_port=$((4500 + $(printf '%s' "$suffix" | cksum | awk '{print $1}') % 1000))
  echo "Local app-server port [$default_port]:"
  read -r port
  port=${port:-$default_port}
  if [[ ! "$port" =~ ^[0-9]+$ || "$port" -lt 1024 || "$port" -gt 65535 ]]; then
    echo "Invalid TCP port" >&2
    return 1
  fi

  {
    printf 'TELEGRAM_BOT_TOKEN=%s\n' "$token"
    printf 'TELEGRAM_ALLOWED_USER_IDS=%s\n' "$users"
    printf 'TELEGRAM_ALLOWED_CHAT_IDS=%s\n' "$chats"
    printf 'TELEGRAM_REQUIRE_MENTION=true\n\n'
    printf 'CODEX_PROJECT_DIR=%s\n' "$PWD"
    printf 'CODEX_APP_SERVER_URL=ws://127.0.0.1:%s\n' "$port"
    printf 'CODEX_SANDBOX=workspace-write\n'
    printf 'CODEX_NETWORK_ACCESS=true\n'
    printf 'CODEX_APPROVAL_POLICY=never\n'
    printf 'CODEX_TELEGRAM_STATE_DIR=%s/runtime\n' "$state"
  } >"$state/instance.env"
  chmod 600 "$state/instance.env"
  echo "✅ Saved isolated Codex bot config to $state/instance.env"
  if [[ -n "$variant" ]]; then
    echo "   Start with: codex-tg-alt $variant"
  else
    echo "   Start with: codex-tg"
  fi
}

codex-tg-allow() {
  if [[ $# -lt 1 || $# -gt 3 ]]; then
    echo "Usage: codex-tg-allow USER_IDS [CHAT_IDS] [VARIANT]" >&2
    return 2
  fi
  local users="$1" chats="${2:-}" variant="${3:-}" state repo
  state=$(_codex_tg_state "$variant")
  repo=$(_codex_tg_repo)
  "$repo/scripts/update-telegram-allow.sh" "$state/instance.env" "$users" "$chats"
}

codex-tg-status() {
  local variant=""
  [[ "${1:-}" =~ ^[0-9]+$ ]] && variant="$1"
  local state pid label
  state=$(_codex_tg_state "$variant")
  echo "state:  $state"
  [[ -s "$state/thread-id" ]] && echo "thread: $(<"$state/thread-id")" || echo "thread: not created"
  for label in app-server bridge; do
    if [[ -s "$state/$label.pid" ]]; then
      pid=$(<"$state/$label.pid")
      if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
        echo "$label: running (PID $pid)"
      else
        echo "$label: stale PID file ($pid)"
      fi
    else
      echo "$label: stopped"
    fi
  done
  [[ -f "$state/logs/bridge.log" ]] && echo "logs:   $state/logs"
}
