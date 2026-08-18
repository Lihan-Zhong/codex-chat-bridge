import fs from "node:fs/promises";
import path from "node:path";
import type { TurnInput } from "./codex-app-server.js";

export type TelegramAttachment = {
  fileId: string;
  name: string;
  contentType?: string;
  size?: number;
};
export type PreparedInput = { input: TurnInput[]; cleanup: () => Promise<void> };

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export async function prepareTurnInput(
  prompt: string,
  attachments: TelegramAttachment[],
  stateDir: string,
  messageId: string,
  resolveUrl: (fileId: string) => Promise<string>,
): Promise<PreparedInput> {
  const tempDir = path.join(stateDir, "attachments", sanitize(messageId));
  const input: TurnInput[] = [];
  const lines = prompt ? [prompt] : ["The user sent Telegram attachments without additional text."];
  if (attachments.length) lines.push("", "Telegram attachments:");
  let created = false;
  for (const [index, attachment] of attachments.entries()) {
    const contentType = String(attachment.contentType ?? "").split(";", 1)[0].toLowerCase();
    const size = attachment.size ?? 0;
    if (IMAGE_TYPES.has(contentType) && size <= MAX_IMAGE_BYTES) {
      if (!created) { await fs.mkdir(tempDir, { recursive: true, mode: 0o700 }); created = true; }
      const localPath = path.join(tempDir, `${index + 1}-${sanitize(path.parse(attachment.name).name)}${extensionFor(contentType)}`);
      const response = await fetch(await resolveUrl(attachment.fileId), { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`Could not download Telegram image ${attachment.name}: HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error(`Telegram image ${attachment.name} exceeds 20 MiB`);
      await fs.writeFile(localPath, buffer, { mode: 0o600 });
      lines.push(`${index + 1}. image ${attachment.name} (${contentType}), attached as localImage`);
      input.push({ type: "localImage", path: localPath });
    } else {
      lines.push(`${index + 1}. ${attachment.name} (${contentType || "unknown type"}) was not downloaded`);
    }
  }
  input.unshift({ type: "text", text: lines.join("\n").trim(), text_elements: [] });
  return { input, cleanup: async () => { if (created) await fs.rm(tempDir, { recursive: true, force: true }); } };
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/gu, "-").slice(0, 100) || "item";
}

function extensionFor(contentType: string): string {
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/webp") return ".webp";
  return ".png";
}
