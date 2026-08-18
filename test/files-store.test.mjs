import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildSync } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "dsh-ui-files-test-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

const out = buildSync({
  entryPoints: [join(here, "..", "src", "notes", "files-store.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  write: false,
}).outputFiles[0].text;
const file = join(dir, "files-store.mjs");
const { writeFileSync } = await import("node:fs");
writeFileSync(file, out);
const { FilesStore } = await import(file);

test("FilesStore 上传/列表/读取字节/删除", async () => {
  const store = new FilesStore(join(dir, "store"));
  // 非法类型拒绝
  const bad = await store.upload({ name: "x.txt", mime: "text/plain", bytesBase64: "aGk=" });
  assert.equal(bad.ok, false);

  // 合法 PDF（字节无所谓——文本提取失败不影响上传）
  const uploaded = await store.upload({
    name: "paper.pdf",
    mime: "application/pdf",
    bytesBase64: Buffer.from("%PDF-1.4 not really a pdf").toString("base64"),
  });
  assert.equal(uploaded.ok, true);
  if (!uploaded.ok) return;
  const meta = uploaded.value.file;
  assert.equal(meta.name, "paper.pdf");
  assert.equal(meta.size > 0, true);
  // 伪 PDF 提取失败 → 无 text 字段，但仍入列
  assert.equal(meta.text === undefined, true);

  const list = await store.list();
  assert.equal(list.ok, true);
  if (!list.ok) return;
  assert.equal(list.value.items.length, 1);
  assert.equal(list.value.items[0].id, meta.id);

  const got = await store.get(meta.id);
  assert.equal(got.ok, true);
  if (!got.ok) return;
  assert.equal(got.value.file.name, "paper.pdf");

  const bytes = await store.getBytes(meta.id);
  assert.equal(bytes.ok, true);
  if (!bytes.ok) return;
  assert.ok(bytes.value.bytesBase64.length > 0);

  const removed = await store.delete(meta.id);
  assert.equal(removed.ok, true);
  const after = await store.list();
  assert.equal(after.ok, true);
  if (!after.ok) return;
  assert.equal(after.value.items.length, 0);
});

test("FilesStore 空目录列出空列表", async () => {
  const store = new FilesStore(join(dir, "empty"));
  const list = await store.list();
  assert.equal(list.ok, true);
  if (!list.ok) return;
  assert.equal(list.value.items.length, 0);
});
