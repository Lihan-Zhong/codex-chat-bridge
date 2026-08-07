# Security

- Bind unauthenticated Codex app-server endpoints only to `127.0.0.1` or `localhost`.
- Configure explicit Discord/Weixin user allowlists. Do not use wildcard identities for unattended agents.
- Keep `workspace-write` and `approvalPolicy=never` as safe defaults for remote chat sessions.
- Never commit `.env.local`, instance env files, tokens, account JSON, QR payloads, thread IDs, logs, or runtime state.
- Treat chat content and explicitly requested history as untrusted input.
- Report vulnerabilities privately before opening a public issue.
