# Canonical layout

Project root: `$CODEX_DISCORD_BRIDGE_ROOT`, or `packages/discord-bridge` in this repository.

Key source files:

- `src/index.ts`: Discord gateway, commands, queues, and Codex turn dispatch
- `src/codex-app-server.ts`: Codex JSON-RPC transport
- `src/config.ts`: explicit instance configuration and security defaults
- `src/state.ts`: Discord channel to Codex thread persistence
- `src/history.ts`: explicit `!codex history` request parsing and formatting
- `src/progress-relay.ts`: throttled early Discord delivery for Codex commentary
- `src/attachments.ts`: bounded Discord CDN image download and `localImage` input preparation
- `codex-dc.bash`: interactive project initialization and lifecycle functions
- `scripts/attach-thread.sh`: attach a terminal TUI to a shared remote thread

Runtime state:

```text
~/.codex-discord/<instance>/
├── instance.env
├── thread-id
├── app-server.pid
├── bridge.pid
├── logs/
└── runtime/
```

Default instance name is the project directory basename. Alternate bot `N` uses `<basename>-N`.

Discord commands include `!codex status`, `!codex stop`, `!codex reset`, and explicit on-demand `!codex history [1-100] [task]`. Server-channel commands normally require mentioning the bot.

## HPC lifecycle

`codex-dc` is loaded from `.bashrc` by sourcing the repository's `codex-dc.bash`. Run it from the same project directory used during initialization because the default instance name is derived from that directory basename.

For a live allocation on the same node, reattach the user's outer tmux with `tmux attach -t codex-dc`. After a hard wall-time expiry, request a new compute allocation and run:

```bash
cd /the/original/project
tmux new -s codex-dc
codex-dc
```

The new process reads `instance.env` and `thread-id`, recreates the localhost app-server and Discord bridge, and resumes the existing thread. Do not run `codex-dc-init` again. Node-local PIDs and tmux sockets are disposable; the state directory on shared storage is authoritative.
