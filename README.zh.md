# Codex Chat Bridge

把 Discord 或微信聊天窗口连接到持久化 Codex app-server thread，并让同一个 thread 同时显示在 Terminal TUI 中。

仓库结构：

- `packages/discord-bridge`：可独立运行的 Discord adapter，支持白名单、中间进度、图片输入、持久 thread 与 HPC 断线恢复。
- `integrations/codexbridge-weixin`：面向上游 CodexBridge 的微信 HPC launcher 与集成说明。
- `skills`：两套可复用的 Codex 运维 skill。

两条链路共享的是架构，不是所有代码。Discord adapter 很小；微信依赖体量更大的上游 CodexBridge。现阶段保持同一 monorepo、不同 adapter，避免过早抽象。详见 [架构说明](docs/architecture.md)。

## 安全

app-server 只监听 localhost；聊天身份默认拒绝。禁止提交 bot token、微信登录状态、thread ID、日志或 runtime 目录。详见 [SECURITY.md](SECURITY.md)。

## 状态

Discord 是当前参考实现。微信 launcher 仍属实验性集成，并要求上游 CodexBridge 提供其目录中列出的兼容能力。

## 许可证

本仓库原创代码使用 MIT License。仓库不包含上游 CodexBridge 源码；上游代码继续受其自身仓库条款约束。
