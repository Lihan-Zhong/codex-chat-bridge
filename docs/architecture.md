# Architecture

```text
Discord ---- adapter ----+
                         +---- localhost Codex app-server ---- persistent thread
Weixin -- CodexBridge ---+                         |
                                                   +---- Codex terminal TUI
```

## Shared invariants

1. Codex thread state is the source of truth.
2. The chat adapter and terminal attach to the same app-server and thread.
3. The app-server is localhost-only.
4. Platform identities are explicitly allowlisted.
5. Runtime processes and tmux sockets are disposable; credentials and thread metadata persist outside the repository.
6. HPC allocation expiry is recovered by recreating processes and resuming the saved thread, not by reinitializing accounts.

## Why one repository with separate adapters

Discord and Weixin share lifecycle and security semantics, documentation, and skills. Their transports and upstream dependencies differ substantially. Keeping them together makes the system understandable while separate packages avoid coupling Discord to CodexBridge internals. A shared library should be extracted only after a second adapter demonstrates a stable common API.
