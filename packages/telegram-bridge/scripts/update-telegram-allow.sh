#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 INSTANCE_ENV USER_IDS CHAT_IDS" >&2
  exit 2
fi
env_file=$1
users=$2
chats=$3

[[ -f "$env_file" ]] || { echo "Config not found: $env_file" >&2; exit 1; }
[[ "$users" =~ ^[0-9]+(,[0-9]+)*$ ]] || { echo "Invalid user ID list" >&2; exit 2; }
[[ -z "$chats" || "$chats" =~ ^-?[0-9]+(,-?[0-9]+)*$ ]] || { echo "Invalid chat ID list" >&2; exit 2; }

temp=$(mktemp "$(dirname "$env_file")/.instance.env.XXXXXX")
trap 'unlink "$temp" 2>/dev/null || true' EXIT
awk -v users="$users" -v chats="$chats" '
  /^TELEGRAM_ALLOWED_USER_IDS=/ { print "TELEGRAM_ALLOWED_USER_IDS=" users; seen_users=1; next }
  /^TELEGRAM_ALLOWED_CHAT_IDS=/ { print "TELEGRAM_ALLOWED_CHAT_IDS=" chats; seen_chats=1; next }
  { print }
  END {
    if (!seen_users) print "TELEGRAM_ALLOWED_USER_IDS=" users
    if (!seen_chats) print "TELEGRAM_ALLOWED_CHAT_IDS=" chats
  }
' "$env_file" >"$temp"
chmod 600 "$temp"
mv "$temp" "$env_file"
trap - EXIT
echo "✅ Updated Telegram allowlists in $env_file"
echo "   Restart codex-tg for the change to take effect."
