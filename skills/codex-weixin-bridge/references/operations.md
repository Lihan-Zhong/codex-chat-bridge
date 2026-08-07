# Operations reference

## Runtime

Run all project commands through `./scripts/hpc-node24.sh`. The expected Node version is 24.x. `node_modules`, Node 24, and the npm cache are symlinked into scratch to protect HOME inode quota.

## Configuration invariants

In `.env.local`, retain the existing state directory, default working directory, locale, and real Codex binary. Keep native API disabled unless a later audited workflow requires it. Set the authenticated ID as the sole initial value of `WEIXIN_ALLOWED_USERS`; do not use wildcards. Keep Weixin group handling disabled.

## Commands

```bash
cd /path/to/workspace
tmux new -s my-work
codex-wx

codex-wx status
codex-wx login
codex-wx stop
```

The default `codex-wx` action creates or resumes a thread associated with the current working directory, writes its ID to the private launcher state, restarts the Weixin bridge with that binding, and opens the same thread in the foreground Codex TUI.

The service uses an isolated tmux socket named `codex-wx-runtime` and explicitly ignores a stale outer `$TMUX`. Inspect it with:

```bash
tmux -L codex-wx-runtime list-sessions
tmux -L codex-wx-runtime capture-pane -pt codex-wx-appserver -S -100
```

Run those checks on the compute node that owns the service. Shared state files persist across nodes, but PIDs, localhost ports, and tmux sockets do not.

The bridge and foreground TUI share one localhost WebSocket app-server so Weixin-origin turns render live in the TUI.

Low-level bridge commands remain available:

```bash
./scripts/hpc-node24.sh npm run weixin:login
./scripts/hpc-node24.sh npm run weixin:serve
```

Thread commands are sent inside the Weixin chat:

- `/new`: create a fresh isolated Codex thread.
- `/threads`: list available threads.
- `/open <thread-id>`: deliberately bind to an existing thread.

For the current deployment, prefer the launcher's automatic binding. `/new` creates a bridge-owned thread and therefore is not part of the normal tmux-first workflow.

## HPC recovery

Node-local processes, `/tmp/tmux-<uid>/...` sockets, and ports disappear when an allocation ends. Login credentials, allowlists, the thread ID, Codex history, and project files persist on shared storage. After the wall-time expires, run on a new compute node:

```bash
cd /the/original/workspace
tmux new -s codex-wx
codex-wx
```

Do not scan again and do not delete the current thread file. `codex-wx` recreates its app-server and bridge and resumes the existing TUI. Use `codex-wx stop` before a planned restart on the same node.

One ClawBot private chat is one platform scope and has one active thread binding. Multiple Codex projects require deliberate thread/project routing; do not create multiple Weixin accounts unless the user explicitly chooses that architecture.

## Diagnosis

Check, in order: resolved symlink targets, Node version, `.env.local` presence and permissions, login state presence, allowlist match, named tmux sessions, localhost app-server readiness, then bridge logs. Never paste raw environment files or state files into chat because they may contain credentials. Treat `/tmp/tmux-<uid>/default` errors as stale outer tmux state; the launcher must use its isolated named socket.
