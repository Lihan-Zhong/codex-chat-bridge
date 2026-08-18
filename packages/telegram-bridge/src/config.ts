import path from "node:path";
import dotenv from "dotenv";

// Deliberately load only an explicit instance file or this repository's .env.
// Never search for or source ~/.env.
dotenv.config({ path: process.env.CODEX_TELEGRAM_ENV_FILE || path.resolve(".env"), quiet: true });

function csv(value: string | undefined): Set<string> {
  return new Set((value ?? "").split(",").map((x) => x.trim()).filter(Boolean));
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(value.toLowerCase());
}

const projectDir = path.resolve(process.env.CODEX_PROJECT_DIR ?? "");
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required");
if (!process.env.CODEX_PROJECT_DIR) throw new Error("CODEX_PROJECT_DIR is required");

export const config = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  projectDir,
  allowedUsers: csv(process.env.TELEGRAM_ALLOWED_USER_IDS),
  allowedChats: csv(process.env.TELEGRAM_ALLOWED_CHAT_IDS),
  requireMention: bool(process.env.TELEGRAM_REQUIRE_MENTION, true),
  codexBin: process.env.CODEX_BIN || "codex",
  appServerUrl: process.env.CODEX_APP_SERVER_URL || undefined,
  appServerToken: process.env.CODEX_APP_SERVER_TOKEN || undefined,
  sharedThreadId: process.env.CODEX_SHARED_THREAD_ID || undefined,
  model: process.env.CODEX_MODEL || undefined,
  sandbox: process.env.CODEX_SANDBOX || "workspace-write",
  approvalPolicy: process.env.CODEX_APPROVAL_POLICY || "never",
  stateDir: path.resolve(process.env.CODEX_TELEGRAM_STATE_DIR || ".state"),
};
