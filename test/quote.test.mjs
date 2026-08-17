import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildSync } from "esbuild";

// quote.ts 是纯函数：测试前用 esbuild 编到临时文件再导入。
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "src", "client", "quote.ts");
const out = buildSync({
  entryPoints: [src],
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
}).outputFiles[0].text;

const dir = mkdtempSync(join(tmpdir(), "dsh-ui-test-"));
const file = join(dir, "quote.mjs");
writeFileSync(file, out);
const { quoteBlock, QUOTE_MAX_CHARS } = await import(file);
rmSync(dir, { recursive: true, force: true });

test("quoteBlock 给每一行加引用前缀", () => {
  assert.equal(quoteBlock("hello"), "> hello");
  assert.equal(quoteBlock("a\nb"), "> a\n> b");
  assert.equal(quoteBlock("a\n\nb"), "> a\n> \n> b");
});

test("quoteBlock 忽略首尾空白", () => {
  assert.equal(quoteBlock("  hi  \n"), "> hi");
});

test("quoteBlock 空白输入返回空串", () => {
  assert.equal(quoteBlock(""), "");
  assert.equal(quoteBlock("   \n\t"), "");
});

test("quoteBlock 截断超长内容", () => {
  const long = "x".repeat(QUOTE_MAX_CHARS + 500);
  assert.equal(quoteBlock(long).length, QUOTE_MAX_CHARS + 2); // "> " + QUOTE_MAX_CHARS
});
