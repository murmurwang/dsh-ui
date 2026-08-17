/** 预填引用块的最大字符数（超出部分截断）。 */
export const QUOTE_MAX_CHARS = 4000;

/**
 * 把一段选中文字折成 Markdown 引用块，供输入框预填。
 *
 * 每一行都加上 `> ` 前缀；空行保持为 `> ` 以维持引用块连续，
 * 多行选中内容不会在块中间断开。
 *
 * @param text - 划选得到的原始文字。
 * @returns 引用块文本；空白输入返回空字符串。
 */
export function quoteBlock(text: string): string {
  const trimmed = text.trim().slice(0, QUOTE_MAX_CHARS);
  if (trimmed === "") return "";
  return trimmed
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}
