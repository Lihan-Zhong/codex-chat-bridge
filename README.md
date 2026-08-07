# Codex Chat Bridge

Run persistent Codex app-server threads from chat platforms while keeping the same thread visible in a terminal TUI.

This monorepo contains:

- `packages/discord-bridge`: a working Discord adapter with allowlists, progress updates, image input, persistent threads, and HPC recovery.
- `integrations/codexbridge-weixin`: an HPC launcher and integration notes for connecting the upstream CodexBridge Weixin adapter to a shared Codex thread.
- `skills`: reusable Codex operational skills for both adapters.

The adapters share an architecture, not yet a forced code abstraction. Discord is a small standalone adapter; Weixin builds on the larger upstream CodexBridge project. See [docs/architecture.md](docs/architecture.md).

## Security

App-server listeners are localhost-only. Chat identities are deny-by-default. Never commit bot tokens, Weixin account state, thread IDs, logs, or runtime directories. See [SECURITY.md](SECURITY.md).

## Status

Discord is the reference implementation. The Weixin launcher is experimental and requires compatible upstream CodexBridge capabilities documented in its integration directory.

## License

Original code in this repository is MIT licensed. Upstream CodexBridge code is not vendored and remains governed by its own repository and terms.
