---
name: codex-discord-bridge
description: Configure, start, resume, inspect, test, upgrade, or troubleshoot the local codex-discord-multibot bridge that connects Discord channels to persistent Codex app-server threads. Use for codex-dc setup, Discord bot allowlists, shared terminal/Discord threads, commentary progress delivery, image attachments, Discord presence with Slurm node/time-left status, bridge logs, history-on-demand commands, project isolation, tmux use, HPC job expiry or cross-node recovery, and safe bridge restarts.
---

# Codex Discord Bridge

Manage the checkout selected by `CODEX_DISCORD_BRIDGE_ROOT`, or the repository's `packages/discord-bridge` directory. Do not duplicate its source into the skill.

## Workflow

1. Run `scripts/bridge.sh paths` to resolve canonical paths.
2. Read the project `README.zh.md` only when setup or behavior details are needed.
3. Run `scripts/bridge.sh status [instance]` before changing or restarting a live bridge.
4. Preserve existing instance env files, state directories, thread IDs, tokens, and unrelated worktree edits.
5. Run `scripts/bridge.sh test` after code changes.
6. Report whether a restart is required. Do not terminate an active bridge unless the user requested activation/restart; it may carry the current conversation.
7. When the request itself arrived through Discord, never restart that same bridge before its final reply is delivered. Build and test first, then instruct the user to restart from the terminal between turns, or use a proven post-reply restart mechanism.

## Common tasks

- Initialize from the target project directory by sourcing `codex-dc.bash`, then invoking `codex-dc-init` interactively.
- Start or resume with `codex-dc`; use `codex-dc-alt N` for an isolated additional bot.
- Change allowlists with `codex-dc-allow USER_IDS [CHANNEL_IDS] [N]`.
- Inspect without exposing secrets with `scripts/bridge.sh status [instance]` and tail only the relevant logs.
- Preserve event-driven progress delivery while sending the final answer separately. Buffer all pure-text commentary without time, length, punctuation, or newline triggers. Flush the accumulated commentary only immediately before a tool, command, or file-change item starts; after the tool, begin a fresh buffer. At turn completion discard any unsent commentary buffer and send the complete final answer.
- Treat app-server `item/started` events for `commandExecution`, `fileChange`, `mcpToolCall`, `dynamicToolCall`, `collabAgentToolCall`, `webSearch`, `imageView`, `sleep`, and `imageGeneration` as tool boundaries. Do not flush for agent-message, reasoning, plan, punctuation, newline, elapsed time, or buffer length alone.
- Track whether commentary was already delivered. If an interrupted or commentary-only turn has no final-answer text, do not resend the accumulated commentary as a duplicate final reply.
- Preserve multimodal input: download allowlisted Discord CDN image types with size/time limits, pass them as Codex `localImage` inputs, and remove per-turn temporary files afterward.
- Preserve truthful Discord presence: explicitly set `online`, display `node · ⏳Slurm-time-left · project`, query the process's own `SLURM_JOB_ID` asynchronously, refresh no more often than every 15 minutes, and `unref()` the timer. Fall back to `node · project` outside Slurm; presence failures must never break message delivery.
- Attach a terminal to an existing shared thread using the project `scripts/attach-thread.sh` and its explicit instance env.
- After an HPC allocation expires, enter a new compute allocation, return to the same project directory, create/attach a user tmux, and run `codex-dc`. Reuse the persisted instance env and thread ID; never reinitialize.
- Distinguish node-local processes/tmux sockets from shared Lustre state. A bridge is offline between allocations, but its Discord token, allowlists, thread ID, and Codex history persist.
- Treat `instance.env`, Discord bot tokens, app-server tokens, and QR/login credentials as secrets. Never print or commit their values.

## Guardrails

- Keep `CODEX_SANDBOX=workspace-write` and `CODEX_APPROVAL_POLICY=never` unless the user explicitly requests a security-policy change.
- Keep app-server listeners on `127.0.0.1` or `localhost`; never expose the unauthenticated WebSocket on an HPC network interface.
- Require explicit Discord user allowlists. Keep channel allowlists narrow.
- Use one state directory and port per bot instance.
- Do not reset a thread, replace a token, kill a live process, or overwrite an instance env without explicit authorization.
- Treat a restart performed inside an active Discord turn as unsafe: killing the bridge drops that turn's pending final reply even if the replacement process starts successfully.
- After changing live bridge code, build and test during the Discord turn, report completion, and let the user restart `codex-dc` from the terminal only after receiving the final reply.

Read [references/layout.md](references/layout.md) when locating state, logs, threads, or source components.
