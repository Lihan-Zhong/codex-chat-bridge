# Codex Telegram Multibot

每个本地 Codex 项目使用一个独立 Telegram bot。Telegram 与终端连接同一个
Codex app-server 和持久 thread，不会形成两套彼此失忆的会话。

## 安全默认值

- Telegram 用户白名单必须显式填写，空白名单会拒绝启动。
- 可选 chat 白名单；群聊默认必须 `@bot`。
- Codex 默认使用 `workspace-write` 和 `approvalPolicy=never`。
- bridge 会拒绝所有远程提权、文件变更审批和权限请求。
- 共享 app-server launcher 只接受 localhost WebSocket 地址。
- Token、状态、日志、临时附件和 thread ID 均不进入 Git。

## 编译与测试

```bash
npm install
npm run test
```

## 使用

先通过 Telegram 的 `@BotFather` 创建 bot，并获取自己的数字 user ID。测试时
只在当前 shell 临时加载 launcher，不修改 `.bashrc`：

```bash
source /绝对路径/packages/telegram-bridge/codex-tg.bash
cd /绝对路径/你的项目
codex-tg-init
codex-tg
```

默认密钥目录为
`${CODEX_TELEGRAM_STATE_ROOT:-$HOME/.codex-telegram}/<project>/instance.env`，
目录权限为 `0700`、配置文件权限为 `0600`。如果不希望写入 HOME，请在初始化前
把 `CODEX_TELEGRAM_STATE_ROOT` 指向获准目录。

Bot 支持 `/status`、`/stop`、`/reset`、`/help`，并支持文字、图片说明、Telegram
照片及 PNG/JPEG/WebP 图片文档。

本包不会自动编辑 `.bashrc`。完成测试并明确授权后，用户可自行加入：

```bash
source /绝对路径/packages/telegram-bridge/codex-tg.bash
```
