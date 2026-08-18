# Codex Telegram Multibot

One dedicated Telegram bot per local Codex project. Telegram and the terminal
attach to the same persistent Codex app-server thread.

## Safety defaults

- Explicit Telegram user allowlist; an empty list refuses startup.
- Optional chat allowlist, with `@bot` required in groups by default.
- `workspace-write` sandbox and `approvalPolicy=never`.
- Every approval or permission request received from Codex is declined.
- The shared app-server launcher accepts localhost WebSocket URLs only.
- Tokens, state, logs, attachments, and thread IDs stay outside Git.

## Build

```bash
npm install
npm run test
```

## Use

Create a bot with Telegram's `@BotFather`, then obtain your numeric Telegram
user ID. Temporarily load the launcher without modifying your shell profile:

```bash
source /absolute/path/to/packages/telegram-bridge/codex-tg.bash
cd /absolute/path/to/your/project
codex-tg-init
codex-tg
```

The launcher stores secrets under
`${CODEX_TELEGRAM_STATE_ROOT:-$HOME/.codex-telegram}/<project>/instance.env`
with mode `0600`. Set `CODEX_TELEGRAM_STATE_ROOT` before `codex-tg-init` if the
default location is unsuitable.

Supported bot commands are `/status`, `/stop`, `/reset`, and `/help`. Text,
captions, Telegram photos, and PNG/JPEG/WebP image documents are accepted.

The package never edits `.bashrc`. After testing, the user may explicitly add:

```bash
source /absolute/path/to/packages/telegram-bridge/codex-tg.bash
```
