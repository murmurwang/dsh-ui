import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildSync } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "dsh-ui-store-test-"));
const out = buildSync({
  entryPoints: [join(here, "..", "src", "notes", "store.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  write: false,
}).outputFiles[0].text;
const file = join(dir, "store.mjs");
mkdirSync(dir, { recursive: true });
const { writeFileSync } = await import("node:fs");
writeFileSync(file, out);
const { NotesStore } = await import(file);

test.after(() => rmSync(dir, { recursive: true, force: true }));

test("NotesStore 创建/读取/列表/删除", async () => {
  const store = new NotesStore(join(dir, "n1"));
  const created = await store.create({ title: "第一篇" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const note = created.value.note;
  assert.equal(note.title, "第一篇");
  assert.equal(note.body, "");

  const list = await store.list();
  assert.equal(list.ok, true);
  if (!list.ok) return;
  assert.equal(list.value.items.length, 1);
  assert.equal(list.value.items[0].clipCount, 0);

  const got = await store.get(note.id);
  assert.equal(got.ok, true);
  if (!got.ok) return;
  assert.deepEqual(got.value.note, note);

  const removed = await store.remove(note.id);
  assert.equal(removed.ok, true);
  assert.equal((await store.get(note.id)).ok, false);
});

test("NotesStore 更新带乐观并发：ifVersion 不匹配被拒", async () => {
  const store = new NotesStore(join(dir, "n2"));
  const created = await store.create({});
  if (!created.ok) return assert.fail("create failed");
  const note = created.value.note;

  const updated = await store.update({
    id: note.id,
    ifVersion: note.version,
    body: "正文",
    addClip: { text: "剪藏内容", sessionId: "s1" },
  });
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.value.note.body, "正文");
  assert.equal(updated.value.note.clips.length, 1);
  assert.equal(updated.value.note.clips[0].sessionId, "s1");

  // 旧版本重放 → version-conflict
  const stale = await store.update({
    id: note.id,
    ifVersion: note.version,
    body: "旧版本写入",
  });
  assert.equal(stale.ok, false);
  if (stale.ok) return;
  assert.equal(stale.error.code, "version-conflict");

  // 用当前版本删除剪藏
  const withoutClip = await store.update({
    id: note.id,
    ifVersion: updated.value.note.version,
    removeClipId: updated.value.note.clips[0].id,
  });
  assert.equal(withoutClip.ok, true);
  if (!withoutClip.ok) return;
  assert.equal(withoutClip.value.note.clips.length, 0);
});

test("NotesStore 持久化：新实例读回同一份数据", async () => {
  const root = join(dir, "n3");
  const first = new NotesStore(root);
  const created = await first.create({ title: "持久化" });
  if (!created.ok) return assert.fail("create failed");

  const second = new NotesStore(root);
  const got = await second.get(created.value.note.id);
  assert.equal(got.ok, true);
  if (!got.ok) return;
  assert.equal(got.value.note.title, "持久化");
});

test("NotesStore 损坏行跳过、空标题兜底", async () => {
  const root = join(dir, "n4");
  mkdirSync(root, { recursive: true });
  writeFileSync(
    join(root, "notes.jsonl"),
    "{not json}\n" + JSON.stringify({ id: "x", bad: true }) + "\n",
  );
  const store = new NotesStore(root);
  await store.load();
  const list = await store.list();
  assert.equal(list.ok, true);
  if (!list.ok) return;
  assert.equal(list.value.items.length, 0);

  const created = await store.create({ title: "   " });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.value.note.title, "未命名笔记");
  // 文件真实落盘
  const raw = readFileSync(join(root, "notes.jsonl"), "utf8");
  assert.ok(raw.includes("未命名笔记"));
});
