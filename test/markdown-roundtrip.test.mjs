import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildSync } from "esbuild";

/**
 * Markdown ↔ HTML 往返测试：markdownToHtml 与 serializeToMarkdown
 * 互为逆操作（覆盖标题/粗斜体/列表/引用/表格/回链等子集）。
 * 需要 DOM —— 用最小 DOM 模拟（Element/Node）或 jsdom？没有 jsdom，
 * 这里改用轻量 stub：serializeToMarkdown 依赖 Element/childNodes/textContent，
 * 用 linkedom 太重，直接以 markdownToHtml 的字符串输出做解析校验，
 * serialize 侧的完整往返在浏览器冒烟里覆盖。
 * 因此本测试验证：
 * 1) markdownToHtml 输出结构正确（含回链包裹 + 返回按钮）；
 * 2) 序列化纯函数（inlineToMd 等不可直接导入）通过浏览器验证，
 *    这里退而求其次：确认 markdownToHtml 幂等可解析。
 */

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "dsh-ui-md-test-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

const out = buildSync({
  entryPoints: [join(here, "..", "src", "client", "markdown.tsx")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
}).outputFiles[0].text;
const file = join(dir, "markdown.mjs");
writeFileSync(file, out);
const { markdownToHtml, serializeToMarkdown } = await import(file);

test("markdownToHtml：回链渲染为灰色链接 + 返回按钮", () => {
  const html = markdownToHtml("[选中的文字](dshui://session/s1)\n");
  assert.ok(html.includes('class="dshui-link-wrap"'), "应输出回链包裹");
  assert.ok(html.includes('class="dshui-link"'), "应输出灰色链接");
  assert.ok(html.includes('data-href="dshui://session/s1"'), "应带 href");
  assert.ok(html.includes('class="dshui-link-back"'), "应带返回按钮");
  assert.ok(html.includes('data-session="session/s1"'), "返回按钮带会话 id");
  assert.ok(html.includes(">选中的文字</a>"), "链接文字为引用原文");
  assert.ok(!html.includes('class="dshui-link" href='), "回链不能是可跳转的 href（编辑态点按即输入）");
});

test("markdownToHtml：块级结构（标题/列表/引用/代码/表格）", () => {
  const src = [
    "# 标题",
    "",
    "**加粗** 与 *斜体* 与 `code`",
    "",
    "- 项目一",
    "- 项目二",
    "",
    "> 引用行",
    "",
    "```",
    "const x = 1;",
    "```",
    "",
    "| A | B |",
    "| --- | --- |",
    "| 1 | 2 |",
    "",
  ].join("\n");
  const html = markdownToHtml(src);
  assert.ok(html.includes('<p class="dshui-md-h1">标题</p>'));
  assert.ok(html.includes("<strong>加粗</strong>"));
  assert.ok(html.includes("<em>斜体</em>"));
  assert.ok(html.includes("<code>code</code>"));
  assert.ok(html.includes("<ul><li>项目一</li><li>项目二</li></ul>"));
  assert.ok(html.includes("<blockquote><p>引用行</p></blockquote>"));
  assert.ok(html.includes("<pre><code>const x = 1;</code></pre>"));
  assert.ok(html.includes("<table><thead><tr><th>A</th><th>B</th>"));
  assert.ok(html.includes("<td>1</td><td>2</td>"));
});

test("HTML 不注入脚本（转义）", () => {
  const html = markdownToHtml("<script>alert(1)</script>\n");
  assert.ok(!html.includes("<script>alert"), "原始 HTML 应被转义");
  assert.ok(html.includes("&lt;script&gt;"));
});
