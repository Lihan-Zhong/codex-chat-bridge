[🇺🇸 English](README.md) · **🇨🇳 中文**

# Codex Chat Bridge

### 把你的 Codex 终端，装进 Telegram、Discord 和微信里。

[![License: MIT](https://img.shields.io/badge/License-MIT-4c1.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Platforms](https://img.shields.io/badge/Chat-Telegram%20%7C%20Discord%20%7C%20Weixin-5865F2)
![HPC ready](https://img.shields.io/badge/HPC-recovery_ready-orange)

> **太长不看版** —— 在聊天软件里和一个持久化 Codex thread 对话，同时在 Terminal TUI 中看到并控制同一个 thread。手机上发任务，tmux 里看工具执行；HPC allocation 到期后，还能接着原来的上下文继续跑。

> **当前状态：** Discord 是参考实现；Telegram 是复用同一 Codex app-server 生命周期的可用独立 adapter；微信/ClawBot 仍是实验性集成。

## ✨ 为什么需要它

Codex 很适合住在终端里，手机则胜在永远就在手边。

这个项目把两者连起来，但不会偷偷创建一个彼此失忆的新会话：

```text
Telegram ─── adapter ──┐
Discord ───── adapter ──┤
                      ├── localhost Codex app-server ── 持久 thread
微信 ───── CodexBridge ─┘                    │
                                             └── Codex Terminal TUI / tmux
```

聊天 adapter 和终端连接同一个 app-server、同一个 thread。消息、工具调用、上下文和断线恢复最终都落在同一个 Codex 会话里，而不是两边各聊各的。

## 🔥 已经实现的功能

### Discord —— 参考实现

- 🔁 Discord ↔ Codex 双向通信
- 🟢 在线 presence 显示计算节点、Slurm 剩余时间和项目名
- 🖥️ Discord 与 Codex TUI 共同显示同一个 thread
- ⏳ 事件驱动的中间进度：只在工具开始前，把完整 commentary 合并发送
- 🖼️ PNG、JPEG、WebP 附件作为真正的多模态图片输入
- 📚 通过 `!codex history` 明确授权、按需读取频道历史
- 🔐 用户/频道白名单、@mention 门控、`workspace-write` 和禁止远程越权审批
- 🧩 每项目一个 bot，也支持相互隔离的 alt 实例
- ♻️ tmux、计算节点或 HPC allocation 到期后恢复原 thread

### 微信 / ClawBot —— 实验性集成

- 📱 通过现有 CodexBridge 实现微信私聊 ↔ Codex
- 📷 Terminal 二维码登录与持久化账号状态
- 🧵 微信 scope 与前台 Codex TUI 绑定同一个 thread
- 🧰 独立 tmux socket，不受外层 stale `$TMUX` 干扰
- 💾 面向 HOME inode 紧张环境的 scratch-backed Node/runtime 布局
- 🔄 allocation 到期后恢复，不需要重新扫码

## 🚀 快速开始：Discord

> 前置条件：Codex CLI 已安装并登录 · Node.js 20+ · Discord bot token · 已开启 Message Content Intent · bot 至少拥有 `View Channel`、`Send Messages` 和 `Read Message History` 权限。

```bash
# 1. clone 并编译
git clone https://github.com/Lihan-Zhong/codex-chat-bridge.git
cd codex-chat-bridge
npm --prefix packages/discord-bridge install
npm --prefix packages/discord-bridge run build

# 2. 加载 launcher
echo "source $PWD/packages/discord-bridge/codex-dc.bash" >> ~/.bashrc
source ~/.bashrc

# 3. 安装运维 skill
mkdir -p ~/.codex/skills
cp -a skills/codex-discord-bridge ~/.codex/skills/
```

给某个项目接上 Discord：

```bash
cd /path/to/your-project
codex-dc-init   # 输入 bot token、允许的用户/频道 ID 和 localhost 端口
codex-dc        # 启动 bridge，并进入共享 Codex TUI
```

然后私聊 bot，或者在白名单服务器频道里 @它：

```text
@your_bot 阅读这个仓库并解释架构
```

以后重启只需要：

```bash
cd /path/to/your-project
codex-dc
```

它会自动恢复保存的 thread；不要再次执行 `codex-dc-init`。

## 💬 Discord 命令

| 命令 | 作用 |
| --- | --- |
| `!codex status` | 查看当前 thread 与运行状态 |
| `!codex stop` | 中断正在执行的 turn |
| `!codex reset` | 忘记频道映射，下次建立新 thread |
| `!codex history 30 总结决定` | 为当前任务明确授权读取最近频道历史 |

服务器频道通常需要 `@bot`；私信不需要。

## 🧠 有进度感，但不“消息放烟花”

把每个 token 都实时塞进 Discord，前三秒看起来很酷，之后只剩刷屏。本项目改用 app-server 事件：

1. 纯文本 commentary 始终缓存，不受时间、标点、换行或长度影响。
2. command、文件修改、MCP、网页搜索、图片操作等工具即将开始前，把此前 commentary 合并为一条 `⏳` 消息。
3. 工具结束后，建立新的 commentary 缓冲区。
4. 最终答案只发送一次，而且完整发送。

这样既能及时看到“我接下来要做什么”，又不会把一句话拆成六条 Discord 回复。

## 🧩 仓库结构

```text
codex-chat-bridge/
├── packages/
│   ├── discord-bridge/          # 可独立运行的 Discord adapter
│   └── telegram-bridge/         # Telegram adapter + codex-tg
├── integrations/
│   └── codexbridge-weixin/      # 原创 HPC launcher + 上游兼容契约
├── skills/
│   ├── codex-discord-bridge/    # 配置、恢复、进度、图片和诊断
│   └── codex-weixin-bridge/     # 扫码、tmux、白名单和 HPC 恢复
├── docs/
│   └── architecture.md
├── SECURITY.md
└── LICENSE
```

## 🧭 为什么放在一个仓库，却保留两个 adapter？

Discord 和微信共享同一种运行模型：localhost app-server、持久 thread、同一个终端视图、白名单与 HPC 恢复。但两边的传输协议差异很大。Discord 是轻量的独立 adapter；微信则依赖更完整的 CodexBridge runtime。

放在一个 monorepo，方便复用架构、文档和 skills；保持实现分离，则不会让 Discord 被尚未稳定的上游内部 API 锁死。等第二个 adapter 证明公共接口确实稳定，再抽共享 npm core 也不迟。

## 🟢 微信集成状态

[`integrations/codexbridge-weixin`](integrations/codexbridge-weixin) 中的 launcher 要求现有 CodexBridge checkout 支持：

- 通过 `CODEX_APP_SERVER_URL` 使用外部 localhost app-server；
- 通过 `CODEXBRIDGE_WEIXIN_THREAD_ID` 显式绑定 thread；
- `weixin:login` 与 `weixin:serve` 入口。

当前 CodexBridge 上游仓库没有提供能够明确允许再分发的 LICENSE，因此本项目不复制它的源码。准确兼容契约见该 integration 目录的 README。

## 🐛 HPC 恢复与常见坑

- **Allocation 到期：** 进入新的计算节点，回到原项目目录，再运行 `codex-dc` 或 `codex-wx`。凭据和 thread 元数据会保留，节点本地进程不会。
- **Presence：** `node177 · ⏳6d19h · project` 每 15 分钟刷新；绿点是真实的 Gateway 健康信号，非 Slurm 环境退化为 `node · project`。
- **`/tmp/tmux-<uid>/default` 不存在：** 通常是外层 `$TMUX` 已过期；微信 launcher 使用独立的 `codex-wx-runtime` socket。
- **Discord 先报 `app-server is not connected`，随后又成功：** 多半是两个 bridge 同时消费同一个 bot token。只保留当前实例 PID 文件指向的 bridge。
- **服务器频道消息被忽略：** 当 `DISCORD_REQUIRE_MENTION=true` 时需要 @bot，同时检查用户和频道白名单。
- **图片无法识别：** 当前只接受 Discord CDN 上不超过 20 MiB 的 PNG、JPEG 和 WebP。

## 🔒 安全模型

聊天入口换个角度看，就是远程代码执行入口。因此默认配置刻意保守：

- 必须显式填写用户白名单；频道白名单建议尽量收窄；
- 服务器频道默认要求 @mention；
- `workspace-write` sandbox；
- 无人值守聊天 turn 使用 `approvalPolicy=never`；
- app-server 只监听 `127.0.0.1` / `localhost`；
- token、账号文件、二维码 payload、日志、runtime state 和 thread ID 全部排除在 Git 之外。

把 bot 暴露到私人频道以外之前，请先阅读 [`SECURITY.md`](SECURITY.md)。

## 🤝 贡献

欢迎 PR，特别期待：

- Slack、Matrix、iMessage 等新的聊天 adapter；
- 把 CodexBridge 兼容能力干净地贡献回上游；
- 单个微信私聊中的多项目路由；
- 面向未来 Codex app-server 协议版本的集成测试；
- 更安全的“回复送达后滚动重启”机制。

启发源自本仓库风格与“每项目一个 bot”工作流的姐妹项目：

- [`claude-code-discord-multibot`](https://github.com/Lihan-Zhong/claude-code-discord-multibot)
- [`claude-code-telegram-multibot`](https://github.com/Lihan-Zhong/claude-code-telegram-multibot)

## 📜 License

本仓库原创代码使用 [MIT License](LICENSE)。上游 CodexBridge 源码不包含在本仓库中，继续受其自身仓库与条款约束。
Telegram 的配置方式和项目级 `codex-tg` launcher 见
[`packages/telegram-bridge/README.zh.md`](packages/telegram-bridge/README.zh.md)。
