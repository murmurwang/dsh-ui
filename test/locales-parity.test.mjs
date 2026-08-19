import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

/**
 * 双语完整性：zh / en 词典键位必须一一对齐。
 * 直接从源码提取两个字典的键集合对比（防止手改时漏掉某一边）。
 */
const src = readFileSync(
  join(import.meta.dirname, "..", "src", "client", "locales.ts"),
  "utf8",
);

function keysOf(name) {
  const re = new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\n\\} as const;`);
  const match = src.match(re);
  assert.ok(match, `locales.ts 应包含 ${name} 字典`);
  return [...match[1].matchAll(/^\s*"([^"]+)":/gm)].map((x) => x[1]);
}

test("zh / en 词典键位对齐", () => {
  const zh = keysOf("zh");
  const en = keysOf("en");
  assert.ok(zh.length > 0, "zh 字典非空");
  assert.deepEqual([...en].sort(), [...zh].sort(), "en 必须覆盖 zh 的全部键且不多不少");
});
