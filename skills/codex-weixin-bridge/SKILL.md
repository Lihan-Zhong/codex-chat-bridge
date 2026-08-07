---
name: codex-weixin-bridge
description: "Operate the local CodexBridge Weixin/ClawBot integration on the HPC: verify the scratch-backed runtime, perform terminal QR login, configure a private-message allowlist, run a shared app-server/TUI thread, stop or diagnose services, and recover after tmux, node, or HPC job expiry. Use when the user asks to connect, log in, start, resume, repair, or inspect codex-wx on Weixin/微信/ClawBot."
---

# Codex Weixin Bridge

Use the existing CodexBridge checkout; do not build a second bridge implementation.

## Safety rules

- Keep direct messages deny-by-default until the scanned account ID is known.
- Keep group handling disabled unless the user explicitly requests it.
- Never print, copy, or commit login tokens, QR payloads, `.env.local`, or state files.
- Do not expose the Codex app-server on a network interface.
- Do not enable full-access permissions automatically.
- Preserve the current Discord thread. Use the dedicated `codex-wx` Terminal thread for Weixin unless the user explicitly asks to share another one.
- QR scanning and phone-side confirmation require the user; pause and show only the QR URL/artifact needed to scan.
- When publishing integration code, include only original launcher/skill material. Do not vendor or relicense an upstream checkout unless its license explicitly permits redistribution.

## Paths

- Checkout: `$CODEXBRIDGE_DIR` (defaults to `~/CodexBridge` in the published launcher)
- Account/runtime state: `~/.codexbridge`
- Runtime target: site-specific scratch storage selected by the operator
- Wrapper: `scripts/hpc-node24.sh`

Read [references/operations.md](references/operations.md) when editing configuration, diagnosing login, or binding threads.

## Workflow

1. Run `codex-wx status` and resolve missing checkout/runtime prerequisites.
2. Tell the user to `cd` to the desired workspace, enter their own tmux window, and run `codex-wx`.
3. On first use, let `codex-wx` run QR login. Relay the generated QR artifact and wait for phone confirmation.
4. Let the launcher configure the authenticated user allowlist, create or resume the workspace thread, bind Weixin to it, and start the bridge in its private tmux service session.
5. Confirm round-trip messaging and live TUI visibility. The foreground TUI and bridge must connect to the same localhost app-server and thread ID.
6. Use `/threads` or `/open` only for deliberate troubleshooting or manual rebinding; do not require `/new` in the normal workflow.
7. Use `codex-wx stop` only on the node that owns the service. After allocation expiry, enter a new compute node and run `codex-wx` from the same workspace to recreate processes and resume the persisted thread without rescanning.
8. Diagnose tmux errors with the isolated `codex-wx-runtime` socket and node ownership first. Ignore stale outer `$TMUX` values and never assume a PID or `/tmp/tmux-<uid>` socket survives an HPC allocation change.

## Reporting

Report whether login, allowlisting, bridge startup, round-trip messaging, and Terminal-thread binding succeeded. Distinguish upstream repository typecheck failures from failures of the actual Weixin entry point.
