# CodexBridge Weixin integration

This directory contains original launcher code for running an existing CodexBridge checkout on an HPC node with terminal QR login, scratch-friendly Node runtime, isolated tmux service sessions, and one localhost Codex app-server shared by Weixin and the foreground TUI.

## Upstream requirement

CodexBridge itself is deliberately not vendored here. Set `CODEXBRIDGE_DIR` to your own checkout. The checkout must support:

1. `CODEX_APP_SERVER_URL=ws://127.0.0.1:<port>` for an external app-server;
2. `CODEXBRIDGE_WEIXIN_THREAD_ID` to bind the Weixin scope to a chosen thread;
3. `npm run weixin:login -- --state-dir <path>`;
4. `npm run weixin:serve -- --state-dir <path>`.

These capabilities were developed against a local CodexBridge checkout and should preferably be contributed upstream before treating this integration as turnkey. Do not redistribute upstream source without verifying its license.

## Configuration

```bash
export CODEXBRIDGE_DIR=/path/to/CodexBridge
export CODEX_REAL_BIN=/path/to/codex
export CODEXBRIDGE_NODE24_DIR=/path/to/node24/bin
export CODEX_WX_STATE_DIR="$HOME/.codexbridge"

./scripts/codex-wx login
./scripts/codex-wx
```

Keep `.env.local`, account state, QR data, logs, and thread IDs outside Git.
