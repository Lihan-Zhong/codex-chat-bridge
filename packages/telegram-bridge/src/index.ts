import fs from "node:fs/promises";
import { Bot, Context } from "grammy";
import { config } from "./config.js";
import { StateStore } from "./state.js";
import { CodexAppServer } from "./codex-app-server.js";
import { prepareTurnInput, TelegramAttachment } from "./attachments.js";
import { ProgressRelay } from "./progress-relay.js";
import { markdownV2OrPlain, TELEGRAM_DEVELOPER_INSTRUCTIONS } from "./telegram-markdown.js";

if (config.allowedUsers.size === 0) {
  throw new Error("TELEGRAM_ALLOWED_USER_IDS must contain at least one numeric Telegram user ID");
}

const state = new StateStore(config.stateDir);
const codex = new CodexAppServer(config.codexBin, config.projectDir, {
  model: config.model,
  sandbox: config.sandbox,
  approvalPolicy: config.approvalPolicy,
  developerInstructions: TELEGRAM_DEVELOPER_INSTRUCTIONS,
}, config.appServerUrl ? { url: config.appServerUrl, token: config.appServerToken } : undefined);
const bot = new Bot(config.token);
const queues = new Map<string, Promise<void>>();
const active = new Map<string, { threadId: string; turnId: string }>();
let botUsername = "";

function scope(ctx: Context): string {
  return String(ctx.chat!.id);
}

function allowed(ctx: Context): boolean {
  const message = ctx.message;
  if (!message?.from || message.from.is_bot || !config.allowedUsers.has(String(message.from.id))) return false;
  if (config.allowedChats.size && !config.allowedChats.has(String(message.chat.id))) return false;
  if (message.chat.type === "private" || !config.requireMention) return true;
  const text = message.text ?? message.caption ?? "";
  if (!botUsername) return false;
  const username = escapeRegex(botUsername);
  return new RegExp(`(?:^|\\s)@${username}(?=\\s|$)|^/(?:codex_)?(?:status|stop|reset|help)@${username}(?:\\s|$)`, "i").test(text);
}

function promptFrom(ctx: Context): string {
  const text = ctx.message?.text ?? ctx.message?.caption ?? "";
  if (!botUsername) return text.trim();
  return text.replace(new RegExp(`@${escapeRegex(botUsername)}`, "gi"), "").trim();
}

async function sendLong(ctx: Context, text: string): Promise<void> {
  const body = text.trim() || "Codex completed without a text response.";
  const chunks = body.match(/[\s\S]{1,3900}/g) ?? [body];
  for (const chunk of chunks) {
    const replyParameters = { message_id: ctx.message!.message_id };
    const mode = await markdownV2OrPlain(
      () => ctx.reply(chunk, { parse_mode: "MarkdownV2", reply_parameters: replyParameters }),
      () => ctx.reply(chunk, { reply_parameters: replyParameters }),
    );
    if (mode === "plain") console.warn("Telegram rejected MarkdownV2 output; sent the same message as plain text");
  }
}

async function getThread(chatId: string): Promise<string> {
  if (config.sharedThreadId) {
    await codex.resumeThread(config.sharedThreadId);
    return config.sharedThreadId;
  }
  const existing = state.get(chatId);
  if (existing) {
    try { await codex.resumeThread(existing); return existing; }
    catch (error) { console.warn(`Could not resume ${existing}; starting a new thread`, error); }
  }
  const threadId = await codex.startThread();
  await state.set(chatId, threadId);
  return threadId;
}

async function command(ctx: Context, prompt: string): Promise<boolean> {
  const match = prompt.match(/^\/(?:codex_)?(status|stop|reset|help)(?:@\w+)?(?:\s|$)/i);
  if (!match) return false;
  const name = match[1].toLowerCase();
  const chatId = scope(ctx);
  if (name === "reset") {
    if (active.has(chatId)) await ctx.reply("Stop the active turn before resetting.");
    else { await state.reset(chatId); await ctx.reply("Codex thread reset. The next message starts a fresh thread."); }
  } else if (name === "stop") {
    const current = active.get(chatId);
    if (!current) await ctx.reply("No active Codex turn.");
    else { await codex.interrupt(current.threadId, current.turnId); await ctx.reply("Stop requested."); }
  } else if (name === "status") {
    const threadId = config.sharedThreadId ?? state.get(chatId) ?? "not started";
    await ctx.reply(active.has(chatId)
      ? `Codex is working. Thread: ${active.get(chatId)!.threadId}`
      : `Codex is idle. Thread: ${threadId}`);
  } else {
    await ctx.reply("Commands: /status, /stop, /reset, /help. Otherwise, send a normal task or image.");
  }
  return true;
}

async function attachmentsFrom(ctx: Context): Promise<TelegramAttachment[]> {
  const message = ctx.message!;
  const attachments: TelegramAttachment[] = [];
  const photo = message.photo?.at(-1);
  if (photo) attachments.push({ fileId: photo.file_id, name: `photo-${message.message_id}.jpg`, contentType: "image/jpeg", size: photo.file_size });
  if (message.document) attachments.push({
    fileId: message.document.file_id,
    name: message.document.file_name ?? `document-${message.message_id}`,
    contentType: message.document.mime_type,
    size: message.document.file_size,
  });
  return attachments;
}

async function handle(ctx: Context): Promise<void> {
  const prompt = promptFrom(ctx);
  const attachments = await attachmentsFrom(ctx);
  if (!prompt && attachments.length === 0) return;
  if (await command(ctx, prompt)) return;
  await ctx.replyWithChatAction("typing");
  const chatId = scope(ctx);
  const threadId = await getThread(chatId);
  const prepared = await prepareTurnInput(prompt, attachments, config.stateDir, String(ctx.message!.message_id), async (fileId) => {
    const file = await ctx.api.getFile(fileId);
    if (!file.file_path) throw new Error("Telegram did not return a file path");
    return `https://api.telegram.org/file/bot${config.token}/${file.file_path}`;
  });
  const relay = new ProgressRelay(async (text) => {
    const mode = await markdownV2OrPlain(
      () => ctx.reply(text, { parse_mode: "MarkdownV2" }),
      () => ctx.reply(text),
    );
    if (mode === "plain") console.warn("Telegram rejected MarkdownV2 commentary; sent it as plain text");
  });
  try {
    const result = await codex.runTurn(threadId, prepared.input, (turnId) => {
      active.set(chatId, { threadId, turnId });
    }, (progress) => {
      if (progress.type === "tool_boundary") void relay.flushBeforeTool();
      else relay.push(progress.delta, progress.outputKind);
    });
    await relay.finish();
    if (result.finalText) await sendLong(ctx, result.finalText);
    else if (!relay.hasSent) await sendLong(ctx, result.commentaryText || `Turn ended with status: ${result.status}`);
  } finally {
    await relay.finish();
    await prepared.cleanup();
    active.delete(chatId);
  }
}

bot.on("message", (ctx) => {
  if (!allowed(ctx)) return;
  const chatId = scope(ctx);
  const previous = queues.get(chatId) ?? Promise.resolve();
  const next = previous.then(() => handle(ctx)).catch(async (error) => {
    console.error(error);
    await ctx.reply(`Codex bridge error: ${error instanceof Error ? error.message : String(error)}`).catch(() => undefined);
  }).finally(() => {
    if (queues.get(chatId) === next) queues.delete(chatId);
  });
  queues.set(chatId, next);
});

bot.catch((error) => console.error("Telegram update failed", error.error));
codex.on("log", (line) => { if (line) console.error(`[codex] ${line}`); });

await fs.access(config.projectDir);
await state.load();
await codex.start();
const me = await bot.api.getMe();
botUsername = me.username;
console.log(`Telegram bot ready as @${botUsername}; project=${config.projectDir}`);
await bot.start({ allowed_updates: ["message"] });

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
