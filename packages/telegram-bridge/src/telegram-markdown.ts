export const TELEGRAM_DEVELOPER_INSTRUCTIONS = `
This thread is presented to the user through Telegram.
Write every user-visible commentary update and final answer as valid Telegram MarkdownV2.
Escape literal MarkdownV2 reserved characters when they are not formatting syntax: _ * [ ] ( ) ~ \` > # + - = | { } . !
Keep formatting delimiters balanced. Do not use Markdown tables because Telegram MarkdownV2 does not support them.
Prefer responses no longer than 3500 characters. If a longer response is necessary, make each section independently valid MarkdownV2 so it can be sent as a separate message.
`.trim();

export async function markdownV2OrPlain(
  sendMarkdownV2: () => Promise<unknown>,
  sendPlain: () => Promise<unknown>,
): Promise<"markdown-v2" | "plain"> {
  try {
    await sendMarkdownV2();
    return "markdown-v2";
  } catch {
    await sendPlain();
    return "plain";
  }
}
