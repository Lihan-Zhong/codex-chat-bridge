**🇺🇸 English** · [🇨🇳 中文](README.zh.md)

# Codex Chat Bridge

### Your Codex terminal, now inside Telegram, Discord, and Weixin.

[![License: MIT](https://img.shields.io/badge/License-MIT-4c1.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Platforms](https://img.shields.io/badge/Chat-Telegram%20%7C%20Discord%20%7C%20Weixin-5865F2)
![HPC ready](https://img.shields.io/badge/HPC-recovery_ready-orange)

> **TL;DR** — talk to a persistent Codex thread from chat while watching and controlling the very same thread in the terminal TUI. Start a task from your phone, see tool execution in tmux, and resume after an HPC allocation expires.

> **Current status:** Discord is the reference adapter; Telegram is a working standalone adapter built on the same Codex app-server lifecycle. Weixin/ClawBot remains experimental.

## ✨ Why this exists

Codex is excellent in a terminal. Phones are excellent at being nearby.

This project joins them without creating a second, disconnected agent session:

```text
Telegram ─── adapter ──┐
Discord ───── adapter ──┤
                      ├── localhost Codex app-server ── persistent thread
Weixin ── CodexBridge ─┘                    │
                                            └── Codex terminal TUI / tmux
```

The chat adapter and terminal attach to the same app-server and thread. Messages, tool calls, context, and recovery all converge on one Codex session instead of drifting into parallel conversations.

## 🔥 What already works

### Discord — reference implementation

- 🔁 Bidirectional Discord ↔ Codex messaging
- 🟢 Live presence showing compute node, Slurm time left, and project name
- 🖥️ One shared thread visible in both Discord and the Codex TUI
- ⏳ Event-driven progress: commentary is grouped and sent only immediately before a tool starts
- 🖼️ PNG, JPEG, and WebP attachments passed to Codex as real multimodal input
- 📚 Explicit, on-demand channel history via `!codex history`
- 🔐 User/channel allowlists, mention gating, `workspace-write`, and no remote approval escalation
- 🧩 One bot per project, plus isolated alternate instances
- ♻️ Persistent thread recovery after tmux, node, or HPC allocation expiry

### Weixin / ClawBot — experimental integration

- 📱 Private-chat Weixin ↔ Codex messaging through an existing CodexBridge checkout
- 📷 Terminal QR login and persistent account state
- 🧵 One Weixin scope bound to the same thread as a foreground Codex TUI
- 🧰 Isolated tmux service socket that survives stale outer `$TMUX` variables
- 💾 Scratch-backed Node/runtime layout for inode-constrained HPC homes
- 🔄 Resume after allocation expiry without rescanning the QR code

## 🚀 Quick start: Discord

> Prerequisites: Codex CLI installed and logged in · Node.js 20+ · a Discord bot token · Message Content Intent enabled · `View Channel`, `Send Messages`, and `Read Message History` permissions.

```bash
# 1. Clone and build
git clone https://github.com/Lihan-Zhong/codex-chat-bridge.git
cd codex-chat-bridge
npm --prefix packages/discord-bridge install
npm --prefix packages/discord-bridge run build

# 2. Load the launcher
echo "source $PWD/packages/discord-bridge/codex-dc.bash" >> ~/.bashrc
source ~/.bashrc

# 3. Install the operational skill
mkdir -p ~/.codex/skills
cp -a skills/codex-discord-bridge ~/.codex/skills/
```

Connect a project:

```bash
cd /path/to/your-project
codex-dc-init   # enter bot token, allowed user/channel IDs, and local port
codex-dc        # start the bridge and enter the shared Codex TUI
```

Then DM the bot, or mention it in the allowlisted server channel:

```text
@your_bot inspect this repository and explain the architecture
```

Future restarts are simply:

```bash
cd /path/to/your-project
codex-dc
```

The saved thread is resumed automatically. Do not run `codex-dc-init` again.

## 💬 Discord commands

| Command | What it does |
| --- | --- |
| `!codex status` | Show the current thread and activity state |
| `!codex stop` | Interrupt the active turn |
| `!codex reset` | Forget the channel mapping and create a thread next time |
| `!codex history 30 summarize decisions` | Explicitly read recent channel history for one task |

Guild commands normally require `@bot`; DMs do not.

## 🧠 Progress without message confetti

Streaming every token into Discord looks lively for about three seconds—and then becomes unbearable. This bridge uses app-server events instead:

1. Pure-text commentary stays buffered, regardless of time, punctuation, line breaks, or length.
2. Immediately before a command, file change, MCP call, web search, image operation, or another tool starts, the accumulated commentary is sent as one `⏳` message.
3. After the tool, a fresh commentary buffer begins.
4. The final answer is delivered once, complete.

That gives useful “here is what I am about to do” updates without splitting one thought into six Discord replies.

## 🧩 Repository layout

```text
codex-chat-bridge/
├── packages/
│   ├── discord-bridge/          # standalone Discord adapter
│   └── telegram-bridge/         # standalone Telegram adapter + codex-tg
├── integrations/
│   └── codexbridge-weixin/      # original HPC launcher + upstream contract
├── skills/
│   ├── codex-discord-bridge/    # setup, recovery, progress, images, diagnostics
│   └── codex-weixin-bridge/     # QR login, tmux, allowlist, HPC recovery
├── docs/
│   └── architecture.md
├── SECURITY.md
└── LICENSE
```

## 🧭 Why one repo, but two adapters?

Discord and Weixin share the operating model—localhost app-server, persistent threads, one terminal view, allowlists, and HPC recovery. Their transports are very different. Discord is a compact standalone adapter; Weixin depends on the broader CodexBridge runtime.

Keeping them in one monorepo makes the architecture reusable. Keeping their implementations separate avoids coupling Discord to unstable upstream internals. A shared npm core can be extracted later, once the common API has proved itself.

## 🟢 Weixin setup status

The launcher under [`integrations/codexbridge-weixin`](integrations/codexbridge-weixin) expects an existing CodexBridge checkout with support for:

- external localhost app-server via `CODEX_APP_SERVER_URL`;
- explicit thread binding via `CODEXBRIDGE_WEIXIN_THREAD_ID`;
- `weixin:login` and `weixin:serve` entry points.

CodexBridge is not vendored because its upstream repository currently does not provide a license that clearly permits redistribution. See the integration README for the exact compatibility contract.

## 🐛 HPC recovery and common traps

- **Allocation expired:** enter a new compute allocation, return to the same project, and run `codex-dc` or `codex-wx`. Credentials and thread metadata persist; node-local processes do not.
- **Presence:** `node177 · ⏳6d19h · project` refreshes every 15 minutes. The green dot is a real Gateway health signal; outside Slurm it falls back to `node · project`.
- **`/tmp/tmux-<uid>/default` missing:** that is usually a stale outer `$TMUX`. The Weixin launcher uses its own `codex-wx-runtime` socket.
- **Discord replies with `app-server is not connected`, then succeeds:** two bridge processes are probably consuming the same bot token. Keep only the bridge PID recorded by the active instance.
- **Discord ignores server messages:** mention the bot when `DISCORD_REQUIRE_MENTION=true`, and verify both user and channel allowlists.
- **Images are not understood:** supported images must be PNG, JPEG, or WebP from Discord's CDN and no larger than 20 MiB.

## 🔒 Security model

Chat access is remote code execution by another name. The defaults are deliberately conservative:

- explicit user allowlists; optional narrow channel allowlists;
- guild mention required by default;
- `workspace-write` sandbox;
- `approvalPolicy=never` for unattended chat turns;
- app-server bound only to `127.0.0.1` / `localhost`;
- tokens, account files, QR payloads, logs, runtime state, and thread IDs excluded from Git.

Read [`SECURITY.md`](SECURITY.md) before exposing a bot beyond a private channel.

## 🤝 Contributing

PRs are welcome—especially for:

- additional chat adapters such as Slack, Matrix, or iMessage;
- a clean upstream path for the CodexBridge compatibility hooks;
- multi-project routing for a single Weixin private chat;
- integration tests against future Codex app-server protocol revisions;
- safer post-reply rolling restarts.

Sibling experiments that inspired the style and project-per-bot workflow:

- [`claude-code-discord-multibot`](https://github.com/Lihan-Zhong/claude-code-discord-multibot)
- [`claude-code-telegram-multibot`](https://github.com/Lihan-Zhong/claude-code-telegram-multibot)

## 📜 License

Original code in this repository is available under the [MIT License](LICENSE). Upstream CodexBridge source is not included and remains governed by its own repository and terms.
For Telegram setup, including the project-level `codex-tg` launcher, see
[`packages/telegram-bridge/README.md`](packages/telegram-bridge/README.md).
